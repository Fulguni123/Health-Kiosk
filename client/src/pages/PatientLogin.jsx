import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { usePatient } from '../context/PatientContext.jsx';
import axios from 'axios';
import {
  UserCheck,
  User,
  Phone,
  CreditCard,
  MapPin,
  ArrowRight,
  Sparkles,
  Volume2
} from 'lucide-react';
import './PatientLogin.css';

export default function PatientLogin() {
  const navigate = useNavigate();
  const { language, t, patientData, loginPatient, speakText } = usePatient();

  const [name, setName] = useState(patientData.name || '');
  const [phone, setPhone] = useState(patientData.phone || '');
  const [age, setAge] = useState(patientData.age || 38);
  const [gender, setGender] = useState(patientData.gender || 'female');
  const [village, setVillage] = useState(patientData.village || 'Majuli Village Kiosk');
  const [abhaId, setAbhaId] = useState(patientData.abhaId || '');
  const [loading, setLoading] = useState(false);

  // Quick 1-tap Guest Kiosk Check-in
  const handleQuickKioskGuest = async () => {
    setLoading(true);
    try {
      const payload = {
        name: language === 'as' ? 'মাজুলীৰ নাগৰিক' : language === 'hi' ? 'ग्रामीण नागरिक' : 'Rural Villager',
        phone: '9864' + Math.floor(100000 + Math.random() * 900000),
        age: 42,
        gender: 'female',
        village: 'Majuli Village Kiosk',
        abhaId: `ABHA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
      };

      const res = await axios.post('/api/auth/patient-login', payload);
      loginPatient(res.data.patient);
      speakText(language === 'hi' ? 'कियोस्क में आपका स्वागत है। लक्षण दर्ज करें।' : language === 'as' ? 'কিয়স্কলৈ স্বাগতম। লক্ষণ বাছক।' : 'Welcome to the kiosk. Please select your symptoms.');
      navigate('/symptoms');
    } catch (err) {
      console.warn('Backend login fallback:', err.message);
      loginPatient({
        id: 'PT-' + Math.floor(1000 + Math.random() * 9000),
        name: 'Rural Villager',
        age: 42,
        gender: 'female',
        village: 'Majuli Village Kiosk'
      });
      navigate('/symptoms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: name.trim() || 'Rural Villager',
        phone,
        age: Number(age) || 35,
        gender,
        village,
        abhaId
      };

      const res = await axios.post('/api/auth/patient-login', payload);
      loginPatient(res.data.patient);
      speakText(`Welcome ${payload.name}.`);
      navigate('/symptoms');
    } catch (err) {
      console.warn('Backend login fallback:', err.message);
      loginPatient({
        id: 'PT-' + Math.floor(1000 + Math.random() * 9000),
        name: name || 'Rural Villager',
        phone,
        age: Number(age) || 35,
        gender,
        village,
        abhaId
      });
      navigate('/symptoms');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-login-container">
      <Navbar title={language === 'hi' ? 'रोगी पंजीकरण / चेक-इन' : language === 'as' ? 'ৰোগী পঞ্জীয়ন / চেক-ইন' : 'Patient Kiosk Check-In'} />

      <main className="patient-login-content">
        <div className="patient-login-card">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#1f5c45' }}>
              {language === 'hi' ? 'स्वास्थ्य कियोस्क चेक-इन' : language === 'as' ? 'স্বাস্থ্য কিয়স্ক চেক-ইন' : 'Health Kiosk Patient Check-In'}
            </h1>
            <p style={{ margin: '6px 0 0 0', fontSize: '1.15rem', color: '#4d695a' }}>
              {language === 'hi'
                ? 'तुरंत शुरू करने के लिए 1-टैप करें या नीचे विवरण भरें'
                : language === 'as'
                ? 'তাৎক্ষণিক আৰম্ভ কৰিবলৈ ১-স্পৰ্শ কৰক বা তলত তথ্য দিয়ক'
                : '1-Tap to start instantly or enter your village details below'}
            </p>
          </div>

          {/* 1-Tap Quick Guest Check-in for low literacy */}
          <div className="kiosk-quick-guest-box" onClick={handleQuickKioskGuest} role="button" tabIndex={0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={36} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                  {language === 'hi' ? 'त्वरित 1-टैप कियोस्क चेक-इन (अतिथि)' : language === 'as' ? 'দ্ৰুত ১-স্পৰ্শ কিয়স্ক চেক-ইন (অতিথি)' : '1-Tap Instant Kiosk Check-In'}
                </h3>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '1.05rem' }}>
                  {language === 'hi' ? 'टाइप करने की आवश्यकता नहीं, तुरंत लक्षण बताएं' : language === 'as' ? 'লিখাৰ প্ৰয়োজন নাই, তৎক্ষণাৎ লক্ষণ কওক' : 'No typing required — jump straight to voice symptom check'}
                </p>
              </div>
            </div>
            <ArrowRight size={32} />
          </div>

          <div className="login-divider">
            <span>{language === 'hi' ? 'या अपना विवरण दर्ज करें' : language === 'as' ? 'বা আপোনাৰ তথ্য দিয়ক' : 'OR REGISTER WITH DETAILS'}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="kiosk-input-group">
                <label>
                  <User size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  {language === 'hi' ? 'रोगी का नाम' : language === 'as' ? 'ৰোগীৰ নাম' : 'Full Name'}:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Biren Kalita"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="kiosk-text-input"
                />
              </div>

              <div className="kiosk-input-group">
                <label>
                  <Phone size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  {language === 'hi' ? 'मोबाइल नंबर (वैकल्पिक)' : language === 'as' ? 'মোবাইল নম্বৰ (ঐচ্ছিক)' : 'Mobile Phone (Optional)'}:
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 98640 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="kiosk-text-input"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="kiosk-input-group">
                <label>{language === 'hi' ? 'आयु (वर्ष)' : language === 'as' ? 'বয়স (বছৰ)' : 'Age (Years)'}:</label>
                <input
                  type="number"
                  min="1"
                  max="110"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="kiosk-text-input"
                />
              </div>

              <div className="kiosk-input-group">
                <label>{language === 'hi' ? 'लिंग' : language === 'as' ? 'লিংগ' : 'Gender'}:</label>
                <div className="gender-pills-row">
                  <button
                    type="button"
                    className={`gender-touch-btn ${gender === 'female' ? 'active' : ''}`}
                    onClick={() => setGender('female')}
                  >
                    Female (মহিলা)
                  </button>
                  <button
                    type="button"
                    className={`gender-touch-btn ${gender === 'male' ? 'active' : ''}`}
                    onClick={() => setGender('male')}
                  >
                    Male (পুৰুষ)
                  </button>
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="kiosk-input-group">
                <label>
                  <MapPin size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  {language === 'hi' ? 'गांव / उपकेंद्र' : language === 'as' ? 'গাঁও / উপকেন্দ্ৰ' : 'Village / Kiosk Location'}:
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="kiosk-text-input"
                />
              </div>

              <div className="kiosk-input-group">
                <label>
                  <CreditCard size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  ABHA Health ID (Ayushman Bharat):
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABHA-9941-2234-1100"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  className="kiosk-text-input"
                />
              </div>
            </div>

            <button type="submit" className="patient-submit-btn" disabled={loading}>
              <UserCheck size={28} />
              <span>
                {loading
                  ? 'Saving to DB...'
                  : language === 'hi'
                  ? 'पंजीकरण करें और लक्षण बताएं'
                  : language === 'as'
                  ? 'পঞ্জীয়ন কৰক আৰু লক্ষণ বাছক'
                  : 'Check In & Log Symptoms'}
              </span>
              <ArrowRight size={26} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
