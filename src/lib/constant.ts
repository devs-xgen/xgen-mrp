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

export function formatCurrencyPHP(value: number | undefined | null): string {
  // Handle undefined, null, or invalid values
  if (value === undefined || value === null || isNaN(value)) {
    return '₱0.00';
  }
  
  return value.toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Company information for shareable documents
export const DEFAULT_COMPANY_INFO = {
  name: "XGen Manufacturing",
  address: "123 Manufacturing St, Industrial City, IC 12345",
  phone: "+63",
  email: "info@xgenmanufacturing.com",
  website: "www.xgenmanufacturing.com"
} as const;

// Company branding information
export const COMPANY_BRANDING = {
  displayName: "XGen Manufacturing",
  shortName: "XGen",
  tagline: "Quality Manufacturing Solutions",
  industry: "Textile & Clothing Manufacturing"
} as const;