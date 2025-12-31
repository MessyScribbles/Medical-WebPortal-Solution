import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Listen for UNREAD notifications for this user
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    // Real-time listener (updates instantly)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleClick = async (notification) => {
    // 1. Mark as read in database
    const notifRef = doc(db, 'notifications', notification.id);
    await updateDoc(notifRef, { isRead: true });

    // 2. Close dropdown
    setShowDropdown(false);

    // 3. Navigate if link exists
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm">
            Notifications
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                       {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;