import { Router } from 'express';
import Registro from '../models/Registro.js';
import User from '../models/User.js';
import { parseFecha, fechaKey } from '../utils/fecha.js';
import { calcularGestacion } from '../utils/gestacion.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/azucar — Obtener todas las mediciones de azúcar/glucosa ordenadas cronológicamente
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const registros = await Registro.find({
      usuarioId: req.userId,
      glucosa: { $exists: true, $ne: null }
    }).sort({ fecha: -1 });

    const filtrados = registros
      .filter((r) => {
        const g = r.glucosa;
        if (!g) return false;
        return (
          g.antesDesayuno != null ||
          g.despuesDesayuno != null ||
          g.antesComida != null ||
          g.despuesComida != null ||
          g.antesCena != null ||
          g.despuesCena != null ||
          (g.nota && g.nota.trim() !== '')
        );
      })
      .map((r) => ({
        _id: r._id,
        fecha: fechaKey(r.fecha),
        semanaEmbarazo: r.semanaEmbarazo,
        diaGestacion: r.diaGestacion,
        glucosa: r.glucosa
      }));

    res.json(filtrados);
  })
);

// POST /api/azucar — Guardar o actualizar la glucosa de un día
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { fecha: fechaStr, ...datosGlucosa } = req.body;
    const fecha = parseFecha(fechaStr);
    if (!fecha) return res.status(400).json({ error: 'Fecha inválida, usa YYYY-MM-DD' });

    const usuario = await User.findById(req.userId);
    const gestacion = calcularGestacion(usuario?.fechaUltimaRegla, fecha);

    // Normalizar números vacíos a null
    const limpia = {
      antesDesayuno: datosGlucosa.antesDesayuno !== '' && datosGlucosa.antesDesayuno != null ? Number(datosGlucosa.antesDesayuno) : null,
      despuesDesayuno: datosGlucosa.despuesDesayuno !== '' && datosGlucosa.despuesDesayuno != null ? Number(datosGlucosa.despuesDesayuno) : null,
      antesComida: datosGlucosa.antesComida !== '' && datosGlucosa.antesComida != null ? Number(datosGlucosa.antesComida) : null,
      despuesComida: datosGlucosa.despuesComida !== '' && datosGlucosa.despuesComida != null ? Number(datosGlucosa.despuesComida) : null,
      antesCena: datosGlucosa.antesCena !== '' && datosGlucosa.antesCena != null ? Number(datosGlucosa.antesCena) : null,
      despuesCena: datosGlucosa.despuesCena !== '' && datosGlucosa.despuesCena != null ? Number(datosGlucosa.despuesCena) : null,
      nota: datosGlucosa.nota || ''
    };

    const registro = await Registro.findOneAndUpdate(
      { usuarioId: req.userId, fecha },
      {
        $set: {
          glucosa: limpia,
          ...gestacion,
          usuarioId: req.userId,
          fecha
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(201).json({
      _id: registro._id,
      fecha: fechaKey(registro.fecha),
      semanaEmbarazo: registro.semanaEmbarazo,
      diaGestacion: registro.diaGestacion,
      glucosa: registro.glucosa
    });
  })
);

// POST /api/azucar/batch — Guardar múltiples mediciones de glucosa a la vez
router.post(
  '/batch',
  asyncHandler(async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items debe ser un array' });

    const usuario = await User.findById(req.userId);
    const resultados = [];

    for (const item of items) {
      const { fecha: fechaStr, ...datosGlucosa } = item;
      const fecha = parseFecha(fechaStr);
      if (!fecha) continue;

      const gestacion = calcularGestacion(usuario?.fechaUltimaRegla, fecha);

      const limpia = {
        antesDesayuno: datosGlucosa.antesDesayuno !== '' && datosGlucosa.antesDesayuno != null ? Number(datosGlucosa.antesDesayuno) : null,
        despuesDesayuno: datosGlucosa.despuesDesayuno !== '' && datosGlucosa.despuesDesayuno != null ? Number(datosGlucosa.despuesDesayuno) : null,
        antesComida: datosGlucosa.antesComida !== '' && datosGlucosa.antesComida != null ? Number(datosGlucosa.antesComida) : null,
        despuesComida: datosGlucosa.despuesComida !== '' && datosGlucosa.despuesComida != null ? Number(datosGlucosa.despuesComida) : null,
        antesCena: datosGlucosa.antesCena !== '' && datosGlucosa.antesCena != null ? Number(datosGlucosa.antesCena) : null,
        despuesCena: datosGlucosa.despuesCena !== '' && datosGlucosa.despuesCena != null ? Number(datosGlucosa.despuesCena) : null,
        nota: datosGlucosa.nota || ''
      };

      const registro = await Registro.findOneAndUpdate(
        { usuarioId: req.userId, fecha },
        {
          $set: {
            glucosa: limpia,
            ...gestacion,
            usuarioId: req.userId,
            fecha
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );

      resultados.push({
        _id: registro._id,
        fecha: fechaKey(registro.fecha),
        semanaEmbarazo: registro.semanaEmbarazo,
        diaGestacion: registro.diaGestacion,
        glucosa: registro.glucosa
      });
    }

    res.json(resultados);
  })
);

// DELETE /api/azucar/:fecha — Eliminar la medición de glucosa de una fecha
router.delete(
  '/:fecha',
  asyncHandler(async (req, res) => {
    const fecha = parseFecha(req.params.fecha);
    if (!fecha) return res.status(400).json({ error: 'Fecha inválida, usa YYYY-MM-DD' });

    await Registro.updateOne(
      { usuarioId: req.userId, fecha },
      { $unset: { glucosa: 1 } }
    );

    res.json({ ok: true });
  })
);

export default router;
