import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { 
  doc, updateDoc, onSnapshot, collection, addDoc, 
  setDoc, getDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Mic, MicOff, Video, VideoOff, Phone, PhoneOff, User, AlertCircle, RefreshCcw, Ear 
} from 'lucide-react';

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

const VideoCall = ({ caseId, mode, endCall, callType }) => {
  // UI State
  const [view, setView] = useState(mode === 'receiver' ? 'incoming' : 'active');
  const [callStatus, setCallStatus] = useState('Initializing...');
  const [callerName, setCallerName] = useState("Doctor");
  const [errorMsg, setErrorMsg] = useState(null);
  const [isListenerOnly, setIsListenerOnly] = useState(false);
  
  // Media State
  const [micActive, setMicActive] = useState(true);
  // CRITICAL FIX: If audio call, videoActive starts FALSE
  const [videoActive, setVideoActive] = useState(callType === 'video');
  const [hasCam, setHasCam] = useState(false);
  
  // Refs
  const localRef = useRef();
  const remoteRef = useRef();
  const pc = useRef(null); 
  const candidatesQueue = useRef([]); 

  // 1. INCOMING CALL LISTENER
  useEffect(() => {
    if (mode === 'caller') return; 
    const callDocRef = doc(db, "cases", caseId, "calls", "active_call");
    const unsub = onSnapshot(callDocRef, (snapshot) => {
        if(snapshot.exists()) {
            const data = snapshot.data();
            if(data.callerName) setCallerName(data.callerName);
            // If doc status becomes ended, close it
            if(data.status === 'ended') endCall(); 
        } else {
            // Doc deleted
            endCall();
        }
    });
    return () => unsub();
  }, [caseId, mode, endCall]);


  // 2. MAIN CALL LOGIC
  useEffect(() => {
    // Only start WebRTC logic when call is ACTIVE (accepted/started)
    if (view !== 'active') return;

    // Reset PC
    if(pc.current) pc.current.close();
    pc.current = new RTCPeerConnection(servers);
    const myPc = pc.current;
    
    let isActive = true;
    let localStream = null;
    
    // Refs
    const callDoc = doc(db, "cases", caseId, "calls", "active_call");
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");
    
    let unsubscribeCallDoc = null;
    let unsubscribeCandidates = null;

    // Helper: Candidates
    const handleCandidate = (candidateData) => {
      if (myPc.signalingState === 'closed') return;
      const candidate = new RTCIceCandidate(candidateData);
      if (myPc.remoteDescription) {
        myPc.addIceCandidate(candidate).catch(e => console.warn(e));
      } else {
        candidatesQueue.current.push(candidate);
      }
    };

    // Helper: Drain Queue
    const processCandidateQueue = async () => {
      if (myPc.signalingState === 'closed') return;
      while (candidatesQueue.current.length > 0) {
        try { await myPc.addIceCandidate(candidatesQueue.current.shift()); } catch (e) { console.error(e); }
      }
    };

    const startCall = async () => {
      setCallStatus('Connecting Devices...');
      setErrorMsg(null);
      
      try {
        if (!isListenerOnly) {
            // --- STRICT CONSTRAINT LOGIC ---
            // If callType is audio, NEVER ask for video: false
            const constraints = {
                audio: true,
                video: callType === 'video' ? true : false
            };
            
            console.log("Requesting Media with:", constraints);

            try {
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                // If we got video successfully, enable flag
                if (callType === 'video') setHasCam(true);

            } catch (err) {
                console.warn("Media request failed:", err.name);
                
                // If video failed, try Audio-Only fallback
                if (callType === 'video') {
                     console.log("Video failed, trying audio-only fallback...");
                     try {
                        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                        setHasCam(false); 
                        setVideoActive(false);
                     } catch (audioErr) {
                        // Double fail: No Mic
                        console.error("Audio fallback failed:", audioErr);
                        setIsListenerOnly(true); 
                     }
                } else {
                    // Audio call failed -> No Mic
                    console.error("Audio call failed (No Mic):", err);
                    setIsListenerOnly(true);
                }
            }
        }
        
        if (!isActive) {
            if (localStream) localStream.getTracks().forEach(t => t.stop());
            return;
        }

        // Attach Media to PC & UI
        if (localStream && !isListenerOnly) {
            // Local Preview (only if video)
            if (localRef.current && callType === 'video' && hasCam) {
                 localRef.current.srcObject = localStream;
            }
            // Add Tracks
            localStream.getTracks().forEach((track) => myPc.addTrack(track, localStream));
        }

        // Handle Remote Stream (Incoming)
        myPc.ontrack = (event) => {
          if (event.streams && event.streams[0] && remoteRef.current) {
            remoteRef.current.srcObject = event.streams[0];
          }
        };

        // --- SIGNALING ---
        if (mode === 'caller') {
            setCallStatus('Calling...');
            myPc.onicecandidate = (event) => event.candidate && addDoc(offerCandidates, event.candidate.toJSON());

            const offerDescription = await myPc.createOffer();
            await myPc.setLocalDescription(offerDescription);

            await setDoc(callDoc, { 
                offer: { sdp: offerDescription.sdp, type: offerDescription.type }, 
                status: 'calling', 
                callType, 
                callerName: "Doctor", 
                createdAt: serverTimestamp()
            });

            unsubscribeCallDoc = onSnapshot(callDoc, (snapshot) => {
                const data = snapshot.data();
                if (!myPc.currentRemoteDescription && data?.answer) {
                    myPc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    setCallStatus('Connected');
                    processCandidateQueue();
                }
            });

            unsubscribeCandidates = onSnapshot(answerCandidates, (s) => {
                s.docChanges().forEach((c) => c.type === 'added' && handleCandidate(c.doc.data()));
            });
        } else {
            setCallStatus('Connecting...');
            myPc.onicecandidate = (event) => event.candidate && addDoc(answerCandidates, event.candidate.toJSON());

            const callSnapshot = await getDoc(callDoc);
            const callData = callSnapshot.data();

            if(!callData || !callData.offer) {
                setCallStatus('Call Failed');
                return;
            }

            await myPc.setRemoteDescription(new RTCSessionDescription(callData.offer));
            processCandidateQueue(); 

            const answerDescription = await myPc.createAnswer();
            await myPc.setLocalDescription(answerDescription);

            // Update status so patient keeps screen open
            await updateDoc(callDoc, { 
                answer: { type: answerDescription.type, sdp: answerDescription.sdp }, 
                status: 'accepted' 
            });
            setCallStatus('Connected');

            unsubscribeCandidates = onSnapshot(offerCandidates, (s) => {
                s.docChanges().forEach((c) => c.type === 'added' && handleCandidate(c.doc.data()));
            });
        }

      } catch (err) {
          console.error("Signaling Error:", err);
          setErrorMsg(err.message || "Connection Error");
      }
    };

    startCall();

    return () => {
        isActive = false;
        if(unsubscribeCallDoc) unsubscribeCallDoc();
        if(unsubscribeCandidates) unsubscribeCandidates();
        if (myPc) myPc.close();
        if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, [view, caseId, mode, callType, isListenerOnly]);

  // --- ACTIONS ---
  const handleAccept = () => setView('active');
  
  const handleDecline = async () => {
      // Set to 'ended' so both sides close
      await updateDoc(doc(db, "cases", caseId, "calls", "active_call"), { status: 'ended' });
      endCall();
  };
  
  const handleHangup = async () => {
      await updateDoc(doc(db, "cases", caseId, "calls", "active_call"), { status: 'ended' });
      endCall();
  };

  const toggleMic = () => {
    setMicActive(!micActive);
    if(pc.current) pc.current.getSenders().forEach(s => { if(s.track?.kind === 'audio') s.track.enabled = !micActive; });
  };

  const toggleVideo = () => {
    if(callType !== 'video') return; 
    setVideoActive(!videoActive);
    if(pc.current) pc.current.getSenders().forEach(s => { if(s.track?.kind === 'video') s.track.enabled = !videoActive; });
  };

  if (view === 'incoming') {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-300">
            <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-6 border-4 border-slate-700 animate-pulse">
                <User size={64} className="text-slate-400" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{callerName}</h2>
            <p className="text-slate-400 mb-12 flex items-center gap-2 uppercase tracking-wide text-sm font-bold">
                {callType === 'video' ? <><Video size={18}/> Incoming Video Call</> : <><Phone size={18}/> Incoming Audio Call</>}
            </p>
            <div className="flex gap-16">
                <div className="flex flex-col items-center gap-2">
                    <button onClick={handleDecline} className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg transition-transform hover:scale-110"><PhoneOff size={32}/></button>
                    <span className="text-sm">Decline</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <button onClick={handleAccept} className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 shadow-lg transition-transform hover:scale-110 animate-bounce"><Phone size={32}/></button>
                    <span className="text-sm">Accept</span>
                </div>
            </div>
        </div>
      );
  }

  if (errorMsg) {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
            <AlertCircle size={64} className="text-red-500 mb-4"/>
            <h3 className="text-xl font-bold mb-2">Error</h3>
            <p className="text-slate-300 mb-6 max-w-md">{errorMsg}</p>
            <button onClick={endCall} className="px-6 py-3 bg-slate-700 rounded-lg font-bold">Close</button>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-5xl h-[80vh] bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-slate-800">
        
        {/* Remote View */}
        {callType === 'video' ? (
          <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-slate-400">
             <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-4 border-2 border-slate-600"><User size={80} /></div>
             <p className="text-xl font-bold">{callStatus}</p>
             <p className="text-sm text-slate-500">{isListenerOnly ? "Listener Mode" : "Audio Only"}</p>
             {/* Audio element for remote stream must exist but be hidden */}
             <video ref={remoteRef} autoPlay playsInline className="hidden" />
          </div>
        )}
        
        {/* Local View (PIP) */}
        {!isListenerOnly && callType === 'video' && hasCam && videoActive && (
          <div className="absolute bottom-6 right-6 w-32 md:w-48 aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg">
            <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${callStatus === 'Connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
           {callStatus}
           {isListenerOnly && <span className="ml-2 text-orange-400 font-bold flex items-center gap-1"><Ear size={12}/> Mic Failed</span>}
        </div>
      </div>

      <div className="flex items-center gap-8 mt-8">
        {!isListenerOnly && (
            <button onClick={toggleMic} className={`p-5 rounded-full transition-all ${micActive ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 text-white'}`}>
            {micActive ? <Mic size={24}/> : <MicOff size={24}/>}
            </button>
        )}
        
        <button onClick={handleHangup} className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl transform hover:scale-110 transition-all">
           <PhoneOff size={32}/>
        </button>

        {!isListenerOnly && callType === 'video' && hasCam && (
          <button onClick={toggleVideo} className={`p-5 rounded-full transition-all ${videoActive ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 text-white'}`}>
             {videoActive ? <Video size={24}/> : <VideoOff size={24}/>}
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;