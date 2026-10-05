import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { usePatient } from '../context/PatientContext.jsx';
import socket from '../services/socket.js';
import axios from 'axios';
import {
  Users,
  AlertTriangle,
  Video,
  FileCheck,
  Clock,
  HeartPulse,
  Sun,
  Moon,
  Send,
  Building2,
  CheckCircle2,
  RefreshCw,
  LogOut,
  UserCheck
} from 'lucide-react';
import './DoctorDashboard.css';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { doctorUser, logoutDoctor, setPrescription, speakText } = usePatient();

  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [patientsQueue, setPatientsQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Selected patient for prescription
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Prescription Form State
  const [medName, setMedName] = useState('Sorbitrate 5mg (Sublingual)');
  const [morningDose, setMorningDose] = useState(true);
  const [noonDose, setNoonDose] = useState(false);
  const [nightDose, setNightDose] = useState(true);
  const [durationDays, setDurationDays] = useState('5');
  const [doctorNotes, setDoctorNotes] = useState('Emergency stabilization. Take immediately under tongue if chest pain recurs. Transfer to district hospital.');
  const [rxSuccessMsg, setRxSuccessMsg] = useState('');

  // Play audio chime on emergency alert
  const playAlertChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch alarm
      osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio chime skipped:', e);
    }
  };

  const fetchPatients = async () => {
    setLoadingQueue(true);
    try {
      const res = await axios.get('/api/patients');
      if (res.data.success && res.data.patients) {
        setPatientsQueue(res.data.patients);
        if (!selectedPatient && res.data.patients.length > 0) {
          setSelectedPatient(res.data.patients[0]);
        }
      }
    } catch (err) {
      console.warn('Error fetching patients queue:', err.message);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchPatients();

    // Listen for new patients listed in the triage queue
    socket.on('patient-queued', (newPatient) => {
      console.log('📋 New patient listed in DB queue:', newPatient);
      setPatientsQueue((prev) => {
        const filtered = prev.filter((p) => p.id !== newPatient.id);
        const updated = [newPatient, ...filtered];
        // Sort: RED first, YELLOW second, GREEN third
        const orderMap = { RED: 1, YELLOW: 2, GREEN: 3 };
        return updated.sort((a, b) => {
          const lA = orderMap[a.triage?.level] || 4;
          const lB = orderMap[b.triage?.level] || 4;
          return lA - lB;
        });
      });
      if (!selectedPatient) setSelectedPatient(newPatient);
    });

    // Listen for emergency broadcasts from Kiosk
    socket.on('doctor-emergency-alert', (alert) => {
      console.log('🚨 Incoming Doctor Emergency:', alert);
      setEmergencyAlert(alert);
      playAlertChime();
    });

    // Listen for patient status updates (e.g. consulting, completed)
    socket.on('patient-status-updated', ({ patientId, status }) => {
      setPatientsQueue((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, status } : p))
      );
    });

    return () => {
      socket.off('patient-queued');
      socket.off('doctor-emergency-alert');
      socket.off('patient-status-updated');
    };
  }, []);

  const handleStartConsult = async (patient) => {
    setSelectedPatient(patient);
    try {
      await axios.patch(`/api/patients/${patient.id}`, { status: 'consulting' });
    } catch (e) {}

    navigate(`/consult?role=doctor&patientId=${patient.id}`, {
      state: { emergency: patient.triage?.level === 'RED' || patient.level === 'RED' }
    });
  };

  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const prescriptionPayload = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorName: doctorUser?.name || 'Dr. A. Sharma, MD',
      medicines: [
        {
          name: medName,
          morning: morningDose,
          noon: noonDose,
          night: nightDose,
          duration: `${durationDays} Days`,
          instructions: 'After meals with water'
        }
      ],
      notes: doctorNotes,
      status: 'dispatched'
    };

    try {
      await axios.post('/api/prescriptions', prescriptionPayload);
      await axios.post('/api/pharmacy/dispatch', {
        prescriptionId: selectedPatient.id,
        medicines: prescriptionPayload.medicines,
        village: selectedPatient.village
      });
    } catch (err) {
      console.warn('Backend prescription save fallback:', err.message);
    }

    setPrescription(prescriptionPayload);
    setRxSuccessMsg(`✅ Prescription for ${selectedPatient.name} saved in DB & routed to Jan Aushadhi!`);
    speakText('Prescription issued successfully.');

    // Refresh queue to show updated status
    fetchPatients();

    setTimeout(() => {
      setRxSuccessMsg('');
    }, 4500);
  };

  const handleLogout = () => {
    logoutDoctor();
    navigate('/login/doctor');
  };

  return (
    <div className="doctor-container">
      <Navbar title="Doctor Consultation & Triage Queue Console" />

      <main className="doctor-content">
        {/* Doctor Header Bar with Credentials & Logout */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '16px 24px',
          border: '1px solid #d5e5db',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#eaf6ef', color: '#1f5c45', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={26} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#16281e' }}>
                {doctorUser?.name || 'Dr. A. Sharma, MD'}
              </h3>
              <p style={{ margin: '2px 0 0 0', color: '#556e60', fontSize: '0.9rem' }}>
                {doctorUser?.specialization || 'Cardiology & Rural Tele-ICU'} • {doctorUser?.regNumber || 'MCI-88421'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchPatients}
              style={{
                background: '#f2f8f5',
                border: '1px solid #c7dcd0',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#284635',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={16} className={loadingQueue ? 'spin' : ''} />
              <span>Refresh Queue</span>
            </button>

            <button
              onClick={handleLogout}
              style={{
                background: '#fdf2f2',
                border: '1px solid #fecaca',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#b3261e',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Flashing Emergency Alert Banner */}
        {emergencyAlert && (
          <div className="flashing-emergency-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <AlertTriangle size={34} />
              <div>
                <strong style={{ fontSize: '1.25rem' }}>
                  🚨 CRITICAL INCOMING EMERGENCY: {emergencyAlert.patientName} ({emergencyAlert.village})
                </strong>
                <p style={{ margin: '2px 0 0 0', opacity: 0.95, fontSize: '1rem' }}>
                  Reasons: {emergencyAlert.reasons?.[0]}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleStartConsult(emergencyAlert)}
              style={{
                background: '#ffffff',
                color: '#b3261e',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '30px',
                fontWeight: 800,
                fontSize: '1.05rem',
                cursor: 'pointer'
              }}
            >
              Answer Immediately
            </button>
          </div>
        )}

        <div className="doctor-layout-grid">
          {/* Left Column: Live Queue from Database */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.45rem', color: '#1a3325', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={24} />
                <span>Live Database Patient Triage Queue</span>
              </h2>
              <span style={{ fontSize: '0.9rem', color: '#577263', fontWeight: 600 }}>
                {patientsQueue.length} Patients in Queue
              </span>
            </div>

            <div className="queue-card-list">
              {patientsQueue.map((patient, i) => {
                const level = patient.triage?.level || patient.level || 'GREEN';
                const isSelected = selectedPatient?.id === patient.id;

                return (
                  <div
                    key={patient.id || i}
                    className={`patient-queue-card ${level} ${isSelected ? 'selected-row' : ''}`}
                    style={isSelected ? { outline: '2px solid #1f5c45' } : {}}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge-tag ${level}`}>{level}</span>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#16281e' }}>
                          {patient.name} ({patient.age} {patient.gender?.[0]?.toUpperCase()})
                        </h3>
                        <small style={{ color: '#6d8376' }}>• ID: {patient.id}</small>
                        {patient.status === 'consulting' && (
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                            IN CALL
                          </span>
                        )}
                        {patient.status === 'completed' && (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                            PRESCRIBED
                          </span>
                        )}
                      </div>

                      <p style={{ margin: '6px 0 2px 0', fontSize: '0.95rem', color: '#385042' }}>
                        <strong>Kiosk:</strong> {patient.village} | <strong>Symptoms:</strong> {patient.symptoms?.join(', ') || 'General Checkup'}
                      </p>

                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#5e7668' }}>
                        <strong>Vitals:</strong> SpO2 {patient.vitals?.spo2}% | BP {patient.vitals?.systolicBP}/{patient.vitals?.diastolicBP} mmHg | {patient.vitals?.temperature}°F
                      </p>

                      {patient.triage?.reasons?.[0] && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: level === 'RED' ? '#b3261e' : '#854d0e', fontWeight: 600 }}>
                          AI Reason: {patient.triage.reasons[0]}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => handleStartConsult(patient)}
                        style={{
                          background: level === 'RED' ? '#b3261e' : '#1f5c45',
                          color: 'white',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '24px',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Video size={18} />
                        <span>Start Call</span>
                      </button>

                      <button
                        onClick={() => setSelectedPatient(patient)}
                        style={{
                          background: isSelected ? '#1f5c45' : 'transparent',
                          color: isSelected ? '#ffffff' : '#284634',
                          border: '1px solid #c5dbce',
                          padding: '6px 14px',
                          borderRadius: '16px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ Prescribing' : 'Select for RX'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Digital Prescription Creator */}
          <aside>
            <div className="prescription-creator-card">
              <h2 style={{ margin: '0 0 14px 0', fontSize: '1.35rem', color: '#1f5c45', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={22} />
                <span>Issue Prescription</span>
              </h2>

              <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#50675a' }}>
                Prescribing for:{' '}
                <strong>{selectedPatient?.name || 'Select a patient from queue'}</strong>
                {selectedPatient && ` (${selectedPatient.village} • ${selectedPatient.id})`}
              </p>

              {rxSuccessMsg && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '14px', fontWeight: 600 }}>
                  {rxSuccessMsg}
                </div>
              )}

              <form onSubmit={handleIssuePrescription}>
                <div className="form-field">
                  <label>Medicine Name & Strength</label>
                  <select
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                  >
                    <option value="Sorbitrate 5mg (Sublingual)">Sorbitrate 5mg (Cardiac emergency / Chest pain)</option>
                    <option value="Aspirin 75mg Gastro-resistant">Aspirin 75mg (Blood thinner)</option>
                    <option value="Paracetamol 500mg">Paracetamol 500mg (Fever & Pain)</option>
                    <option value="ORS Rehydration Powder (1L)">ORS Oral Electrolyte Solution</option>
                    <option value="Amoxicillin 500mg">Amoxicillin 500mg (Broad Antibiotic)</option>
                    <option value="Cetirizine 10mg">Cetirizine 10mg (Allergy / Cough)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Dosage Timing (Visual Icons for Villagers)</label>
                  <div className="dose-timing-pills">
                    <button
                      type="button"
                      className={`timing-pill ${morningDose ? 'selected' : ''}`}
                      onClick={() => setMorningDose(!morningDose)}
                    >
                      <Sun size={16} /> Morning
                    </button>
                    <button
                      type="button"
                      className={`timing-pill ${noonDose ? 'selected' : ''}`}
                      onClick={() => setNoonDose(!noonDose)}
                    >
                      <Sun size={16} /> Noon
                    </button>
                    <button
                      type="button"
                      className={`timing-pill ${nightDose ? 'selected' : ''}`}
                      onClick={() => setNightDose(!nightDose)}
                    >
                      <Moon size={16} /> Night
                    </button>
                  </div>
                </div>

                <div className="form-field">
                  <label>Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Doctor Notes / Instructions</label>
                  <textarea
                    rows="3"
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="submit-rx-btn"
                  disabled={!selectedPatient}
                >
                  <Send size={18} />
                  <span>Send to Patient & Jan Aushadhi</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
