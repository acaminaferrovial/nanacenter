import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    nombre: { type: String, default: '' },
    fechaUltimaRegla: { type: Date },
    fechaProbableParto: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
