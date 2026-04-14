import { useMemo } from 'react';
import { useReceipts } from './useReceipts';
import { CATEGORIES } from '../constants/categories';

export type TimeFilter = 'month' | '3months' | 'year' | 'all';

export const useInsights = (timeFilter: TimeFilter = 'year') => {
  const { receipts, loading } = useReceipts();

  const filteredReceipts = useMemo(() => {
    const now = new Date();
    return receipts.filter(r => {
      const date = new Date(r.purchaseDate);
      if (timeFilter === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (timeFilter === '3months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return date >= threeMonthsAgo;
      }
      if (timeFilter === 'year') {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [receipts, timeFilter]);

  const monthlyTotals = useMemo(() => {
    const totals: Record<string, any> = {};
    const now = new Date();
    
    const monthsToShow = timeFilter === 'month' ? 1 : timeFilter === '3months' ? 3 : timeFilter === 'year' ? 12 : 6;
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      totals[monthStr] = { month: monthStr };
      CATEGORIES.forEach(c => totals[monthStr][c.id] = 0);
    }

    filteredReceipts.forEach(r => {
      const date = new Date(r.purchaseDate);
      const monthStr = date.toLocaleString('default', { month: 'short' });
      if (totals[monthStr]) {
        totals[monthStr][r.category] = (totals[monthStr][r.category] || 0) + Number(r.totalAmount);
      }
    });

    return Object.values(totals);
  }, [filteredReceipts, timeFilter]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    let total = 0;

    filteredReceipts.forEach(r => {
      breakdown[r.category] = (breakdown[r.category] || 0) + Number(r.totalAmount);
      total += Number(r.totalAmount);
    });

    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredReceipts]);

  const totalSpent = useMemo(() => {
    return filteredReceipts.reduce((sum, r) => sum + Number(r.totalAmount), 0);
  }, [filteredReceipts]);

  const topMerchants = useMemo(() => {
    const merchants: Record<string, number> = {};
    filteredReceipts.forEach(r => {
      merchants[r.merchantName] = (merchants[r.merchantName] || 0) + Number(r.totalAmount);
    });
    return Object.entries(merchants)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredReceipts]);

  return { monthlyTotals, categoryBreakdown, totalSpent, topMerchants, loading, filteredReceipts };
};
