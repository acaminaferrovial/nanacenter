import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { seedUser } from './scripts/seedUser.js';
import { requireAuth } from './middleware/auth.js';
import { requireMcpAuth } from './middleware/mcpAuth.js';
import authRoutes from './routes/auth.js';
import registrosRoutes from './routes/registros.js';
import uploadRoutes from './routes/upload.js';
import mcpRoutes from './routes/mcp.js';

if (!process.env.MONGODB_URI && !process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'gestabien-dev-secret-change-me';
}
if (process.env.MONGODB_URI && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET es obligatorio cuando se usa una base de datos real (MONGODB_URI definido). Añádelo a server/.env');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/registros', requireAuth, registrosRoutes);
app.use('/api/upload', requireAuth, uploadRoutes);
app.use('/mcp', requireMcpAuth, mcpRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;

const { usingMemoryDB } = await connectDB();

if (usingMemoryDB) {
  const email = process.env.SEED_EMAIL || 'cristina@example.com';
  const password = process.env.SEED_PASSWORD || 'dev123456';
  await seedUser({ email, password, nombre: process.env.SEED_NOMBRE });
  console.log(`[dev] Usuario de prueba: ${email} / ${password}`);
} else if (process.env.SEED_EMAIL && process.env.SEED_PASSWORD) {
  await seedUser({ email: process.env.SEED_EMAIL, password: process.env.SEED_PASSWORD, nombre: process.env.SEED_NOMBRE });
}

app.listen(PORT, () => console.log(`GestaBien API escuchando en el puerto ${PORT}`));
