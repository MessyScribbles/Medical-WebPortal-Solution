// src/components/InviteDoctorModal.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaSearch, FaUserMd, FaPaperPlane, FaTimes } from 'react-icons/fa';

const InviteDoctorModal = ({ caseId, caseTitle, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser;

  // Search for doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      if (searchTerm.length < 2) return;
      setLoading(true);
      try {
        // Query users collection for doctors
        // Note: In a real app with many users, use a dedicated search service (like Algolia)
        // Here we fetch all doctors and filter client-side for simplicity, or use simple firestore queries
        const q = query(collection(db, "users"), where("role", "==", "doctor"));
        const snapshot = await getDocs(q);
        
        const results = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => 
            doc.id !== currentUser.uid && // Don't show self
            doc.fullName.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
        setDoctors(results);
      } catch (error) {
        console.error("Error searching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchDoctors();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentUser.uid]);

  const handleInvite = async (doctor) => {
    try {
      await addDoc(collection(db, "invitations"), {
        caseId,
        caseTitle: caseTitle || "Untitled Case",
        fromDoctorId: currentUser.uid,
        fromDoctorName: currentUser.displayName || "Doctor",
        toDoctorId: doctor.id,
        toDoctorName: doctor.fullName,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert(`Invitation sent to Dr. ${doctor.fullName}`);
      onClose();
    } catch (error) {
      console.error("Error sending invite:", error);
      alert("Failed to send invitation.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Invite Colleague</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
        </div>
        
        <div className="p-6">
          <div className="relative mb-6">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search doctor by name..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-400 text-sm">Searching...</p>
            ) : doctors.length === 0 && searchTerm.length > 1 ? (
              <p className="text-center text-gray-400 text-sm">No doctors found.</p>
            ) : (
              doctors.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <FaUserMd size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{doc.fullName}</p>
                      <p className="text-xs text-gray-500">{doc.specialty || "General Practitioner"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleInvite(doc)}
                    className="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors"
                    title="Send Invitation"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              ))
            )}
            {doctors.length === 0 && !searchTerm && (
               <p className="text-center text-gray-400 text-xs mt-4">Start typing to find a colleague.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteDoctorModal;