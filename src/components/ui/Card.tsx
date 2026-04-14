import React from 'react';
import { cn } from './Button';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-2xl border border-gray-100 bg-white text-gray-950 shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';
