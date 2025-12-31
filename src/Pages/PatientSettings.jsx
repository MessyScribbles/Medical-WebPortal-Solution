import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { FaLock, FaTrashAlt, FaSave, FaSpinner, FaCheckCircle } from 'react-icons/fa';

const PatientSettings = () => {
  // State for Password Change
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Handle Password Update with Re-authentication
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (newPass.length < 6) {
      setMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    try {
      // 1. Re-authenticate the user (REQUIRED by Firebase)
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);

      // 2. Update the password
      await updatePassword(user, newPass);
      
      setMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPass('');
      setNewPass('');
      
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setMsg({ type: 'error', text: 'Current password is incorrect.' });
      } else {
        setMsg({ type: 'error', text: 'Error: ' + err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!window.confirm("Are you sure? This will request admin approval to delete your account.")) return;
    
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "deletion_requests"), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || "Patient",
        role: "patient",
        reason: "User requested via settings",
        status: "pending",
        requestedAt: serverTimestamp()
      });
      alert("Deletion request sent to admin.");
    } catch (err) {
      alert("Error sending request: " + err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>

      {/* --- PASSWORD CHANGE SECTION --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700">
          <FaLock className="text-blue-600"/> Security
        </h3>

        {msg.text && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {msg.type === 'success' && <FaCheckCircle />} {msg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Current Password</label>
            <input 
              type="password" 
              required
              placeholder="Enter current password" 
              value={currentPass} 
              onChange={e => setCurrentPass(e.target.value)} 
              className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">New Password</label>
            <input 
              type="password" 
              required
              placeholder="Min. 6 characters" 
              value={newPass} 
              onChange={e => setNewPass(e.target.value)} 
              className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin"/> : <FaSave />} 
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* --- DELETE ACCOUNT SECTION --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600">
          <FaTrashAlt /> Danger Zone
        </h3>
        <p className="text-slate-500 mb-4 text-sm">
          Once you request deletion, an administrator will review your request. This action is irreversible once approved.
        </p>
        <button 
          onClick={handleDeleteRequest} 
          className="border border-red-500 text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-50 transition"
        >
          Request Account Deletion
        </button>
      </div>
    </div>
  );
};

export default PatientSettings;