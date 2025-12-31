import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, serverTimestamp, 
  orderBy, doc, updateDoc, getDocs, documentId 
} from 'firebase/firestore';
import { auth, db } from '../firebase'; 
import { Send, Phone, Video, Stethoscope, Info, Lock } from 'lucide-react'; 
import VideoCall from '../components/VideoCall'; 

const PatientChat = () => {
  const [activeCase, setActiveCase] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignedDoctors, setAssignedDoctors] = useState([]); 
  
  // Call States
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [callData, setCallData] = useState(null); 
  
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;

  // 1. FETCH ACTIVE CASE & DOCTORS
  useEffect(() => {
    // If auth isn't ready yet, don't run query
    if (!currentUser) return;

    const q = query(
      collection(db, "cases"), 
      where("patientId", "==", currentUser.uid),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const caseData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setActiveCase(caseData);
        
        if (caseData.participants && caseData.participants.length > 0) {
          try {
            const doctorIds = caseData.participants.filter(id => id !== currentUser.uid);
            if (doctorIds.length > 0) {
              const usersRef = collection(db, "users");
              const docsQuery = query(usersRef, where(documentId(), 'in', doctorIds)); 
              const docsSnap = await getDocs(docsQuery);
              const docsList = docsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              setAssignedDoctors(docsList);
            }
          } catch (err) { console.error(err); }
        }
      } else {
        setActiveCase(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 2. FETCH MESSAGES & LISTEN FOR CALLS
  useEffect(() => {
    if (!activeCase) return;

    const messagesRef = collection(db, "cases", activeCase.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    
    const msgUnsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      scrollToBottom();
    });

    // CALL LISTENER
    const callRef = doc(db, "cases", activeCase.id, "calls", "active_call");
    const callUnsub = onSnapshot(callRef, (docSnap) => {
        if(docSnap.exists()) {
            const data = docSnap.data();
            if (['calling', 'accepted', 'connected'].includes(data.status)) {
                setShowCallScreen(true);
                setCallData(data);
            } else {
                setShowCallScreen(false);
                setCallData(null);
            }
        } else {
            setShowCallScreen(false);
            setCallData(null);
        }
    });

    return () => { msgUnsub(); callUnsub(); };
  }, [activeCase]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeCase || !currentUser) return;
    
    const text = newMessage;
    setNewMessage('');
    
    try {
      await addDoc(collection(db, "cases", activeCase.id, "messages"), {
        text: text, 
        senderId: currentUser.uid, 
        senderName: currentUser.displayName || "Patient",
        senderRole: 'patient', 
        createdAt: serverTimestamp(),
      });
      
      await updateDoc(doc(db, "cases", activeCase.id), {
        lastMessage: text, 
        lastMessageTime: serverTimestamp(), 
        doctorHasUnread: true
      });

      // Notify Doctors
      assignedDoctors.forEach(async (doctor) => {
         await addDoc(collection(db, "notifications"), {
            targetUserId: doctor.id, 
            type: 'message', 
            title: `Message from ${currentUser.displayName}`,
            message: text.substring(0, 50), 
            link: `/doctor/chat/${activeCase.id}`, 
            read: false, 
            createdAt: serverTimestamp()
         });
      });
    } catch (error) { console.error("Error sending message:", error); }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading chat...</div>;

  return (
    <div className="flex flex-col md:flex-row h-[85vh] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
      
      {/* VIDEO CALL OVERLAY */}
      {showCallScreen && activeCase && (
        <VideoCall 
          caseId={activeCase.id} 
          mode="receiver" 
          callType={callData?.callType || 'video'} 
          endCall={() => setShowCallScreen(false)} 
        />
      )}

      {/* SIDEBAR (Doctor Info) */}
      <div className="w-full md:w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-5 border-b border-gray-200 bg-white">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Stethoscope className="text-blue-600"/> Care Team
            </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {assignedDoctors.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-4">No doctors assigned yet.</p>
            ) : assignedDoctors.map(doc => (
                <div key={doc.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {doc.fullName?.charAt(0) || 'D'}
                    </div>
                    <div><p className="text-sm font-bold text-gray-800">Dr. {doc.fullName}</p></div>
                </div>
            ))}
        </div>
        <div className="p-4 bg-blue-50 border-t border-blue-100 flex gap-2 text-blue-800">
             <Lock size={16} className="shrink-0 mt-0.5"/> <p className="text-xs">Secure encrypted chat.</p>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white">
        {!activeCase ? (
           <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
             <Info size={48} className="mb-4 text-gray-300"/><p>No active case.</p>
           </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm z-10">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <h3 className="font-bold text-gray-800">Live Consultation</h3>
               </div>
               <div className="flex gap-2 opacity-50">
                  <button disabled className="p-2 bg-gray-100 text-gray-400 rounded-full cursor-not-allowed"><Phone size={20}/></button>
                  <button disabled className="p-2 bg-gray-100 text-gray-400 rounded-full cursor-not-allowed"><Video size={22}/></button>
               </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
               {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            isMe 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                        }`}>
                            {/* --- THIS WAS MISSING: SHOW SENDER NAME --- */}
                            {!isMe && (
                                <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">
                                    {msg.senderName || "Doctor"}
                                </p>
                            )}
                            
                            <p>{msg.text}</p>
                            
                            {/* Timestamp */}
                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                {msg.createdAt?.seconds 
                                  ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                  : '...'}
                            </p>
                        </div>
                    </div>
                  );
               })}
               <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
               <form onSubmit={handleSendMessage} className="flex gap-3">
                 <input 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    placeholder="Type a message..." 
                    className="flex-1 bg-gray-100 rounded-full px-6 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                 />
                 <button 
                    type="submit" 
                    disabled={!newMessage.trim()} 
                    className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 shadow-md"
                 >
                    <Send size={20} />
                 </button>
               </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientChat;