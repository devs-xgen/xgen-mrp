/**
 * Configuration constants for shareable document links
 * Provides easy access to configuration values throughout the application
 */

import { getShareableLinksConfig } from './shareable-links';

// Lazy-loaded configuration constants
export const SHAREABLE_LINKS_CONFIG = {
  get DEFAULT_EXPIRY_DAYS() {
    return getShareableLinksConfig().defaultExpiryDays;
  },
  
  get MAX_LINKS_PER_DOCUMENT() {
    return getShareableLinksConfig().maxLinksPerDocument;
  },
  
  get TOKEN_LENGTH() {
    return getShareableLinksConfig().tokenLength;
  },
  
  get RATE_LIMIT_PER_MINUTE() {
    return getShareableLinksConfig().rateLimitPerMinute;
  },
  
  get CLEANUP_INTERVAL_HOURS() {
    return getShareableLinksConfig().cleanupIntervalHours;
  },
  
  get COMPANY_INFO() {
    return getShareableLinksConfig().companyInfo;
  },
  
  get FEATURE_FLAGS() {
    const config = getShareableLinksConfig();
    return {
      enableShareableLinks: config.enableShareableLinks,
      enableLinkAnalytics: config.enableLinkAnalytics,
      enableAutoCleanup: config.enableAutoCleanup,
    };
  },
  
  get SECURITY_SETTINGS() {
    const config = getShareableLinksConfig();
    return {
      requireHttps: config.requireHttps,
      ipWhitelist: config.ipWhitelist,
    };
  },
};

// Document type constants
export const DOCUMENT_TYPES = {
  BILLING_STATEMENT: 'BILLING_STATEMENT',
  SALES_INVOICE: 'SALES_INVOICE',
  DELIVERY_RECEIPT: 'DELIVERY_RECEIPT',
} as const;

// URL path constants
export const SHARE_PATHS = {
  BILLING_STATEMENT: '/billing-statement/share',
  SALES_INVOICE: '/sales-invoice/share',
  DELIVERY_RECEIPT: '/delivery-receipt/share',
} as const;

// API endpoint constants
export const API_ENDPOINTS = {
  SHARE_LINKS: '/api/share-links',
  SHARED_DOCUMENTS: '/api/shared-documents',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  LINK_NOT_FOUND: 'The requested document link was not found.',
  LINK_EXPIRED: 'This document link has expired.',
  LINK_REVOKED: 'This document link has been revoked.',
  DOCUMENT_NOT_FOUND: 'The requested document could not be found.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  FEATURE_DISABLED: 'Shareable links feature is currently disabled.',
  INVALID_TOKEN: 'Invalid or malformed document link.',
  SERVER_ERROR: 'An error occurred while processing your request.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LINK_GENERATED: 'Shareable link generated successfully.',
  LINK_COPIED: 'Link copied to clipboard.',
  LINK_REVOKED: 'Link has been revoked successfully.',
} as const;

// Rate limiting constants
export const RATE_LIMIT = {
  get WINDOW_MS() {
    return 60 * 1000; // 1 minute in milliseconds
  },
  
  get MAX_REQUESTS() {
    return SHAREABLE_LINKS_CONFIG.RATE_LIMIT_PER_MINUTE;
  },
  
  SKIP_SUCCESSFUL_REQUESTS: false,
  SKIP_FAILED_REQUESTS: false,
} as const;

// Token generation constants
export const TOKEN_CONFIG = {
  get LENGTH() {
    return SHAREABLE_LINKS_CONFIG.TOKEN_LENGTH;
  },
  
  ENCODING: 'base64url' as const,
  ALGORITHM: 'sha256' as const,
} as const;

// Cleanup constants
export const CLEANUP_CONFIG = {
  get INTERVAL_MS() {
    return SHAREABLE_LINKS_CONFIG.CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000;
  },
  
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
} as const;

// Export types for TypeScript
export type DocumentType = keyof typeof DOCUMENT_TYPES;
export type SharePath = typeof SHARE_PATHS[keyof typeof SHARE_PATHS];
export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];