export const formatCurrency = (amount: number, currencyCode: string | undefined | null): string => {
  let code = (currencyCode || 'USD').toUpperCase().trim();
  
  // Common fixes for invalid ISO codes
  if (code === 'TL') code = 'TRY';
  if (code === 'UK') code = 'GBP';
  
  try {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: code 
    }).format(amount);
  } catch (e) {
    // Fallback if the currency code is completely invalid (prevents app crash)
    return `${Number(amount).toFixed(2)} ${code}`;
  }
};
