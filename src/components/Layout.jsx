import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaComments, FaUserMd } from 'react-icons/fa';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-white shadow-lg hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <FaUserMd /> MediPortal
          </h1>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium transition">
            <FaHome /> Dashboard
          </Link>
          <Link to="/appointments" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
            <FaCalendarAlt /> Appointments
          </Link>
          <Link to="/chat" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
            <FaComments /> Messages
          </Link>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;