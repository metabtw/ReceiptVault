/**
 * Helper file for RevenueCat Purchases.
 * Adapted for web environment (mocked).
 */

import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { PlanType, User } from '../types/database';

export enum PremiumFeature {
  UNLIMITED_RECEIPTS,
  ALL_WARRANTY_ALERTS,
  SPEND_INSIGHTS,
  CSV_EXPORT,
  FAMILY_SHARING,
}

export const configurePurchases = (apiKey: string) => {
  console.log('RevenueCat configured with key:', apiKey);
};

export const getCurrentPlan = async (userId: string): Promise<PlanType> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data() as User;
    return userData.plan || 'free';
  }
  return 'free';
};

export const purchasePackage = async (userId: string, packageId: string): Promise<boolean> => {
  console.log(`Simulating purchase of ${packageId}...`);
  let newPlan: PlanType = 'free';
  if (packageId.includes('pro')) newPlan = 'pro';
  if (packageId.includes('family')) newPlan = 'family';

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { plan: newPlan });
    return true;
  } catch (error) {
    console.error('Failed to update plan:', error);
    return false;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  console.log('Simulating restore purchases...');
  return true;
};

export const isPremiumFeature = (feature: PremiumFeature, plan: PlanType): boolean => {
  if (plan === 'pro' || plan === 'family') return true;
  return false;
};
