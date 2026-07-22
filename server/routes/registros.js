import { Router } from 'express';
import Registro from '../models/Registro.js';
import User from '../models/User.js';

const router = Router();

function parseFecha(fechaStr) {
  if (!fechaStr) return null;
  const fecha = new Date(`${fechaStr}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha;
}

function calcularGestacion(fechaUltimaRegla, fecha) {
  if (!fechaUltimaRegla) return {};
  const dias = Math.floor((fecha - new Date(fechaUltimaRegla)) / 86400000) + 1;
  if (dias < 1) return {};
  return { diaGestacion: dias, semanaEmbarazo: Math.floor((dias - 1) / 7) + 1 };
}

router.get('/', async (req, res) => {
  const registros = await Registro.find({ usuarioId: req.userId }).sort({ fecha: 1 });
  res.json(registros);
});

router.get('/semana/:n', async (req, res) => {
  const semana = Number(req.params.n);
  const registros = await Registro.find({ usuarioId: req.userId, semanaEmbarazo: semana }).sort({ fecha: 1 });
  res.json(registros);
});

router.get('/:fecha', async (req, res) => {
  const fecha = parseFecha(req.params.fecha);
  if (!fecha) return res.status(400).json({ error: 'Fecha inválida, usa YYYY-MM-DD' });

  const registro = await Registro.findOne({ usuarioId: req.userId, fecha });
  if (!registro) return res.status(404).json({ error: 'No hay registro para esa fecha' });
  res.json(registro);
});

router.post('/', async (req, res) => {
  const { fecha: fechaStr, ...datos } = req.body;
  const fecha = parseFecha(fechaStr);
  if (!fecha) return res.status(400).json({ error: 'Fecha inválida, usa YYYY-MM-DD' });

  delete datos.usuarioId;
  delete datos._id;

  const usuario = await User.findById(req.userId);
  const gestacion = calcularGestacion(usuario?.fechaUltimaRegla, fecha);

  const registro = await Registro.findOneAndUpdate(
    { usuarioId: req.userId, fecha },
    { $set: { ...datos, ...gestacion, usuarioId: req.userId, fecha } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.status(201).json(registro);
});

router.patch('/:fecha', async (req, res) => {
  const fecha = parseFecha(req.params.fecha);
  if (!fecha) return res.status(400).json({ error: 'Fecha inválida, usa YYYY-MM-DD' });

  const datos = { ...req.body };
  delete datos.usuarioId;
  delete datos._id;
  delete datos.fecha;

  const usuario = await User.findById(req.userId);
  const gestacion = calcularGestacion(usuario?.fechaUltimaRegla, fecha);

  const registro = await Registro.findOneAndUpdate(
    { usuarioId: req.userId, fecha },
    { $set: { ...datos, ...gestacion } },
    { new: true, runValidators: true }
  );
  if (!registro) return res.status(404).json({ error: 'No hay registro para esa fecha' });
  res.json(registro);
});

export default router;
