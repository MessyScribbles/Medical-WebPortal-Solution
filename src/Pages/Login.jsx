import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; // Added setDoc, serverTimestamp
import HomeNavbar from '../components/HomeNavbar'; 
import { FaUserMd, FaUserInjured, FaUserShield, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('patient'); 
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let email = identifier;

      // 1. Handle Admin Login (CID logic)
      if (role === 'admin' && !identifier.includes('@')) {
         email = `${identifier}@admin.mediportal.ma`;
      }

      // 2. Authenticate with Firebase Auth (Check Password)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. SECURITY CHECK: Check if profile exists in Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      let userData = null;

      if (!docSnap.exists()) {
         // --- ADMIN RESCUE LOGIC ---
         // If it's an Admin who passed password check but has no DB profile,
         // we AUTO-RESTORE their profile so they aren't locked out.
         if (role === 'admin') {
            console.log("Admin profile missing... Restoring automatically.");
            
            const newAdminData = {
                fullName: "Super Admin",
                email: email,
                role: 'admin',
                createdAt: serverTimestamp(),
                isRestored: true
            };
            
            await setDoc(docRef, newAdminData);
            userData = newAdminData; // Proceed with this new data
         } else {
            // For Patients/Doctors, if doc is missing, they are truly deleted.
            await signOut(auth);
            throw new Error("Account not found. It may have been deleted.");
         }
      } else {
         userData = docSnap.data();
      }

      // 4. Role Verification & Routing
      if (role === 'doctor') {
          if (userData.role !== 'doctor') {
            throw new Error("Access denied. You are not registered as a doctor.");
          }
          if (userData.isFirstLogin) {
            navigate('/change-password');
            return;
          }
          navigate('/doctor/dashboard');
      } 
      else if (role === 'admin') {
         // Security: Ensure the DB says they are an admin
         if (userData.role !== 'admin') {
            throw new Error("Access denied. Database says you are not an admin.");
         }
         navigate('/admin-dashboard');
      }
      else {
         // Patient
         navigate('/patient/dashboard'); 
      }

    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid Email or Password.");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Failed to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getActiveClass = (currentRole) => 
    role === currentRole 
      ? 'bg-white shadow text-[#000080]' 
      : 'text-gray-500 hover:text-gray-700';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-50 font-sans">
      <HomeNavbar />

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#000080]">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your portal</p>
          </div>

          {/* Role Selector */}
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            {['patient', 'doctor', 'admin'].map((r) => (
              <button 
                key={r}
                onClick={() => { setRole(r); setIdentifier(''); setError(''); }}
                className={`flex-1 flex items-center justify-center py-2 rounded-md font-medium transition capitalize ${getActiveClass(r)}`}
              >
                {r === 'patient' && <FaUserInjured className="mr-2" />}
                {r === 'doctor' && <FaUserMd className="mr-2" />}
                {r === 'admin' && <FaUserShield className="mr-2" />}
                <span className="hidden sm:inline">{r}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center">
                <FaExclamationCircle className="mr-2" /> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {role === 'admin' ? 'National ID (CID) or Email' : 'Email Address'}
              </label>
              <input 
                type={role === 'admin' ? "text" : "email"}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#000080] outline-none transition"
                placeholder={role === 'admin' ? "Enter CID" : "name@example.com"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#000080] outline-none transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#000080] hover:bg-blue-900 text-white font-bold py-3 rounded-lg transition duration-200 shadow-lg flex justify-center items-center"
            >
              {loading ? <FaSpinner className="animate-spin" /> : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;