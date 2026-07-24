import mongoose from 'mongoose';

const sintomaSchema = new mongoose.Schema(
  {
    tipo: String,
    momento: [{ type: String, enum: ['mañana', 'tarde', 'noche'] }],
    intensidad: { type: Number, min: 0, max: 10 },
    duracion: String,
    nota: String
  },
  { _id: false }
);

const ejercicioSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ['Pilates', 'Yoga', 'Movilidad', 'Estiramientos', 'Caminar', 'Fuerza', 'Aeróbic', 'Cardio'] },
    duracion: Number,
    intensidad: { type: String, enum: ['suave', 'moderada', 'intensa'] },
    frecuenciaCardiaca: Number,
    sensaciones: String,
    molestias: String
  },
  { _id: false }
);

const exposicionSolarSchema = new mongoose.Schema(
  {
    horaInicio: String,
    duracion: Number,
    momentoDia: { type: String, enum: ['mañana', 'tarde', 'noche'] },
    spf: Boolean,
    factorSpf: Number,
    partesExpuestas: [String],
    directa: Boolean,
    nota: String
  },
  { _id: false }
);

const medicacionSchema = new mongoose.Schema(
  {
    nombre: String,
    dosis: String,
    horario: String,
    motivo: String,
    efectosSecundarios: String,
    recordatorio: Boolean
  },
  { _id: false }
);

const citaMedicaSchema = new mongoose.Schema(
  {
    tipo: String,
    resumen: String,
    recomendaciones: String,
    fecha: Date,
    documentos: [String]
  },
  { _id: false }
);

const momentoDiaSchema = new mongoose.Schema(
  {
    nota: String,
    energia: { type: Number, min: 0, max: 10 }
  },
  { _id: false }
);

const deposicionSchema = new mongoose.Schema(
  {
    hora: String,
    tipoBristol: { type: Number, min: 1, max: 7 },
    cantidad: { type: String, enum: ['poca', 'normal', 'abundante'] },
    color: {
      type: String,
      enum: ['Negro', 'Marrón', 'Marrón ennegrecido', 'Marrón amarillento', 'Marrón anaranjado']
    },
    evacuacionCompleta: Boolean,
    dolor: Boolean,
    nota: String
  },
  { _id: false }
);

const infusionSchema = new mongoose.Schema(
  {
    tipos: [{ type: String, enum: ['Manzanilla', 'Romero', 'Tomillo', 'Duermebien', 'Meabien', 'Cagabien'] }],
    hora: String,
    efecto: String
  },
  { _id: false }
);

const registroSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fecha: { type: Date, required: true },
    semanaEmbarazo: Number,
    diaGestacion: Number,
    sintomas: [sintomaSchema],
    emocional: {
      animo: { type: Number, min: 0, max: 10 },
      ansiedad: { type: Number, min: 0, max: 10 },
      estres: { type: Number, min: 0, max: 10 },
      irritabilidad: { type: Number, min: 0, max: 10 },
      energia: { type: Number, min: 0, max: 10 },
      nota: String
    },
    sueno: {
      horas: Number,
      calidad: { type: Number, min: 0, max: 10 },
      despertares: Number,
      dificultadConciliar: Boolean,
      sensacionAlDespertar: String,
      nota: String
    },
    peso: Number,
    nutricion: {
      comidas: Number,
      hambre: { type: Number, min: 0, max: 10 }
    },
    transito: {
      deposiciones: [deposicionSchema],
      estrenimiento: Boolean,
      diarrea: Boolean,
      nota: String
    },
    ejercicio: [ejercicioSchema],
    exposicionSolar: [exposicionSolarSchema],
    medicacion: [medicacionSchema],
    infusiones: [infusionSchema],
    miccion: {
      frecuencia: Number,
      nota: String
    },
    citasMedicas: [citaMedicaSchema],
    diario: String,
    resumenDia: String,
    momentos: {
      manana: momentoDiaSchema,
      tarde: momentoDiaSchema,
      noche: momentoDiaSchema
    }
  },
  { timestamps: true }
);

registroSchema.index({ usuarioId: 1, fecha: 1 }, { unique: true });

export default mongoose.model('Registro', registroSchema);
