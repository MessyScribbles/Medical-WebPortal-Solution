import React, { useState, useEffect } from 'react';
import { 
  doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs 
} from 'firebase/firestore';
// FIX 1: Import verifyBeforeUpdateEmail instead of updateEmail
import { verifyBeforeUpdateEmail } from 'firebase/auth'; 
import { auth, db } from '../firebase'; 
import { 
  User, Mail, Phone, Building, Stethoscope, Save, Trash2, AlertTriangle 
} from 'lucide-react';

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    hospital: '',
    specialty: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser; 
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              fullName: data.fullName || '',
              // Display current Auth email, or fallback to DB email
              email: user.email || data.email || '', 
              phone: data.phone || '',
              hospital: data.hospital || '',
              specialty: data.specialty || ''
            });
          }

          const q = query(
            collection(db, "deletion_requests"), 
            where("userId", "==", user.uid),
            where("status", "==", "pending")
          );
          const requestSnap = await getDocs(q);
          if (!requestSnap.empty) {
            setRequestPending(true);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in.");
      setLoading(false);
      return;
    }

    try {
      let message = "Profile updated successfully!";

      // 1. HANDLE EMAIL CHANGE (The Fix)
      if (formData.email !== user.email) {
        // Use verifyBeforeUpdateEmail instead of updateEmail
        await verifyBeforeUpdateEmail(user, formData.email);
        message = `Verification email sent to ${formData.email}. Please click the link in your inbox to finalize the email change.`;
      }

      // 2. UPDATE DATABASE PROFILE
      // We update the DB regardless, but the actual Login Email won't change until they click the link.
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        fullName: formData.fullName || '',
        email: formData.email || '', 
        phone: formData.phone || '',
        hospital: formData.hospital || '',
        specialty: formData.specialty || '',
        updatedAt: serverTimestamp()
      });

      alert(message);
    
    } catch (error) {
      console.error("Error updating profile:", error);
      
      if (error.code === 'auth/requires-recent-login') {
        alert("Security Alert: To change your email, you must Log Out and Log In again first.");
      } else {
        alert("Failed to update: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (window.confirm("Request account deletion? This action cannot be undone once approved.")) {
      try {
        await addDoc(collection(db, "deletion_requests"), {
          userId: user.uid,
          userEmail: user.email,
          userName: formData.fullName || "Unknown",
          role: "doctor",
          reason: "User requested deletion",
          status: "pending", 
          requestedAt: serverTimestamp()
        });
        setRequestPending(true);
        alert("Deletion request sent to Admin.");
      } catch (error) {
        alert("Failed to send request.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h3 className="font-semibold text-gray-700">Personal Information</h3>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User size={16} /> Full Name
              </label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail size={16} /> Email Address
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              <p className="text-xs text-blue-600 font-medium">Changing this sends a verification link.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone size={16} /> Phone Number
              </label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Stethoscope size={16} /> Specialty
              </label>
              <input type="text" name="specialty" placeholder="e.g. Cardiology" value={formData.specialty} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>

             <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building size={16} /> Hospital of Practice
              </label>
              <input type="text" name="hospital" value={formData.hospital} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2">
              {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
        <div className="border-b border-red-100 px-6 py-4 bg-red-50 flex items-center gap-2">
          <AlertTriangle className="text-red-600" size={20} />
          <h3 className="font-semibold text-red-800">Account Deletion</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-500 text-sm mb-6">Request deletion of your account and all data.</p>
          {requestPending ? (
            <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg inline-flex items-center gap-2 border border-yellow-200">
               Request Pending Approval
            </div>
          ) : (
            <button onClick={handleRequestDeletion} className="bg-white border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2">
              <Trash2 size={18} /> Request Account Deletion
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;