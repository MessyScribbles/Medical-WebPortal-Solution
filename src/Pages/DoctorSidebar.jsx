import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserPlus, MessageSquare, 
  Calendar, Settings, X, ClipboardCheck 
} from 'lucide-react';

const DoctorSidebar = ({ isOpen, onClose }) => {

  const navClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group mb-1 font-medium whitespace-nowrap ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <>
      {/* 1. MOBILE BACKDROP (Visible only on mobile when open) */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* 2. SIDEBAR CONTAINER */}
      <div 
        className={`
          fixed md:static inset-y-0 left-0 h-full bg-slate-900 text-slate-100 z-50 
          transform transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
          flex flex-col overflow-hidden flex-shrink-0
          ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72 md:translate-x-0 md:w-0'}
        `}
      >
        {/* INNER CONTAINER (Maintains width to prevent content squashing while outer container shrinks) */}
        <div className="flex flex-col h-full w-72">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
                <h2 className="font-bold text-xl text-white">Navigation</h2>
                <p className="text-xs text-slate-400">Manage your practice</p>
            </div>
            <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors md:hidden"
            >
                <X size={20} />
            </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <NavLink to="/doctor/dashboard" className={navClass} onClick={() => window.innerWidth < 768 && onClose()}>
                <LayoutDashboard size={20} /> <span>Overview</span>
            </NavLink>
            
            <NavLink to="/doctor/patients" className={navClass} onClick={() => window.innerWidth < 768 && onClose()}>
                <Users size={20} /> <span>My Patients</span>
            </NavLink>

            <NavLink to="/doctor/register-patient" className={navClass} onClick={() => window.innerWidth < 768 && onClose()}>
                <UserPlus size={20} /> <span>Register Patient</span>
            </NavLink>

            <NavLink to="/doctor/survey-answers" className={navClass} onClick={() => window.innerWidth < 768 && onClose()}>
                <ClipboardCheck size={20} /> <span>Survey Answers</span>
            </NavLink>

            <NavLink to="/doctor/chat" className={navClass} onClick={() => window.innerWidth < 768 && onClose()}>
                <MessageSquare size={20} /> <span>Messages</span>
            </NavLink>

            <NavLink to="/doctor/appointments" className={navClass} onClick={() => window.innerWidth < 768 && onClose()}>
                <Calendar size={20} /> <span>Schedule</span>
            </NavLink>
            
            <div className="my-6 border-t border-slate-800 mx-2"></div>
            
            <NavLink to="/doctor/settings" className={navClass} onClick={() => window.innerWidth < 768 && onClose()}>
                <Settings size={20} /> <span>Settings</span>
            </NavLink>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
                MediPortal v1.0 <br/> Secure Connection
            </p>
            </div>
        </div>
      </div>
    </>
  );
};

export default DoctorSidebar;