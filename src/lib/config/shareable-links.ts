/**
 * Configuration utilities for shareable document links
 * Handles environment variables, validation, and default settings
 */

import { z } from 'zod';

// Environment variable schema for validation
const shareableLinkEnvSchema = z.object({
  // Shareable Links Configuration
  SHAREABLE_LINKS_DEFAULT_EXPIRY_DAYS: z.string().optional().default('30'),
  SHAREABLE_LINKS_MAX_PER_DOCUMENT: z.string().optional().default('5'),
  SHAREABLE_LINKS_RATE_LIMIT_PER_MINUTE: z.string().optional().default('10'),
  SHAREABLE_LINKS_TOKEN_LENGTH: z.string().optional().default('32'),
  SHAREABLE_LINKS_CLEANUP_INTERVAL_HOURS: z.string().optional().default('24'),
  
  // Company Information for Shared Documents
  COMPANY_NAME: z.string().optional().default('XGen Manufacturing'),
  COMPANY_ADDRESS: z.string().optional().default('123 Manufacturing St, Industrial City, IC 12345'),
  COMPANY_PHONE: z.string().optional().default('+1 (555) 123-4567'),
  COMPANY_EMAIL: z.string().optional().default('info@xgenmanufacturing.com'),
  COMPANY_WEBSITE: z.string().optional().default('https://xgenmanufacturing.com'),
  
  // Feature Flags
  ENABLE_SHAREABLE_LINKS: z.string().optional().default('true'),
  ENABLE_LINK_ANALYTICS: z.string().optional().default('true'),
  ENABLE_AUTO_CLEANUP: z.string().optional().default('true'),
  
  // Security Settings
  SHAREABLE_LINKS_REQUIRE_HTTPS: z.string().optional().default('false'),
  SHAREABLE_LINKS_IP_WHITELIST: z.string().optional().default(''),
});

// Parse and validate environment variables
function parseEnvVars() {
  try {
    return shareableLinkEnvSchema.parse(process.env);
  } catch (error) {
    console.error('Invalid shareable links configuration:', error);
    throw new Error('Failed to parse shareable links environment variables');
  }
}

// Company information interface
export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

// Shareable links configuration interface
export interface ShareableLinksConfig {
  // Link settings
  defaultExpiryDays: number;
  maxLinksPerDocument: number;
  tokenLength: number;
  
  // Rate limiting
  rateLimitPerMinute: number;
  
  // Cleanup settings
  cleanupIntervalHours: number;
  
  // Company information
  companyInfo: CompanyInfo;
  
  // Feature flags
  enableShareableLinks: boolean;
  enableLinkAnalytics: boolean;
  enableAutoCleanup: boolean;
  
  // Security settings
  requireHttps: boolean;
  ipWhitelist: string[];
}

// Create configuration object from environment variables
function createConfig(): ShareableLinksConfig {
  const env = parseEnvVars();
  
  return {
    // Link settings
    defaultExpiryDays: parseInt(env.SHAREABLE_LINKS_DEFAULT_EXPIRY_DAYS, 10),
    maxLinksPerDocument: parseInt(env.SHAREABLE_LINKS_MAX_PER_DOCUMENT, 10),
    tokenLength: parseInt(env.SHAREABLE_LINKS_TOKEN_LENGTH, 10),
    
    // Rate limiting
    rateLimitPerMinute: parseInt(env.SHAREABLE_LINKS_RATE_LIMIT_PER_MINUTE, 10),
    
    // Cleanup settings
    cleanupIntervalHours: parseInt(env.SHAREABLE_LINKS_CLEANUP_INTERVAL_HOURS, 10),
    
    // Company information
    companyInfo: {
      name: env.COMPANY_NAME,
      address: env.COMPANY_ADDRESS,
      phone: env.COMPANY_PHONE,
      email: env.COMPANY_EMAIL,
      website: env.COMPANY_WEBSITE,
    },
    
    // Feature flags
    enableShareableLinks: env.ENABLE_SHAREABLE_LINKS.toLowerCase() === 'true',
    enableLinkAnalytics: env.ENABLE_LINK_ANALYTICS.toLowerCase() === 'true',
    enableAutoCleanup: env.ENABLE_AUTO_CLEANUP.toLowerCase() === 'true',
    
    // Security settings
    requireHttps: env.SHAREABLE_LINKS_REQUIRE_HTTPS.toLowerCase() === 'true',
    ipWhitelist: env.SHAREABLE_LINKS_IP_WHITELIST
      ? env.SHAREABLE_LINKS_IP_WHITELIST.split(',').map(ip => ip.trim())
      : [],
  };
}

// Validation functions
export function validateConfig(config: ShareableLinksConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate numeric values
  if (config.defaultExpiryDays <= 0 || config.defaultExpiryDays > 365) {
    errors.push('Default expiry days must be between 1 and 365');
  }
  
  if (config.maxLinksPerDocument <= 0 || config.maxLinksPerDocument > 100) {
    errors.push('Max links per document must be between 1 and 100');
  }
  
  if (config.tokenLength < 16 || config.tokenLength > 64) {
    errors.push('Token length must be between 16 and 64 characters');
  }
  
  if (config.rateLimitPerMinute <= 0 || config.rateLimitPerMinute > 1000) {
    errors.push('Rate limit per minute must be between 1 and 1000');
  }
  
  if (config.cleanupIntervalHours <= 0 || config.cleanupIntervalHours > 168) {
    errors.push('Cleanup interval must be between 1 and 168 hours (1 week)');
  }
  
  // Validate company information
  if (!config.companyInfo.name.trim()) {
    errors.push('Company name is required');
  }
  
  if (!config.companyInfo.email.trim()) {
    errors.push('Company email is required');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(config.companyInfo.email)) {
    errors.push('Company email must be a valid email address');
  }
  
  // Validate website URL if provided
  if (config.companyInfo.website && config.companyInfo.website !== '#') {
    try {
      new URL(config.companyInfo.website);
    } catch {
      errors.push('Company website must be a valid URL');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Singleton configuration instance
let configInstance: ShareableLinksConfig | null = null;

// Get configuration (singleton pattern)
export function getShareableLinksConfig(): ShareableLinksConfig {
  if (!configInstance) {
    configInstance = createConfig();
    
    // Validate configuration on first load
    const validation = validateConfig(configInstance);
    if (!validation.isValid) {
      console.error('Invalid shareable links configuration:', validation.errors);
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Log configuration in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Shareable Links Configuration:', {
        defaultExpiryDays: configInstance.defaultExpiryDays,
        maxLinksPerDocument: configInstance.maxLinksPerDocument,
        rateLimitPerMinute: configInstance.rateLimitPerMinute,
        enableShareableLinks: configInstance.enableShareableLinks,
        companyName: configInstance.companyInfo.name,
      });
    }
  }
  
  return configInstance;
}

// Reset configuration (useful for testing)
export function resetConfig(): void {
  configInstance = null;
}

// Helper functions for common configuration checks
export function isShareableLinksEnabled(): boolean {
  return getShareableLinksConfig().enableShareableLinks;
}

export function isLinkAnalyticsEnabled(): boolean {
  return getShareableLinksConfig().enableLinkAnalytics;
}

export function isAutoCleanupEnabled(): boolean {
  return getShareableLinksConfig().enableAutoCleanup;
}

export function getCompanyInfo(): CompanyInfo {
  return getShareableLinksConfig().companyInfo;
}

// Export types for use in other modules
export type { ShareableLinksConfig, CompanyInfo };