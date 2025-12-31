import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  FaClipboardList, FaCheckCircle, FaSpinner, FaPaperPlane 
} from 'react-icons/fa';

const PatientSurveys = () => {
  const [loading, setLoading] = useState(true);
  const [pendingCases, setPendingCases] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // General Recovery Questions
  const questions = [
    { id: 'q1', text: "How would you rate your overall recovery today?", type: 'rating', max: 10 },
    { id: 'q2', text: "Are you experiencing any pain?", type: 'yesno' },
    { id: 'q3', text: "Have you resumed your normal daily activities?", type: 'yesno' },
    { id: 'q4', text: "Describe any new symptoms or concerns:", type: 'text' }
  ];

  useEffect(() => {
    const fetchSurveys = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Find cases where survey is sent but NOT replied
        const q = query(
          collection(db, "cases"), 
          where("patientId", "==", user.uid),
          where("surveySent", "==", true),
          where("surveyReplied", "==", false)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPendingCases(data);
      } catch (error) {
        console.error("Error fetching surveys:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  const handleInputChange = (caseId, questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        [questionId]: value
      }
    }));
  };

  const handleSubmit = async (caseId) => {
    setSubmitting(true);
    try {
      const caseAnswers = answers[caseId] || {};
      
      // Save to Firestore
      await updateDoc(doc(db, "cases", caseId), {
        surveyReplied: true,
        surveyRepliedAt: serverTimestamp(),
        surveyData: caseAnswers // Storing the full answer object
      });

      // Remove from local list
      setPendingCases(prev => prev.filter(c => c.id !== caseId));
      alert("Survey submitted successfully!");

    } catch (error) {
      console.error(error);
      alert("Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><FaSpinner className="animate-spin inline"/> Loading Surveys...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <FaClipboardList className="text-blue-600"/> Health Surveys
      </h1>
      
      {pendingCases.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center">
          <FaCheckCircle className="text-5xl text-green-100 mx-auto mb-4"/>
          <h2 className="text-xl font-bold text-gray-700">All Caught Up!</h2>
          <p className="text-gray-500 mt-2">You have no pending surveys at the moment.</p>
        </div>
      ) : (
        pendingCases.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
            <div className="bg-blue-600 px-6 py-4 text-white">
              <h2 className="font-bold text-lg">Post-Recovery Checkup</h2>
              <p className="text-blue-100 text-sm">Case: {c.title || "General Consultation"} (Dr. {c.doctorName})</p>
            </div>
            
            <div className="p-6 space-y-6">
              {questions.map(q => (
                <div key={q.id}>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{q.text}</label>
                  
                  {q.type === 'rating' && (
                    <div className="flex gap-2">
                      {[...Array(q.max)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handleInputChange(c.id, q.id, i + 1)}
                          className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                            answers[c.id]?.[q.id] === i + 1 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === 'yesno' && (
                    <div className="flex gap-4">
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name={`${c.id}-${q.id}`}
                            value={opt}
                            onChange={(e) => handleInputChange(c.id, q.id, e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <textarea 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      rows="3"
                      placeholder="Type here..."
                      onChange={(e) => handleInputChange(c.id, q.id, e.target.value)}
                    />
                  )}
                </div>
              ))}

              <button 
                onClick={() => handleSubmit(c.id)}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors flex justify-center items-center gap-2"
              >
                {submitting ? <FaSpinner className="animate-spin"/> : <><FaPaperPlane /> Submit Survey</>}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PatientSurveys;
