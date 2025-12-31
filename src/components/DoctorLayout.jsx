import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { 
  collection, query, where, onSnapshot, orderBy, updateDoc, doc, arrayUnion 
} from 'firebase/firestore';
import DoctorSidebar from '../Pages/DoctorSidebar'; 
import { Menu, LogOut, User, Bell, X, Check, XCircle } from 'lucide-react';

const DoctorLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  
  // NEW: State to hold the live doctor profile data
  const [doctorProfile, setDoctorProfile] = useState(null);

  const navigate = useNavigate();
  const user = auth.currentUser;

  // 1. Listen for Notifications AND Profile Changes
  useEffect(() => {
    if (!user) return;

    // A. Notifications Listener
    const qNotif = query(
      collection(db, "notifications"),
      where("targetUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // B. Profile Listener (Fixes the name change issue)
    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setDoctorProfile(docSnap.data());
      }
    });

    return () => {
        unsubNotif();
        unsubProfile();
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/'); 
  };

  const markRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const handleInvite = async (e, notif, status) => {
    e.stopPropagation();
    try {
      if (status === 'accepted') {
        await updateDoc(doc(db, "cases", notif.caseId), {
          participants: arrayUnion(user.uid)
        });
        alert("You have joined the case.");
        navigate(`/doctor/chat/${notif.caseId}`);
      }
      await updateDoc(doc(db, "notifications", notif.id), { 
        read: true,
        status: status 
      });
    } catch (error) {
      console.error(error);
      alert("Error processing invitation.");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Use DB name if available, otherwise fallback to Auth name
  const displayName = doctorProfile?.fullName || user?.displayName || 'Doctor';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <DoctorSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col h-screen relative transition-all duration-300">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-20 relative shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Doctor Portal</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 rounded-full transition-colors relative">
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
              </button>
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-sm text-gray-700">Notifications</h3>
                    <button onClick={() => setShowNotifs(false)}><X size={16}/></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto bg-gray-50">
                    {notifications.length === 0 ? <p className="p-4 text-center text-xs text-gray-400">No notifications</p> : 
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-gray-100 transition-colors bg-white ${!n.read ? 'border-l-4 border-l-blue-500' : 'opacity-70'}`}>
                          <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-1 mb-2">{n.message}</p>
                          {n.type === 'referral_invite' && !n.read ? (
                            <div className="flex gap-2 mt-2">
                              <button onClick={(e) => handleInvite(e, n, 'accepted')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1"><Check size={12}/> Accept</button>
                              <button onClick={(e) => handleInvite(e, n, 'rejected')} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1"><XCircle size={12}/> Decline</button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400 text-right mt-1">{n.read && n.status ? `Invitation ${n.status}` : ''}</div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden md:block">
                 {/* DISPLAY UPDATED NAME HERE */}
                 <p className="text-sm font-bold text-gray-700">Dr. {displayName}</p>
              </div>
              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center border border-blue-200 shadow-sm"><User size={18} /></div>
            </div>
            <button onClick={handleLogout} className="ml-2 flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all text-sm font-bold"><LogOut size={18} /><span className="hidden md:inline">Sign Out</span></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;