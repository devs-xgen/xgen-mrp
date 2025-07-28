/**
 * Tests for shareable links configuration utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getShareableLinksConfig,
  validateConfig,
  resetConfig,
  isShareableLinksEnabled,
  type ShareableLinksConfig,
} from '@/lib/config/shareable-links';
import { validateApplicationConfig } from '@/lib/config/validate-config';

describe('Shareable Links Configuration', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset configuration before each test
    resetConfig();
    
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
    resetConfig();
  });

  describe('getShareableLinksConfig', () => {
    it('should return default configuration when no env vars are set', () => {
      const config = getShareableLinksConfig();
      
      expect(config.defaultExpiryDays).toBe(30);
      expect(config.maxLinksPerDocument).toBe(5);
      expect(config.rateLimitPerMinute).toBe(10);
      expect(config.tokenLength).toBe(32);
      expect(config.companyInfo.name).toBe('XGen Manufacturing');
      expect(config.enableShareableLinks).toBe(true);
    });

    it('should use environment variables when provided', () => {
      process.env.SHAREABLE_LINKS_DEFAULT_EXPIRY_DAYS = '60';
      process.env.SHAREABLE_LINKS_MAX_PER_DOCUMENT = '10';
      process.env.COMPANY_NAME = 'Test Company';
      process.env.ENABLE_SHAREABLE_LINKS = 'false';
      
      const config = getShareableLinksConfig();
      
      expect(config.defaultExpiryDays).toBe(60);
      expect(config.maxLinksPerDocument).toBe(10);
      expect(config.companyInfo.name).toBe('Test Company');
      expect(config.enableShareableLinks).toBe(false);
    });

    it('should parse IP whitelist correctly', () => {
      process.env.SHAREABLE_LINKS_IP_WHITELIST = '192.168.1.1, 10.0.0.1, 127.0.0.1';
      
      const config = getShareableLinksConfig();
      
      expect(config.ipWhitelist).toEqual(['192.168.1.1', '10.0.0.1', '127.0.0.1']);
    });

    it('should handle empty IP whitelist', () => {
      process.env.SHAREABLE_LINKS_IP_WHITELIST = '';
      
      const config = getShareableLinksConfig();
      
      expect(config.ipWhitelist).toEqual([]);
    });
  });

  describe('validateConfig', () => {
    it('should validate a correct configuration', () => {
      const config: ShareableLinksConfig = {
        defaultExpiryDays: 30,
        maxLinksPerDocument: 5,
        tokenLength: 32,
        rateLimitPerMinute: 10,
        cleanupIntervalHours: 24,
        companyInfo: {
          name: 'Test Company',
          address: '123 Test St',
          phone: '+1 555-0123',
          email: 'test@example.com',
          website: 'https://example.com',
        },
        enableShareableLinks: true,
        enableLinkAnalytics: true,
        enableAutoCleanup: true,
        requireHttps: false,
        ipWhitelist: [],
      };

      const result = validateConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid expiry days', () => {
      const config = getShareableLinksConfig();
      config.defaultExpiryDays = 0;

      const result = validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Default expiry days must be between 1 and 365');
    });

    it('should reject invalid token length', () => {
      const config = getShareableLinksConfig();
      config.tokenLength = 8; // Too short

      const result = validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Token length must be between 16 and 64 characters');
    });

    it('should reject invalid email format', () => {
      const config = getShareableLinksConfig();
      config.companyInfo.email = 'invalid-email';

      const result = validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Company email must be a valid email address');
    });

    it('should reject empty company name', () => {
      const config = getShareableLinksConfig();
      config.companyInfo.name = '';

      const result = validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Company name is required');
    });

    it('should reject invalid website URL', () => {
      const config = getShareableLinksConfig();
      config.companyInfo.website = 'not-a-url';

      const result = validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Company website must be a valid URL');
    });
  });

  describe('helper functions', () => {
    it('should return correct feature flag status', () => {
      process.env.ENABLE_SHAREABLE_LINKS = 'false';
      
      expect(isShareableLinksEnabled()).toBe(false);
    });

    it('should handle boolean conversion correctly', () => {
      process.env.ENABLE_SHAREABLE_LINKS = 'TRUE';
      resetConfig();
      
      expect(isShareableLinksEnabled()).toBe(true);
    });
  });

  describe('validateApplicationConfig', () => {
    it('should validate complete application configuration', () => {
      // Set required environment variables
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      
      const result = validateApplicationConfig();
      
      expect(result.isValid).toBe(true);
    });

    it('should detect missing required environment variables', () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.DATABASE_URL;
      
      const result = validateApplicationConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('NEXTAUTH_SECRET'))).toBe(true);
      expect(result.errors.some(error => error.includes('DATABASE_URL'))).toBe(true);
    });

    it('should generate warnings for potential security issues', () => {
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NODE_ENV = 'production';
      process.env.SHAREABLE_LINKS_REQUIRE_HTTPS = 'false';
      process.env.SHAREABLE_LINKS_DEFAULT_EXPIRY_DAYS = '180';
      
      const result = validateApplicationConfig();
      
      expect(result.warnings.some(warning => 
        warning.includes('HTTPS is not required')
      )).toBe(true);
      expect(result.warnings.some(warning => 
        warning.includes('more than 90 days')
      )).toBe(true);
    });
  });
});