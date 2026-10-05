import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations.js';

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
  const [language, setLanguage] = useState('en'); // 'en', 'hi', 'as'

  // Logged-in Patient state
  const [patientData, setPatientData] = useState(() => {
    const saved = localStorage.getItem('kiosk_patient');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'PT-' + Math.floor(1000 + Math.random() * 9000),
      name: 'Villager',
      phone: '',
      abhaId: '',
      age: 35,
      gender: 'female',
      village: 'Majuli Village',
      bodyParts: [],
      symptoms: [],
      vitals: {
        temperature: '98.6',
        spo2: '98',
        systolicBP: '120',
        diastolicBP: '80',
        feverDays: '1'
      },
      speechText: '',
      status: 'registered'
    };
  });

  // Logged-in Doctor state
  const [doctorUser, setDoctorUser] = useState(() => {
    const saved = localStorage.getItem('kiosk_doctor');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [triageResult, setTriageResult] = useState(null);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [prescription, setPrescription] = useState(null);

  const t = translations[language] || translations.en;

  // Persist patient changes
  useEffect(() => {
    localStorage.setItem('kiosk_patient', JSON.stringify(patientData));
  }, [patientData]);

  // Persist doctor session
  const loginDoctor = (doc) => {
    setDoctorUser(doc);
    localStorage.setItem('kiosk_doctor', JSON.stringify(doc));
  };

  const logoutDoctor = () => {
    setDoctorUser(null);
    localStorage.removeItem('kiosk_doctor');
  };

  const loginPatient = (patient) => {
    setPatientData((prev) => ({
      ...prev,
      ...patient
    }));
  };

  const updatePatientData = (fields) => {
    setPatientData((prev) => ({
      ...prev,
      ...fields
    }));
  };

  const toggleSymptom = (symptom) => {
    setPatientData((prev) => {
      const exists = prev.symptoms.includes(symptom);
      return {
        ...prev,
        symptoms: exists
          ? prev.symptoms.filter((s) => s !== symptom)
          : [...prev.symptoms, symptom]
      };
    });
  };

  const toggleBodyPart = (part) => {
    setPatientData((prev) => {
      const exists = prev.bodyParts.includes(part);
      return {
        ...prev,
        bodyParts: exists
          ? prev.bodyParts.filter((p) => p !== part)
          : [...prev.bodyParts, part]
      };
    });
  };

  const resetPatient = () => {
    const fresh = {
      id: 'PT-' + Math.floor(1000 + Math.random() * 9000),
      name: 'Villager',
      phone: '',
      abhaId: '',
      age: 35,
      gender: 'female',
      village: 'Majuli Village',
      bodyParts: [],
      symptoms: [],
      vitals: {
        temperature: '98.6',
        spo2: '98',
        systolicBP: '120',
        diastolicBP: '80',
        feverDays: '1'
      },
      speechText: '',
      status: 'registered'
    };
    setPatientData(fresh);
    setTriageResult(null);
    setActiveConsultation(null);
    setPrescription(null);
    localStorage.setItem('kiosk_patient', JSON.stringify(fresh));
  };

  // Helper for text-to-speech with proper language code
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'as') {
      utterance.lang = 'as-IN';
    } else {
      utterance.lang = 'en-IN';
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <PatientContext.Provider
      value={{
        language,
        setLanguage,
        t,
        patientData,
        loginPatient,
        updatePatientData,
        toggleSymptom,
        toggleBodyPart,
        doctorUser,
        loginDoctor,
        logoutDoctor,
        triageResult,
        setTriageResult,
        activeConsultation,
        setActiveConsultation,
        prescription,
        setPrescription,
        resetPatient,
        speakText
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}
