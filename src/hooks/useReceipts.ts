import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { ReceiptWithWarranties, Receipt, WarrantyItem } from '../types/database';

export const useReceipts = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptWithWarranties[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    const receiptsRef = collection(db, 'users', user.uid, 'receipts');
    const qReceipts = query(receiptsRef, orderBy('purchaseDate', 'desc'));
    
    const warrantiesRef = collection(db, 'users', user.uid, 'warranty_items');

    let currentReceipts: Receipt[] = [];
    let currentWarranties: WarrantyItem[] = [];

    const updateCombinedState = () => {
      const combined = currentReceipts.map(receipt => ({
        ...receipt,
        warranty_items: currentWarranties.filter(w => w.receiptId === receipt.id)
      }));
      setReceipts(combined);
      setLoading(false);
    };

    const unsubReceipts = onSnapshot(qReceipts, (snapshot) => {
      currentReceipts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Receipt));
      updateCombinedState();
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    const unsubWarranties = onSnapshot(warrantiesRef, (snapshot) => {
      currentWarranties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarrantyItem));
      updateCombinedState();
    }, (err) => {
      console.error("Error fetching warranties:", err);
    });

    return () => {
      unsubReceipts();
      unsubWarranties();
    };
  }, [user]);

  const deleteReceipt = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'receipts', id));
      // In a real app, you'd also delete associated warranties and images
    } catch (err: any) {
      console.error('Failed to delete receipt:', err);
    }
  };

  const getExpiringItems = (days: number) => {
    const targetDate = new Date();
    targetDate.setHours(23, 59, 59, 999);
    targetDate.setDate(targetDate.getDate() + days);
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return receipts.flatMap(r => 
      (r.warranty_items || [])
        .filter(w => {
          if (!w.warrantyEnd) return false;
          const endDate = new Date(w.warrantyEnd);
          // Set to end of day for the expiry date to be inclusive
          endDate.setHours(23, 59, 59, 999);
          return endDate <= targetDate && endDate >= now;
        })
        .map(w => ({ ...w, receipt: r }))
    ).sort((a, b) => new Date(a.warrantyEnd).getTime() - new Date(b.warrantyEnd).getTime());
  };

  return { receipts, loading, error, deleteReceipt, getExpiringItems };
};
