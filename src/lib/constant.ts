// src/lib/constant.ts
export const CURRENCY_SYMBOLS = {
    PESO: '₱',
    DOLLAR: '$',
    EURO: '€',
  };
  
  // You could also add formatting options
  export const CURRENCY_FORMATS = {
    PHP: { 
      symbol: '₱', 
      locale: 'en-PH',
      currency: 'PHP'
    }
  };

export function formatCurrencyPHP(value: number) {
  return value.toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}