import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Activity, TrendingUp, Clock, AlertCircle, CheckCircle, ArrowRight 
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  collection, query, where, getDocs, orderBy, limit, doc, onSnapshot 
} from 'firebase/firestore'; 
import { Link } from 'react-router-dom';

const DocDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    activeCases: 0,
    pendingReports: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("");

  const user = auth.currentUser;

  // Helper to get LOCAL date string (YYYY-MM-DD) instead of UTC
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!user) return;

    // 1. LISTEN TO PROFILE
    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDoctorName(data.fullName || user.displayName || "Doctor");
      }
    });

    // 2. LISTEN TO APPOINTMENTS (Real-time Count)
    const todayStr = getTodayStr();
    const apptQuery = query(
      collection(db, "appointments"), 
      where("doctorId", "==", user.uid),
      where("date", "==", todayStr)
    );
    const unsubAppt = onSnapshot(apptQuery, (snap) => {
      setStats(prev => ({ ...prev, appointmentsToday: snap.size }));
    });

    // 3. LISTEN TO CASES (For Patient Count & Active Cases)
    const casesQuery = query(collection(db, "cases"), where("doctorId", "==", user.uid));
    const unsubCases = onSnapshot(casesQuery, (snap) => {
       const active = snap.docs.filter(d => d.data().status === 'active').length;
       const uniquePts = new Set(snap.docs.map(d => d.data().patientId)).size;
       
       setStats(prev => ({ 
         ...prev, 
         activeCases: active, 
         totalPatients: uniquePts 
       }));

       // Update Recents List from the same snapshot (simpler than separate query)
       const sortedDocs = snap.docs
         .map(d => ({ id: d.id, ...d.data() }))
         .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
         .slice(0, 5);
       
       setRecentPatients(sortedDocs);
       setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubAppt();
      unsubCases();
    };
  }, [user]);

  // Slideshow Logic
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      id: 1,
      subtitle: `Welcome Back, Dr. ${doctorName}`, 
      title: "Your Medical Command Center",
      desc: "You have high-priority cases pending review. Check your patient list for updates.",
      image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=2000",
      link: "/doctor/patients",
      btnText: "View Patients"
    },
    {
      id: 2,
      subtitle: "Today's Schedule",
      title: `${stats.appointmentsToday} Appointments Today`,
      desc: "Your schedule is ready. Ensure all preliminary reports are reviewed before consultations.",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=2000",
      link: "/doctor/appointments",
      btnText: "Check Schedule"
    },
    {
      id: 3,
      subtitle: "Recent Updates",
      title: `${recentPatients.length} Recent Activities`,
      desc: "Patient files have been updated with new lab results and messages.",
      image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=2000",
      link: "/doctor/chat",
      btnText: "Go to Messages"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); 
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* 1. HERO SLIDESHOW */}
      <div className="relative h-[300px] md:h-[350px] rounded-2xl overflow-hidden shadow-2xl group">
        {slides.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear scale-105" style={{ backgroundImage: `url('${slide.image}')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent"></div>
            <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-3xl">
              <div className="inline-flex items-center gap-2 mb-3">
                 <div className="h-1 w-10 bg-blue-500 rounded-full"></div>
                 <span className="text-blue-300 font-bold uppercase tracking-wider text-sm">{slide.subtitle}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight shadow-sm">{slide.title}</h1>
              <p className="text-slate-200 text-lg mb-8 max-w-xl leading-relaxed opacity-90">{slide.desc}</p>
              <Link to={slide.link} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:translate-x-1 w-fit shadow-lg">
                {slide.btnText} <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-blue-600" size={24}/>} label="Total Patients" value={stats.totalPatients} trend="Total Unique" color="bg-blue-50 border-blue-100"/>
        <StatCard icon={<Calendar className="text-purple-600" size={24}/>} label="Appointments" value={stats.appointmentsToday} trend="Today" color="bg-purple-50 border-purple-100"/>
        <StatCard icon={<Activity className="text-emerald-600" size={24}/>} label="Active Cases" value={stats.activeCases} trend="Open Files" color="bg-emerald-50 border-emerald-100"/>
        <StatCard icon={<AlertCircle className="text-orange-600" size={24}/>} label="Recent Activity" value={recentPatients.length} trend="Last 5 Updates" color="bg-orange-50 border-orange-100"/>
      </div>

      {/* 3. RECENT PATIENTS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={18} className="text-gray-400"/> Recent Patient Activity</h3>
          <Link to="/doctor/patients" className="text-sm text-blue-600 font-semibold hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-3">Patient Name</th>
                <th className="px-6 py-3">Case Status</th>
                <th className="px-6 py-3">Last Update</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentPatients.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-400 italic">No recent activity found.</td></tr>
              ) : recentPatients.map((pt) => (
                <tr key={pt.id} className="hover:bg-gray-50 transition group">
                  <td className="px-6 py-4 font-medium text-gray-800">{pt.patientName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pt.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {pt.status === 'active' ? <CheckCircle size={12} className="mr-1"/> : <Clock size={12} className="mr-1"/>}
                      {pt.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pt.createdAt?.seconds ? new Date(pt.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/doctor/chat/${pt.id}`} className="text-gray-400 hover:text-blue-600 font-bold text-sm transition-colors group-hover:text-blue-600 flex items-center justify-end gap-1">Open File <ArrowRight size={14}/></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, color }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${color.replace('bg-', 'border-')}`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">{trend}</span>
    </div>
    <h3 className="text-3xl font-extrabold text-gray-800 mb-1">{value}</h3>
    <p className="text-sm font-medium text-gray-500">{label}</p>
  </div>
);

export default DocDashboard;