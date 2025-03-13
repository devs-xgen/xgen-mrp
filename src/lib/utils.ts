import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}



// src/lib/utils.ts
export const PESO_SYMBOL = '₱';

// You could also create a formatter function
export function formatPeso(amount: number): string {
  return `${PESO_SYMBOL}${amount.toFixed(2)}`;
}

// Or a more flexible currency formatter
export function formatCurrency(amount: number, currency = 'PHP'): string {
  const formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
  });
  
  return formatter.format(amount);
}