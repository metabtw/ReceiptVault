import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { PlanType } from '../types/database';

export const usePremium = () => {
  const { user, appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [receiptCount, setReceiptCount] = useState(0);

  useEffect(() => {
    if (!user || !appUser) {
      setLoading(false);
      return;
    }

    const fetchCount = async () => {
      const receiptsRef = collection(db, 'users', user.uid, 'receipts');
      const snapshot = await getDocs(receiptsRef);
      setReceiptCount(snapshot.size);
      setLoading(false);
    };

    fetchCount();
  }, [user, appUser]);

  const currentPlan: PlanType = appUser?.plan || 'free';
  const isPro = currentPlan === 'pro' || currentPlan === 'family';
  const isFamily = currentPlan === 'family';

  const canAddReceipt = () => {
    if (isPro) return true;
    return receiptCount < 10;
  };

  return { currentPlan, isPro, isFamily, loading, canAddReceipt };
};
