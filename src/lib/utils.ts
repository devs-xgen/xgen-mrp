import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "";

  // Handle Date objects
  if (date instanceof Date) {
    return isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  }

  // Handle string dates
  if (typeof date === "string") {
    const trimmed = date.trim();
    if (!trimmed) return "";
    const d = new Date(trimmed);
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  }

  return "";
}

// src/lib/utils.ts
export const PESO_SYMBOL = "₱";

// You could also create a formatter function
export function formatPeso(amount: number): string {
  return `${PESO_SYMBOL}${amount.toFixed(2)}`;
}

// Or a more flexible currency formatter
export function formatCurrency(amount: number, currency = "PHP"): string {
  const formatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
  });

  return formatter.format(amount);
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Check if it's a 10-digit US number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // International format support
  if (cleaned.length > 10) {
    // Check for US/Canada number with country code
    if (cleaned.startsWith("1") && cleaned.length === 11) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    // Generic international format
    return `+${cleaned.slice(0, cleaned.length - 10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
  }

  // For shorter numbers or other formats, return as is
  return phoneNumber;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
