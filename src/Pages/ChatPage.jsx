import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, serverTimestamp, 
  orderBy, doc, updateDoc, setDoc 
} from 'firebase/firestore'; // Added setDoc
import { auth, db } from '../firebase'; 
import { 
  Send, MessageSquare, Search, MoreVertical, Phone, Video 
} from 'lucide-react';
import VideoCall from '../components/VideoCall'; 

const ChatPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Call States
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState('video'); 

  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;

  // 1. FETCH PATIENTS
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "cases"), 
      where("participants", "array-contains", currentUser.uid),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      patientsList.sort((a, b) => (b.lastMessageTime?.seconds || 0) - (a.lastMessageTime?.seconds || 0));
      setPatients(patientsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 2. FETCH MESSAGES
  useEffect(() => {
    if (!selectedPatient) return;

    const messagesRef = collection(db, "cases", selectedPatient.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedPatient]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPatient) return;
    
    const text = newMessage;
    setNewMessage('');
    
    try {
      await addDoc(collection(db, "cases", selectedPatient.id, "messages"), {
        text: text, 
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "Doctor",
        senderRole: 'doctor',
        createdAt: serverTimestamp(),
      });
      
      await updateDoc(doc(db, "cases", selectedPatient.id), {
        lastMessage: text, 
        lastMessageTime: serverTimestamp(), 
        patientHasUnread: true 
      });

      if (selectedPatient.patientId) {
        await addDoc(collection(db, "notifications"), {
            targetUserId: selectedPatient.patientId,
            type: 'message',
            title: `Dr. ${currentUser.displayName}`,
            message: text.substring(0, 50),
            link: '/patient/chat',
            read: false,
            createdAt: serverTimestamp()
        });
      }

    } catch (error) { console.error(error); }
  };

  // --- FIXED CALL LOGIC ---
  const startCall = async (type) => {
    if(!selectedPatient) return;
    setCallType(type);
    setIsCalling(true);
    
    try {
        // 1. SIGNAL THE DATABASE (This triggers the patient's screen)
        // We write to a specific sub-document that the patient is listening to
        await setDoc(doc(db, "cases", selectedPatient.id, "calls", "active_call"), {
            status: 'calling',
            type: type,
            callerName: currentUser.displayName || "Doctor",
            createdAt: serverTimestamp()
        });

        // 2. SEND NOTIFICATION (Backup)
        if (selectedPatient.patientId) {
           await addDoc(collection(db, "notifications"), {
                targetUserId: selectedPatient.patientId,
                type: 'call',
                title: `Incoming ${type} call`,
                message: 'Tap to join consultation',
                link: '/patient/chat',
                read: false,
                createdAt: serverTimestamp()
           });
        }
    } catch (error) {
        console.error("Error starting call:", error);
        setIsCalling(false);
    }
  };

  const endCall = async () => {
    setIsCalling(false);
    // Reset the call signal
    if (selectedPatient) {
        await setDoc(doc(db, "cases", selectedPatient.id, "calls", "active_call"), {
            status: 'ended'
        });
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-gray-500">Loading chats...</div>;

  return (
    <div className="flex h-[85vh] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
      
      {isCalling && selectedPatient && (
        <VideoCall 
          caseId={selectedPatient.id} 
          mode="caller" 
          callType={callType} 
          endCall={endCall} 
        />
      )}

      {/* LEFT SIDEBAR */}
      <div className="w-80 md:w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 bg-white border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Search patients..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.map((patient) => (
            <div 
              key={patient.id} 
              onClick={() => setSelectedPatient(patient)} 
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors flex items-center gap-3 hover:bg-white relative ${selectedPatient?.id === patient.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                {patient.patientName?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{patient.patientName}</h3>
                  <span className="text-xs text-gray-400">
                    {patient.lastMessageTime ? new Date(patient.lastMessageTime.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p className="text-sm truncate text-gray-500">{patient.lastMessage || 'Start conversation'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white">
        {!selectedPatient ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={64} className="mb-4 text-gray-200"/>
            <h3 className="text-xl font-medium">Select a patient</h3>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                  {selectedPatient.patientName?.charAt(0) || 'P'}
                </div>
                <div>
                   <h3 className="font-bold text-gray-900">{selectedPatient.patientName}</h3>
                   <span className="text-xs text-green-500 flex items-center gap-1">
                     <span className="w-2 h-2 bg-green-500 rounded-full"></span> Active Case
                   </span>
                </div>
              </div>
              
              <div className="flex gap-2 text-gray-400">
                <button onClick={() => startCall('audio')} className="p-2 hover:bg-green-100 hover:text-green-600 rounded-full transition-colors" title="Start Voice Call"><Phone size={20} /></button>
                <button onClick={() => startCall('video')} className="p-2 hover:bg-blue-100 hover:text-blue-600 rounded-full transition-colors" title="Start Video Call"><Video size={22} /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full"><MoreVertical size={20} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isMe 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}>
                      {!isMe && <p className="text-[10px] text-gray-500 font-bold mb-1">{msg.senderName}</p>}
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder="Type a message..." 
                  className="flex-1 bg-gray-100 rounded-full px-6 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 shadow-md">
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

export default ChatPage;