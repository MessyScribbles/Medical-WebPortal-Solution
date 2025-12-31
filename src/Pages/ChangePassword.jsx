import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { updatePassword, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { FaLock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwords.new !== passwords.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (passwords.new.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in.");

      // 1. Update Auth Password
      await updatePassword(user, passwords.new);

      // 2. Update Firestore (Turn off isFirstLogin)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        isFirstLogin: false,
        updatedAt: new Date()
      });

      alert("Password updated successfully!");
      navigate('/doctor/dashboard');

    } catch (err) {
      console.error(err);
      setError("Error updating password. Please try again (you may need to re-login).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border-t-4 border-yellow-500">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FaLock />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Security Check</h2>
          <p className="text-gray-500 mt-2 text-sm">
            For your security, you must change your temporary password before accessing patient data.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center">
             <FaExclamationTriangle className="mr-2" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none"
              onChange={(e) => setPasswords({...passwords, new: e.target.value})}
            />
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none"
              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-lg transition shadow-lg mt-2"
          >
            {loading ? 'Updating...' : 'Set Password & Enter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;