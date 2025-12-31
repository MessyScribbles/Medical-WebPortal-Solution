// src/services/caseService.js
import { db } from '../firebase'; // Adjust path to your firebase config
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export const assignPatientToCase = async (patientId, doctorId, doctorName) => {
  try {
    // 1. Check if an active case already exists (Optional but recommended)
    const casesRef = collection(db, 'cases');
    const q = query(casesRef, 
      where('patientId', '==', patientId), 
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("This patient is already assigned to an active case.");
    }

    // 2. Create the new Case Document
    const newCase = {
      patientId: patientId,
      doctorId: doctorId,
      doctorName: doctorName, // Useful to show "Chatting with Dr. X"
      status: 'active',
      createdAt: serverTimestamp(),
      lastMessage: null,
      participants: [patientId, doctorId] // Critical for security rules
    };

    const docRef = await addDoc(casesRef, newCase);
    return docRef.id; // Return the new Case ID so you can redirect to chat

  } catch (error) {
    console.error("Error assigning case:", error);
    throw error;
  }
};