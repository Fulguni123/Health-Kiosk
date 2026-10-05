import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { usePatient } from '../context/PatientContext.jsx';
import axios from 'axios';
import {
  Stethoscope,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import './DoctorLogin.css';

export default function DoctorLogin() {
  const navigate = useNavigate();
  const { loginDoctor, speakText } = usePatient();

  const [email, setEmail] = useState('dr.sharma@health.gov.in');
  const [password, setPassword] = useState('doc123');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post('/api/auth/doctor-login', {
        email,
        password
      });

      if (res.data.success) {
        loginDoctor(res.data.doctor);
        navigate('/doctor');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('dr.sharma@health.gov.in');
    setPassword('doc123');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/doctor-login', {
        email: 'dr.sharma@health.gov.in',
        password: 'doc123'
      });
      loginDoctor(res.data.doctor);
      navigate('/doctor');
    } catch (err) {
      loginDoctor({
        id: 'DOC-101',
        name: 'Dr. A. Sharma, MD',
        email: 'dr.sharma@health.gov.in',
        specialization: 'Cardiology & Rural Tele-ICU',
        regNumber: 'MCI-88421'
      });
      navigate('/doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-login-container">
      <Navbar title="Medical Officer & Teleconsultant Portal" />

      <main className="doctor-login-content">
        <div className="doctor-login-card">
          <div className="doctor-avatar-badge">
            <Stethoscope size={40} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff' }}>
              Doctor Portal Login
            </h1>
            <p style={{ margin: '6px 0 0 0', color: '#94b8a4', fontSize: '0.95rem' }}>
              Telemedicine Consultation & Live Triage Queue
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: '#451212', border: '1px solid #7f1d1d', color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="doctor-input-group">
              <label>Doctor ID / Official Email:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="doctor-text-input"
                  required
                />
              </div>
            </div>

            <div className="doctor-input-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="doctor-text-input"
                required
              />
            </div>

            <button type="submit" className="doctor-login-submit-btn" disabled={loading}>
              <ShieldCheck size={20} />
              <span>{loading ? 'Authenticating...' : 'Sign In to Doctor Console'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Demo 1-Click Button */}
          <button className="quick-doctor-demo-btn" onClick={handleQuickDemoLogin}>
            <Sparkles size={18} />
            <span>⚡ 1-Click Doctor Demo (Dr. Sharma, MD)</span>
          </button>

          <p style={{ textAlign: 'center', margin: '20px 0 0 0', fontSize: '0.85rem', color: '#688d79' }}>
            Demo credentials pre-filled: <code>dr.sharma@health.gov.in</code> / <code>doc123</code>
          </p>
        </div>
      </main>
    </div>
  );
}
