import mongoose from 'mongoose';

const sintomaSchema = new mongoose.Schema(
  {
    tipo: String,
    momento: { type: String, enum: ['mañana', 'tarde', 'noche'] },
    intensidad: { type: Number, min: 1, max: 10 },
    duracion: String,
    nota: String
  },
  { _id: false }
);

const ejercicioSchema = new mongoose.Schema(
  {
    tipo: String,
    duracion: Number,
    intensidad: { type: String, enum: ['suave', 'moderada', 'intensa'] },
    pasos: Number,
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
    energia: { type: Number, min: 1, max: 5 }
  },
  { _id: false }
);

const deposicionSchema = new mongoose.Schema(
  {
    hora: String,
    tipoBristol: { type: Number, min: 1, max: 7 },
    dolor: Boolean,
    nota: String
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
      animo: { type: Number, min: 1, max: 5 },
      ansiedad: { type: Number, min: 1, max: 5 },
      estres: { type: Number, min: 1, max: 5 },
      irritabilidad: { type: Number, min: 1, max: 5 },
      energia: { type: Number, min: 1, max: 5 },
      nota: String
    },
    sueno: {
      horas: Number,
      calidad: { type: Number, min: 1, max: 5 },
      despertares: Number,
      dificultadConciliar: Boolean,
      sensacionAlDespertar: String,
      nota: String
    },
    peso: Number,
    nutricion: {
      comidas: Number,
      agua: Number,
      hambre: { type: Number, min: 1, max: 5 },
      vomitos: Boolean,
      nota: String
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
