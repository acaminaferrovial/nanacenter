import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { email: user.email, nombre: user.nombre } });
});

router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

router.patch('/me', requireAuth, async (req, res) => {
  const { nombre, fechaUltimaRegla, fechaProbableParto } = req.body;
  const datos = {};
  if (nombre !== undefined) datos.nombre = nombre;
  if (fechaUltimaRegla !== undefined) datos.fechaUltimaRegla = fechaUltimaRegla ? new Date(fechaUltimaRegla) : null;
  if (fechaProbableParto !== undefined) datos.fechaProbableParto = fechaProbableParto ? new Date(fechaProbableParto) : null;

  const user = await User.findByIdAndUpdate(req.userId, { $set: datos }, { new: true, runValidators: true }).select(
    '-passwordHash'
  );
  res.json(user);
});

export default router;
