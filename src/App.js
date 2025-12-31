import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- LAYOUTS ---
import PatientLayout from './components/PatientLayout';
import DoctorLayout from './components/DoctorLayout';

// --- PUBLIC PAGES ---
import LandingPage from './Pages/LandingPage';
import Login from './Pages/Login';
import DoctorRegister from './Pages/DoctorRegister';
import ContactUs from './Pages/ContactUs';
import HowToConnect from './Pages/HowToConnect';

// --- ADMIN PAGES ---
import AdminDashboard from './Pages/AdminDashboard';
import UserManagement from './Pages/UserManagement';
import ApplicationManagement from './Pages/ApplicationManagement';
import ApplicationDetails from './Pages/ApplicationDetails';

// --- DOCTOR PAGES ---
import DocDashboard from './Pages/DocDashboard';
import DoctorPatientList from './Pages/DoctorPatientList';
import RegisterPatient from './Pages/RegisterPatient';
import ChatPage from './Pages/ChatPage'; 
import Appointments from './Pages/Appointments';
import SettingsPage from './Pages/SettingsPage';
import PatientDetails from './Pages/PatientDetails';
import ChangePassword from './Pages/ChangePassword';
import DoctorSurveyAnswers from './Pages/DoctorSurveyAnswers';

// --- PATIENT PAGES ---
import PatientDashboard from './Pages/PatientDashboard';
import PatientAppointments from './Pages/PatientAppointments';
import PatientChat from './Pages/PatientChat';
import PatientCaseInfo from './Pages/PatientCaseInfo';
import PatientSettings from './Pages/PatientSettings';
import PatientSurveys from './Pages/PatientSurveys';

const App = () => {
  return (
    <Router>
      <Routes>
        
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-doctor" element={<DoctorRegister />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/how-to-connect" element={<HowToConnect />} />

        {/* ================= ADMIN ROUTES ================= */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/applications" element={<ApplicationManagement />} />
        <Route path="/admin/application/:id" element={<ApplicationDetails />} />

        {/* ================= DOCTOR ROUTES ================= */}
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DocDashboard />} />
          <Route path="patients" element={<DoctorPatientList />} />
          <Route path="register-patient" element={<RegisterPatient />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:caseId" element={<ChatPage />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="patient-details/:id" element={<PatientDetails />} />
          <Route path="survey-answers" element={<DoctorSurveyAnswers />} />
        </Route>
        
        <Route path="/change-password" element={<ChangePassword />} />

        {/* ================= PATIENT ROUTES ================= */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="chat" element={<PatientChat />} />
          <Route path="medical-file" element={<PatientCaseInfo />} />
          <Route path="settings" element={<PatientSettings />} />
          <Route path="surveys" element={<PatientSurveys />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
};

export default App;