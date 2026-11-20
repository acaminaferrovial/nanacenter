import mongoose from 'mongoose';

const bebeRegistroSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fecha: { type: Date, required: true, index: true },
    grupoId: { type: String, index: true },
    tipo: {
      type: String,
      required: true,
      enum: ['peso', 'tamano', 'perimetroCefalico', 'comentario'],
      index: true
    },
    valor: { type: Number },
    unidad: { type: String },
    texto: { type: String, default: '' }
  },
  { timestamps: true }
);

bebeRegistroSchema.index({ usuarioId: 1, tipo: 1, fecha: 1 });

export default mongoose.model('BebeRegistro', bebeRegistroSchema);
