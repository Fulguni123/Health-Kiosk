import mongoose from 'mongoose';

const PrescriptionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  medicines: [
    {
      name: { type: String, required: true },
      morning: { type: Boolean, default: false },
      noon: { type: Boolean, default: false },
      night: { type: Boolean, default: false },
      duration: { type: String, default: '5 Days' },
      instructions: { type: String, default: 'After meals' }
    }
  ],
  notes: { type: String, default: '' },
  pharmacyStatus: { type: String, default: 'dispatched' },
  createdAt: { type: Date, default: Date.now }
});

export const PrescriptionModel = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);
