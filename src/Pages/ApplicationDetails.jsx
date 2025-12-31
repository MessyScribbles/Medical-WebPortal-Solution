import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { FaArrowLeft, FaCheck, FaTimes, FaUserMd, FaHospital, FaIdCard, FaMapMarkerAlt, FaPhone, FaEnvelope, FaSpinner } from 'react-icons/fa';

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        // 1. Fetch from "doctor_applications"
        const docRef = doc(db, "doctor_applications", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setApplicationData({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("Application not found!");
          navigate('/admin/applications');
        }
      } catch (error) {
        console.error("Error getting document:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [id, navigate]);

  const handleDecision = async (decision) => {
    if (!window.confirm(`Are you sure you want to ${decision} this application?`)) return;
    setIsProcessing(true);

    try {
      // 2. Update status in "doctor_applications"
      const docRef = doc(db, "doctor_applications", id);
      await updateDoc(docRef, { 
        status: decision, // 'approved' or 'rejected'
        decisionAt: new Date()
      });

      alert(`Application ${decision}! returning to list...`);
      navigate('/admin/applications');
    } catch (err) {
      console.error('Error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><FaSpinner className="animate-spin text-4xl text-[#000080]"/></div>;
  if (!applicationData) return null;

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin/applications')} className="text-gray-500 hover:text-[#000080]">
           <FaArrowLeft /> Back
        </button>
        <h1 className="text-xl font-bold text-[#000080]">Review Application</h1>
      </div>

      <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-[#000080] px-8 py-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{applicationData.fullName}</h2>
              <p className="opacity-80">Applicant for Doctor Status</p>
            </div>
            <div className="bg-white/10 p-3 rounded-full"><FaUserMd size={32} /></div>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h3 className="text-gray-400 uppercase text-xs font-bold tracking-wider border-b pb-2">Personal Info</h3>
               <div className="flex items-start gap-3"><FaEnvelope className="text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Email</p><p className="font-medium text-gray-800">{applicationData.email}</p></div></div>
               <div className="flex items-start gap-3"><FaPhone className="text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Phone</p><p className="font-medium text-gray-800">{applicationData.phone}</p></div></div>
               <div className="flex items-start gap-3"><FaIdCard className="text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">CID</p><p className="font-medium text-gray-800">{applicationData.cid}</p></div></div>
            </div>
            <div className="space-y-4">
               <h3 className="text-gray-400 uppercase text-xs font-bold tracking-wider border-b pb-2">Professional Info</h3>
               <div className="flex items-start gap-3"><FaUserMd className="text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">License</p><p className="font-medium text-gray-800">{applicationData.license}</p></div></div>
               <div className="flex items-start gap-3"><FaHospital className="text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Hospital</p><p className="font-medium text-gray-800">{applicationData.hospital}</p></div></div>
               <div className="flex items-start gap-3"><FaMapMarkerAlt className="text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Address</p><p className="font-medium text-gray-800">{applicationData.address}</p></div></div>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-end gap-4">
             {applicationData.status === 'pending' ? (
              <>
                <button onClick={() => handleDecision('rejected')} disabled={isProcessing} className="px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 flex items-center gap-2"><FaTimes /> Reject</button>
                <button onClick={() => handleDecision('approved')} disabled={isProcessing} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg flex items-center gap-2"><FaCheck /> Approve</button>
              </>
            ) : (
              <div className={`font-bold px-4 py-2 rounded-lg ${applicationData.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Application {applicationData.status.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;