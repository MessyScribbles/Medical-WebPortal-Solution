import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
// 1. Import extra tools to create a background connection
import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { UserPlus, Mail, Phone, User, FileText, Calendar, Lock } from 'lucide-react';

const RegisterPatient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cid: '',
    dob: '',
    password: '',
    medicalHistory: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    let secondaryApp = null;

    try {
      // --- THE FIX: Create a "Secondary" App to handle registration ---
      // This prevents the main 'auth' (Doctor) from being logged out.
      const firebaseConfig = getApp().options; 
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      // 1. Create Account on the SECONDARY auth instance
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      const newUser = userCredential.user;

      // 2. Update the new user's profile
      await updateProfile(newUser, { displayName: formData.fullName });

      // 3. Create Database Entry (Using the MAIN db)
      await setDoc(doc(db, "users", newUser.uid), {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        cid: formData.cid,
        dob: formData.dob,
        role: 'patient',
        medicalHistory: formData.medicalHistory, 
        createdByDoctorId: auth.currentUser.uid, 
        createdAt: serverTimestamp()
      });

      // 4. Create Active Case
      await addDoc(collection(db, "cases"), {
        patientId: newUser.uid,
        patientName: formData.fullName,
        doctorId: auth.currentUser.uid,
        doctorName: auth.currentUser.displayName || "Doctor",
        title: "Initial Consultation",
        summary: "Patient registered. Initial case opened.",
        status: 'active',
        participants: [auth.currentUser.uid, newUser.uid], 
        createdAt: serverTimestamp(),
        surveySent: false,
        surveyReplied: false
      });

      // 5. Sign out the secondary auth so it doesn't linger
      await signOut(secondaryAuth);
      
      alert("Patient registered successfully!");
      navigate('/doctor/patients');

    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.message);
    } finally {
      // 6. Delete the temporary app
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
      <div className="border-b border-gray-100 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="text-blue-600"/> Register New Patient
        </h2>
        <p className="text-gray-500 text-sm mt-1">Create a patient account and open their first case file.</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input required name="fullName" type="text" placeholder="John Doe" onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">National ID (CID)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input required name="cid" type="text" placeholder="AB123456" onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input required name="email" type="email" placeholder="patient@example.com" onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input required name="phone" type="tel" placeholder="+212 6..." onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input required name="dob" type="date" onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Temporary Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input required name="password" type="text" placeholder="Create password" onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Diagnosis / Notes</label>
          <textarea name="medicalHistory" rows="3" placeholder="Enter initial observations or diagnosis..." onChange={handleChange} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            {loading ? 'Registering...' : <><UserPlus size={20}/> Register Patient</>}
          </button>
        </div>

      </form>
    </div>
  );
};

export default RegisterPatient;