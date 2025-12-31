import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, LogOut } from 'lucide-react';

const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path 
    ? "bg-blue-600 text-white" 
    : "text-gray-300 hover:bg-gray-800 hover:text-white";

  const handleLogout = () => {
    // Add your auth logout logic here (e.g., signOut(auth))
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 text-white py-4 px-6 mb-8 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold tracking-wider">ADMIN PORTAL</h1>
          
          <div className="flex gap-2">
            <Link 
              to="/admin-dashboard" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isActive('/admin-dashboard')}`}
            >
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            
            <Link 
              to="/admin/applications" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isActive('/admin/applications')}`}
            >
              <FileText size={18} /> Requests
            </Link>

            <Link 
              to="/admin/users" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isActive('/admin/users')}`}
            >
              <Users size={18} /> Users
            </Link>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;