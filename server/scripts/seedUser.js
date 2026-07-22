import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export async function seedUser({ email, password, nombre = 'Cristina' }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $set: { passwordHash, nombre } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;

  if (!email || !password) {
    console.error('Define SEED_EMAIL y SEED_PASSWORD en server/.env antes de ejecutar npm run seed');
    process.exit(1);
  }

  const { connectDB, disconnectDB } = await import('../db.js');
  await connectDB();
  const user = await seedUser({ email, password, nombre: process.env.SEED_NOMBRE });
  console.log(`Usuario listo: ${user.email}`);
  await disconnectDB();
  process.exit(0);
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/seedUser.js');
if (isMain) {
  main();
}
