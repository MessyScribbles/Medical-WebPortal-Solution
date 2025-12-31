import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { FaClipboardCheck, FaUser, FaCalendarAlt } from 'react-icons/fa';

const DoctorSurveyAnswers = () => {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Matches questions in PatientSurveys
  const questionMap = {
    'q1': "Recovery Rating (1-10)",
    'q2': "Experiencing Pain?",
    'q3': "Resumed Activities?",
    'q4': "Symptoms/Notes"
  };

  useEffect(() => {
    const fetchAnswers = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch cases where this doctor is involved AND survey is replied
        const q = query(
          collection(db, "cases"),
          where("participants", "array-contains", user.uid),
          where("surveyReplied", "==", true)
          // Note: ordering by a field requires an index with the array-contains filter
        );
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Manual sort by date
        data.sort((a, b) => (b.surveyRepliedAt?.seconds || 0) - (a.surveyRepliedAt?.seconds || 0));
        
        setAnswers(data);
      } catch (error) {
        console.error("Error fetching answers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnswers();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading answers...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <FaClipboardCheck className="text-green-600"/> Survey Responses
      </h1>

      {answers.length === 0 ? (
        <p className="text-gray-500">No survey responses received yet.</p>
      ) : (
        <div className="grid gap-6">
          {answers.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FaUser className="text-blue-500"/> {item.patientName}
                  </h3>
                  <p className="text-sm text-gray-500">Case ID: {item.id.slice(0,6)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 flex items-center gap-1 justify-end">
                    <FaCalendarAlt size={14}/> 
                    {item.surveyRepliedAt?.toDate().toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.surveyRepliedAt?.toDate().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.surveyData && Object.entries(item.surveyData).map(([qid, val]) => (
                  <div key={qid} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                      {questionMap[qid] || qid}
                    </p>
                    <p className="text-gray-800 font-medium">
                      {val.toString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorSurveyAnswers;