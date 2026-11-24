import crypto from 'crypto';
import { Router } from 'express';
import BebeRegistro from '../models/BebeRegistro.js';
import BebeVacuna from '../models/BebeVacuna.js';
import BebeCompra from '../models/BebeCompra.js';
import BebeRevision from '../models/BebeRevision.js';
import BebeActividad from '../models/BebeActividad.js';
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
    fechaPrevista: v.fechaPrevista ? fechaKey(v.fechaPrevista) : '',
    lote: v.lote || '',
    notas: v.notas || '',
    personalizada: !!v.personalizada
  };
}

// GET /api/bebe/registros — Obtener registros individuales (opcional ?tipo=peso|tamano|perimetroCefalico|comentario)
router.get(
  '/registros',
  asyncHandler(async (req, res) => {
    const filtro = { usuarioId: req.userId };
    if (req.query.tipo && ['peso', 'tamano', 'perimetroCefalico', 'comentario'].includes(req.query.tipo)) {
      filtro.tipo = req.query.tipo;
    }

    const registros = await BebeRegistro.find(filtro).sort({ fecha: 1, createdAt: 1 });
    res.json(registros.map(serializarRegistro));
  })
);

// POST /api/bebe/mediciones — Guarda peso, tamaño, perímetro cefálico y comentario como registros separados con mismo grupoId
router.post(
  '/mediciones',
  asyncHandler(async (req, res) => {
    const { fecha: fechaStr, peso, tamano, perimetroCefalico, comentario } = req.body;
    const fecha = parseFecha(fechaStr);
    if (!fecha) return res.status(400).json({ error: 'Fecha inválida, usa YYYY-MM-DD' });

    const tienePeso = peso !== '' && peso !== null && peso !== undefined && !Number.isNaN(Number(peso));
    const tieneTamano = tamano !== '' && tamano !== null && tamano !== undefined && !Number.isNaN(Number(tamano));
    const tienePerimetro =
      perimetroCefalico !== '' &&
      perimetroCefalico !== null &&
      perimetroCefalico !== undefined &&
      !Number.isNaN(Number(perimetroCefalico));
    const tieneComentario = typeof comentario === 'string' && comentario.trim() !== '';

    if (!tienePeso && !tieneTamano && !tienePerimetro && !tieneComentario) {
      return res.status(400).json({ error: 'Introduce al menos peso, tamaño, perímetro cefálico o un comentario' });
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

    if (tienePerimetro) {
      docsACrear.push({
        usuarioId: req.userId,
        fecha,
        grupoId,
        tipo: 'perimetroCefalico',
        valor: Number(perimetroCefalico),
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
      fechaPrevista,
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

    let fechaPrevistaParsed = null;
    if (fechaPrevista) {
      fechaPrevistaParsed = parseFecha(fechaPrevista);
      if (!fechaPrevistaParsed) return res.status(400).json({ error: 'Fecha prevista inválida, usa YYYY-MM-DD' });
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
          fechaPrevista: fechaPrevistaParsed,
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
    eliminado: !!c.eliminado,
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
          eliminado: false,
          notas: notas || '',
          personalizada: Boolean(personalizada)
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(201).json(serializarCompra(item));
  })
);

// DELETE /api/bebe/compras/:codigo — Eliminar un artículo (marcar como eliminado para que no vuelva si es base)
router.delete(
  '/compras/:codigo',
  asyncHandler(async (req, res) => {
    await BebeCompra.findOneAndUpdate(
      { usuarioId: req.userId, codigo: req.params.codigo },
      {
        $set: {
          usuarioId: req.userId,
          codigo: req.params.codigo,
          eliminado: true
        }
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ ok: true });
  })
);

function serializarRevision(r) {
  return {
    _id: r._id,
    fecha: fechaKey(r.fecha),
    tipo: r.tipo || 'Revisión rutinaria',
    profesional: r.profesional || '',
    resumen: r.resumen || '',
    recomendaciones: r.recomendaciones || '',
    proximaRevision: r.proximaRevision ? fechaKey(r.proximaRevision) : '',
    documentos: r.documentos || [],
    createdAt: r.createdAt
  };
}

// GET /api/bebe/revisiones — Listar revisiones pediátricas
router.get(
  '/revisiones',
  asyncHandler(async (req, res) => {
    const revisiones = await BebeRevision.find({ usuarioId: req.userId }).sort({ fecha: -1, createdAt: -1 });
    res.json(revisiones.map(serializarRevision));
  })
);

// POST /api/bebe/revisiones — Crear una revisión pediátrica
router.post(
  '/revisiones',
  asyncHandler(async (req, res) => {
    const { fecha: fechaStr, tipo, profesional, resumen, recomendaciones, proximaRevision, documentos } = req.body;
    const fecha = parseFecha(fechaStr);
    if (!fecha) return res.status(400).json({ error: 'Fecha inválida, usa YYYY-MM-DD' });

    let proxParsed = null;
    if (proximaRevision) {
      proxParsed = parseFecha(proximaRevision);
      if (!proxParsed) return res.status(400).json({ error: 'Fecha de próxima revisión inválida, usa YYYY-MM-DD' });
    }

    const rev = await BebeRevision.create({
      usuarioId: req.userId,
      fecha,
      tipo: tipo || 'Revisión rutinaria',
      profesional: profesional || '',
      resumen: resumen || '',
      recomendaciones: recomendaciones || '',
      proximaRevision: proxParsed,
      documentos: Array.isArray(documentos) ? documentos : []
    });

    res.status(201).json(serializarRevision(rev));
  })
);

// PATCH /api/bebe/revisiones/:id — Actualizar una revisión pediátrica
router.patch(
  '/revisiones/:id',
  asyncHandler(async (req, res) => {
    const { fecha: fechaStr, tipo, profesional, resumen, recomendaciones, proximaRevision, documentos } = req.body;
    const datos = {};

    if (fechaStr !== undefined) {
      const fecha = parseFecha(fechaStr);
      if (!fecha) return res.status(400).json({ error: 'Fecha inválida, usa YYYY-MM-DD' });
      datos.fecha = fecha;
    }
    if (tipo !== undefined) datos.tipo = tipo;
    if (profesional !== undefined) datos.profesional = profesional;
    if (resumen !== undefined) datos.resumen = resumen;
    if (recomendaciones !== undefined) datos.recomendaciones = recomendaciones;
    if (proximaRevision !== undefined) {
      if (!proximaRevision) {
        datos.proximaRevision = null;
      } else {
        const proxParsed = parseFecha(proximaRevision);
        if (!proxParsed) return res.status(400).json({ error: 'Fecha de próxima revisión inválida' });
        datos.proximaRevision = proxParsed;
      }
    }
    if (documentos !== undefined) datos.documentos = Array.isArray(documentos) ? documentos : [];

    const rev = await BebeRevision.findOneAndUpdate(
      { _id: req.params.id, usuarioId: req.userId },
      { $set: datos },
      { new: true, runValidators: true }
    );
    if (!rev) return res.status(404).json({ error: 'Revisión no encontrada' });
    res.json(serializarRevision(rev));
  })
);

// DELETE /api/bebe/revisiones/:id — Eliminar una revisión pediátrica
router.delete(
  '/revisiones/:id',
  asyncHandler(async (req, res) => {
    const eliminada = await BebeRevision.findOneAndDelete({
      _id: req.params.id,
      usuarioId: req.userId
    });
    if (!eliminada) return res.status(404).json({ error: 'Revisión no encontrada' });
    res.json({ ok: true });
  })
);

function serializarActividad(a) {
  return {
    _id: a._id,
    fecha: fechaKey(a.fecha),
    codigo: a.codigo,
    titulo: a.titulo,
    categoria: a.categoria || 'Ejercicio',
    completada: !!a.completada,
    notas: a.notas || ''
  };
}

// GET /api/bebe/actividades — Obtener actividades/ejercicios marcados del bebé
router.get(
  '/actividades',
  asyncHandler(async (req, res) => {
    const actividades = await BebeActividad.find({ usuarioId: req.userId }).sort({ fecha: 1, createdAt: 1 });
    res.json(actividades.map(serializarActividad));
  })
);

// POST /api/bebe/actividades — Marcar/desmarcar o guardar una actividad de un día (upsert por fecha + codigo)
router.post(
  '/actividades',
  asyncHandler(async (req, res) => {
    const { fecha: fechaStr, codigo, titulo, categoria, completada, notas } = req.body;
    const fecha = parseFecha(fechaStr);
    if (!fecha) return res.status(400).json({ error: 'Fecha inválida, usa YYYY-MM-DD' });
    if (!titulo || !titulo.trim()) return res.status(400).json({ error: 'El título de la actividad es obligatorio' });

    const codigoFinal = codigo && String(codigo).trim() ? String(codigo).trim() : `custom-${crypto.randomUUID()}`;

    const act = await BebeActividad.findOneAndUpdate(
      { usuarioId: req.userId, fecha, codigo: codigoFinal },
      {
        $set: {
          usuarioId: req.userId,
          fecha,
          codigo: codigoFinal,
          titulo: titulo.trim(),
          categoria: categoria || 'Ejercicio',
          completada: completada !== undefined ? Boolean(completada) : true,
          notas: notas || ''
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(201).json(serializarActividad(act));
  })
);

// DELETE /api/bebe/actividades/:id — Eliminar una actividad personalizada o registro
router.delete(
  '/actividades/:id',
  asyncHandler(async (req, res) => {
    const eliminada = await BebeActividad.findOneAndDelete({
      _id: req.params.id,
      usuarioId: req.userId
    });
    if (!eliminada) return res.status(404).json({ error: 'Actividad no encontrada' });
    res.json({ ok: true });
  })
);

export default router;
