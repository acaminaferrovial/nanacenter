import mongoose from 'mongoose';

const bebeRevisionSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fecha: { type: Date, required: true, index: true },
    tipo: { type: String, default: 'Revisión rutinaria', trim: true },
    profesional: { type: String, default: '', trim: true },
    resumen: { type: String, default: '' },
    recomendaciones: { type: String, default: '' },
    proximaRevision: { type: Date, default: null },
    documentos: [{ type: String }]
  },
  { timestamps: true }
);

bebeRevisionSchema.index({ usuarioId: 1, fecha: -1 });

export default mongoose.model('BebeRevision', bebeRevisionSchema);
