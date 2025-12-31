import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc 
} from 'firebase/firestore';
import { Calendar, Clock, User, Plus, Trash2, Edit2, X, Check, XCircle, AlertCircle } from 'lucide-react';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [myPatients, setMyPatients] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    type: 'Check-up',
    notes: ''
  });

  const currentUser = auth.currentUser;

  useEffect(() => {
    if(!currentUser) return;
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const q = query(collection(db, "appointments"), where("doctorId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const appts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort: Pending requests first, then by date
      appts.sort((a,b) => {
        if (a.rescheduleRequested && !b.rescheduleRequested) return -1;
        if (!a.rescheduleRequested && b.rescheduleRequested) return 1;
        return new Date(a.date) - new Date(b.date);
      });
      
      setAppointments(appts);

      // Fetch Patients (Logic from previous fix)
      const casesQ = query(
        collection(db, "cases"), 
        where("participants", "array-contains", currentUser.uid),
        where("status", "==", "active")
      );
      const casesSnap = await getDocs(casesQ);
      const patientList = casesSnap.docs.map(doc => ({
          id: doc.data().patientId, 
          name: doc.data().patientName || "Unknown",
      }));
      const uniquePatients = Array.from(new Map(patientList.map(item => [item.id, item])).values());
      setMyPatients(uniquePatients);

    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) return alert("Please select a patient");
    try {
      const selectedPatient = myPatients.find(p => p.id === formData.patientId);
      await addDoc(collection(db, "appointments"), {
        doctorId: currentUser.uid,
        doctorName: currentUser.displayName || "Dr. Smith",
        patientId: formData.patientId, 
        patientName: selectedPatient?.name || "Unknown",
        date: formData.date,
        time: formData.time,
        type: formData.type,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({ patientId: '', date: '', time: '', type: 'Check-up', notes: '' });
      fetchData(); 
      alert("Appointment scheduled!");
    } catch (error) {
      console.error(error);
      alert("Failed to schedule.");
    }
  };

  // --- NEW: Handle Reschedule Logic ---
  const handleRescheduleResponse = async (appt, isAccepted) => {
    try {
        if (isAccepted) {
            // Parse the requested "Tomorrow at 2pm" is hard for code, 
            // so normally you'd ask the doctor to pick the specific date in a picker.
            // For now, we will just alert the doctor to manually edit it, 
            // OR if you stored a real date string, we update it.
            
            // Assuming the patient just sent text, we let the doctor edit it manually.
            const confirmMsg = `Patient requested: "${appt.requestedNewDate}".\n\nClick OK to confirm you have updated your schedule manually.`;
            if(!window.confirm(confirmMsg)) return;

            await updateDoc(doc(db, "appointments", appt.id), {
                rescheduleRequested: false, // Clear flag
                notes: `Rescheduled to: ${appt.requestedNewDate}` // Save history
            });
        } else {
            // Decline
            await updateDoc(doc(db, "appointments", appt.id), {
                rescheduleRequested: false, // Clear flag
                // status: 'cancelled' // Optional: cancel if they can't make it
            });
            alert("Request declined. Appointment kept at original time.");
        }
        fetchData();
    } catch (err) {
        console.error(err);
        alert("Error updating appointment.");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Cancel this appointment?")) {
        await deleteDoc(doc(db, "appointments", id));
        fetchData();
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading schedule...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Calendar className="text-blue-600"/> Schedule
           </h2>
           <p className="text-gray-500 text-sm">Manage upcoming patient visits</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md">
          <Plus size={20}/> New Appointment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {appointments.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
                <Calendar size={48} className="mx-auto mb-4 opacity-20"/>
                <p>No appointments scheduled.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Time</th>
                            <th className="p-4">Patient</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {appointments.map((appt) => (
                            <tr key={appt.id} className={`transition-colors ${appt.rescheduleRequested ? 'bg-orange-50' : 'hover:bg-blue-50/50'}`}>
                                <td className="p-4">
                                    <div className="font-bold text-gray-800">{appt.time}</div>
                                    <div className="text-xs text-gray-500">{new Date(appt.date).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4 font-medium text-gray-700">
                                    {appt.patientName}
                                    {appt.notes && <div className="text-xs text-gray-400 mt-1 italic">{appt.notes}</div>}
                                </td>
                                <td className="p-4">
                                    {appt.rescheduleRequested ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded w-fit">
                                                <AlertCircle size={12}/> Request: {appt.requestedNewDate}
                                            </span>
                                            <div className="flex gap-2 mt-1">
                                                <button onClick={() => handleRescheduleResponse(appt, true)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Accept</button>
                                                <button onClick={() => handleRescheduleResponse(appt, false)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Decline</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                                            {appt.type}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDelete(appt.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors">
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Modal code remains the same as before... */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">New Appointment</h3>
                    <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Select Patient</label>
                        <select name="patientId" value={formData.patientId} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none" required>
                            <option value="">-- Choose Patient --</option>
                            {myPatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full p-2 border rounded-lg"/>
                        <input type="time" name="time" required value={formData.time} onChange={handleInputChange} className="w-full p-2 border rounded-lg"/>
                    </div>
                    <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-2 border rounded-lg">
                        <option>Check-up</option><option>Follow-up</option><option>Consultation</option>
                    </select>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow">Confirm</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;