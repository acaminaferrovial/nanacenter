import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    nombre: { type: String, default: '' },
    fechaUltimaRegla: { type: Date },
    fechaProbableParto: { type: Date },
    alturaCm: { type: Number },
    fototipo: { type: Number, min: 1, max: 6 },
    edad: { type: Number }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
