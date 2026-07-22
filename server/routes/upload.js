import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = Router();

router.get('/firma', (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return res.status(503).json({ error: 'La subida de documentos no está configurada todavía' });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `gestabien/${req.userId}`;
  const paramsToSign = { timestamp, folder, use_filename: true, unique_filename: true, access_control: '[{"access_type":"anonymous"}]' };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

  res.json({
    ...paramsToSign,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  });
});

// Llamado justo después de que el browser sube el archivo a Cloudinary.
// Usa la Admin API (con credenciales de servidor) para forzar acceso anónimo
// incluso cuando la cuenta tiene "Restricted media access" activo globalmente.
router.post('/publicar', async (req, res) => {
  const { publicId, resourceType } = req.body;
  if (!publicId || !resourceType) {
    return res.status(400).json({ error: 'Faltan publicId o resourceType' });
  }

  try {
    await cloudinary.api.update(publicId, {
      resource_type: resourceType,
      access_control: [{ access_type: 'anonymous' }]
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error al publicar en Cloudinary:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar el acceso del archivo' });
  }
});

export default router;
