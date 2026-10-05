import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { usePatient } from '../context/PatientContext.jsx';
import socket from '../services/socket.js';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Volume2,
  Video,
  ArrowRight,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import './TriageResult.css';

export default function TriageResult() {
  const navigate = useNavigate();
  const { language, t, patientData, triageResult, speakText } = usePatient();

  // Fallback if reached directly without prior state
  const result = triageResult || {
    level: patientData.symptoms.includes('Chest Pain') ? 'RED' : 'YELLOW',
    score: 8,
    reasons: [
      'Chest pain and breathlessness together can indicate a heart problem.',
      'Critical hypoxemia (low oxygen level) detected.'
    ],
    advice: 'Priority emergency alert triggered. A remote doctor is connecting now.',
    recommendedAction: 'Immediate Emergency Video Call & Hospital Transfer'
  };

  const isRed = result.level === 'RED';
  const isYellow = result.level === 'YELLOW';

  // Read aloud automatically on entry
  useEffect(() => {
    const summary = `${result.level} priority. ${result.reasons.join(' ')}`;
    speakText(summary);

    // If RED, make sure emergency alert is actively broadcasted
    if (isRed) {
      socket.emit('emergency-alert', {
        patientName: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        village: patientData.village,
        symptoms: patientData.symptoms,
        vitals: patientData.vitals,
        reasons: result.reasons,
        level: 'RED'
      });
    }
  }, []);

  const handleSpeakReasons = () => {
    speakText(result.reasons.join('. '));
  };

  const handleConnectDoctor = () => {
    navigate('/consult', { state: { emergency: isRed } });
  };

  return (
    <div className="triage-container">
      <Navbar title={language === 'hi' ? 'एआई जाँच परिणाम' : language === 'as' ? 'এআই পৰীক্ষাৰ ফলাফল' : 'AI Triage Assessment'} />

      <main className="triage-content">
        <div className={`triage-card ${result.level}`}>
          {/* Header Pill */}
          <div className="triage-level-pill">
            {isRed ? <ShieldAlert size={30} /> : isYellow ? <AlertTriangle size={30} /> : <CheckCircle size={30} />}
            <span>
              {result.level === 'RED'
                ? (language === 'hi' ? 'गंभीर आपातकाल (RED)' : language === 'as' ? 'সংকটজনক অৱস্থা (RED)' : 'EMERGENCY (RED)')
                : result.level === 'YELLOW'
                ? (language === 'hi' ? 'प्राथमिकता (YELLOW)' : language === 'as' ? 'প্ৰাথমিক সতৰ্কতা (YELLOW)' : 'URGENT ATTENTION (YELLOW)')
                : (language === 'hi' ? 'सामान्य (GREEN)' : language === 'as' ? 'সাধাৰণ (GREEN)' : 'ROUTINE (GREEN)')}
            </span>
          </div>

          <h1 className="triage-title">
            {result.recommendedAction}
          </h1>

          <p style={{ fontSize: '1.25rem', color: '#3d5446', margin: '0 0 20px 0' }}>
            {result.advice}
          </p>

          {/* Quick Patient Snapshot */}
          <div className="patient-quick-summary">
            <span><strong>Patient:</strong> {patientData.name} ({patientData.age} {patientData.gender})</span>
            <span>•</span>
            <span><strong>Location:</strong> {patientData.village}</span>
            <span>•</span>
            <span><strong>SpO2:</strong> {patientData.vitals.spo2}%</span>
            <span>•</span>
            <span><strong>BP:</strong> {patientData.vitals.systolicBP}/{patientData.vitals.diastolicBP}</span>
          </div>

          {/* Audio Guidance Banner */}
          <div className="triage-voice-prompt" onClick={handleSpeakReasons} role="button" tabIndex={0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1f5c45', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Volume2 size={24} />
              </div>
              <strong style={{ fontSize: '1.15rem', color: '#1f5c45' }}>
                {language === 'hi' ? 'कारण दोबारा सुनने के लिए यहाँ दबाएं' : language === 'as' ? 'কাৰণসমূহ পুনৰ শুনিবলৈ স্পৰ্শ কৰক' : 'Touch to listen to clinical reasons aloud'}
              </strong>
            </div>
            <span style={{ fontWeight: 700, color: '#1f5c45' }}>▶ Replay</span>
          </div>

          {/* Transparent Medical Reasons Box */}
          <div className="reasons-box">
            <h3>
              <HelpCircle size={24} style={{ color: '#1f5c45' }} />
              <span>
                {language === 'hi' ? 'एआई ने यह निर्णय क्यों लिया?' : language === 'as' ? 'এআই-য়ে এই সিদ্ধান্ত কিয় ল’লে?' : 'Why this triage decision?'}
              </span>
            </h3>
            <ul className="reasons-list">
              {result.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="triage-actions-group">
            <button
              onClick={() => navigate('/symptoms')}
              style={{
                background: 'transparent',
                border: '2px solid #c9ded2',
                borderRadius: '30px',
                padding: '14px 26px',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: '#3e5849',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw size={18} />
              <span>Change Symptoms</span>
            </button>

            <button
              className={`connect-doctor-btn ${result.level}`}
              onClick={handleConnectDoctor}
            >
              <Video size={30} />
              <span>
                {language === 'hi'
                  ? 'डॉक्टर से तुरंत वीडियो कॉल करें'
                  : language === 'as'
                  ? 'চিকিৎসকৰ সৈতে ভিডিঅ’ কল আৰম্ভ কৰক'
                  : 'Start Doctor Consultation'}
              </span>
              <ArrowRight size={26} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
