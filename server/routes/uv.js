import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UBICACIONES } from '../utils/ubicaciones.js';

const router = Router();

// El índice UV solo viene hora a hora, pero durante una sesión de sol puede cambiar mucho
// (a media mañana sube muy rápido). Interpolamos linealmente para estimar el valor
// en un minuto concreto del día.
function uvEnMinuto(tiempos, valores, fecha, minutoDelDia) {
  const hora = Math.floor(minutoDelDia / 60);
  const fraccion = (minutoDelDia % 60) / 60;
  const idx = tiempos.indexOf(`${fecha}T${String(hora).padStart(2, '0')}:00`);
  if (idx === -1) return null;

  const actual = valores[idx];
  const siguiente = idx + 1 < valores.length && valores[idx + 1] != null ? valores[idx + 1] : actual;
  return actual + (siguiente - actual) * fraccion;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { ubicacion, fecha, hora, duracion } = req.query;

    const coords = UBICACIONES[ubicacion];
    if (!coords) return res.status(400).json({ error: 'Ubicación desconocida' });
    if (!fecha || !hora) return res.status(400).json({ error: 'Faltan fecha u hora' });

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=uv_index&timezone=auto&start_date=${fecha}&end_date=${fecha}`;

    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      return res.status(502).json({ error: 'No se pudo consultar el índice UV' });
    }
    const datos = await respuesta.json();

    const tiempos = datos.hourly?.time || [];
    const valores = datos.hourly?.uv_index || [];

    const minutoInicio = Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
    const minutos = Math.max(0, Math.round(Number(duracion) || 0));

    const uvInicio = uvEnMinuto(tiempos, valores, fecha, minutoInicio);
    if (uvInicio == null) {
      return res
        .status(404)
        .json({ error: 'No hay datos de UV disponibles para esa fecha/hora (el pronóstico solo cubre unos 92 días atrás)' });
    }

    // Sin duración todavía no hay ventana que promediar: devolvemos el valor del inicio.
    if (minutos === 0) {
      return res.json({ uvIndex: Math.round(uvInicio * 100) / 100, uvInicio: Math.round(uvInicio * 100) / 100 });
    }

    let suma = 0;
    let cuenta = 0;
    for (let m = minutoInicio; m < minutoInicio + minutos; m++) {
      const valor = uvEnMinuto(tiempos, valores, fecha, Math.min(m, 24 * 60 - 1));
      if (valor != null) {
        suma += valor;
        cuenta++;
      }
    }

    const uvMedio = cuenta > 0 ? suma / cuenta : uvInicio;
    res.json({
      uvIndex: Math.round(uvMedio * 100) / 100,
      uvInicio: Math.round(uvInicio * 100) / 100
    });
  })
);

export default router;
