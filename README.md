# GestaBien

App personal de seguimiento del embarazo y la salud para Cristina. Contexto completo y fases de desarrollo en el plan aprobado: `C:\Users\Alberto\.claude\plans\cheeky-enchanting-matsumoto.md`.

## Estructura

- `client/` — React + Vite + Tailwind (frontend)
- `server/` — Node + Express + MongoDB/Mongoose (backend)

## Desarrollo local

Requiere Node.js (LTS) instalado.

```bash
# Backend
cd server
npm install
npm run dev        # http://localhost:4000, usa Mongo en memoria si no hay MONGODB_URI

# Frontend (en otra terminal)
cd client
npm install
npm run dev        # http://localhost:5173
```

En modo desarrollo (sin `MONGODB_URI` configurado) el backend levanta una base de datos Mongo en memoria y crea automáticamente un usuario de prueba (se muestra el email/contraseña en la consola al arrancar). Los datos no persisten al reiniciar el servidor.

Para usar una base de datos real, copia `server/.env.example` a `server/.env` y rellena `MONGODB_URI`, `JWT_SECRET` y opcionalmente `SEED_EMAIL`/`SEED_PASSWORD` para crear el usuario real (Cristina).
