import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptWithWarranties, getDaysUntilExpiry } from '../../types/database';
import { CATEGORIES } from '../../constants/categories';
import { Card } from '../ui/Card';
import { ChevronRight } from 'lucide-react';

interface ReceiptCardProps {
  receipt: ReceiptWithWarranties;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt }) => {
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === receipt.category) || CATEGORIES[CATEGORIES.length - 1];
  
  // Find the closest warranty expiry
  let closestExpiry: number | null = null;
  if (receipt.warranty_items && receipt.warranty_items.length > 0) {
    const expiries = receipt.warranty_items.map(w => getDaysUntilExpiry(w.warrantyEnd));
    closestExpiry = Math.min(...expiries);
  }

  const getExpiryColor = (days: number | null) => {
    if (days === null) return 'text-gray-400';
    if (days < 0) return 'text-gray-400';
    if (days <= 7) return 'text-red-500';
    if (days <= 30) return 'text-orange-500';
    return 'text-green-500';
  };

  const getExpiryText = (days: number | null) => {
    if (days === null) return 'No warranty';
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    return `${days}d left`;
  };

  return (
    <Card 
      className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors active:scale-[0.98]"
      onClick={() => navigate(`/receipt/${receipt.id}`)}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${category.color} text-white shrink-0`}>
        {category.icon}
      </div>
      
      <div className="ml-4 flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{receipt.merchantName}</h3>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <span>{new Date(receipt.purchaseDate).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span className="font-medium text-gray-700">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: receipt.currency || 'USD' }).format(receipt.totalAmount)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end ml-4 shrink-0">
        <span className={`text-sm font-medium ${getExpiryColor(closestExpiry)}`}>
          {getExpiryText(closestExpiry)}
        </span>
        <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
      </div>
    </Card>
  );
};
