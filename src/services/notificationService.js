import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Sends a notification to a specific user.
 * @param {string} recipientId - The UID of the user receiving the notification (Patient).
 * @param {string} type - 'message' | 'appointment' | 'system'
 * @param {string} title - Short title (e.g., "New Message").
 * @param {string} message - The main content.
 * @param {string} link - (Optional) Where the user goes when they click it (e.g., "/patient/chat").
 */
export const sendNotification = async (recipientId, type, title, message, link = null) => {
  try {
    const notifRef = collection(db, 'notifications');
    
    await addDoc(notifRef, {
      recipientId,
      type,         // helps display different icons (envelope vs calendar)
      title,
      message,
      link,         // Route to redirect to
      isRead: false,
      createdAt: serverTimestamp()
    });
    console.log("Notification sent!");
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};