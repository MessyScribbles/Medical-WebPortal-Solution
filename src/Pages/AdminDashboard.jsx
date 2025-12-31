import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy, limit, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  FaSignOutAlt, FaBars, FaTimes, FaUserMd, FaUserInjured, 
  FaChartLine, FaClipboardList, FaUsers, FaShieldAlt, 
  FaCheckCircle, FaUserTimes, FaClock 
} from 'react-icons/fa';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [statsData, setStatsData] = useState({ patients: 0, deletions: 0, doctors: 0 });
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const allUsers = usersSnap.docs.map(doc => doc.data());
        
        const patientCount = allUsers.filter(u => u.role === 'patient' || u.role === 'user').length;
        const doctorCount = allUsers.filter(u => u.role === 'doctor').length;

        const delQuery = query(collection(db, "deletion_requests"), where("status", "==", "pending"));
        const delSnap = await getDocs(delQuery);
        const deletionList = delSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const docsQuery = query(collection(db, "users"), where("role", "==", "doctor"), limit(5));
        const docsSnap = await getDocs(docsQuery);
        const recentDocsList = docsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setStatsData({
          patients: patientCount,
          deletions: deletionList.length,
          doctors: doctorCount
        });
        setPendingDeletions(deletionList);
        setRecentDoctors(recentDocsList);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // <--- Redirects to Main Landing Page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleConfirmDeletion = async (req) => {
    if(!window.confirm(`Permanently delete ${req.userName}?`)) return;
    try {
      await deleteDoc(doc(db, "users", req.userId));
      await updateDoc(doc(db, "deletion_requests", req.id), { status: "approved", adminActionDate: new Date() });
      setPendingDeletions(prev => prev.filter(p => p.id !== req.id));
      setStatsData(prev => ({ ...prev, deletions: prev.deletions - 1 }));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const stats = [
    { label: "Total Patients", value: statsData.patients, icon: <FaUserInjured />, color: "bg-green-500" },
    { label: "Deletion Requests", value: statsData.deletions, icon: <FaUserTimes />, color: "bg-red-500" },
    { label: "Active Doctors", value: statsData.doctors, icon: <FaUserMd />, color: "bg-indigo-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col justify-between">
      
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-[#000080] text-2xl focus:outline-none">
            <FaBars />
          </button>
          <div className="text-xl font-bold text-[#000080] flex items-center gap-2">
            <FaShieldAlt /> MediPortal Admin
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium transition">
          <span>Logout</span> <FaSignOutAlt /> 
        </button>
      </nav>

      {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#000080] text-white z-50 transform transition-transform duration-300 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center border-b border-blue-900">
          <h2 className="text-xl font-bold">Admin Menu</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-blue-300 hover:text-white"><FaTimes size={24} /></button>
        </div>
        <ul className="p-4 space-y-2">
          <li onClick={() => navigate('/admin-dashboard')} className="px-4 py-3 bg-blue-900 rounded-lg cursor-pointer font-medium flex items-center gap-3">
             <FaChartLine /> Dashboard
          </li>
          <li onClick={() => navigate('/admin/users')} className="px-4 py-3 hover:bg-blue-900 rounded-lg cursor-pointer transition flex items-center gap-3">
             <FaUsers /> User Management
          </li>
          <li onClick={() => navigate('/admin/applications')} className="px-4 py-3 hover:bg-blue-900 rounded-lg cursor-pointer transition flex items-center gap-3">
             <FaClipboardList /> Application Management
          </li>
        </ul>
      </div>

      <div className="flex-grow">
        <div className="relative h-72 bg-cover bg-center flex items-center justify-center text-center text-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=2070')" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#000080] to-blue-900 opacity-80"></div>
          <div className="relative z-10 px-4 max-w-3xl">
            <h1 className="text-4xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-lg text-blue-100">
              System Overview & Recent Activities
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg border-b-4 border-transparent hover:border-[#000080] transition duration-300 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-1">{loading ? "-" : stat.value}</h3>
                </div>
                <div className={`p-4 rounded-full text-white shadow-md ${stat.color}`}>
                  <div className="text-xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FaCheckCircle className="text-green-600" /> Latest Approved Doctors
                </h3>
                <Link to="/admin/users" className="text-xs text-[#000080] font-semibold hover:underline">
                  View All
                </Link>
              </div>
              <div className="p-0">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td className="p-4 text-center text-gray-400">Loading...</td></tr>
                    ) : recentDoctors.length === 0 ? (
                      <tr><td className="p-4 text-center text-gray-400">No doctors found.</td></tr>
                    ) : (
                      recentDoctors.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{doc.fullName || doc.userName || "No Name"}</p>
                            <p className="text-xs text-gray-500">{doc.specialty || "General Medicine"}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 text-gray-500 text-sm">
                              <FaClock className="text-xs" /> {doc.hospital || "Active"}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FaUserTimes className="text-red-500" /> Account Deletion Requests
                </h3>
                <Link to="/admin/applications" className="text-xs text-[#000080] font-semibold hover:underline">
                  Manage Requests
                </Link>
              </div>
              <div className="flex-grow overflow-auto max-h-[300px]">
                <ul className="divide-y divide-gray-100">
                  {loading ? (
                     <li className="p-4 text-center text-gray-400">Loading requests...</li>
                  ) : pendingDeletions.length === 0 ? (
                     <li className="p-4 text-center text-gray-400">No pending deletion requests.</li>
                  ) : (
                    pendingDeletions.map((req) => (
                      <li key={req.id} className="px-6 py-4 hover:bg-red-50 transition flex items-center justify-between group">
                        <div>
                          <p className="font-medium text-gray-900">
                            {req.userName || "Unknown User"} 
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${req.role === 'doctor' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                              {req.role || 'User'}
                            </span>
                          </p>
                          <p className="text-sm text-gray-500">Reason: {req.reason}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleConfirmDeletion(req)}
                              className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button onClick={() => navigate('/admin/applications')} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-300">
                              Dismiss
                            </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

          </div>

        </div>
      </div>

      <footer className="bg-white py-8 text-center border-t border-gray-200 mt-auto">
        <p className="text-gray-500 text-sm font-medium">
          © {new Date().getFullYear()} MediPortal Morocco. All Trademarks Registered.
        </p>
      </footer>
    </div>
  );
};

export default AdminDashboard;