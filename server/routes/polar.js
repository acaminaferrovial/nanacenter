import { Router } from 'express';
import User from '../models/User.js';
import Registro from '../models/Registro.js';
import { parseFecha } from '../utils/fecha.js';
import { calcularGestacion } from '../utils/gestacion.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { urlAutorizacion, intercambiarCodigo, registrarUsuario, obtenerPorFecha } from '../utils/polar.js';

const router = Router();

router.get(
  '/estado',
  asyncHandler(async (req, res) => {
    const usuario = await User.findById(req.userId);
    res.json({ conectado: !!usuario?.polarAccessToken });
  })
);

router.get('/url-autorizacion', (req, res) => {
  res.json({ url: urlAutorizacion() });
});

router.post(
  '/token',
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Falta el código de autorización' });

    const datos = await intercambiarCodigo(code);
    const token = datos.access_token;
    const polarUserId = String(datos.x_user_id);

    await registrarUsuario(token, polarUserId);

    await User.findByIdAndUpdate(req.userId, { $set: { polarAccessToken: token, polarUserId } });
    res.json({ conectado: true });
  })
);

function minutosDesdeDuracionIso(duracionIso) {
  if (!duracionIso) return null;
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/.exec(duracionIso);
  if (!match) return null;
  const horas = Number(match[1] || 0);
  const min = Number(match[2] || 0);
  const seg = Number(match[3] || 0);
  return Math.round(horas * 60 + min + seg / 60);
}

const MAPA_DEPORTES = {
  RUNNING: 'Cardio',
  JOGGING: 'Cardio',
  TRACK_AND_FIELD_RUNNING: 'Cardio',
  CYCLING: 'Cardio',
  MOUNTAIN_BIKING: 'Cardio',
  WALKING: 'Caminar',
  NORDIC_WALKING: 'Caminar',
  HIKING: 'Caminar',
  YOGA: 'Yoga',
  PILATES: 'Pilates',
  STRENGTH_TRAINING: 'Fuerza',
  STRETCHING: 'Estiramientos',
  OTHER_INDOOR: 'Movilidad',
  OTHER_OUTDOOR: 'Movilidad',
  AEROBICS: 'Aeróbic',
  GROUP_EXERCISE: 'Aeróbic',
  SWIMMING: 'Cardio'
};

async function obtenerUsuarioPolarOFallo(req, res) {
  const usuario = await User.findById(req.userId);
  if (!usuario?.polarAccessToken || !usuario?.polarUserId) {
    res.status(400).json({ error: 'Cuenta de Polar no conectada todavía' });
    return null;
  }
  return usuario;
}

async function fusionarEnRegistro(usuarioId, fechaStr, campos, usuario) {
  const fecha = parseFecha(fechaStr);
  const gestacion = calcularGestacion(usuario?.fechaUltimaRegla, fecha);
  return Registro.findOneAndUpdate(
    { usuarioId, fecha },
    { $set: { ...campos, ...gestacion, usuarioId, fecha } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

router.post(
  '/sincronizar/ejercicios',
  asyncHandler(async (req, res) => {
    const usuario = await obtenerUsuarioPolarOFallo(req, res);
    if (!usuario) return;
    const { fecha: fechaStr } = req.body;
    if (!fechaStr) return res.status(400).json({ error: 'Falta la fecha' });

    // Listado directo (no transacción): GET /v3/exercises devuelve los ejercicios subidos
    // a Flow en los últimos 30 días, pero SOLO los subidos después de que este cliente se
    // registrara con el usuario — los anteriores a conectar la cuenta no están disponibles
    // por la API, sin importar cómo se pidan (confirmado por la documentación de Polar).
    const todos = (await obtenerPorFecha('/v3/exercises', usuario.polarAccessToken)) || [];
    const detalles = todos.filter((ej) => (ej.start_time || '').slice(0, 10) === fechaStr);

    if (detalles.length === 0) {
      return res.json({ nuevos: 0, mensaje: 'No hay ejercicios de Polar para ese día (o son anteriores a conectar la cuenta)' });
    }

    const porFecha = {};
    for (const ej of detalles) {
      // Polar casi siempre manda sport:"OTHER" y el deporte real en detailed_sport_info.
      const deportePolar = ej.detailed_sport_info || ej.sport || '';
      const entrada = {
        fuente: 'polar',
        polarId: String(ej.id || ''),
        deportePolar,
        tipo: MAPA_DEPORTES[deportePolar] || null,
        duracion: minutosDesdeDuracionIso(ej.duration),
        calorias: ej.calories ?? null,
        distanciaKm: ej.distance != null ? Math.round((ej.distance / 1000) * 100) / 100 : null,
        fcMedia: ej.heart_rate?.average ?? null,
        fcMaxima: ej.heart_rate?.maximum ?? null,
        intensidad: 'moderada'
      };
      (porFecha[fechaStr] = porFecha[fechaStr] || []).push(entrada);
    }

    for (const [fechaStr, nuevos] of Object.entries(porFecha)) {
      const fecha = parseFecha(fechaStr);
      const existente = await Registro.findOne({ usuarioId: req.userId, fecha });
      const idsExistentes = new Set((existente?.ejercicio || []).filter((e) => e.polarId).map((e) => e.polarId));
      const aAnadir = nuevos.filter((n) => !idsExistentes.has(n.polarId));
      if (aAnadir.length === 0) continue;
      const ejercicioFinal = [...(existente?.ejercicio || []), ...aAnadir];
      await fusionarEnRegistro(req.userId, fechaStr, { ejercicio: ejercicioFinal }, usuario);
    }

    res.json({ nuevos: detalles.length, dias: Object.keys(porFecha) });
  })
);

router.post(
  '/sincronizar/actividad',
  asyncHandler(async (req, res) => {
    const usuario = await obtenerUsuarioPolarOFallo(req, res);
    if (!usuario) return;
    const { fecha: fechaStr } = req.body;
    if (!fechaStr) return res.status(400).json({ error: 'Falta la fecha' });

    const datos = await obtenerPorFecha(`/v3/users/activities/${fechaStr}`, usuario.polarAccessToken);
    if (!datos) return res.json({ mensaje: 'No hay actividad de Polar para ese día' });

    const registro = await fusionarEnRegistro(
      req.userId,
      fechaStr,
      {
        actividad: {
          pasos: datos.steps ?? null,
          caloriasActivas: datos.active_calories ?? null,
          porcentajeActividad: datos.daily_activity ?? null,
          fuente: 'polar'
        }
      },
      usuario
    );
    res.json({ actividad: registro.actividad });
  })
);

router.post(
  '/sincronizar/sueno',
  asyncHandler(async (req, res) => {
    const usuario = await obtenerUsuarioPolarOFallo(req, res);
    if (!usuario) return;
    const { fecha: fechaStr } = req.body;
    if (!fechaStr) return res.status(400).json({ error: 'Falta la fecha' });

    const datos = await obtenerPorFecha(`/v3/users/sleep/${fechaStr}`, usuario.polarAccessToken);
    if (!datos) return res.json({ mensaje: 'No hay datos de sueño de Polar para esa noche' });

    const registroPrevio = await Registro.findOne({ usuarioId: req.userId, fecha: parseFecha(fechaStr) });
    const suenoPrevio = registroPrevio?.sueno?.toObject ? registroPrevio.sueno.toObject() : registroPrevio?.sueno || {};

    let horas = suenoPrevio.horas;
    if (datos.sleep_start_time && datos.sleep_end_time) {
      const ms = new Date(datos.sleep_end_time) - new Date(datos.sleep_start_time);
      horas = Math.round((ms / 3600000) * 100) / 100;
    }

    const actualizado = await fusionarEnRegistro(
      req.userId,
      fechaStr,
      {
        sueno: {
          ...suenoPrevio,
          horas,
          faseProfundoMin: datos.deep_sleep != null ? Math.round(datos.deep_sleep / 60) : suenoPrevio.faseProfundoMin,
          faseREMMin: datos.rem_sleep != null ? Math.round(datos.rem_sleep / 60) : suenoPrevio.faseREMMin,
          puntuacion: datos.sleep_score ?? suenoPrevio.puntuacion,
          fuente: 'polar'
        }
      },
      usuario
    );
    res.json({ sueno: actualizado.sueno });
  })
);

router.post(
  '/sincronizar/recuperacion',
  asyncHandler(async (req, res) => {
    const usuario = await obtenerUsuarioPolarOFallo(req, res);
    if (!usuario) return;
    const { fecha: fechaStr } = req.body;
    if (!fechaStr) return res.status(400).json({ error: 'Falta la fecha' });

    const datos = await obtenerPorFecha(`/v3/users/nightly-recharge/${fechaStr}`, usuario.polarAccessToken);
    if (!datos) return res.json({ mensaje: 'No hay datos de recuperación de Polar para esa noche' });

    const registro = await fusionarEnRegistro(
      req.userId,
      fechaStr,
      {
        recuperacion: {
          ansCharge: datos.ans_charge ?? null,
          hrvMs: datos.heart_rate_variability_avg ?? null,
          frecuenciaRespiratoria: datos.breathing_rate_avg ?? null,
          fuente: 'polar'
        }
      },
      usuario
    );
    res.json({ recuperacion: registro.recuperacion });
  })
);

export default router;
