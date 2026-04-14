import React from 'react';
import { getDaysUntilExpiry } from '../../types/database';

interface ExpiryCountdownProps {
  warrantyEnd: string;
}

export const ExpiryCountdown: React.FC<ExpiryCountdownProps> = ({ warrantyEnd }) => {
  const days = getDaysUntilExpiry(warrantyEnd);
  
  let colorClass = 'text-green-500';
  let bgClass = 'bg-green-50';
  let label = 'Days Left';

  if (days < 0) {
    colorClass = 'text-gray-500';
    bgClass = 'bg-gray-50';
    label = 'Expired';
  } else if (days <= 7) {
    colorClass = 'text-red-500';
    bgClass = 'bg-red-50';
  } else if (days <= 30) {
    colorClass = 'text-orange-500';
    bgClass = 'bg-orange-50';
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl ${bgClass}`}>
      <span className={`text-5xl font-bold tracking-tight ${colorClass}`}>
        {Math.abs(days)}
      </span>
      <span className={`text-sm font-medium mt-2 ${colorClass} opacity-80 uppercase tracking-wider`}>
        {label}
      </span>
    </div>
  );
};
