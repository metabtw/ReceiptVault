/**
 * Helper file for Expo Push Notifications.
 * Adapted for web environment (mocked).
 */

import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const registerForPushNotifications = async (userId: string) => {
  console.log('Push notifications are simulated in this web environment.');
  const mockToken = `ExponentPushToken[mock-${userId}]`;
  
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { pushToken: mockToken });
  } catch (error) {
    console.error('Failed to save push token:', error);
  }
};

export const scheduleLocalNotification = async (title: string, body: string, trigger: any) => {
  console.log(`[Local Notification Scheduled] ${title}: ${body}`);
};
