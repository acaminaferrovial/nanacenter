import mongoose from 'mongoose';

const bebeCompraSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    codigo: { type: String, required: true },
    nombre: { type: String, required: true, trim: true },
    categoria: { type: String, default: 'Otros' },
    comprado: { type: Boolean, default: false },
    descartado: { type: Boolean, default: false },
    eliminado: { type: Boolean, default: false },
    notas: { type: String, default: '' },
    personalizada: { type: Boolean, default: false }
  },
  { timestamps: true }
);

bebeCompraSchema.index({ usuarioId: 1, codigo: 1 }, { unique: true });

export default mongoose.model('BebeCompra', bebeCompraSchema);
