import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PatientModel } from '../models/Patient.js';
import { PrescriptionModel } from '../models/Prescription.js';
import { DoctorModel } from '../models/Doctor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Ensure data folder exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default initial state
const defaultState = {
  doctors: [
    {
      id: 'DOC-101',
      name: 'Dr. A. Sharma, MD',
      email: 'dr.sharma@health.gov.in',
      password: 'doc123',
      specialization: 'Cardiology & Rural Tele-ICU',
      regNumber: 'MCI-88421',
      activeKiosk: 'Majuli Health Hub'
    }
  ],
  patients: [
    {
      id: 'PT-9941',
      name: 'Biren Kalita',
      phone: '9864012345',
      abhaId: 'ABHA-9921-3312-4411',
      age: 58,
      gender: 'male',
      village: 'Majuli Village Kiosk',
      symptoms: ['Chest Pain', 'Breathlessness'],
      bodyParts: ['chest'],
      vitals: { temperature: '99.2', spo2: '89', systolicBP: '168', diastolicBP: '104', feverDays: '1' },
      speechText: 'Severe chest tightness radiating to left arm',
      triage: {
        level: 'RED',
        score: 9,
        reasons: ['Combined chest pain and respiratory distress with hypoxemia (SpO2 89%).'],
        advice: 'Emergency cardiology intervention required.',
        recommendedAction: 'Immediate Emergency Video Call & Hospital Transfer'
      },
      status: 'waiting',
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString()
    },
    {
      id: 'PT-8820',
      name: 'Pooja Deka',
      phone: '9435012345',
      abhaId: 'ABHA-7712-4499-1122',
      age: 28,
      gender: 'female',
      village: 'Sonapur Subcenter',
      symptoms: ['High Fever', 'Vomiting'],
      bodyParts: ['head', 'stomach'],
      vitals: { temperature: '103.4', spo2: '97', systolicBP: '118', diastolicBP: '78', feverDays: '4' },
      speechText: 'Fever for 4 days and persistent vomiting',
      triage: {
        level: 'YELLOW',
        score: 5,
        reasons: ['Prolonged pyrexia (>3 days) warrants dengue/malaria investigation.'],
        advice: 'Priority teleconsultation needed today.',
        recommendedAction: 'Priority Doctor Teleconsultation within 15 minutes'
      },
      status: 'waiting',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    }
  ],
  prescriptions: [],
  villages: [
    { id: 'v1', name: 'Majuli Village Kiosk', cases: 28, feverCount: 9, alert: false },
    { id: 'v2', name: 'Dhekiajuli Camp Kiosk', cases: 34, feverCount: 18, alert: true },
    { id: 'v3', name: 'Sonapur Health Center', cases: 19, feverCount: 4, alert: false },
    { id: 'v4', name: 'Rani Island Outpost', cases: 22, feverCount: 7, alert: false },
    { id: 'v5', name: 'Boko Rural Subcenter', cases: 15, feverCount: 3, alert: false }
  ]
};

// In-Memory store initialized from file if available
function loadStoreFromFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Could not parse db.json, using default seed:', e.message);
  }
  return defaultState;
}

export const inMemoryStore = loadStoreFromFile();

function persistToFile() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf8');
  } catch (e) {
    console.warn('Could not persist to db.json:', e.message);
  }
}

// Initial persist
persistToFile();

let isConnectedToMongo = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/telehealth_kiosk';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
    isConnectedToMongo = true;
    console.log('✅ Connected to MongoDB at:', uri);
  } catch (err) {
    isConnectedToMongo = false;
    console.warn('⚠️  MongoDB not found. Using Resilient JSON File-Backed Persistence Store.');
  }
}

export function isMongoActive() {
  return isConnectedToMongo;
}

// --- High-Level Database Abstraction Layer ---

export async function savePatientToDB(patientData) {
  // Always update in-memory and file store
  const existingIdx = inMemoryStore.patients.findIndex(p => p.id === patientData.id);
  if (existingIdx >= 0) {
    inMemoryStore.patients[existingIdx] = { ...inMemoryStore.patients[existingIdx], ...patientData };
  } else {
    inMemoryStore.patients.unshift(patientData);
  }
  persistToFile();

  if (isConnectedToMongo) {
    try {
      await PatientModel.findOneAndUpdate({ id: patientData.id }, patientData, { upsert: true, new: true });
    } catch (e) {
      console.warn('Mongo save error (using file store):', e.message);
    }
  }
  return patientData;
}

export async function getPatientsFromDB() {
  if (isConnectedToMongo) {
    try {
      const docs = await PatientModel.find().sort({ createdAt: -1 });
      if (docs && docs.length > 0) return docs;
    } catch (e) {
      console.warn('Mongo fetch fallback:', e.message);
    }
  }
  return inMemoryStore.patients;
}

export async function updatePatientStatusInDB(patientId, statusUpdate) {
  const patient = inMemoryStore.patients.find(p => p.id === patientId);
  if (patient) {
    Object.assign(patient, statusUpdate);
    persistToFile();
  }
  if (isConnectedToMongo) {
    try {
      await PatientModel.findOneAndUpdate({ id: patientId }, statusUpdate);
    } catch (e) {
      console.warn('Mongo update fallback:', e.message);
    }
  }
  return patient;
}

export async function savePrescriptionToDB(prescriptionData) {
  inMemoryStore.prescriptions.unshift(prescriptionData);
  persistToFile();

  if (isConnectedToMongo) {
    try {
      await PrescriptionModel.create(prescriptionData);
    } catch (e) {
      console.warn('Mongo save rx fallback:', e.message);
    }
  }
  return prescriptionData;
}

export async function getPrescriptionFromDB(patientId) {
  if (isConnectedToMongo) {
    try {
      const rx = await PrescriptionModel.findOne({ patientId }).sort({ createdAt: -1 });
      if (rx) return rx;
    } catch (e) {
      console.warn('Mongo fetch rx fallback:', e.message);
    }
  }
  return inMemoryStore.prescriptions.find(p => p.patientId === patientId) || null;
}
