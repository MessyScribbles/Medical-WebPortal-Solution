import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore'; // Added deleteDoc
import { 
  FaSignOutAlt, FaBars, FaTimes, FaUserMd, FaUserInjured, 
  FaChartLine, FaClipboardList, FaUsers, FaShieldAlt, 
  FaSearch, FaPhone, FaEnvelope, FaFilter, FaTrash 
} from 'react-icons/fa';

const UserManagement = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users")); 
      const snapshot = await getDocs(q);
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if(!window.confirm(`Are you sure you want to permanently delete/ban ${userName || 'this user'}?`)) return;
    
    try {
        // This deletes the database profile.
        // Thanks to our Login.jsx update, this effectively bans them.
        await deleteDoc(doc(db, "users", userId));
        
        // Update UI
        setUsers(prev => prev.filter(u => u.id !== userId));
        alert("User profile deleted. They will be blocked from logging in.");
    } catch (err) {
        alert("Error deleting user: " + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (user.fullName || user.userName || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (user.id || '').toLowerCase().includes(term);
    const userRole = user.role || 'patient'; 
    const matchesRole = roleFilter === 'all' || userRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col justify-between">
      
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-[#000080] text-2xl focus:outline-none"><FaBars /></button>
          <div className="text-xl font-bold text-[#000080] flex items-center gap-2"><FaShieldAlt /> MediPortal Admin</div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium transition"><span>Logout</span> <FaSignOutAlt /> </button>
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
          <li onClick={() => navigate('/admin/users')} className="px-4 py-3 bg-blue-900 rounded-lg cursor-pointer font-medium flex items-center gap-3"><FaUsers /> User Management</li>
          <li onClick={() => navigate('/admin/applications')} className="px-4 py-3 hover:bg-blue-900 rounded-lg cursor-pointer transition flex items-center gap-3"><FaClipboardList /> Application Management</li>
        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-grow">
        <div className="relative h-64 bg-cover bg-center flex items-center justify-center text-center text-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070')" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#000080] to-blue-900 opacity-80"></div>
          <div className="relative z-10 px-4 max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">User Directory</h1>
            <p className="text-blue-100">Manage patients, doctors, and administrators.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-12">
          <div className="bg-white rounded-xl shadow-lg border-t-4 border-[#000080] overflow-hidden">
            
            {/* TOOLBAR */}
            <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-4">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FaUsers className="text-[#000080]" /> Users <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{filteredUsers.length}</span></h2>
               <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                 <div className="relative">
                   <FaFilter className="absolute left-3 top-3 text-gray-400" />
                   <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full sm:w-48 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000080]">
                     <option value="all">All Roles</option>
                     <option value="patient">Patients</option>
                     <option value="doctor">Doctors</option>
                     <option value="admin">Admins</option>
                   </select>
                 </div>
                 <div className="relative w-full sm:w-64">
                   <FaSearch className="absolute left-3 top-3 text-gray-400" />
                   <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000080]" />
                 </div>
               </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading directory...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">No matching users found.</td></tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-blue-50 transition duration-150">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{user.fullName || user.userName || "Unnamed User"}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">ID: {user.id}</div>
                        </td>
                        <td className="px-6 py-4">
                           {user.role === 'admin' && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold inline-flex items-center gap-1"><FaShieldAlt/> Admin</span>}
                           {user.role === 'doctor' && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold inline-flex items-center gap-1"><FaUserMd/> Doctor</span>}
                           {(!user.role || user.role === 'user' || user.role === 'patient') && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-flex items-center gap-1"><FaUserInjured/> Patient</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2"><FaEnvelope className="text-gray-400 text-xs"/> {user.email}</div>
                          {user.phone && <div className="flex items-center gap-2"><FaPhone className="text-gray-400 text-xs"/> {user.phone}</div>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.fullName)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition"
                            title="Delete / Ban User"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

export default UserManagement;