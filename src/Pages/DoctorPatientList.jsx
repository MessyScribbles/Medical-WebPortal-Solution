import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase';
import { Clock, Mail, UserPlus, ChevronRight, CheckCircle } from 'lucide-react';

const DoctorPatientList = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); 

  useEffect(() => {
    const fetchCases = async () => {
      const user = auth.currentUser;
      if(!user) return;

      try {
        // Fetch cases where this doctor is a participant
        const q = query(
          collection(db, "cases"), 
          where("participants", "array-contains", user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCases(fetchedData);
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const handleSendSurvey = async (caseId, patientId) => {
    // Optional: Add confirmation if it was already sent
    const caseItem = cases.find(c => c.id === caseId);
    if (caseItem?.surveySent) {
        if(!window.confirm("A survey was already sent. Do you want to send it again? (This will reset any previous reply)")) {
            return;
        }
    }

    try {
      const caseRef = doc(db, 'cases', caseId);
      
      // UPDATE: We set surveyReplied to false so the patient sees the form again
      await updateDoc(caseRef, {
        surveySent: true,
        surveyReplied: false, // Reset reply status
        surveySentAt: serverTimestamp(),
      });

      // Send Notification
      if(patientId) {
        await addDoc(collection(db, "notifications"), {
          targetUserId: patientId,
          type: 'survey',
          title: 'Satisfaction Survey Request',
          message: 'Your doctor has requested you to fill out a satisfaction survey.',
          link: '/patient/medical-file',
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Update local state
      setCases((prevCases) => 
        prevCases.map((c) => c.id === caseId ? { ...c, surveySent: true, surveyReplied: false } : c)
      );
      
      alert('Survey sent successfully!');

    } catch (error) {
      console.error("Error sending survey:", error);
      alert("Failed to send survey.");
    }
  };

  const activeCases = cases.filter(c => c.status === 'active');
  const pastCases = cases.filter(c => c.status === 'solved');
  const currentList = activeTab === 'active' ? activeCases : pastCases;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading patient data...</div>;

  if (cases.length === 0) {
     return <div className="p-10 text-center text-gray-500">You have no active cases.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">My Patients</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('active')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
            Active ({activeCases.length})
          </button>
          <button onClick={() => setActiveTab('past')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'past' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
            Past ({pastCases.length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Patient Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Case Details</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Survey</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentList.length > 0 ? currentList.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{c.patientName}</div>
                  <div className="text-sm text-gray-500">#{c.id.slice(0,6)}</div>
                </td>
                <td className="px-6 py-4 max-w-xs"><p className="text-sm text-gray-600 truncate">{c.summary}</p></td>
                <td className="px-6 py-4 text-sm text-gray-600"><Clock size={16} className="inline mr-1" />{c.status}</td>
                <td className="px-6 py-4">
                   {!c.surveySent ? (
                     <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100">Not Sent</span> 
                   ) : c.surveyReplied ? (
                     <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Replied</span>
                   ) : (
                     <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">Sent (Pending)</span>
                   )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {/* UPDATE: Button is enabled even if surveySent is true, allowing re-sends */}
                  <button 
                    onClick={() => handleSendSurvey(c.id, c.patientId)} 
                    className={`p-2 rounded-lg border transition-colors ${
                      c.surveySent 
                        ? 'text-green-600 border-green-200 hover:bg-green-50' 
                        : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                    }`} 
                    title={c.surveySent ? "Resend Survey" : "Send Survey"}
                  >
                    <Mail size={18} />
                  </button>

                  <button 
                    onClick={() => navigate(`/doctor/patient-details/${c.patientId}`)} 
                    className="inline-flex items-center gap-1 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
                  >
                    View <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No {activeTab} cases found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorPatientList;