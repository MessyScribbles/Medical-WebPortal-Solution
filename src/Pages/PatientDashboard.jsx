import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import Slider from 'react-slick';
import { 
  Calendar, Activity, FileText, Clock, ChevronRight, Star, Heart, Shield, Bell, Check 
} from 'lucide-react';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Patient");
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    appointments: 0,
    activeCases: 0
  });

  const [pendingSurvey, setPendingSurvey] = useState(false);
  const [reminders, setReminders] = useState([]); // RESTORED: Reminders State

  useEffect(() => {
    const fetchDashboardData = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserName(user.displayName || "Patient");
        
        try {
            // 1. Check for Pending Surveys
            const surveyQ = query(
                collection(db, "cases"),
                where("patientId", "==", user.uid),
                where("surveySent", "==", true),
                where("surveyReplied", "==", false)
            );
            const surveySnap = await getDocs(surveyQ);
            if (!surveySnap.empty) setPendingSurvey(true);

            // 2. RESTORED: Fetch Active Reminders
            const remQ = query(
                collection(db, "reminders"),
                where("patientId", "==", user.uid),
                where("status", "==", "active")
            );
            const remSnap = await getDocs(remQ);
            const remData = remSnap.docs.map(d => ({id: d.id, ...d.data()}));
            // Sort by date (handle potential missing field safely)
            remData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setReminders(remData);

            // 3. Get Active Cases Count
            const casesQ = query(collection(db, "cases"), where("patientId", "==", user.uid), where("status", "==", "active"));
            const casesSnap = await getDocs(casesQ);
            
            setStats({
                appointments: 0, 
                activeCases: casesSnap.size
            });

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
      }
    };
    fetchDashboardData();
  }, []);

  // RESTORED: Handle Dismiss Reminder
  const handleDismissReminder = async (id) => {
      try {
          await updateDoc(doc(db, "reminders", id), { status: 'completed' });
          setReminders(prev => prev.filter(r => r.id !== id));
      } catch (err) { console.error(err); }
  };

  // Slider Settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false
  };

  if(loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-8 pb-8">
      
      {/* 1. HERO SLIDER SECTION */}
      <div className="rounded-2xl overflow-hidden shadow-lg bg-white relative">
        <Slider {...sliderSettings}>
          <div className="relative h-[250px] outline-none">
            <img src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80" alt="Healthy Lifestyle" className="absolute inset-0 w-full h-full object-cover opacity-90"/>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {userName}</h1>
              <p className="text-blue-100 text-lg max-w-lg">Your health journey continues here. Check your active cases and messages below.</p>
            </div>
          </div>

          <div className="relative h-[250px] outline-none">
            <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80" alt="Exercise" className="absolute inset-0 w-full h-full object-cover opacity-90"/>
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Daily Health Tip</h1>
              <p className="text-green-100 text-lg max-w-lg">Regular check-ups can detect health issues early. Don't forget to update your recovery status.</p>
            </div>
          </div>
        </Slider>
      </div>

      {/* 2. ALERTS & REMINDERS SECTION */}
      <div className="grid gap-6">
        
        {/* Pending Survey Alert */}
        {pendingSurvey && (
            <div 
                onClick={() => navigate('/patient/surveys')}
                className="bg-indigo-600 rounded-xl p-4 text-white shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                        <Star className="text-yellow-300" fill="currentColor"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Action Required</h3>
                        <p className="text-indigo-100 text-sm">You have a pending health survey.</p>
                    </div>
                </div>
                <div className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm">
                    Start Now
                </div>
            </div>
        )}

        {/* RESTORED: Doctor Reminders List */}
        {reminders.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Bell className="text-yellow-500" size={20}/> Doctor's Reminders
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reminders.map(r => (
                        <div key={r.id} className={`p-4 rounded-lg border-l-4 shadow-sm relative group transition-all ${
                            r.priority === 'high' ? 'bg-red-50 border-red-500' :
                            r.priority === 'normal' ? 'bg-blue-50 border-blue-500' :
                            'bg-green-50 border-green-500'
                        }`}>
                            <div className="pr-8">
                                <p className="text-gray-800 font-medium mb-1 line-clamp-2 text-sm">{r.text}</p>
                                <p className="text-xs text-gray-500">From: Dr. {r.doctorName}</p>
                            </div>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDismissReminder(r.id); }}
                                className="absolute top-3 right-3 p-1.5 bg-white rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 shadow-sm border border-gray-100 transition-colors"
                                title="Mark as Done"
                            >
                                <Check size={14}/>
                            </button>

                            <div className="mt-2 flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                                    r.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    r.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                    {r.priority} Priority
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* 3. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
           <div className="p-4 bg-blue-50 text-blue-600 rounded-full"><Activity size={28}/></div>
           <div>
              <p className="text-3xl font-bold text-gray-800">{stats.activeCases}</p>
              <p className="text-sm text-gray-500 uppercase font-semibold tracking-wide">Active Cases</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
           <div className="p-4 bg-green-50 text-green-600 rounded-full"><Calendar size={28}/></div>
           <div>
              <p className="text-3xl font-bold text-gray-800">{stats.appointments}</p>
              <p className="text-sm text-gray-500 uppercase font-semibold tracking-wide">Upcoming Appointments</p>
           </div>
        </div>
      </div>

      {/* 4. QUICK ACCESS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Quick Actions</h3>
              <div className="space-y-3">
                  <div onClick={() => navigate('/patient/medical-file')} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl cursor-pointer border border-gray-100 transition-all group">
                      <div className="flex items-center gap-4">
                          <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><FileText size={20}/></div>
                          <span className="text-gray-700 font-bold group-hover:text-blue-700">View Medical Records</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600"/>
                  </div>
                  <div onClick={() => navigate('/patient/chat')} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl cursor-pointer border border-gray-100 transition-all group">
                      <div className="flex items-center gap-4">
                          <div className="bg-green-100 p-2 rounded-lg text-green-600"><Activity size={20}/></div>
                          <span className="text-gray-700 font-bold group-hover:text-green-700">Message Care Team</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-green-600"/>
                  </div>
              </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white flex flex-col justify-between shadow-md">
              <div>
                <h3 className="font-bold text-xl mb-2 flex items-center gap-2"><Shield /> Emergency Support</h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-4">
                  If you are experiencing severe symptoms, chest pain, or difficulty breathing, do not wait.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                 <Clock size={24} className="text-white" />
                 <div>
                    <p className="font-bold text-sm">24/7 Hotline</p>
                    <p className="text-xs text-blue-100">Call 15 (Emergency)</p>
                 </div>
              </div>
          </div>
      </div>

      {/* 5. FOOTER */}
      <footer className="mt-12 border-t border-gray-200 pt-8 text-center">
        <div className="flex justify-center items-center gap-2 mb-4 text-gray-400">
            <Heart size={16} fill="currentColor" className="text-red-300"/>
            <span className="text-sm font-medium">Caring for you, every step of the way.</span>
        </div>
        <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} MediPortal Healthcare System. All rights reserved.<br/>
            Privacy Policy | Terms of Service | Help Center
        </p>
      </footer>

    </div>
  );
};

export default PatientDashboard;