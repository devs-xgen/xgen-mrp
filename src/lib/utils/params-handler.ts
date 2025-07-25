/**
 * Utility for handling Next.js route parameters with proper Promise handling
 */

export interface ParamsHandler {
  getParams<T>(params: Promise<T>): Promise<T>;
}

/**
 * Async function to get params with error handling
 * @param params - The params Promise from Next.js page props
 * @returns Promise resolving to the params object
 */
export async function getParams<T>(params: Promise<T>): Promise<T> {
  try {
    return await params;
  } catch (error) {
    console.error('Error resolving params:', error);
    throw new ParamsResolutionError('Failed to resolve route parameters', error);
  }
}

/**
 * Custom error class for params resolution failures
 */
export class ParamsResolutionError extends Error {
  public readonly originalError: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'ParamsResolutionError';
    this.originalError = originalError;
  }
}

/**
 * Type guard to check if an error is a ParamsResolutionError
 */
export function isParamsResolutionError(error: unknown): error is ParamsResolutionError {
  return error instanceof ParamsResolutionError;
}

/**
 * Validate that required params are present
 * @param params - The params object
 * @param requiredKeys - Array of required parameter keys
 * @throws ParamsResolutionError if required params are missing
 */
export function validateParams<T extends Record<string, unknown>>(
  params: T,
  requiredKeys: (keyof T)[]
): void {
  const missingKeys = requiredKeys.filter(key => !params[key]);
  
  if (missingKeys.length > 0) {
    throw new ParamsResolutionError(
      `Missing required parameters: ${missingKeys.join(', ')}`
    );
  }
}

/**
 * Route parameter types for billing pages
 */
export interface BillingRouteParams extends Record<string, string> {
  id: string;
}

export interface DeliveryRouteParams extends Record<string, string> {
  id: string;
}

export interface SalesInvoiceRouteParams extends Record<string, string> {
  id: string;
}

/**
 * Utility to safely extract and validate billing statement ID from params
 */
export function getBillingStatementId(params: BillingRouteParams): string {
  if (typeof params.id !== 'string' || params.id.trim() === '') {
    throw new ParamsResolutionError('Invalid billing statement ID');
  }
  
  return params.id.trim();
}

/**
 * Utility to safely extract and validate delivery receipt ID from params
 */
export function getDeliveryReceiptId(params: DeliveryRouteParams): string {
  if (typeof params.id !== 'string' || params.id.trim() === '') {
    throw new ParamsResolutionError('Invalid delivery receipt ID');
  }
  
  return params.id.trim();
}

/**
 * Utility to safely extract and validate sales invoice ID from params
 */
export function getSalesInvoiceId(params: SalesInvoiceRouteParams): string {
  if (typeof params.id !== 'string' || params.id.trim() === '') {
    throw new ParamsResolutionError('Invalid sales invoice ID');
  }
  
  return params.id.trim();
}