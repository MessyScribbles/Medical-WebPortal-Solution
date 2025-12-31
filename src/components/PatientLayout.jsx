import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase'; 
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { 
  LayoutDashboard, MessageSquare, Calendar, FileText, 
  LogOut, User, Settings, Activity, Bell, X, ClipboardList 
} from 'lucide-react';

const PatientLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("targetUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const markRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/'); // <--- Redirects to Main Landing Page
  };

  const navItems = [
    { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', path: '/patient/appointments', icon: Calendar },
    { label: 'My Messages', path: '/patient/chat', icon: MessageSquare },
    { label: 'Surveys', path: '/patient/surveys', icon: ClipboardList },
    { label: 'Medical File', path: '/patient/medical-file', icon: FileText },
    { label: 'Settings', path: '/patient/settings', icon: Settings },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-20 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Activity className="text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-blue-900">MediPortal</h1>
            <p className="text-xs text-gray-500">Patient Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-blue-50 text-blue-700 font-bold shadow-sm border-r-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <Icon size={20} className={isActive ? "text-blue-600" : "text-gray-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-lg transition-colors font-medium">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10">
          <h2 className="text-lg font-bold text-gray-800 hidden md:block">
            {navItems.find(i => i.path === location.pathname)?.label || 'Overview'}
          </h2>
          <span className="md:hidden font-bold text-blue-900">MediPortal</span>
          
          <div className="flex items-center gap-4">
             {/* NOTIFICATIONS */}
             <div className="relative">
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 rounded-full transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                   <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-sm text-gray-700">My Notifications</h3>
                    <button onClick={() => setShowNotifs(false)}><X size={16}/></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto bg-gray-50">
                    {notifications.length === 0 ? <p className="p-4 text-center text-xs text-gray-400">No notifications</p> : 
                      notifications.map(n => (
                        <div key={n.id} onClick={() => { markRead(n.id); if(n.link) navigate(n.link); setShowNotifs(false); }} className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${!n.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}`}>
                          <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-gray-700">{user?.displayName || 'Patient'}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border border-blue-200">
                <User size={20} />
              </div>
            </div>
            
            <button onClick={handleLogout} className="md:hidden"><LogOut size={20} className="text-gray-500"/></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;