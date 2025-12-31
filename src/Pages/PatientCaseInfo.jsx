import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  FaNotesMedical, FaUserMd, FaClipboardCheck, FaStar, 
  FaSpinner, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';

const PatientCaseInfo = () => {
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState(null);
  
  // Survey State
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // 1. Fetch ALL cases for this patient (Active or Solved)
        const q = query(
          collection(db, "cases"), 
          where("patientId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const casesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        if (casesList.length > 0) {
          // STRATEGY: 
          // 1. Priority: Find a case with a PENDING SURVEY
          const pendingSurveyCase = casesList.find(c => c.surveySent && !c.surveyReplied);
          
          if (pendingSurveyCase) {
            setActiveCase(pendingSurveyCase);
          } else {
            // 2. Fallback: Find the 'active' case
            const active = casesList.find(c => c.status === 'active');
            // 3. Last Resort: Show the most recently created case
            casesList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            
            setActiveCase(active || casesList[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching case:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, []);

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const caseRef = doc(db, "cases", activeCase.id);
      await updateDoc(caseRef, {
        surveyReplied: true,
        surveyRating: rating,
        surveyFeedback: feedback,
        surveyRepliedAt: serverTimestamp()
      });
      setActiveCase(prev => ({ ...prev, surveyReplied: true }));
      alert("Thank you for your feedback!");
    } catch (error) {
      console.error("Error submitting survey:", error);
      alert("Failed to submit survey.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><FaSpinner className="animate-spin inline"/> Loading Case Info...</div>;
  
  if (!activeCase) return (
    <div className="p-10 text-center bg-white rounded-xl shadow-sm border border-gray-200">
        <FaNotesMedical className="text-4xl text-gray-300 mx-auto mb-4"/>
        <h2 className="text-xl font-bold text-gray-700">No Medical Records Found</h2>
        <p className="text-gray-500">You do not currently have any case files.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-gray-800">My Medical File</h1>
         {activeCase.status === 'active' 
           ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Active Case</span>
           : <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase">Archived Case</span>
         }
      </div>

      {/* SURVEY ALERT SECTION */}
      {activeCase.surveySent && !activeCase.surveyReplied && (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl shadow-md p-6 mb-8 animate-pulse">
            <div className="flex items-start gap-4">
                <FaExclamationCircle className="text-indigo-600 text-2xl mt-1"/>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Feedback Requested</h3>
                    <p className="text-indigo-800 mb-4">
                        Dr. {activeCase.doctorName || 'your doctor'} has marked this case as complete and requested your feedback. 
                        Please fill out the survey below to help us improve.
                    </p>
                    
                    <form onSubmit={handleSurveySubmit} className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">How was your experience?</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      type="button"
                                      key={star}
                                      onClick={() => setRating(star)}
                                      className={`text-3xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                                    >
                                      <FaStar />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Comments (Optional)</label>
                            <textarea 
                              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                              rows="2"
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              placeholder="Type your feedback here..."
                            ></textarea>
                        </div>

                        <button 
                          type="submit" 
                          disabled={submitting}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-colors w-full sm:w-auto"
                        >
                          {submitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Case Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
            <div>
               <h2 className="font-bold text-lg">{activeCase.title || "Medical Consultation"}</h2>
               <p className="text-blue-100 text-sm">Case ID: #{activeCase.id.slice(0,6)}</p>
            </div>
            <FaNotesMedical size={24} className="opacity-80"/>
        </div>
        <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600"><FaUserMd size={20}/></div>
                <div>
                    <p className="text-sm font-bold text-gray-500 uppercase">Primary Doctor</p>
                    <p className="text-lg font-medium text-gray-900">Dr. {activeCase.doctorName || 'Unknown'}</p>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-bold text-gray-500 uppercase mb-2">Diagnosis / Summary</p>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed border border-gray-200">
                    {activeCase.summary || "No summary provided by the doctor."}
                </div>
            </div>
        </div>
      </div>

      {activeCase.surveyReplied && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
              <FaCheckCircle className="text-green-600 text-2xl" />
              <div>
                  <h3 className="font-bold text-green-800">Feedback Submitted</h3>
                  <p className="text-green-700 text-sm">Thank you for helping us improve our care.</p>
              </div>
          </div>
      )}
    </div>
  );
};

export default PatientCaseInfo;