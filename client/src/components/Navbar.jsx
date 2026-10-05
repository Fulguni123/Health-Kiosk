import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { useNetworkSpeed } from '../hooks/useNetworkSpeed.js';
import {
  HeartPulse,
  Home as HomeIcon,
  ArrowLeft,
  Volume2,
  AlertOctagon,
  Wifi,
  WifiOff
} from 'lucide-react';
import './Navbar.css';

export default function Navbar({ title, showBack = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t, speakText, updatePatientData } = usePatient();
  const { speed } = useNetworkSpeed();

  const handleSOS = () => {
    updatePatientData({
      symptoms: ['Chest Pain', 'Breathlessness'],
      bodyParts: ['chest'],
      vitals: { temperature: '99.0', spo2: '88', systolicBP: '170', diastolicBP: '105' }
    });
    navigate('/consult', { state: { emergency: true } });
  };

  return (
    <nav className="kiosk-navbar">
      <div className="navbar-left">
        {showBack && (
          <button className="nav-icon-btn back-btn" onClick={() => navigate(-1)} title="Go back">
            <ArrowLeft size={28} />
            <span>Back</span>
          </button>
        )}
        <button className="nav-icon-btn home-btn" onClick={() => navigate('/')} title="Go home">
          <HomeIcon size={26} />
        </button>
        <div className="nav-title-group">
          <h2>{title || t.title}</h2>
        </div>
      </div>

      <div className="navbar-right">
        {/* Language selector */}
        <div className="nav-lang-pills">
          <button
            className={`nav-lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
          <button
            className={`nav-lang-btn ${language === 'hi' ? 'active' : ''}`}
            onClick={() => setLanguage('hi')}
          >
            हिन्दी
          </button>
          <button
            className={`nav-lang-btn ${language === 'as' ? 'active' : ''}`}
            onClick={() => setLanguage('as')}
          >
            অসমীয়া
          </button>
        </div>

        {/* Network indicator */}
        <div className={`nav-net-badge ${speed}`}>
          {speed === 'offline' ? <WifiOff size={16} /> : <Wifi size={16} />}
          <span>{speed.toUpperCase()}</span>
        </div>

        {/* SOS button */}
        <button className="nav-sos-btn" onClick={handleSOS}>
          <AlertOctagon size={20} />
          <span>SOS</span>
        </button>
      </div>
    </nav>
  );
}
