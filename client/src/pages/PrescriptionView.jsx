import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { usePatient } from '../context/PatientContext.jsx';
import {
  FileText,
  Sun,
  Moon,
  Volume2,
  QrCode,
  CheckCircle,
  Building2,
  Clock,
  ArrowRight,
  Pill,
  Sparkles
} from 'lucide-react';
import './PrescriptionView.css';

export default function PrescriptionView() {
  const navigate = useNavigate();
  const { language, t, patientData, prescription, speakText } = usePatient();

  const activeRx = prescription || {
    patientName: patientData.name,
    doctorName: 'Dr. A. Sharma, MD (Telemedicine Consultant)',
    medicines: [
      {
        name: 'Sorbitrate 5mg (Sublingual)',
        morning: true,
        noon: false,
        night: true,
        duration: '5 Days',
        instructions: 'Under tongue immediately during chest discomfort'
      },
      {
        name: 'Aspirin 75mg Gastro-resistant',
        morning: true,
        noon: false,
        night: false,
        duration: '10 Days',
        instructions: 'After breakfast with a glass of water'
      }
    ],
    notes: 'Emergency stabilization protocol. Kiosk ASHA worker has dispatched local emergency ambulance.',
    date: new Date().toLocaleDateString()
  };

  // Read aloud automatically
  useEffect(() => {
    const rxSummary = activeRx.medicines
      .map(
        (m) =>
          `${m.name}, take ${m.morning ? 'in morning' : ''} ${m.night ? 'and at night' : ''} for ${m.duration}.`
      )
      .join(' ');
    speakText(`Prescription ready. ${rxSummary}`);
  }, []);

  const handleSpeakRx = () => {
    const speech = activeRx.medicines
      .map(
        (m) =>
          `${m.name}. ${m.morning ? 'Morning' : ''} ${m.night ? 'Night' : ''}. ${m.instructions}.`
      )
      .join('. ');
    speakText(speech);
  };

  return (
    <div className="rx-container">
      <Navbar title={language === 'hi' ? 'डिजिटल पर्चा' : language === 'as' ? 'ডিজিটেল প্ৰেচক্ৰিপচন' : 'Digital Prescription'} />

      <main className="rx-content">
        <div className="rx-paper-card">
          {/* Header */}
          <div className="rx-clinic-header">
            <div>
              <span style={{ fontSize: '0.9rem', color: '#1f5c45', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                National Telemedicine Subcenter Kiosk
              </span>
              <h1 style={{ margin: '6px 0 0 0', fontSize: '1.85rem', color: '#162b1f' }}>
                {activeRx.doctorName}
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#556e5f' }}>
                Reg: MCI-44289 | Tele-Consultation Hub
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <strong style={{ fontSize: '1.1rem', color: '#162b1f' }}>Patient: {activeRx.patientName}</strong>
              <p style={{ margin: '4px 0 0 0', color: '#556e5f' }}>{patientData.village}</p>
              <small style={{ color: '#768e80' }}>Date: {activeRx.date || 'Today'}</small>
            </div>
          </div>

          {/* Voice readout banner */}
          <div
            onClick={handleSpeakRx}
            style={{
              background: '#f0f8f3',
              border: '2px dashed #9fcfb3',
              borderRadius: '16px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Volume2 size={24} style={{ color: '#1f5c45' }} />
              <strong style={{ color: '#1f5c45', fontSize: '1.1rem' }}>
                {language === 'hi' ? 'दवाइयों की जानकारी बोलकर सुनें' : language === 'as' ? 'ঔষধৰ নিৰ্দেশনা শুনিবলৈ স্পৰ্শ কৰক' : 'Touch to listen to dosage instructions aloud'}
              </strong>
            </div>
            <span style={{ fontWeight: 700, color: '#1f5c45' }}>▶ Read Aloud</span>
          </div>

          {/* Visual Medicine List with Picture Icons */}
          <h2 style={{ fontSize: '1.4rem', color: '#1f5c45', margin: '0 0 14px 0' }}>
            {language === 'hi' ? 'निर्धारित दवाइयां (चित्र निर्देश)' : language === 'as' ? 'নিৰ্ধাৰিত ঔষধ (ছবি নিৰ্দেশনা)' : 'Prescribed Medicines (Visual Timing)'}
          </h2>

          <div className="rx-medicine-grid">
            {activeRx.medicines.map((med, i) => (
              <div key={i} className="medicine-item-card">
                <div className="med-name-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pill size={22} style={{ color: '#1f5c45' }} />
                    <h3>{med.name}</h3>
                  </div>
                  <p>Duration: <strong>{med.duration}</strong> • {med.instructions}</p>
                </div>

                <div className="dosage-icons-row">
                  <div className={`dose-icon-bubble ${med.morning ? 'active' : 'inactive'}`}>
                    <Sun size={24} style={{ color: med.morning ? '#e8a317' : '#94a3b8' }} />
                    <span>Morning</span>
                  </div>

                  <div className={`dose-icon-bubble ${med.noon ? 'active' : 'inactive'}`}>
                    <Sun size={24} style={{ color: med.noon ? '#e8a317' : '#94a3b8' }} />
                    <span>Noon</span>
                  </div>

                  <div className={`dose-icon-bubble ${med.night ? 'active' : 'inactive'}`}>
                    <Moon size={24} style={{ color: med.night ? '#4338ca' : '#94a3b8' }} />
                    <span>Night</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Clinical Advice */}
          {activeRx.notes && (
            <div style={{ background: '#fdfbf7', border: '1px solid #fae8c8', borderRadius: '14px', padding: '16px 20px', margin: '20px 0' }}>
              <strong style={{ color: '#925c04', fontSize: '1.05rem' }}>Doctor Instructions:</strong>
              <p style={{ margin: '6px 0 0 0', color: '#684508', fontSize: '1.05rem' }}>{activeRx.notes}</p>
            </div>
          )}

          {/* Pharmacy Dispatch & Stock Notification */}
          <div className="pharmacy-dispatch-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#d1fae5', color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={28} />
              </div>
              <div>
                <strong style={{ fontSize: '1.15rem', color: '#065f46' }}>
                  Jan Aushadhi Kendra (Govt Generic Depot)
                </strong>
                <p style={{ margin: '2px 0 0 0', color: '#047857' }}>
                  ✓ In Stock • Generic Alternatives Available • 1.2 km away
                </p>
              </div>
            </div>
            <span style={{ background: '#059669', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
              Dispatched Digitally
            </span>
          </div>

          {/* QR Code and Finish Button */}
          <div className="qr-code-section">
            <QrCode size={70} style={{ color: '#1f5c45' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '1.15rem' }}>Show QR code at village pharmacy</strong>
              <p style={{ margin: '4px 0 0 0', color: '#556e5f' }}>
                The pharmacist will scan this code to dispense generic medicines directly.
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              style={{
                background: '#1f5c45',
                color: 'white',
                border: 'none',
                padding: '16px 36px',
                borderRadius: '30px',
                fontWeight: 800,
                fontSize: '1.15rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minHeight: '64px'
              }}
            >
              <span>Finish Checkup</span>
              <ArrowRight size={22} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
