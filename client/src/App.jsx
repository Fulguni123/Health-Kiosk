import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PatientProvider } from './context/PatientContext.jsx';
import Home from './pages/Home.jsx';
import PatientLogin from './pages/PatientLogin.jsx';
import DoctorLogin from './pages/DoctorLogin.jsx';
import SymptomLogger from './pages/SymptomLogger.jsx';
import TriageResult from './pages/TriageResult.jsx';
import VideoConsult from './pages/VideoConsult.jsx';
import PrescriptionView from './pages/PrescriptionView.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <PatientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login/patient" element={<PatientLogin />} />
          <Route path="/login/doctor" element={<DoctorLogin />} />
          <Route path="/symptoms" element={<SymptomLogger />} />
          <Route path="/triage" element={<TriageResult />} />
          <Route path="/consult" element={<VideoConsult />} />
          <Route path="/prescription" element={<PrescriptionView />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </PatientProvider>
  );
}
