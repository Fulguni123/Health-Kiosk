import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { useNetworkSpeed, getSimulatedNetworkSpeed } from '../hooks/useNetworkSpeed.js';
import {
  HeartPulse,
  Stethoscope,
  Volume2,
  AlertOctagon,
  Users,
  Activity,
  ArrowRight,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { language, setLanguage, t, speakText, updatePatientData } = usePatient();
  const { speed, simulateSpeed } = useNetworkSpeed();
  const currentSimSpeed = getSimulatedNetworkSpeed();

  const handleStartCheckup = () => {
    navigate('/login/patient');
  };

  const handleEmergencyClick = () => {
    updatePatientData({
      symptoms: ['Chest Pain', 'Breathlessness'],
      bodyParts: ['chest'],
      vitals: { temperature: '99.0', spo2: '88', systolicBP: '170', diastolicBP: '105' }
    });
    speakText(
      language === 'hi'
        ? 'आपातकालीन मोड सक्रिय। तुरंत डॉक्टर से संपर्क किया जा रहा है।'
        : language === 'as'
        ? 'জৰুৰীকালীন ব্যৱস্থা সক্ৰিয়। তৎক্ষণাৎ চিকিৎসকৰ সৈতে সংযোগ কৰা হৈছে।'
        : 'Emergency mode triggered. Connecting immediately to an emergency doctor.'
    );
    navigate('/consult', { state: { emergency: true } });
  };

  const handlePlayVoice = () => {
    speakText(t.welcomeVoice);
  };

  const handleQuickDemo = () => {
    // Quick Demo: Assamese speaker, chest pain & breathlessness
    setLanguage('as');
    updatePatientData({
      name: 'Biren Kalita',
      age: 58,
      gender: 'male',
      village: 'Majuli Village',
      bodyParts: ['chest'],
      symptoms: ['Chest Pain', 'Breathlessness'],
      vitals: {
        temperature: '99.2',
        spo2: '89',
        systolicBP: '165',
        diastolicBP: '102',
        feverDays: '1'
      },
      speechText: 'বুকুৰ বিষ আৰু উশাহ লবলৈ কষ্ট হৈছে (Severe chest tightness and shortness of breath)'
    });
    speakText("ডেমো মোড লোড হৈছে। বুকুত বিষ আৰু উশাহৰ সমস্যা।");
    navigate('/triage');
  };

  const getNetworkLabel = () => {
    switch (speed) {
      case 'good':
        return t.netGood;
      case 'slow':
        return t.netSlow;
      case 'very-slow':
        return t.netVerySlow;
      case 'offline':
        return t.netOffline;
      default:
        return t.netGood;
    }
  };

  return (
    <div className="home-container">
      {/* Header with Title, Language & Status */}
      <header className="home-header">
        <div className="kiosk-branding">
          <div className="kiosk-badge-icon">
            <HeartPulse size={34} strokeWidth={2.5} />
          </div>
          <div className="kiosk-title-group">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>

        <div className="header-controls">
          {/* Language Selector */}
          <div className="lang-switcher" role="group" aria-label="Language selection">
            <button
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => {
                setLanguage('en');
                speakText('English selected');
              }}
            >
              English
            </button>
            <button
              className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
              onClick={() => {
                setLanguage('hi');
                speakText('हिन्दी चुनी गई');
              }}
            >
              हिन्दी
            </button>
            <button
              className={`lang-btn ${language === 'as' ? 'active' : ''}`}
              onClick={() => {
                setLanguage('as');
                speakText('অসমীয়া নিৰ্বাচন কৰা হৈছে');
              }}
            >
              অসমীয়া
            </button>
          </div>

          {/* Network Quality Badge */}
          <div className={`network-badge ${speed}`} title="Network condition">
            {speed === 'offline' ? <WifiOff size={18} /> : <Wifi size={18} />}
            <span className="network-pulse"></span>
            <span>{getNetworkLabel()}</span>
          </div>

          {/* Emergency SOS Header Button */}
          <button className="sos-header-btn" onClick={handleEmergencyClick}>
            <AlertOctagon size={24} />
            <span>{t.emergencySOS}</span>
          </button>
        </div>
      </header>

      {/* Audio Guidance Bar */}
      <section
        className="audio-guidance-bar"
        onClick={handlePlayVoice}
        role="button"
        tabIndex={0}
        aria-label="Play welcome audio"
      >
        <div className="audio-guidance-left">
          <div className="audio-icon-circle">
            <Volume2 size={26} />
          </div>
          <div className="audio-guidance-text">
            📢 {t.listenPrompt} (Touch to hear voice guide)
          </div>
        </div>
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-green)' }}>
          ▶ Listen
        </span>
      </section>

      {/* Main Touch Actions */}
      <main className="home-main-actions">
        {/* Giant Start Health Checkup Button */}
        <div
          className="primary-checkup-card"
          onClick={handleStartCheckup}
          role="button"
          tabIndex={0}
        >
          <div className="checkup-content-left">
            <div className="checkup-icon-wrapper">
              <Stethoscope size={52} strokeWidth={2.3} />
            </div>
            <div className="checkup-text-group">
              <h2>{t.startCheckup}</h2>
              <p>{t.startCheckupSub}</p>
            </div>
          </div>
          <div className="checkup-arrow-circle">
            <ArrowRight size={36} strokeWidth={2.5} />
          </div>
        </div>

        {/* Secondary Navigation Row */}
        <div className="secondary-cards-row">
          <div
            className="secondary-card doctor"
            onClick={() => navigate('/login/doctor')}
            role="button"
            tabIndex={0}
          >
            <div className="card-icon-bubble">
              <Users size={38} strokeWidth={2.2} />
            </div>
            <div className="card-info">
              <h3>{t.doctorPortal}</h3>
              <p>{t.doctorPortalSub}</p>
            </div>
          </div>

          <div
            className="secondary-card admin"
            onClick={() => navigate('/admin')}
            role="button"
            tabIndex={0}
          >
            <div className="card-icon-bubble">
              <Activity size={38} strokeWidth={2.2} />
            </div>
            <div className="card-info">
              <h3>{t.adminDashboard}</h3>
              <p>{t.adminDashboardSub}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Tools & Speed Simulation Bar */}
      <footer className="bottom-tools-bar">
        <div className="sim-controls">
          <span>{t.simulateNetwork}:</span>
          <div className="sim-btn-group">
            <button
              className={`sim-chip ${currentSimSpeed === null ? 'active' : ''}`}
              onClick={() => simulateSpeed(null)}
            >
              Auto (Real)
            </button>
            <button
              className={`sim-chip ${currentSimSpeed === 'good' ? 'active' : ''}`}
              onClick={() => simulateSpeed('good')}
            >
              Good
            </button>
            <button
              className={`sim-chip ${currentSimSpeed === 'slow' ? 'active' : ''}`}
              onClick={() => simulateSpeed('slow')}
            >
              Slow (3G)
            </button>
            <button
              className={`sim-chip ${currentSimSpeed === 'very-slow' ? 'active' : ''}`}
              onClick={() => simulateSpeed('very-slow')}
            >
              Very Slow (2G)
            </button>
            <button
              className={`sim-chip ${currentSimSpeed === 'offline' ? 'active' : ''}`}
              onClick={() => simulateSpeed('offline')}
            >
              Offline
            </button>
          </div>
        </div>

        <button className="demo-story-btn" onClick={handleQuickDemo}>
          <Sparkles size={18} />
          <span>⚡ 2-Min Demo (Assamese Patient Story)</span>
        </button>

        <div className="kiosk-footer-note">{t.footerKioskId}</div>
      </footer>
    </div>
  );
}
