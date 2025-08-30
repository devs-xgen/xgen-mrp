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
  materials: {
    searchKey: "name",
    searchPlaceholder: "Filter materials...",
    emptyMessage: "No materials found.",
    enableSelection: true,
    enableFiltering: true,
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
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short", 
    day: "numeric",
  }).format(new Date(date));
}

// Helper function to format date and time
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
