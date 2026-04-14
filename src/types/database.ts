export type PlanType = 'free' | 'pro' | 'family';
export type CategoryType = 'Electronics' | 'Appliances' | 'Clothing' | 'Food' | 'Health' | 'Home' | 'Other';
export type WarrantySourceType = 'inferred' | 'manual' | 'card_scan';

export interface User {
  id: string;
  email: string;
  plan: PlanType;
  pushToken?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  userId: string;
  merchantName: string;
  purchaseDate: string; // YYYY-MM-DD
  totalAmount: number;
  currency: string;
  category: CategoryType;
  imageUrl?: string;
  rawOcrText?: string;
  returnDeadline?: string | null; // YYYY-MM-DD
  createdAt: string;
}

export interface WarrantyItem {
  id: string;
  receiptId: string;
  userId: string;
  productName: string;
  warrantyStart: string; // YYYY-MM-DD
  warrantyEnd: string; // YYYY-MM-DD
  warrantySource: WarrantySourceType;
  notes?: string | null;
  notified30d?: boolean;
  notified7d?: boolean;
  notified1d?: boolean;
}

export type ReceiptWithWarranties = Receipt & { warranty_items: WarrantyItem[] };

/**
 * Calculates days until expiry
 */
export const getDaysUntilExpiry = (endDateStr: string): number => {
  const end = new Date(endDateStr);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
