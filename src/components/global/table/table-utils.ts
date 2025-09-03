// src/components/global/table/table-utils.ts
import { FilterOption, TableConfig } from "./types";

// Common filter options for different data types
export const statusFilterOptions: FilterOption["options"] = [
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
  },
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];

export const priorityFilterOptions: FilterOption["options"] = [
  {
    value: "LOW",
    label: "Low",
  },
  {
    value: "MEDIUM",
    label: "Medium",
  },
  {
    value: "HIGH",
    label: "High",
  },
  {
    value: "URGENT",
    label: "Urgent",
  },
  {
    value: "CRITICAL",
    label: "Critical",
  },
];

// Predefined table configurations for common page types
export const tableConfigs = {
  "billing-statements": {
    searchKey: "statementNumber",
    searchPlaceholder: "Filter billing statements...",
    emptyMessage: "No billing statements found.",
    enableSelection: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filterOptions: [
      {
        column: "status",
        title: "Status",
        options: statusFilterOptions,
      },
    ],
  },

  "sales-invoices": {
    searchKey: "invoiceNumber",
    searchPlaceholder: "Filter sales invoices...",
    emptyMessage: "No sales invoices found.",
    enableSelection: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filterOptions: [
      {
        column: "status",
        title: "Status",
        options: statusFilterOptions,
      },
    ],
  },
  materials: {
    searchKey: "name",
    searchPlaceholder: "Filter materials...",
    emptyMessage: "No materials found.",
    enableSelection: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filterOptions: [
      {
        column: "status",
        title: "Status",
        options: statusFilterOptions,
      },
    ],
  },

  products: {
    searchKey: "name",
    searchPlaceholder: "Filter products...",
    emptyMessage: "No products found.",
    enableSelection: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filterOptions: [
      {
        column: "status",
        title: "Status",
        options: statusFilterOptions,
      },
    ],
  },

  production: {
    searchKey: "productName",
    searchPlaceholder: "Filter production orders...",
    emptyMessage: "No production orders found.",
    enableSelection: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filterOptions: [
      {
        column: "status",
        title: "Status",
        options: statusFilterOptions,
      },
      {
        column: "priority",
        title: "Priority",
        options: priorityFilterOptions,
      },
    ],
  },

  customers: {
    searchKey: "name",
    searchPlaceholder: "Filter customers...",
    emptyMessage: "No customers found.",
    enableSelection: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filterOptions: [
      {
        column: "status",
        title: "Status",
        options: statusFilterOptions,
      },
    ],
  },

  suppliers: {
    searchKey: "name",
    searchPlaceholder: "Filter suppliers...",
    emptyMessage: "No suppliers found.",
    enableSelection: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filterOptions: [
      {
        column: "status",
        title: "Status",
        options: statusFilterOptions,
      },
    ],
  },

  users: {
    searchKey: "email",
    searchPlaceholder: "Filter users...",
    emptyMessage: "No users found.",
    enableSelection: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filterOptions: [
      {
        column: "role",
        title: "Role",
        options: [
          { value: "ADMIN", label: "Admin" },
          { value: "WORKER", label: "Worker" },
          { value: "INSPECTOR", label: "Inspector" },
          { value: "DELIVERY", label: "Delivery" },
          { value: "DEVELOPER", label: "Developer" },
        ],
      },
      {
        column: "status",
        title: "Status",
        options: [
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
          { value: "SUSPENDED", label: "Suspended" },
        ],
      },
    ],
  },

  "delivery-receipts": {
    searchKey: "receiptNumber",
    searchPlaceholder: "Filter delivery receipts...",
    emptyMessage: "No delivery receipts found.",
    enableSelection: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filterOptions: [
      {
        column: "deliveryStatus",
        title: "Status",
        options: [
          { value: "PENDING", label: "Pending" },
          { value: "IN_TRANSIT", label: "In Transit" },
          { value: "DELIVERED", label: "Delivered" },
          { value: "FAILED", label: "Failed" },
          { value: "RETURNED", label: "Returned" },
        ],
      },
    ],
  },

  "customer-orders-v2": {
    searchKey: "orderNumber",
    searchPlaceholder: "Filter customer orders...",
    emptyMessage: "No customer orders found.",
    enableSelection: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filterOptions: [
      {
        column: "status",
        title: "Status",
        options: statusFilterOptions,
      },
    ],
  },
} as const;

// Helper function to get table config
export function getTableConfig<T extends keyof typeof tableConfigs>(
  type: T
): TableConfig<any> {
  return tableConfigs[type];
}

// Helper function to format currency
export function formatCurrency(amount: number, currency = "PHP"): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
  }).format(amount);
}

// Helper function to format date
// Internal safe date parsing utility to prevent "Invalid time value" errors
function toSafeDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "number") {
    if (!isFinite(value)) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatDate(date: Date | string | number | null | undefined, fallback: string = "—"): string {
  const d = toSafeDate(date as unknown);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

// Helper function to format date and time
export function formatDateTime(
  date: Date | string | number | null | undefined,
  fallback: string = "—"
): string {
  const d = toSafeDate(date as unknown);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
