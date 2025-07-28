/**
 * Configuration validation utility
 * Validates all configuration settings during application startup
 */

import { getShareableLinksConfig, validateConfig } from './shareable-links';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates all application configuration
 * Should be called during application startup
 */
export function validateApplicationConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Validate shareable links configuration
    const shareableLinksConfig = getShareableLinksConfig();
    const shareableLinksValidation = validateConfig(shareableLinksConfig);
    
    if (!shareableLinksValidation.isValid) {
      errors.push(...shareableLinksValidation.errors.map(error => `Shareable Links: ${error}`));
    }
    
    // Check for potential security issues
    if (!shareableLinksConfig.requireHttps && process.env.NODE_ENV === 'production') {
      warnings.push('HTTPS is not required for shareable links in production environment');
    }
    
    if (shareableLinksConfig.defaultExpiryDays > 90) {
      warnings.push('Default expiry days is set to more than 90 days, consider shorter expiration for security');
    }
    
    if (shareableLinksConfig.rateLimitPerMinute > 100) {
      warnings.push('Rate limit is set very high, consider lowering for better security');
    }
    
    // Validate required environment variables
    const requiredEnvVars = ['NEXTAUTH_SECRET', 'DATABASE_URL'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        errors.push(`Required environment variable ${envVar} is not set`);
      }
    }
    
    // Check database URL format
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
      warnings.push('DATABASE_URL does not appear to be a PostgreSQL connection string');
    }
    
  } catch (error) {
    errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Logs configuration validation results
 */
export function logConfigValidation(result: ConfigValidationResult): void {
  if (result.isValid) {
    console.log('✅ Configuration validation passed');
    
    if (result.warnings.length > 0) {
      console.warn('⚠️  Configuration warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  } else {
    console.error('❌ Configuration validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    
    if (result.warnings.length > 0) {
      console.warn('⚠️  Additional warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
}

/**
 * Validates configuration and throws if invalid
 * Use this in critical startup paths
 */
export function validateConfigOrThrow(): void {
  const result = validateApplicationConfig();
  
  if (!result.isValid) {
    logConfigValidation(result);
    throw new Error(`Configuration validation failed: ${result.errors.join(', ')}`);
  }
  
  // Log warnings even if validation passes
  if (result.warnings.length > 0) {
    logConfigValidation(result);
  }
}