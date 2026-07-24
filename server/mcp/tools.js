import { z } from 'zod';
import Registro from '../models/Registro.js';
import User from '../models/User.js';
import { parseFecha, fechaKey } from '../utils/fecha.js';
import { calcularGestacion } from '../utils/gestacion.js';
import { SINTOMA_TIPOS } from '../utils/sintomas.js';

async function getUsuario() {
  return User.findOne();
}

function limpiar(registro) {
  if (!registro) return null;
  const obj = registro.toObject ? registro.toObject() : registro;
  const { _id, usuarioId, createdAt, updatedAt, __v, ...resto } = obj;
  return { ...resto, fecha: fechaKey(obj.fecha) };
}

function objSubdoc(sub) {
  if (!sub) return {};
  return sub.toObject ? sub.toObject() : sub;
}

function ok(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function fail(mensaje) {
  return { content: [{ type: 'text', text: mensaje }], isError: true };
}

const escalaEmocional = z.number().min(1).max(5);

const emocionalSchema = z
  .object({
    animo: escalaEmocional.optional(),
    ansiedad: escalaEmocional.optional(),
    estres: escalaEmocional.optional(),
    irritabilidad: escalaEmocional.optional(),
    energia: escalaEmocional.optional(),
    nota: z.string().optional()
  })
  .optional()
  .describe('Estado emocional del día. Solo se actualizan los campos que se envíen, el resto se conserva.');

const suenoSchema = z
  .object({
    horas: z.number().optional(),
    calidad: escalaEmocional.optional(),
    despertares: z.number().optional(),
    dificultadConciliar: z.boolean().optional(),
    sensacionAlDespertar: z.string().optional(),
    nota: z.string().optional()
  })
  .optional()
  .describe('Datos de sueño. Solo se actualizan los campos que se envíen, el resto se conserva.');

const nutricionSchema = z
  .object({
    comidas: z.number().optional(),
    agua: z.number().optional(),
    hambre: escalaEmocional.optional(),
    vomitos: z.boolean().optional(),
    nota: z.string().optional()
  })
  .optional()
  .describe('Nutrición del día. Solo se actualizan los campos que se envíen, el resto se conserva.');

const transitoSchema = z
  .object({
    estrenimiento: z.boolean().optional(),
    diarrea: z.boolean().optional(),
    nota: z.string().optional()
  })
  .optional()
  .describe('Tránsito intestinal general (no las deposiciones individuales, para eso usa anadir_deposicion).');

const momentoDiaSchema = z
  .object({
    nota: z.string().optional(),
    energia: z.number().min(1).max(5).optional()
  })
  .optional();

export function registerTools(server) {
  server.registerTool(
    'consultar_dia',
    {
      title: 'Consultar registro de un día',
      description:
        'Devuelve todos los datos registrados para una fecha concreta: síntomas, estado emocional, sueño, peso, nutrición, tránsito intestinal, ejercicio, exposición solar, medicación, citas médicas y diario personal.',
      inputSchema: { fecha: z.string().describe('Fecha en formato YYYY-MM-DD') }
    },
    async ({ fecha }) => {
      const f = parseFecha(fecha);
      if (!f) return fail('Fecha inválida, usa el formato YYYY-MM-DD');

      const usuario = await getUsuario();
      const registro = await Registro.findOne({ usuarioId: usuario._id, fecha: f });
      const data = limpiar(registro) || { fecha, nota: 'No hay ningún registro guardado para este día todavía.' };
      return ok(data);
    }
  );

  server.registerTool(
    'consultar_rango',
    {
      title: 'Consultar varios días',
      description: 'Devuelve los registros guardados entre dos fechas (ambas incluidas), ordenados cronológicamente. Útil para ver la evolución de una semana o un mes.',
      inputSchema: {
        desde: z.string().describe('Fecha inicial en formato YYYY-MM-DD'),
        hasta: z.string().describe('Fecha final en formato YYYY-MM-DD')
      }
    },
    async ({ desde, hasta }) => {
      const fDesde = parseFecha(desde);
      const fHasta = parseFecha(hasta);
      if (!fDesde || !fHasta) return fail('Fechas inválidas, usa el formato YYYY-MM-DD');

      const usuario = await getUsuario();
      const registros = await Registro.find({
        usuarioId: usuario._id,
        fecha: { $gte: fDesde, $lte: fHasta }
      }).sort({ fecha: 1 });
      return ok(registros.map(limpiar));
    }
  );

  server.registerTool(
    'consultar_perfil',
    {
      title: 'Consultar perfil de embarazo',
      description: 'Devuelve el nombre, la fecha de última regla, la fecha probable de parto y la semana/día de gestación actual.',
      inputSchema: {}
    },
    async () => {
      const usuario = await getUsuario();
      const gestacion = calcularGestacion(usuario.fechaUltimaRegla, new Date());
      return ok({
        nombre: usuario.nombre,
        fechaUltimaRegla: usuario.fechaUltimaRegla ? fechaKey(usuario.fechaUltimaRegla) : null,
        fechaProbableParto: usuario.fechaProbableParto ? fechaKey(usuario.fechaProbableParto) : null,
        ...gestacion
      });
    }
  );

  server.registerTool(
    'consultar_citas_medicas',
    {
      title: 'Consultar citas médicas',
      description: 'Devuelve las citas médicas registradas (ecografías, ginecología, matrona, analíticas...), ordenadas por fecha.',
      inputSchema: {
        soloProximas: z.boolean().optional().describe('Si es true, solo devuelve citas de hoy en adelante')
      }
    },
    async ({ soloProximas }) => {
      const usuario = await getUsuario();
      const registros = await Registro.find({
        usuarioId: usuario._id,
        'citasMedicas.0': { $exists: true }
      });

      let citas = [];
      registros.forEach((r) => {
        (r.citasMedicas || []).forEach((c) => {
          citas.push({
            tipo: c.tipo,
            fecha: fechaKey(c.fecha || r.fecha),
            resumen: c.resumen,
            recomendaciones: c.recomendaciones,
            numDocumentos: (c.documentos || []).length
          });
        });
      });
      citas.sort((a, b) => a.fecha.localeCompare(b.fecha));

      if (soloProximas) {
        const hoy = fechaKey(new Date());
        citas = citas.filter((c) => c.fecha >= hoy);
      }

      return ok(citas);
    }
  );

  server.registerTool(
    'registrar_dia',
    {
      title: 'Registrar o actualizar datos de un día',
      description:
        'Guarda datos para una fecha. Si ya había un registro ese día, los campos enviados se combinan con lo existente (no se pierde lo que ya había, salvo "diario" que se sobreescribe: para añadir texto sin borrar usa anadir_nota_diario).',
      inputSchema: {
        fecha: z.string().describe('Fecha en formato YYYY-MM-DD'),
        peso: z.number().optional().describe('Peso en kg'),
        diario: z.string().optional().describe('Sobreescribe el texto del diario personal de ese día'),
        resumenDia: z.string().optional(),
        emocional: emocionalSchema,
        sueno: suenoSchema,
        nutricion: nutricionSchema,
        transito: transitoSchema,
        momentoManana: momentoDiaSchema,
        momentoTarde: momentoDiaSchema,
        momentoNoche: momentoDiaSchema
      }
    },
    async ({ fecha, peso, diario, resumenDia, emocional, sueno, nutricion, transito, momentoManana, momentoTarde, momentoNoche }) => {
      const f = parseFecha(fecha);
      if (!f) return fail('Fecha inválida, usa el formato YYYY-MM-DD');

      const usuario = await getUsuario();
      const existente = await Registro.findOne({ usuarioId: usuario._id, fecha: f });

      const set = {};
      if (peso !== undefined) set.peso = peso;
      if (diario !== undefined) set.diario = diario;
      if (resumenDia !== undefined) set.resumenDia = resumenDia;
      if (emocional) set.emocional = { ...objSubdoc(existente?.emocional), ...emocional };
      if (sueno) set.sueno = { ...objSubdoc(existente?.sueno), ...sueno };
      if (nutricion) set.nutricion = { ...objSubdoc(existente?.nutricion), ...nutricion };
      if (transito) set.transito = { ...objSubdoc(existente?.transito), ...transito };
      if (momentoManana || momentoTarde || momentoNoche) {
        const momentosExistentes = objSubdoc(existente?.momentos);
        set.momentos = {
          manana: { ...objSubdoc(momentosExistentes.manana), ...momentoManana },
          tarde: { ...objSubdoc(momentosExistentes.tarde), ...momentoTarde },
          noche: { ...objSubdoc(momentosExistentes.noche), ...momentoNoche }
        };
      }

      const gestacion = calcularGestacion(usuario.fechaUltimaRegla, f);
      const registro = await Registro.findOneAndUpdate(
        { usuarioId: usuario._id, fecha: f },
        { $set: { ...set, ...gestacion, usuarioId: usuario._id, fecha: f } },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
      return ok(limpiar(registro));
    }
  );

  server.registerTool(
    'anadir_sintoma',
    {
      title: 'Añadir un síntoma',
      description: 'Añade un síntoma nuevo a la lista de síntomas de un día, sin borrar los que ya hubiera.',
      inputSchema: {
        fecha: z.string().describe('Fecha en formato YYYY-MM-DD'),
        tipo: z.enum(SINTOMA_TIPOS).describe('Tipo de síntoma. Debe ser exactamente uno de los valores de la lista, para que coincida con los que ya usa la app.'),
        momento: z.enum(['mañana', 'tarde', 'noche']).optional(),
        intensidad: z.number().min(1).max(10).optional(),
        duracion: z.string().optional(),
        nota: z.string().optional()
      }
    },
    async ({ fecha, tipo, momento, intensidad, duracion, nota }) => {
      const f = parseFecha(fecha);
      if (!f) return fail('Fecha inválida, usa el formato YYYY-MM-DD');

      const usuario = await getUsuario();
      const gestacion = calcularGestacion(usuario.fechaUltimaRegla, f);
      const registro = await Registro.findOneAndUpdate(
        { usuarioId: usuario._id, fecha: f },
        {
          $push: { sintomas: { tipo, momento, intensidad, duracion, nota } },
          $set: { ...gestacion, usuarioId: usuario._id, fecha: f }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
      return ok(limpiar(registro));
    }
  );

  server.registerTool(
    'anadir_deposicion',
    {
      title: 'Añadir una deposición (escala de Bristol)',
      description: 'Registra una deposición del día, con su hora y tipo según la escala de Bristol (1-7), sin borrar las que ya hubiera ese día.',
      inputSchema: {
        fecha: z.string().describe('Fecha en formato YYYY-MM-DD'),
        hora: z.string().optional().describe('Hora aproximada, p.ej. "09:30"'),
        tipoBristol: z.number().min(1).max(7).describe('Tipo según la escala de Bristol, del 1 (muy duro) al 7 (líquido)'),
        dolor: z.boolean().optional(),
        nota: z.string().optional()
      }
    },
    async ({ fecha, hora, tipoBristol, dolor, nota }) => {
      const f = parseFecha(fecha);
      if (!f) return fail('Fecha inválida, usa el formato YYYY-MM-DD');

      const usuario = await getUsuario();
      const gestacion = calcularGestacion(usuario.fechaUltimaRegla, f);
      const registro = await Registro.findOneAndUpdate(
        { usuarioId: usuario._id, fecha: f },
        {
          $push: { 'transito.deposiciones': { hora, tipoBristol, dolor, nota } },
          $set: { ...gestacion, usuarioId: usuario._id, fecha: f }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
      return ok(limpiar(registro));
    }
  );

  server.registerTool(
    'anadir_nota_diario',
    {
      title: 'Añadir una nota al diario personal',
      description: 'Añade texto al diario personal de un día sin borrar lo que ya estuviera escrito (se añade al final).',
      inputSchema: {
        fecha: z.string().describe('Fecha en formato YYYY-MM-DD'),
        texto: z.string().describe('Texto a añadir al diario de ese día')
      }
    },
    async ({ fecha, texto }) => {
      const f = parseFecha(fecha);
      if (!f) return fail('Fecha inválida, usa el formato YYYY-MM-DD');

      const usuario = await getUsuario();
      const existente = await Registro.findOne({ usuarioId: usuario._id, fecha: f });
      const diarioPrevio = existente?.diario || '';
      const nuevoDiario = diarioPrevio ? `${diarioPrevio}\n\n${texto}` : texto;

      const gestacion = calcularGestacion(usuario.fechaUltimaRegla, f);
      const registro = await Registro.findOneAndUpdate(
        { usuarioId: usuario._id, fecha: f },
        { $set: { diario: nuevoDiario, ...gestacion, usuarioId: usuario._id, fecha: f } },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
      return ok(limpiar(registro));
    }
  );
}
