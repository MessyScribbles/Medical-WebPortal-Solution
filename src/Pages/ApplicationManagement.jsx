import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  FaSignOutAlt, FaBars, FaTimes, 
  FaChartLine, FaClipboardList, FaUsers, FaShieldAlt, 
  FaTrashAlt, FaExclamationTriangle, FaClock 
} from 'react-icons/fa';

const ApplicationManagement = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('registrations');
  
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // --- FIX: CHANGED "applications" TO "doctor_applications" ---
        const appsQuery = query(collection(db, "doctor_applications"), where("status", "==", "pending"));
        const appsSnap = await getDocs(appsQuery);
        setApplications(appsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Deletions
        const delQuery = query(collection(db, "deletion_requests"), where("status", "==", "pending"));
        const delSnap = await getDocs(delQuery);
        setDeletionRequests(delSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error loading requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // Deletion Logic
  const handleApproveDeletion = async (req) => {
    if (!window.confirm(`Permanently delete user ${req.userName}?`)) return;
    try {
      await deleteDoc(doc(db, "users", req.userId));
      await updateDoc(doc(db, "deletion_requests", req.id), { status: "approved", adminActionDate: new Date() });
      setDeletionRequests(prev => prev.filter(item => item.id !== req.id));
      alert("Account deleted.");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col justify-between">
      
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-[#000080] text-2xl focus:outline-none"><FaBars /></button>
          <div className="text-xl font-bold text-[#000080] flex items-center gap-2"><FaShieldAlt /> MediPortal Admin</div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium transition"><span>Logout</span> <FaSignOutAlt /></button>
      </nav>

      {/* SIDEBAR */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#000080] text-white z-50 transform transition-transform duration-300 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center border-b border-blue-900">
          <h2 className="text-xl font-bold">Admin Menu</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-blue-300 hover:text-white"><FaTimes size={24} /></button>
        </div>
        <ul className="p-4 space-y-2">
          <li onClick={() => navigate('/admin-dashboard')} className="px-4 py-3 hover:bg-blue-900 rounded-lg cursor-pointer transition flex items-center gap-3"><FaChartLine /> Dashboard</li>
          <li onClick={() => navigate('/admin/users')} className="px-4 py-3 hover:bg-blue-900 rounded-lg cursor-pointer transition flex items-center gap-3"><FaUsers /> User Management</li>
          <li onClick={() => navigate('/admin/applications')} className="px-4 py-3 bg-blue-900 rounded-lg cursor-pointer font-medium flex items-center gap-3"><FaClipboardList /> Application Management</li>
        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-grow">
        
        {/* HERO SECTION */}
        <div className="relative h-64 bg-cover bg-center flex items-center justify-center text-center text-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053')" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#000080] to-blue-900 opacity-80"></div>
          <div className="relative z-10 px-4 max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">Request Management</h1>
            <p className="text-blue-100">Review doctor applications and account deletion requests.</p>
          </div>
        </div>

        {/* CONTAINER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-12">
          
          <div className="bg-white rounded-xl shadow-lg border-t-4 border-[#000080] overflow-hidden min-h-[500px]">
            
            {/* TABS HEADER */}
            <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('registrations')}
                className={`flex-1 py-5 text-center font-bold text-sm uppercase tracking-wide transition-colors ${activeTab === 'registrations' ? 'text-[#000080] border-b-4 border-[#000080] bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Registrations ({applications.length})
              </button>
              <button 
                onClick={() => setActiveTab('deletions')}
                className={`flex-1 py-5 text-center font-bold text-sm uppercase tracking-wide transition-colors ${activeTab === 'deletions' ? 'text-red-600 border-b-4 border-red-600 bg-red-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Deletion Requests ({deletionRequests.length})
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="p-0">
               {loading ? (
                  <div className="p-12 text-center text-gray-500">Loading requests...</div>
               ) : (
                 <>
                   {/* TAB 1: REGISTRATIONS */}
                   {activeTab === 'registrations' && (
                     <div className="overflow-x-auto">
                       <table className="w-full text-left">
                         <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase">
                           <tr><th className="px-6 py-4">Applicant</th><th className="px-6 py-4">Submitted</th><th className="px-6 py-4 text-right">Action</th></tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                           {applications.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-gray-400">No pending applications.</td></tr> : applications.map(app => (
                             <tr key={app.id} className="hover:bg-blue-50">
                               <td className="px-6 py-4">
                                 <div className="font-bold text-gray-900">{app.fullName}</div>
                                 <div className="text-xs text-gray-500">{app.email}</div>
                               </td>
                               <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-2">
                                  <FaClock className="text-gray-400"/> {app.submittedAt?.toDate ? app.submittedAt.toDate().toLocaleDateString() : 'N/A'}
                               </td>
                               <td className="px-6 py-4 text-right">
                                 <button onClick={() => navigate(`/admin/application/${app.id}`)} className="text-[#000080] font-bold text-sm hover:underline">Review Application</button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   )}

                   {/* TAB 2: DELETIONS */}
                   {activeTab === 'deletions' && (
                     <div className="overflow-x-auto">
                       <div className="bg-red-50 px-6 py-3 text-red-800 text-sm font-medium border-b border-red-100 flex items-center gap-2">
                         <FaExclamationTriangle /> Warning: Actions here are permanent.
                       </div>
                       <table className="w-full text-left">
                         <thead className="bg-white text-gray-500 font-semibold text-xs uppercase">
                           <tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Reason</th><th className="px-6 py-4 text-right">Action</th></tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                           {deletionRequests.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-gray-400">No pending deletions.</td></tr> : deletionRequests.map(req => (
                             <tr key={req.id} className="hover:bg-red-50">
                               <td className="px-6 py-4">
                                 <div className="font-bold text-gray-900">{req.userName}</div>
                                 <div className="text-xs text-gray-500">{req.userEmail}</div>
                               </td>
                               <td className="px-6 py-4 text-sm text-gray-600 italic">"{req.reason}"</td>
                               <td className="px-6 py-4 text-right">
                                 <button onClick={() => handleApproveDeletion(req)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-sm text-sm font-bold flex items-center gap-2 ml-auto">
                                   <FaTrashAlt /> Confirm Delete
                                 </button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   )}
                 </>
               )}
            </div>
            
          </div>
        </div>
      </div>

      <footer className="bg-white py-8 text-center border-t border-gray-200 mt-auto">
        <p className="text-gray-500 text-sm font-medium">© {new Date().getFullYear()} MediPortal Morocco.</p>
      </footer>
    </div>
  );
};

export default ApplicationManagement;