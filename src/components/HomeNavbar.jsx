import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserMd } from 'react-icons/fa';

const HomeNavbar = () => {
  return (
    <nav className="bg-[#000080] text-white shadow-md relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        
        {/* Logo (Left) */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <FaUserMd className="text-blue-300" /> MediPortal
        </Link>

        {/* Links (Pushed to Far Right) */}
        <div className="ml-auto flex items-center gap-6">
          <Link 
            to="/login" 
            className="text-sm font-medium hover:text-blue-200 transition"
          >
            Login
          </Link>
          
          <Link 
            to="/contact" 
            className="text-sm font-medium hover:text-blue-200 transition"
          >
            Contact Us
          </Link>

          <Link 
            to="/register-doctor" 
            className="text-sm font-medium border-b border-white hover:text-blue-200 hover:border-blue-200 transition pb-0.5"
          >
            Looking to start your career in telemedicine? Register today.
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar;