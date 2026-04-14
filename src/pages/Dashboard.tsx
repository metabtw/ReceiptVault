import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useReceipts } from '../hooks/useReceipts';
import { ReceiptCard } from '../components/receipt/ReceiptCard';
import { Card } from '../components/ui/Card';
import { Plus, LogOut, User } from 'lucide-react';
import { CATEGORIES } from '../constants/categories';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { receipts, loading, getExpiringItems } = useReceipts();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [warrantyFilter, setWarrantyFilter] = useState<'all' | 'active' | 'expired'>('all');

  const expiringItems = getExpiringItems(7);
  
  const filteredReceipts = receipts.filter(r => {
    // Category filter
    if (activeCategory !== 'All' && r.category !== activeCategory) return false;
    
    // Warranty filter
    if (warrantyFilter !== 'all') {
      const hasWarranty = r.warranty_items && r.warranty_items.length > 0;
      if (!hasWarranty) return warrantyFilter === 'expired'; // If no warranty, consider it expired for filtering purposes, or maybe just hide it. Let's hide it.
      
      const w = r.warranty_items[0];
      const isExpired = new Date(w.warrantyEnd) < new Date();
      
      if (warrantyFilter === 'active' && isExpired) return false;
      if (warrantyFilter === 'expired' && !isExpired) return false;
    }
    
    return true;
  });

  // Multi-currency support for this month's spending
  const currentMonthReceipts = receipts.filter(r => {
    const d = new Date(r.purchaseDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  const totalsByCurrency = currentMonthReceipts.reduce((acc, r) => {
    const curr = r.currency || 'USD';
    acc[curr] = (acc[curr] || 0) + Number(r.totalAmount);
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">ReceiptVault</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/insights')} className="text-gray-500 hover:text-gray-900">
              📊
            </button>
            <button onClick={() => navigate('/profile')} className="text-gray-500 hover:text-gray-900">
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Summary Cards */}
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
          <Card className="p-4 min-w-[140px] snap-start shrink-0 bg-blue-50 border-blue-100">
            <div className="text-sm text-blue-600 font-medium">Total Receipts</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{receipts.length}</div>
          </Card>
          <Card className="p-4 min-w-[140px] snap-start shrink-0 bg-green-50 border-green-100">
            <div className="text-sm text-green-600 font-medium">Spent this Month</div>
            <div className="text-xl font-bold text-green-900 mt-1 flex flex-col">
              {Object.keys(totalsByCurrency).length === 0 ? (
                <span>$0.00</span>
              ) : (
                Object.entries(totalsByCurrency).map(([curr, amount]) => (
                  <span key={curr}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(amount)}
                  </span>
                ))
              )}
            </div>
          </Card>
          <Card className="p-4 min-w-[140px] snap-start shrink-0 bg-orange-50 border-orange-100">
            <div className="text-sm text-orange-600 font-medium">Expiring Soon</div>
            <div className="text-2xl font-bold text-orange-900 mt-1">{expiringItems.length}</div>
          </Card>
        </div>

        {/* Expiring Soon Section */}
        {expiringItems.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Expiring within 7 days
            </h2>
            <div className="space-y-3">
              {expiringItems.slice(0, 3).map(item => (
                <ReceiptCard key={item.id} receipt={item.receipt} />
              ))}
            </div>
          </section>
        )}

        {/* All Receipts Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Receipts</h2>
            
            {/* Warranty Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['all', 'active', 'expired'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setWarrantyFilter(filter)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                    warrantyFilter === filter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'All' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Receipt List */}
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900">No receipts found</h3>
              <p className="text-gray-500 mt-1">Try changing your filters or add a new receipt.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReceipts.map(receipt => (
                <ReceiptCard key={receipt.id} receipt={receipt} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate('/scan')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-transform active:scale-95 z-50"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
