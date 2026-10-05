import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Building,
  Sparkles,
  Layers
} from 'lucide-react';
import axios from 'axios';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 246,
    villages: [
      { id: 'v1', name: 'Majuli Village Kiosk', cases: 28, feverCount: 9, alert: false },
      { id: 'v2', name: 'Dhekiajuli Camp Kiosk', cases: 34, feverCount: 18, alert: true },
      { id: 'v3', name: 'Sonapur Health Center', cases: 19, feverCount: 4, alert: false },
      { id: 'v4', name: 'Rani Island Outpost', cases: 22, feverCount: 7, alert: false },
      { id: 'v5', name: 'Boko Rural Subcenter', cases: 15, feverCount: 3, alert: false }
    ],
    dailyFootfall: [
      { day: 'Mon', patients: 24, red: 2 },
      { day: 'Tue', patients: 31, red: 4 },
      { day: 'Wed', patients: 38, red: 3 },
      { day: 'Thu', patients: 45, red: 6 },
      { day: 'Fri', patients: 52, red: 8 },
      { day: 'Sat', patients: 56, red: 5 }
    ],
    triageBreakdown: [
      { name: 'Red (Emergency)', value: 28, color: '#b3261e' },
      { name: 'Yellow (Urgent)', value: 84, color: '#e8a317' },
      { name: 'Green (Routine)', value: 134, color: '#1f5c45' }
    ]
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get('/api/admin/stats');
        if (res.data.success) {
          setStats((prev) => ({
            ...prev,
            ...res.data
          }));
        }
      } catch (e) {
        console.warn('Using seeded stats for admin demo:', e.message);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="admin-container">
      <Navbar title="District Public Health & Outbreak Surveillance" />

      <main className="admin-content">
        {/* Outbreak Alert Banner */}
        <div className="admin-alert-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AlertTriangle size={32} />
            <div>
              <strong style={{ fontSize: '1.25rem' }}>
                AUTOMATED SYNDROMIC OUTBREAK ALERT: Dhekiajuli Camp Subcenter
              </strong>
              <p style={{ margin: '3px 0 0 0', opacity: 0.95, fontSize: '1.05rem' }}>
                Fever cluster detected (18 cases in 48 hours, +140% above baseline). Vector-borne surveillance team notified.
              </p>
            </div>
          </div>
          <span style={{ background: '#9f1239', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
            HIGH PRIORITY
          </span>
        </div>

        {/* 4 Metric Cards */}
        <div className="admin-metrics-grid">
          <div className="metric-stat-card">
            <h3>Active Rural Kiosks</h3>
            <div className="stat-number">5</div>
            <div className="stat-sub">100% online across Majuli District</div>
          </div>

          <div className="metric-stat-card">
            <h3>Total Villager Checkups</h3>
            <div className="stat-number">{stats.totalPatients}</div>
            <div className="stat-sub">+34 today across all kiosks</div>
          </div>

          <div className="metric-stat-card">
            <h3>Emergency Interventions</h3>
            <div className="stat-number" style={{ color: '#b3261e' }}>28</div>
            <div className="stat-sub">Immediate hospital transports arranged</div>
          </div>

          <div className="metric-stat-card">
            <h3>Generic Medicine Savings</h3>
            <div className="stat-number" style={{ color: '#e8a317' }}>84%</div>
            <div className="stat-sub">Routed to Jan Aushadhi generic stores</div>
          </div>
        </div>

        {/* Charts Dual Grid */}
        <div className="charts-dual-grid">
          {/* Daily Patient Footfall Bar Chart */}
          <div className="chart-card-box">
            <h3>Daily Kiosk Footfall & Emergency Red Cases</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={stats.dailyFootfall}>
                  <XAxis dataKey="day" stroke="#5a7364" />
                  <YAxis stroke="#5a7364" />
                  <Tooltip />
                  <Bar dataKey="patients" fill="#1f5c45" name="Total Patients" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="red" fill="#b3261e" name="Critical Emergencies" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Triage Severity Split Pie Chart */}
          <div className="chart-card-box">
            <h3>AI Triage Severity Distribution</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.triageBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.triageBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Village Outbreak Monitoring Table */}
        <div className="outbreak-table-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.3rem', color: '#1f5c45' }}>
            Village Subcenter Surveillance Log
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.villages.map((v, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: v.alert ? '#fff5f5' : '#f8fbf9',
                  border: `1px solid ${v.alert ? '#fecaca' : '#d7e7dd'}`,
                  borderRadius: '12px'
                }}
              >
                <div>
                  <strong style={{ fontSize: '1.1rem', color: '#16281e' }}>{v.name}</strong>
                  <div style={{ fontSize: '0.95rem', color: '#556f60', marginTop: '4px' }}>
                    Total Visits: <strong>{v.cases}</strong> • Fever Cases: <strong>{v.feverCount}</strong>
                  </div>
                </div>

                <span
                  style={{
                    background: v.alert ? '#b3261e' : '#1f5c45',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  {v.alert ? '⚠️ OUTBREAK ALERT' : '✓ NORMAL RANGE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Future Scope Slide Card for Presentation */}
        <div className="future-scope-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <Sparkles size={28} />
            <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Future Scope & Scalability Roadmap</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <strong>🗣️ Bhashini AI Integration</strong>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                Full neural speech models for 22 scheduled Indian regional languages & dialects.
              </p>
            </div>
            <div>
              <strong>🩺 Real Bluetooth IoT Sensors</strong>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                Direct BLE integration with pulse oximeters, digital BP cuffs, and USB dermascopes.
              </p>
            </div>
            <div>
              <strong>📱 SMS & Interactive IVR Fallback</strong>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                Automated phone call prescription reminders in local dialect for villagers without smartphones.
              </p>
            </div>
            <div>
              <strong>🤰 Maternal & Child Health Trackers</strong>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                High-risk pregnancy danger sign detection and automated ASHA worker dispatch alerts.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
