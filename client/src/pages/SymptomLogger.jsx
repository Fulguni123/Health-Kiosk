import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { usePatient } from '../context/PatientContext.jsx';
import socket from '../services/socket.js';
import axios from 'axios';
import {
  Mic,
  MicOff,
  Flame,
  Wind,
  HeartCrack,
  Activity,
  Droplets,
  Zap,
  Check,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import './SymptomLogger.css';

export default function SymptomLogger() {
  const navigate = useNavigate();
  const { language, t, patientData, updatePatientData, toggleSymptom, toggleBodyPart, setTriageResult, speakText } = usePatient();

  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [loadingTriage, setLoadingTriage] = useState(false);

  // Multilingual Symptom Dictionary
  const symptomCatalog = [
    {
      id: 'Chest Pain',
      icon: HeartCrack,
      emergency: true,
      en: 'Chest Pain / Pressure',
      hi: 'सीने में दर्द / भारीपन',
      as: 'বুকুৰ বিষ বা হেঁচা'
    },
    {
      id: 'Breathlessness',
      icon: Wind,
      emergency: true,
      en: 'Shortness of Breath',
      hi: 'सांस लेने में तकलीफ',
      as: 'উশাহ লবলৈ কষ্ট'
    },
    {
      id: 'Heavy Bleeding',
      icon: Droplets,
      emergency: true,
      en: 'Heavy Bleeding',
      hi: 'गंभीर रक्तस्राव (खून)',
      as: 'অত্যধিক ৰক্তক্ষৰণ'
    },
    {
      id: 'High Fever',
      icon: Flame,
      en: 'High Fever (>3 days)',
      hi: 'तेज बुखार (३ दिन से)',
      as: 'প্ৰচণ্ড জ্বৰ (৩ দিনতকৈ অধিক)'
    },
    {
      id: 'Severe Cough',
      icon: Activity,
      en: 'Persistent Cough',
      hi: 'लगातार खांसी',
      as: 'লানি নিছিগা কাহ'
    },
    {
      id: 'Vomiting',
      icon: Activity,
      en: 'Vomiting / Nausea',
      hi: 'उल्टी / जी मिचलाना',
      as: 'বমি বা ওকালি'
    },
    {
      id: 'Severe Headache',
      icon: Zap,
      en: 'Severe Headache',
      hi: 'गंभीर सिरदर्द',
      as: 'তীব্ৰ মূৰৰ বিষ'
    },
    {
      id: 'Extreme Weakness',
      icon: Zap,
      en: 'Extreme Weakness',
      hi: 'अत्यधिक कमजोरी / चक्कर',
      as: 'অত্যন্ত দুৰ্বলতা'
    }
  ];

  const bodyAreas = [
    { id: 'head', en: 'Head', hi: 'सिर', as: 'মূৰ' },
    { id: 'chest', en: 'Chest', hi: 'छाती', as: 'বুকু' },
    { id: 'stomach', en: 'Stomach / Belly', hi: 'पेट', as: 'পেট' },
    { id: 'arms', en: 'Arms / Hands', hi: 'हाथ', as: 'হাত' },
    { id: 'legs', en: 'Legs / Feet', hi: 'पैर', as: 'ভৰি' },
    { id: 'back', en: 'Back / Spine', hi: 'पीठ', as: 'পিঠি' }
  ];

  // Web Speech API Integration
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition not supported in this browser. Please type or tap icons.');
      speakText('Speech recognition not available. Please tap the symptom icons.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Select language
      if (language === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (language === 'as') {
        recognition.lang = 'as-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        updatePatientData({ speechText: transcript });
        
        // Auto-detect chest pain / breathlessness in transcript
        const lower = transcript.toLowerCase();
        if (lower.includes('chest') || lower.includes('dard') || lower.includes('buku') || lower.includes('bish')) {
          if (!patientData.symptoms.includes('Chest Pain')) toggleSymptom('Chest Pain');
          if (!patientData.bodyParts.includes('chest')) toggleBodyPart('chest');
        }
        if (lower.includes('breath') || lower.includes('saas') || lower.includes('ushah')) {
          if (!patientData.symptoms.includes('Breathlessness')) toggleSymptom('Breathlessness');
        }
        if (lower.includes('fever') || lower.includes('bukhar') || lower.includes('jwor')) {
          if (!patientData.symptoms.includes('High Fever')) toggleSymptom('High Fever');
        }

        speakText(language === 'hi' ? 'सुना गया: ' + transcript : 'Recorded: ' + transcript);
      };

      recognition.onerror = (e) => {
        console.warn('Speech error:', e.error);
        if (e.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow mic in browser settings.');
        } else {
          setSpeechError('Could not catch your voice. Please try again or tap the symptoms.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setSpeechError('Error accessing microphone: ' + err.message);
      setIsListening(false);
    }
  };

  const handleSymptomClick = (symptom) => {
    toggleSymptom(symptom.id);
    const label = symptom[language] || symptom.en;
    speakText(label);
  };

  const handleBodyClick = (area) => {
    toggleBodyPart(area.id);
    const label = area[language] || area.en;
    speakText(label);
  };

  // Quick Vitals Presets
  const applyPreset = (type) => {
    if (type === 'critical') {
      updatePatientData({
        symptoms: ['Chest Pain', 'Breathlessness'],
        bodyParts: ['chest'],
        vitals: { temperature: '99.4', spo2: '88', systolicBP: '172', diastolicBP: '106', feverDays: '1' }
      });
      speakText('Emergency vitals preset loaded: Low oxygen and chest tightness.');
    } else if (type === 'fever') {
      updatePatientData({
        symptoms: ['High Fever', 'Severe Cough'],
        bodyParts: ['head'],
        vitals: { temperature: '103.2', spo2: '96', systolicBP: '124', diastolicBP: '82', feverDays: '4' }
      });
      speakText('High fever preset loaded.');
    } else {
      updatePatientData({
        vitals: { temperature: '98.6', spo2: '98', systolicBP: '120', diastolicBP: '80', feverDays: '1' }
      });
      speakText('Normal vitals set.');
    }
  };

  const handleRunTriage = async () => {
    setLoadingTriage(true);
    try {
      const payload = {
        patientId: patientData.id,
        name: patientData.name,
        phone: patientData.phone,
        abhaId: patientData.abhaId,
        age: patientData.age,
        gender: patientData.gender,
        village: patientData.village,
        bodyParts: patientData.bodyParts,
        symptoms: patientData.symptoms,
        vitals: patientData.vitals,
        text: patientData.speechText
      };

      const res = await axios.post('/api/triage', payload);
      const triage = res.data.triage;
      setTriageResult(triage);
      if (res.data.patient) {
        updatePatientData(res.data.patient);
      }

      // If RED emergency, immediately emit socket alert to Doctor Dashboard
      if (triage.level === 'RED') {
        socket.emit('emergency-alert', {
          patientId: res.data.patientId,
          patientName: patientData.name,
          age: patientData.age,
          gender: patientData.gender,
          village: patientData.village,
          symptoms: patientData.symptoms,
          vitals: patientData.vitals,
          reasons: triage.reasons,
          level: 'RED'
        });
      }

      navigate('/triage');
    } catch (err) {
      console.error('Triage error:', err);
      // Client-side rule evaluation fallback if server route is unreachable
      const isRed = patientData.symptoms.includes('Chest Pain') || Number(patientData.vitals.spo2) < 90;
      setTriageResult({
        level: isRed ? 'RED' : 'YELLOW',
        score: isRed ? 9 : 5,
        reasons: isRed
          ? ['Chest pain and severe breathing distress indicate acute cardiovascular risk.', 'Oxygen saturation below safe clinical threshold.']
          : ['Persistent symptoms require clinical evaluation today.'],
        advice: isRed ? 'EMERGENCY: Immediate doctor consultation required.' : 'Priority doctor review suggested.',
        recommendedAction: isRed ? 'Immediate Emergency Video Call & Hospital Transfer' : 'Priority Teleconsultation'
      });
      navigate('/triage');
    } finally {
      setLoadingTriage(false);
    }
  };

  return (
    <div className="symptom-logger-container">
      <Navbar title={language === 'hi' ? 'लक्षण दर्ज करें' : language === 'as' ? 'লক্ষণ বাছক' : 'Log Symptoms'} />

      <main className="logger-content">
        {/* Step 1: Voice Input Section */}
        <section className="voice-input-card">
          <button
            className={`mic-giant-btn ${isListening ? 'listening' : ''}`}
            onClick={startSpeechRecognition}
            aria-label="Microphone Voice Input"
          >
            {isListening ? <Mic size={46} /> : <Mic size={46} />}
          </button>

          <h3 style={{ margin: '8px 0', fontSize: '1.4rem', color: '#1a3325' }}>
            {isListening
              ? (language === 'hi' ? '🔴 सुन रहे हैं... बोलिए' : language === 'as' ? '🔴 শুনি আছোঁ... কওক' : '🔴 Listening... Speak now')
              : (language === 'hi' ? 'बोलकर बताएं (माइक छुएं)' : language === 'as' ? 'মাত মাতি কওক (মাইক স্পৰ্শ কৰক)' : 'Touch Mic & Speak Your Symptoms')}
          </h3>

          <p style={{ margin: 0, color: '#52695c', fontSize: '1.05rem' }}>
            {language === 'as'
              ? 'অসমীয়া, हिन्दी বা English-ত আপোনাৰ অসুবিধা কওক'
              : language === 'hi'
              ? 'हिन्दी, असमिया या अंग्रेजी में अपनी तकलीफ बताएं'
              : 'Supports English, Hindi, and Assamese speech recognition'}
          </p>

          {speechError && (
            <div style={{ color: '#b3261e', fontWeight: 700, marginTop: '8px' }}>
              ⚠️ {speechError}
            </div>
          )}

          <div className="transcript-display">
            {patientData.speechText
              ? `🎙️ "${patientData.speechText}"`
              : (language === 'hi' ? 'आपकी बोली गई बात यहाँ दिखेगी...' : language === 'as' ? 'আপুনি কোৱা কথা ইয়াত দেখা যাব...' : 'Your spoken words will appear here...')}
          </div>
        </section>

        {/* Step 2: Big Symptom Tap Icons */}
        <section className="step-card">
          <div className="step-header">
            <div>
              <h2>
                <Activity size={26} />
                <span>
                  {language === 'hi' ? 'लक्षण चुनें (आइकन पर छुएं)' : language === 'as' ? 'লক্ষণ বাছক (আইকন স্পৰ্শ কৰক)' : 'Select Symptoms (Tap Icons)'}
                </span>
              </h2>
              <p>
                {language === 'hi' ? 'जो भी परेशानी महसूस हो रही है, उसे दबाएं' : language === 'as' ? 'আপোনাৰ যি সমস্যা হৈছে, তাক স্পৰ্শ কৰক' : 'Touch one or more symptoms that match your condition'}
              </p>
            </div>
          </div>

          <div className="symptom-icon-grid">
            {symptomCatalog.map((s) => {
              const isSelected = patientData.symptoms.includes(s.id);
              const IconComp = s.icon;
              return (
                <div
                  key={s.id}
                  className={`symptom-tap-card ${isSelected ? 'selected' : ''} ${s.emergency ? 'emergency-hint' : ''}`}
                  onClick={() => handleSymptomClick(s)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="symptom-icon-wrap">
                    {isSelected ? <Check size={28} strokeWidth={3} /> : <IconComp size={28} />}
                  </div>
                  <div className="symptom-label-group">
                    <strong>{s[language] || s.en}</strong>
                    <small>{s.en}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 3: Body Location Selector */}
        <section className="step-card">
          <div className="step-header">
            <h2>
              <span>
                {language === 'hi' ? 'दर्द की जगह (शरीर का अंग)' : language === 'as' ? 'বিষ হোৱা অংশ (দেহৰ স্থান)' : 'Where does it hurt? (Body Area)'}
              </span>
            </h2>
          </div>

          <div className="body-parts-pills">
            {bodyAreas.map((area) => {
              const isActive = patientData.bodyParts.includes(area.id);
              return (
                <button
                  key={area.id}
                  className={`body-pill-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleBodyClick(area)}
                >
                  {area[language] || area.en}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 4: Demographics & Simulated Sensor Vitals */}
        <section className="step-card">
          <div className="step-header">
            <h2>
              <span>
                {language === 'hi' ? 'आयु और शरीर के आंकड़े (वाइटल्स)' : language === 'as' ? 'বয়স আৰু স্বাস্থ্যৰ মাপ (Vitals)' : 'Age & Kiosk Vitals'}
              </span>
            </h2>
          </div>

          <div className="demographics-row">
            {/* Age selector */}
            <div>
              <label style={{ fontWeight: 700, color: '#273f32' }}>
                {language === 'hi' ? 'आयु वर्ग' : language === 'as' ? 'বয়সৰ শ্ৰেণী' : 'Age Category'}:
              </label>
              <div className="segmented-group">
                <button
                  className={`segmented-btn ${patientData.age < 12 ? 'active' : ''}`}
                  onClick={() => updatePatientData({ age: 8 })}
                >
                  Child (&lt;12)
                </button>
                <button
                  className={`segmented-btn ${patientData.age >= 12 && patientData.age < 60 ? 'active' : ''}`}
                  onClick={() => updatePatientData({ age: 38 })}
                >
                  Adult (12-59)
                </button>
                <button
                  className={`segmented-btn ${patientData.age >= 60 ? 'active' : ''}`}
                  onClick={() => updatePatientData({ age: 65 })}
                >
                  Senior (60+)
                </button>
              </div>
            </div>

            {/* Gender selector */}
            <div>
              <label style={{ fontWeight: 700, color: '#273f32' }}>
                {language === 'hi' ? 'लिंग' : language === 'as' ? 'লিংগ' : 'Gender'}:
              </label>
              <div className="segmented-group">
                <button
                  className={`segmented-btn ${patientData.gender === 'female' ? 'active' : ''}`}
                  onClick={() => updatePatientData({ gender: 'female' })}
                >
                  Female (মহিলা)
                </button>
                <button
                  className={`segmented-btn ${patientData.gender === 'male' ? 'active' : ''}`}
                  onClick={() => updatePatientData({ gender: 'male' })}
                >
                  Male (পুৰুষ)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Sensor Vitals Presets */}
          <div style={{ marginTop: '20px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#466051' }}>
              Simulate Kiosk Finger Sensor Vitals:
            </span>
            <div className="vitals-preset-bar">
              <button className="vitals-chip" onClick={() => applyPreset('normal')}>
                🟢 Normal (SpO2 98%, BP 120/80, 98.6°F)
              </button>
              <button className="vitals-chip danger" onClick={() => applyPreset('critical')}>
                🚨 Red Demo Alert (SpO2 88%, BP 172/106)
              </button>
              <button className="vitals-chip" onClick={() => applyPreset('fever')}>
                🟡 Fever (103.2°F, 4 days)
              </button>
            </div>
          </div>
        </section>

        {/* Bottom CTA to Trigger Triage */}
        <div className="logger-footer-cta">
          <button
            className="submit-triage-btn"
            onClick={handleRunTriage}
            disabled={loadingTriage}
          >
            <span>
              {loadingTriage
                ? 'Evaluating AI Rules...'
                : language === 'hi'
                ? 'एआई से तुरंत जांच करें'
                : language === 'as'
                ? 'এআই পৰীক্ষা কৰক'
                : 'Analyze with AI Triage'}
            </span>
            <ArrowRight size={28} />
          </button>
        </div>
      </main>
    </div>
  );
}
