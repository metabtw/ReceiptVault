import { CategoryType } from '../types/database';

export const CATEGORIES: { id: CategoryType; label: string; icon: string; color: string }[] = [
  { id: 'Electronics', label: 'Electronics', icon: '💻', color: 'bg-blue-500' },
  { id: 'Appliances', label: 'Appliances', icon: '🧊', color: 'bg-indigo-500' },
  { id: 'Clothing', label: 'Clothing', icon: '👕', color: 'bg-pink-500' },
  { id: 'Food', label: 'Food', icon: '🍔', color: 'bg-orange-500' },
  { id: 'Health', label: 'Health', icon: '💊', color: 'bg-red-500' },
  { id: 'Home', label: 'Home', icon: '🏠', color: 'bg-green-500' },
  { id: 'Other', label: 'Other', icon: '📦', color: 'bg-gray-500' },
];

export const DEFAULT_WARRANTY_MONTHS: Record<CategoryType, number> = {
  Electronics: 12,
  Appliances: 24,
  Clothing: 1, // 30 days
  Food: 0,
  Health: 0,
  Home: 12,
  Other: 0,
};

export const RETURN_WINDOWS: Record<string, number> = {
  'Amazon': 30,
  'Walmart': 90,
  'Apple': 14,
  'Target': 90,
  'Best Buy': 15,
  'Default': 30,
};

/**
 * Guesses category from merchant name
 */
export const getCategoryFromMerchant = (merchantName: string): CategoryType => {
  const lower = merchantName.toLowerCase();
  if (lower.includes('best buy') || lower.includes('apple')) return 'Electronics';
  if (lower.includes('home depot') || lower.includes('ikea')) return 'Home';
  if (lower.includes('walmart') || lower.includes('target')) return 'Other';
  if (lower.includes('mcdonald') || lower.includes('starbucks')) return 'Food';
  if (lower.includes('zara') || lower.includes('h&m')) return 'Clothing';
  return 'Other';
};

/**
 * Gets default warranty for a category
 */
export const getDefaultWarranty = (category: CategoryType, productName: string): { months: number; confidence: 'high' | 'medium' | 'low' } => {
  const months = DEFAULT_WARRANTY_MONTHS[category];
  return {
    months,
    confidence: months > 0 ? 'medium' : 'low',
  };
};
