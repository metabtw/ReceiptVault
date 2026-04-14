import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInsights, TimeFilter } from '../hooks/useInsights';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORIES } from '../constants/categories';

// Map tailwind colors to hex for Recharts
const COLOR_MAP: Record<string, string> = {
  'bg-blue-500': '#3B82F6',
  'bg-indigo-500': '#6366F1',
  'bg-pink-500': '#EC4899',
  'bg-orange-500': '#F97316',
  'bg-red-500': '#EF4444',
  'bg-green-500': '#22C55E',
  'bg-gray-500': '#6B7280',
};

export default function Insights() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const { monthlyTotals, categoryBreakdown, totalSpent, topMerchants, loading, filteredReceipts } = useInsights(timeFilter);

  const handleExport = () => {
    if (filteredReceipts.length === 0) {
      alert('No data to export for the selected time period.');
      return;
    }

    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Currency'];
    const csvContent = [
      headers.join(','),
      ...filteredReceipts.map(r => 
        `"${r.purchaseDate}","${r.merchantName}","${r.category}","${r.totalAmount}","${r.currency || 'USD'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `receipts_export_${timeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-center">Loading insights...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Insights</h1>
          </div>
          <button onClick={handleExport} className="text-blue-600 font-medium text-sm flex items-center gap-1">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Time Filter */}
        <div className="flex bg-gray-200/50 p-1 rounded-xl">
          {(['month', '3months', 'year', 'all'] as TimeFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                timeFilter === filter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter.replace('months', 'm')}
            </button>
          ))}
        </div>

        {/* Total Spent */}
        <Card className="p-6 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none">
          <div className="text-blue-100 font-medium mb-1">Total Spent ({timeFilter})</div>
          <div className="text-4xl font-bold">
            ${totalSpent.toFixed(2)}
          </div>
        </Card>

        {/* Monthly Chart */}
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Spending Trend</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTotals}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                {CATEGORIES.map(cat => (
                  <Bar key={cat.id} dataKey={cat.id} stackId="a" fill={COLOR_MAP[cat.color] || '#3B82F6'} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">By Category</h2>
          <div className="space-y-4">
            {categoryBreakdown.map(item => {
              const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[CATEGORIES.length - 1];
              return (
                <div key={item.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <span>{cat.icon}</span> {cat.label}
                    </span>
                    <span className="font-semibold text-gray-900">${item.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${cat.color.replace('bg-', 'bg-')}`} 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Merchants */}
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Merchants</h2>
          <div className="space-y-3">
            {topMerchants.map((merchant, index) => (
              <div key={merchant.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{merchant.name}</span>
                </div>
                <span className="font-semibold text-gray-900">${merchant.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
