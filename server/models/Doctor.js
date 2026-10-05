import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  specialization: { type: String, default: 'General Medicine & Tele-Emergency' },
  regNumber: { type: String, default: 'MCI-88421' },
  activeKiosk: { type: String, default: 'Majuli Island Hub' }
});

export const DoctorModel = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
