import { Router } from 'express';
import User from '../models/User.js';
import Registro from '../models/Registro.js';
import BebeRevision from '../models/BebeRevision.js';
import BebeVacuna from '../models/BebeVacuna.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fechaKey } from '../utils/fecha.js';
import { construirMensajeResumenBebe, hoyMadridStr } from '../utils/bebePlanning.js';
import { enviarMensajeTelegram } from '../utils/telegram.js';

const router = Router();

// POST /api/cron/resumen-bebe — Envía el resumen diario del calendario del bebé por Telegram
router.post(
  '/resumen-bebe',
  asyncHandler(async (req, res) => {
    const secretEsperado = process.env.CRON_SECRET;
    const secretRecibido = req.headers['x-cron-secret'] || req.query.secret;

    if (!secretEsperado) {
      return res.json({
        ok: true,
        skipped: true,
        reason: 'CRON_SECRET no está configurado en el servidor'
      });
    }
    if (secretRecibido !== secretEsperado) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const emailFiltro = process.env.TELEGRAM_USER_EMAIL;
    const usuario = emailFiltro
      ? await User.findOne({ email: emailFiltro.toLowerCase().trim() })
      : await User.findOne().sort({ createdAt: 1 });

    if (!usuario) {
      return res.status(404).json({ error: 'No se encontró ningún usuario' });
    }

    const hoyStr = hoyMadridStr();
    const fechaNacimientoStr = usuario.fechaNacimientoBebe
      ? fechaKey(usuario.fechaNacimientoBebe)
      : usuario.fechaProbableParto
      ? fechaKey(usuario.fechaProbableParto)
      : '';

    const [revisiones, vacunasBD, registrosConCitas] = await Promise.all([
      BebeRevision.find({ usuarioId: usuario._id }),
      BebeVacuna.find({ usuarioId: usuario._id }),
      Registro.find({ usuarioId: usuario._id, 'citasMedicas.0': { $exists: true } }).select('fecha citasMedicas')
    ]);

    const citasEmbarazo = [];
    registrosConCitas.forEach((reg) => {
      (reg.citasMedicas || []).forEach((cita) => {
        citasEmbarazo.push({
          tipo: cita.tipo,
          resumen: cita.resumen,
          fecha: cita.fecha || reg.fecha
        });
      });
    });

    const mensaje = construirMensajeResumenBebe({
      hoyStr,
      fechaNacimientoStr,
      revisiones,
      citasEmbarazo,
      vacunasBD,
      appUrl: process.env.APP_URL || ''
    });

    const enviados = await enviarMensajeTelegram(mensaje);
    res.json({ ok: true, fecha: hoyStr, enviados });
  })
);

export default router;
