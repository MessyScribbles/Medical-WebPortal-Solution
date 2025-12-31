import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, getDoc, updateDoc, serverTimestamp, 
  collection, query, where, getDocs, arrayRemove, addDoc 
} from 'firebase/firestore';
import { 
  FaUserCircle, FaSave, FaArrowLeft, FaNotesMedical, 
  FaEdit, FaUserMd, FaSignOutAlt, FaRedo, FaSpinner, 
  FaCheckCircle, FaExclamationTriangle, FaBell 
} from 'react-icons/fa';

const PatientDetails = () => {
  const { id } = useParams(); // Patient User ID
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [patient, setPatient] = useState(null);
  const [activeCase, setActiveCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [referEmail, setReferEmail] = useState("");
  const [isReferring, setIsReferring] = useState(false);

  const [reminderText, setReminderText] = useState("");
  const [priority, setPriority] = useState("normal");
  const [sendingReminder, setSendingReminder] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    if (authLoading || !currentUser) return;
    
    // Guard: Check if ID is valid
    if (!id || id === 'undefined' || id === 'null') {
        setErrorMsg("Invalid Patient ID provided.");
        setLoading(false);
        return;
    }

    const fetchData = async () => {
      try {
        // A. Fetch Cases (Priority: Active case involved with this doctor)
        const casesRef = collection(db, "cases");
        const q = query(casesRef, where("patientId", "==", id));
        const caseSnap = await getDocs(q);
        
        let foundCase = null;
        
        if (!caseSnap.empty) {
            const casesList = caseSnap.docs.map(d => ({id: d.id, ...d.data()}));
            // 1. Look for case where I am a participant
            foundCase = casesList.find(c => c.participants && c.participants.includes(currentUser.uid));
            // 2. If not found, look for any active case
            if (!foundCase) foundCase = casesList.find(c => c.status === 'active');
            // 3. Fallback to any case
            if (!foundCase) foundCase = casesList[0];
            
            setActiveCase(foundCase);
        }

        // B. Fetch Patient Profile
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // Scenario 1: Full Profile Exists
          setPatient({ id: userSnap.id, ...userSnap.data() });
          setNotes(userSnap.data().medicalHistory || "");
        } else if (foundCase) {
          // Scenario 2: Profile Missing, but Case Exists (Ghost Profile)
          // Use data from the case to build a temporary patient object
          setPatient({
            id: id,
            fullName: foundCase.patientName || "Unknown Patient",
            email: "N/A (Profile Missing)",
            phone: "N/A",
            cid: "N/A",
            isFallback: true
          });
          setErrorMsg(""); // Clear error if we recovered via fallback
        } else {
          // Scenario 3: Nothing found
          setErrorMsg("Patient profile not found and no active cases linked.");
        }

      } catch (error) {
        console.error("Error fetching details:", error);
        setErrorMsg("System error loading patient details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, currentUser, authLoading]);

  // --- HANDLERS ---

  const handleSaveNotes = async () => {
    try {
      // Try to update existing doc
      await updateDoc(doc(db, "users", id), {
        medicalHistory: notes,
        lastUpdated: serverTimestamp()
      }).catch(async (e) => {
         // If doc doesn't exist (code 'not-found'), alert user
         if (e.code === 'not-found') {
             alert("Cannot save notes: This patient does not have a user profile record.");
         }
      });
      setIsEditingNotes(false);
      alert("Notes updated.");
    } catch (error) {
      console.error(error);
      alert("Failed to save notes.");
    }
  };

  const handleSendReminder = async (e) => {
    e.preventDefault();
    if (!reminderText.trim()) return;
    setSendingReminder(true);
    
    try {
        await addDoc(collection(db, "reminders"), {
            patientId: id,
            doctorId: currentUser.uid,
            doctorName: currentUser.displayName || "Doctor",
            text: reminderText,
            priority: priority,
            status: 'active',
            createdAt: serverTimestamp()
        });
        
        // Notify
        await addDoc(collection(db, "notifications"), {
            targetUserId: id,
            type: 'reminder',
            title: 'New Doctor Reminder',
            message: `Dr. ${currentUser.displayName} sent: ${reminderText.substring(0,30)}...`,
            link: '/patient/dashboard',
            read: false,
            createdAt: serverTimestamp()
        });

        alert("Reminder sent successfully.");
        setReminderText("");
        setPriority("normal");
    } catch (err) {
        console.error("Failed to send reminder:", err);
        alert("Error sending reminder.");
    } finally {
        setSendingReminder(false);
    }
  };

  // Referral, Leave, Solve, Restart handlers (Same as before, abbreviated for clarity)
  const handleReferral = async (e) => {
    e.preventDefault();
    if (!referEmail || !activeCase) return;
    setIsReferring(true);
    try {
      const q = query(collection(db, "users"), where("email", "==", referEmail), where("role", "==", "doctor"));
      const querySnap = await getDocs(q);
      if (querySnap.empty) { alert("Doctor not found."); setIsReferring(false); return; }
      const newDocId = querySnap.docs[0].id;
      await addDoc(collection(db, "notifications"), {
        targetUserId: newDocId, type: 'referral_invite', title: 'Case Referral Invite',
        message: `Invite for patient ${patient.fullName}`, caseId: activeCase.id,
        senderName: currentUser.displayName, read: false, createdAt: serverTimestamp()
      });
      alert(`Invitation sent.`); setReferEmail("");
    } catch (error) { console.error(error); alert("Error referring."); } 
    finally { setIsReferring(false); }
  };

  const handleSolveCase = async () => {
    if (!activeCase) return;
    await updateDoc(doc(db, "cases", activeCase.id), { status: 'solved', solvedAt: serverTimestamp() });
    setActiveCase(p => ({...p, status: 'solved'}));
  };

  const handleRestartCase = async () => {
    if (!activeCase) return;
    await updateDoc(doc(db, "cases", activeCase.id), { status: 'active', restartedAt: serverTimestamp() });
    setActiveCase(p => ({...p, status: 'active'}));
  };

  const handleLeaveCase = async () => {
    if (!activeCase || !window.confirm("Leave case?")) return;
    await updateDoc(doc(db, "cases", activeCase.id), { participants: arrayRemove(currentUser.uid) });
    navigate('/doctor/patients');
  };

  // --- RENDER ---

  if (authLoading || loading) return <div className="p-10 text-center"><FaSpinner className="animate-spin inline"/> Loading...</div>;
  
  if (errorMsg || !patient) return (
    <div className="p-10 text-center">
        <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4"/>
        <h2 className="text-xl font-bold text-gray-800">Patient Data Unavailable</h2>
        <p className="text-gray-500 my-2">{errorMsg || "Unknown error occurred."}</p>
        <p className="text-sm text-gray-400">ID Requested: {id}</p>
        <button onClick={() => navigate('/doctor/patients')} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
            Return to Patient List
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 font-bold transition-colors">
        <FaArrowLeft /> Back to List
      </button>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Profile & Actions */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
                <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">
                    <FaUserCircle />
                </div>
                <h1 className="text-xl font-bold text-slate-800">{patient.fullName}</h1>
                <p className="text-sm text-slate-500 mb-2">ID: {patient.cid || "N/A"}</p>
                
                {patient.isFallback && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs px-3 py-2 rounded-lg mb-3">
                        <strong>Warning:</strong> User profile missing. Showing limited case data.
                    </div>
                )}

                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${activeCase?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {activeCase ? `Status: ${activeCase.status.toUpperCase()}` : 'No Active Case'}
                </div>
                
                <div className="text-left space-y-3 mt-6 border-t border-slate-100 pt-6">
                    <div className="flex justify-between"><span className="text-xs font-bold text-slate-400 uppercase">Email</span> <span className="text-sm text-slate-700 truncate">{patient.email}</span></div>
                    <div className="flex justify-between"><span className="text-xs font-bold text-slate-400 uppercase">Phone</span> <span className="text-sm text-slate-700">{patient.phone}</span></div>
                </div>
            </div>

            {/* REMINDER CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FaBell className="text-yellow-500"/> Send Reminder
                </h3>
                <form onSubmit={handleSendReminder}>
                    <textarea 
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3 bg-slate-50 resize-none"
                        rows="3"
                        placeholder="e.g. Take meds after lunch..."
                        value={reminderText}
                        onChange={(e) => setReminderText(e.target.value)}
                    ></textarea>
                    
                    <div className="flex gap-2 mb-4">
                        {['low', 'normal', 'high'].map(p => (
                            <button 
                                type="button" 
                                key={p}
                                onClick={() => setPriority(p)}
                                className={`flex-1 py-1 text-xs font-bold rounded capitalize border transition-colors ${
                                    priority === p 
                                    ? (p==='high'?'bg-red-100 text-red-700 border-red-200' : p==='normal'?'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200') 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <button 
                        type="submit" 
                        disabled={sendingReminder} 
                        className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition flex justify-center items-center gap-2"
                    >
                        {sendingReminder ? <FaSpinner className="animate-spin"/> : 'Send Reminder'}
                    </button>
                </form>
            </div>

            {/* Case Actions */}
            {activeCase && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FaExclamationTriangle className="text-orange-500"/> Case Actions
                    </h3>

                    {activeCase.status === 'active' && (
                       <button onClick={handleSolveCase} className="w-full mb-3 bg-green-600 text-white hover:bg-green-700 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                            <FaCheckCircle size={16} /> Mark as Solved
                       </button>
                    )}

                    {activeCase.status === 'solved' && (
                        <button onClick={handleRestartCase} className="w-full mb-3 bg-blue-600 text-white hover:bg-blue-700 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                            <FaRedo size={14} /> Restart Case
                        </button>
                    )}

                    <div className="border-t border-gray-100 my-4"></div>

                    <form onSubmit={handleReferral} className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Invite Colleague</label>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Doctor's Email" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" value={referEmail} onChange={(e) => setReferEmail(e.target.value)}/>
                            <button type="submit" disabled={isReferring} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-900 transition">
                                {isReferring ? <FaSpinner className="animate-spin"/> : <FaUserMd />}
                            </button>
                        </div>
                    </form>

                    <button onClick={handleLeaveCase} className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition">
                        <FaSignOutAlt size={14} /> Leave Case
                    </button>
                </div>
            )}
        </div>

        {/* RIGHT: Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FaNotesMedical className="text-blue-500"/> Medical Notes
              </h2>
              <button onClick={isEditingNotes ? handleSaveNotes : () => setIsEditingNotes(true)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${isEditingNotes ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {isEditingNotes ? <><FaSave /> Save Notes</> : <><FaEdit /> Edit Notes</>}
              </button>
            </div>

            {isEditingNotes ? (
              <textarea className="flex-1 w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 leading-relaxed resize-none bg-slate-50" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter patient notes..."/>
            ) : (
              <div className="flex-1 bg-slate-50 p-6 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed text-slate-700">
                {notes || <span className="text-slate-400 italic">No medical notes recorded yet.</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;