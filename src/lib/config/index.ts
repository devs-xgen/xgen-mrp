/**
 * Configuration module exports
 * Centralized exports for all configuration utilities
 */

// Main configuration
export {
  getShareableLinksConfig,
  validateConfig,
  resetConfig,
  isShareableLinksEnabled,
  isLinkAnalyticsEnabled,
  isAutoCleanupEnabled,
  getCompanyInfo,
  type ShareableLinksConfig,
  type CompanyInfo,
} from './shareable-links';

// Configuration validation
export {
  validateApplicationConfig,
  logConfigValidation,
  validateConfigOrThrow,
  type ConfigValidationResult,
} from './validate-config';

// Constants and helpers
export {
  SHAREABLE_LINKS_CONFIG,
  DOCUMENT_TYPES,
  SHARE_PATHS,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  RATE_LIMIT,
  TOKEN_CONFIG,
  CLEANUP_CONFIG,
  type DocumentType,
  type SharePath,
  type ApiEndpoint,
} from './constants';