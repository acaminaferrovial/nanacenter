import crypto from 'crypto';
import { Router } from 'express';
import BebeRegistro from '../models/BebeRegistro.js';
import BebeVacuna from '../models/BebeVacuna.js';
import BebeCompra from '../models/BebeCompra.js';
import { parseFecha, fechaKey } from '../utils/fecha.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

function serializarRegistro(r) {
  return {
    _id: r._id,
    fecha: fechaKey(r.fecha),
    grupoId: r.grupoId || null,
    tipo: r.tipo,
    valor: r.valor ?? null,
    unidad: r.unidad || null,
    texto: r.texto || '',
    createdAt: r.createdAt
  };
}

function serializarVacuna(v) {
  return {
    _id: v._id,
    codigo: v.codigo,
    nombre: v.nombre,
    edadRecomendada: v.edadRecomendada,
    dosis: v.dosis,
    descripcion: v.descripcion,
    estado: v.estado,
    fechaAplicacion: v.fechaAplicacion ? fechaKey(v.fechaAplicacion) : '',
    lote: v.lote || '',
    notas: v.notas || '',
    personalizada: !!v.personalizada
  };
}

// GET /api/bebe/registros — Obtener registros individuales (opcional ?tipo=peso|tamano|comentario)
router.get(
  '/registros',
  asyncHandler(async (req, res) => {
    const filtro = { usuarioId: req.userId };
    if (req.query.tipo && ['peso', 'tamano', 'comentario'].includes(req.query.tipo)) {
      filtro.tipo = req.query.tipo;
    }

    const registros = await BebeRegistro.find(filtro).sort({ fecha: 1, createdAt: 1 });
    res.json(registros.map(serializarRegistro));
  })
);

// POST /api/bebe/mediciones — Guarda peso, tamaño y comentario como registros separados con mismo grupoId
router.post(
  '/mediciones',
  asyncHandler(async (req, res) => {
    const { fecha: fechaStr, peso, tamano, comentario } = req.body;
    const fecha = parseFecha(fechaStr);
    if (!fecha) return res.status(400).json({ error: 'Fecha inválida, usa YYYY-MM-DD' });

    const tienePeso = peso !== '' && peso !== null && peso !== undefined && !Number.isNaN(Number(peso));
    const tieneTamano = tamano !== '' && tamano !== null && tamano !== undefined && !Number.isNaN(Number(tamano));
    const tieneComentario = typeof comentario === 'string' && comentario.trim() !== '';

    if (!tienePeso && !tieneTamano && !tieneComentario) {
      return res.status(400).json({ error: 'Introduce al menos peso, tamaño o un comentario' });
    }

    const grupoId = crypto.randomUUID();
    const docsACrear = [];

    if (tienePeso) {
      docsACrear.push({
        usuarioId: req.userId,
        fecha,
        grupoId,
        tipo: 'peso',
        valor: Number(peso),
        unidad: 'kg'
      });
    }

    if (tieneTamano) {
      docsACrear.push({
        usuarioId: req.userId,
        fecha,
        grupoId,
        tipo: 'tamano',
        valor: Number(tamano),
        unidad: 'cm'
      });
    }

    if (tieneComentario) {
      docsACrear.push({
        usuarioId: req.userId,
        fecha,
        grupoId,
        tipo: 'comentario',
        texto: comentario.trim()
      });
    }

    const creados = await BebeRegistro.insertMany(docsACrear);
    res.status(201).json({
      grupoId,
      registros: creados.map(serializarRegistro)
    });
  })
);

// DELETE /api/bebe/registros/:id — Eliminar un registro individual
router.delete(
  '/registros/:id',
  asyncHandler(async (req, res) => {
    const eliminado = await BebeRegistro.findOneAndDelete({
      _id: req.params.id,
      usuarioId: req.userId
    });
    if (!eliminado) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ ok: true });
  })
);

// DELETE /api/bebe/grupos/:grupoId — Eliminar todos los registros de una misma entrada combinada
router.delete(
  '/grupos/:grupoId',
  asyncHandler(async (req, res) => {
    await BebeRegistro.deleteMany({
      usuarioId: req.userId,
      grupoId: req.params.grupoId
    });
    res.json({ ok: true });
  })
);

// GET /api/bebe/vacunas — Obtener cartilla de vacunación guardada
router.get(
  '/vacunas',
  asyncHandler(async (req, res) => {
    const vacunas = await BebeVacuna.find({ usuarioId: req.userId }).sort({ createdAt: 1 });
    res.json(vacunas.map(serializarVacuna));
  })
);

// POST /api/bebe/vacunas — Guardar o actualizar una vacuna (upsert por codigo)
router.post(
  '/vacunas',
  asyncHandler(async (req, res) => {
    const {
      codigo,
      nombre,
      edadRecomendada,
      dosis,
      descripcion,
      estado,
      fechaAplicacion,
      lote,
      notas,
      personalizada
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la vacuna es obligatorio' });
    }

    const codigoFinal = codigo && String(codigo).trim() ? String(codigo).trim() : `custom-${crypto.randomUUID()}`;

    let fechaParsed = null;
    if (fechaAplicacion) {
      fechaParsed = parseFecha(fechaAplicacion);
      if (!fechaParsed) return res.status(400).json({ error: 'Fecha de aplicación inválida, usa YYYY-MM-DD' });
    }

    const vacuna = await BebeVacuna.findOneAndUpdate(
      { usuarioId: req.userId, codigo: codigoFinal },
      {
        $set: {
          usuarioId: req.userId,
          codigo: codigoFinal,
          nombre: nombre.trim(),
          edadRecomendada: edadRecomendada || 'Otra',
          dosis: dosis || '',
          descripcion: descripcion || '',
          estado: ['pendiente', 'puesta', 'no_aplica'].includes(estado) ? estado : 'pendiente',
          fechaAplicacion: fechaParsed,
          lote: lote || '',
          notas: notas || '',
          personalizada: Boolean(personalizada)
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(201).json(serializarVacuna(vacuna));
  })
);

// DELETE /api/bebe/vacunas/:codigo — Eliminar una vacuna personalizada o resetear una estándar
router.delete(
  '/vacunas/:codigo',
  asyncHandler(async (req, res) => {
    await BebeVacuna.findOneAndDelete({
      usuarioId: req.userId,
      codigo: req.params.codigo
    });
    res.json({ ok: true });
  })
);

function serializarCompra(c) {
  return {
    _id: c._id,
    codigo: c.codigo,
    nombre: c.nombre,
    categoria: c.categoria,
    comprado: !!c.comprado,
    descartado: !!c.descartado,
    notas: c.notas || '',
    personalizada: !!c.personalizada
  };
}

// GET /api/bebe/compras — Obtener lista de compras guardada
router.get(
  '/compras',
  asyncHandler(async (req, res) => {
    const compras = await BebeCompra.find({ usuarioId: req.userId }).sort({ createdAt: 1 });
    res.json(compras.map(serializarCompra));
  })
);

// POST /api/bebe/compras — Guardar o actualizar un artículo de la lista (upsert por codigo)
router.post(
  '/compras',
  asyncHandler(async (req, res) => {
    const { codigo, nombre, categoria, comprado, descartado, notas, personalizada } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del artículo es obligatorio' });
    }

    const codigoFinal = codigo && String(codigo).trim() ? String(codigo).trim() : `custom-${crypto.randomUUID()}`;

    const item = await BebeCompra.findOneAndUpdate(
      { usuarioId: req.userId, codigo: codigoFinal },
      {
        $set: {
          usuarioId: req.userId,
          codigo: codigoFinal,
          nombre: nombre.trim(),
          categoria: categoria || 'Otros',
          comprado: Boolean(comprado),
          descartado: Boolean(descartado),
          notas: notas || '',
          personalizada: Boolean(personalizada)
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(201).json(serializarCompra(item));
  })
);

// DELETE /api/bebe/compras/:codigo — Eliminar un artículo personalizado o resetear uno estándar
router.delete(
  '/compras/:codigo',
  asyncHandler(async (req, res) => {
    await BebeCompra.findOneAndDelete({
      usuarioId: req.userId,
      codigo: req.params.codigo
    });
    res.json({ ok: true });
  })
);

export default router;
