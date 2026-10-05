import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  abhaId: { type: String, default: '' },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  village: { type: String, default: 'Majuli Village' },
  symptoms: [{ type: String }],
  bodyParts: [{ type: String }],
  vitals: {
    temperature: { type: String, default: '98.6' },
    spo2: { type: String, default: '98' },
    systolicBP: { type: String, default: '120' },
    diastolicBP: { type: String, default: '80' },
    feverDays: { type: String, default: '1' }
  },
  speechText: { type: String, default: '' },
  triage: {
    level: { type: String, enum: ['RED', 'YELLOW', 'GREEN'], default: 'GREEN' },
    score: { type: Number, default: 0 },
    reasons: [{ type: String }],
    advice: { type: String },
    recommendedAction: { type: String }
  },
  status: { type: String, enum: ['waiting', 'consulting', 'completed', 'dispatched'], default: 'waiting' },
  createdAt: { type: Date, default: Date.now }
});

export const PatientModel = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
