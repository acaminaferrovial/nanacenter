import mongoose from 'mongoose';

const bebeActividadSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fecha: { type: Date, required: true, index: true },
    codigo: { type: String, required: true },
    titulo: { type: String, required: true, trim: true },
    categoria: { type: String, default: 'Ejercicio' },
    completada: { type: Boolean, default: true },
    notas: { type: String, default: '' }
  },
  { timestamps: true }
);

bebeActividadSchema.index({ usuarioId: 1, fecha: 1, codigo: 1 }, { unique: true });

export default mongoose.model('BebeActividad', bebeActividadSchema);
