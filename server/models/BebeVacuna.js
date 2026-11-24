import mongoose from 'mongoose';

const bebeVacunaSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    codigo: { type: String, required: true },
    nombre: { type: String, required: true, trim: true },
    edadRecomendada: { type: String, default: 'Otra' },
    dosis: { type: String, default: '' },
    descripcion: { type: String, default: '' },
    estado: {
      type: String,
      enum: ['pendiente', 'puesta', 'no_aplica'],
      default: 'pendiente'
    },
    fechaAplicacion: { type: Date, default: null },
    fechaPrevista: { type: Date, default: null },
    lote: { type: String, default: '' },
    notas: { type: String, default: '' },
    personalizada: { type: Boolean, default: false }
  },
  { timestamps: true }
);

bebeVacunaSchema.index({ usuarioId: 1, codigo: 1 }, { unique: true });

export default mongoose.model('BebeVacuna', bebeVacunaSchema);
