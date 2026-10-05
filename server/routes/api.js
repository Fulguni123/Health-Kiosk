import express from 'express';
import { evaluateTriage } from '../services/triageService.js';
import {
  inMemoryStore,
  savePatientToDB,
  getPatientsFromDB,
  updatePatientStatusInDB,
  savePrescriptionToDB,
  getPrescriptionFromDB
} from '../services/db.js';

export const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Smart Rural Telemedicine & AI Health Kiosk API',
    timestamp: new Date().toISOString()
  });
});

// --- AUTHENTICATION ROUTES ---

// Patient Check-in / Login
apiRouter.post('/auth/patient-login', async (req, res) => {
  try {
    const { name, phone, age, gender, village, abhaId } = req.body;
    
    // Generate or use existing ID
    const patientId = 'PT-' + Math.floor(1000 + Math.random() * 9000);
    const newPatient = {
      id: patientId,
      name: name?.trim() || 'Rural Villager',
      phone: phone || '',
      abhaId: abhaId || `ABHA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      age: Number(age) || 35,
      gender: gender || 'female',
      village: village || 'Majuli Village',
      symptoms: [],
      bodyParts: [],
      vitals: {
        temperature: '98.6',
        spo2: '98',
        systolicBP: '120',
        diastolicBP: '80',
        feverDays: '1'
      },
      speechText: '',
      status: 'registered',
      createdAt: new Date().toISOString()
    };

    await savePatientToDB(newPatient);

    res.json({
      success: true,
      message: 'Patient registered / logged in successfully',
      patient: newPatient
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Doctor Portal Login
apiRouter.post('/auth/doctor-login', (req, res) => {
  const { email, password } = req.body;
  const doctor = inMemoryStore.doctors.find(d => 
    d.email.toLowerCase() === (email || '').trim().toLowerCase() && d.password === password
  );

  // Allow quick demo fallback if standard demo credentials or empty during rapid demo
  if (doctor || email === 'dr.sharma@health.gov.in' || email === 'demo') {
    const activeDoc = doctor || inMemoryStore.doctors[0];
    return res.json({
      success: true,
      message: 'Doctor authenticated successfully',
      doctor: {
        id: activeDoc.id,
        name: activeDoc.name,
        email: activeDoc.email,
        specialization: activeDoc.specialization,
        regNumber: activeDoc.regNumber,
        activeKiosk: activeDoc.activeKiosk
      }
    });
  }

  res.status(401).json({
    success: false,
    message: 'Invalid Doctor ID or password. Use: dr.sharma@health.gov.in / doc123'
  });
});

// --- TRIAGE & QUEUE ENDPOINTS ---

// Submit Triage & Auto-List in Doctor Queue
apiRouter.post('/triage', async (req, res) => {
  try {
    const {
      patientId,
      name,
      phone,
      abhaId,
      age,
      gender,
      village,
      bodyParts,
      symptoms,
      vitals,
      text
    } = req.body;

    // Run deterministic rule evaluation
    const result = evaluateTriage({ age, gender, bodyParts, symptoms, vitals, text });

    const activeId = patientId || ('PT-' + Math.floor(1000 + Math.random() * 9000));
    const patientRecord = {
      id: activeId,
      name: name || 'Rural Villager',
      phone: phone || '',
      abhaId: abhaId || '',
      age: Number(age) || 35,
      gender: gender || 'female',
      village: village || 'Majuli Village',
      bodyParts: bodyParts || [],
      symptoms: symptoms || [],
      vitals: vitals || {},
      text: text || '',
      triage: result,
      status: 'waiting',
      createdAt: new Date().toISOString()
    };

    // Save to Database / File
    await savePatientToDB(patientRecord);

    // Socket.io Real-Time Broadcasts to all connected Doctor Consoles
    const io = req.app.get('io');
    if (io) {
      // Add to doctor queue in real-time
      io.emit('patient-queued', patientRecord);

      // If RED triage, trigger instant emergency alarm & banner on doctor screen
      if (result.level === 'RED') {
        io.emit('doctor-emergency-alert', {
          patientId: patientRecord.id,
          patientName: patientRecord.name,
          age: patientRecord.age,
          gender: patientRecord.gender,
          village: patientRecord.village,
          symptoms: patientRecord.symptoms,
          vitals: patientRecord.vitals,
          reasons: result.reasons,
          level: 'RED'
        });
      }
    }

    res.json({
      success: true,
      patientId: patientRecord.id,
      patient: patientRecord,
      triage: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Live Queue for Doctor Dashboard (Sorted: RED first, then YELLOW, then GREEN)
apiRouter.get('/patients', async (req, res) => {
  try {
    const patients = await getPatientsFromDB();
    
    // Custom sort: RED (1), YELLOW (2), GREEN (3), then by date descending
    const orderMap = { RED: 1, YELLOW: 2, GREEN: 3 };
    const sorted = [...patients].sort((a, b) => {
      const levelA = orderMap[a.triage?.level] || 4;
      const levelB = orderMap[b.triage?.level] || 4;
      if (levelA !== levelB) return levelA - levelB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      patients: sorted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update patient status (e.g. consulting, completed)
apiRouter.patch('/patients/:id', async (req, res) => {
  try {
    const updated = await updatePatientStatusInDB(req.params.id, req.body);
    if (updated) {
      const io = req.app.get('io');
      if (io) {
        io.emit('patient-status-updated', { patientId: req.params.id, ...req.body });
      }
      return res.json({ success: true, patient: updated });
    }
    res.status(404).json({ success: false, message: 'Patient not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- PRESCRIPTION ENDPOINTS ---

// Create & Dispatch Prescription
apiRouter.post('/prescriptions', async (req, res) => {
  try {
    const prescription = {
      id: 'RX-' + Math.floor(10000 + Math.random() * 90000),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    await savePrescriptionToDB(prescription);

    // Update patient status to 'completed'
    if (prescription.patientId) {
      await updatePatientStatusInDB(prescription.patientId, { status: 'completed' });
    }

    // Emit live to patient screen
    const io = req.app.get('io');
    if (io) {
      io.emit('prescription-issued', prescription);
    }

    res.status(201).json({ success: true, prescription });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Prescription by Patient ID
apiRouter.get('/prescriptions/:patientId', async (req, res) => {
  try {
    const rx = await getPrescriptionFromDB(req.params.patientId);
    res.json({ success: true, prescription: rx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pharmacy Dispatch (Generic medicine prioritizing)
apiRouter.post('/pharmacy/dispatch', (req, res) => {
  const { prescriptionId, medicines, village = 'Majuli Health Center' } = req.body;
  
  const mockPharmacies = [
    {
      name: 'Jan Aushadhi Kendra (Govt Generic Store)',
      distanceKm: 1.2,
      inStock: true,
      genericAlternativeAvailable: true,
      phone: '+91 98765 43210',
      eta: '20 minutes'
    },
    {
      name: 'Primary Health Center (PHC) Dispensary',
      distanceKm: 2.8,
      inStock: true,
      genericAlternativeAvailable: true,
      phone: '+91 94350 11223',
      eta: '45 minutes'
    },
    {
      name: 'Gramin Seva Medical Store',
      distanceKm: 4.5,
      inStock: true,
      genericAlternativeAvailable: false,
      phone: '+91 91234 56789',
      eta: '60 minutes'
    }
  ];

  res.json({
    success: true,
    dispatchId: 'DISP-' + Math.floor(100000 + Math.random() * 900000),
    pharmacies: mockPharmacies,
    preferredOption: mockPharmacies[0],
    message: 'Prescription routed to nearest Jan Aushadhi generic depot.'
  });
});

// Admin Surveillance & Outbreak Statistics
apiRouter.get('/admin/stats', (req, res) => {
  const symptomCounts = {
    'Fever': 42,
    'Cough & Cold': 35,
    'Chest Pain': 14,
    'Breathlessness': 18,
    'Vomiting / Diarrhea': 24,
    'Headache': 19
  };

  const triageBreakdown = [
    { name: 'Red (Emergency)', value: 28, color: '#b3261e' },
    { name: 'Yellow (Urgent)', value: 84, color: '#e8a317' },
    { name: 'Green (Routine)', value: 134, color: '#1f5c45' }
  ];

  const dailyFootfall = [
    { day: 'Mon', patients: 24, red: 2 },
    { day: 'Tue', patients: 31, red: 4 },
    { day: 'Wed', patients: 38, red: 3 },
    { day: 'Thu', patients: 45, red: 6 },
    { day: 'Fri', patients: 52, red: 8 },
    { day: 'Sat', patients: 56, red: 5 }
  ];

  res.json({
    success: true,
    totalPatients: inMemoryStore.patients.length + 180,
    villages: inMemoryStore.villages,
    symptomCounts,
    triageBreakdown,
    dailyFootfall
  });
});
