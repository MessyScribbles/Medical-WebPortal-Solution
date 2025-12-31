import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Calendar, Clock, Edit2, CheckCircle, AlertCircle } from 'lucide-react';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
          setLoading(false);
          return;
      }

      try {
          // SIMPLE QUERY: "Give me appointments for MY user ID"
          const q = query(
              collection(db, "appointments"), 
              where("patientId", "==", user.uid) 
          );
          
          const snap = await getDocs(q);
          const fetchedAppts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Sort ascending (nearest date first)
          fetchedAppts.sort((a, b) => new Date(a.date) - new Date(b.date));
          
          setAppointments(fetchedAppts);

      } catch (err) {
          console.error("Error fetching appointments:", err);
      } finally {
          setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleReschedule = async (id) => {
    const newDate = prompt("Enter preferred new date/time:");
    if (!newDate) return;

    try {
      await updateDoc(doc(db, "appointments", id), {
        rescheduleRequested: true,
        requestedNewDate: newDate
      });
      // Optimistic update
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, rescheduleRequested: true } : a));
      alert("Reschedule request sent.");
    } catch (err) {
      alert("Error sending request");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Calendar className="text-blue-600"/> My Appointments
      </h2>
      
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
             <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                <Calendar className="text-gray-400" size={32}/>
             </div>
             <p className="text-gray-500">No upcoming appointments.</p>
          </div>
        ) : (
          appointments.map(appt => (
            <div key={appt.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg">{appt.type}</h3>
                    <p className="text-sm text-gray-500">{new Date(appt.date).toDateString()} at {appt.time}</p>
                    <p className="text-xs text-gray-400">Dr. {appt.doctorName}</p>
                    {appt.rescheduleRequested && <span className="text-xs text-orange-600 font-bold">Reschedule Requested</span>}
                </div>
                {!appt.rescheduleRequested ? (
                    <button onClick={() => handleReschedule(appt.id)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Reschedule</button>
                ) : (
                    <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm">Sent</button>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientAppointments;