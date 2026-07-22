import mongoose from 'mongoose';

let memoryServer;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    await mongoose.connect(uri);
    console.log('MongoDB conectado (Atlas)');
    return { usingMemoryDB: false };
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  console.log('MongoDB en memoria (desarrollo — los datos no persisten al reiniciar)');
  return { usingMemoryDB: true };
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}
