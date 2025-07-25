import { describe, it, expect } from 'vitest';
import {
  getBillingStatementId,
  getDeliveryReceiptId,
  getSalesInvoiceId,
  ParamsResolutionError,
  isParamsResolutionError,
  validateParams,
  getParams,
  type BillingRouteParams,
  type DeliveryRouteParams,
  type SalesInvoiceRouteParams,
} from '@/lib/utils/params-handler';

describe('Params Handler', () => {
  describe('getParams', () => {
    it('should resolve params Promise successfully', async () => {
      const mockParams = { id: 'test-id' };
      const paramsPromise = Promise.resolve(mockParams);
      
      const result = await getParams(paramsPromise);
      
      expect(result).toEqual(mockParams);
    });

    it('should throw ParamsResolutionError when Promise rejects', async () => {
      const error = new Error('Promise rejected');
      const paramsPromise = Promise.reject(error);
      
      await expect(getParams(paramsPromise)).rejects.toThrow(ParamsResolutionError);
    });
  });

  describe('validateParams', () => {
    it('should pass validation when all required params are present', () => {
      const params = { id: 'test-id', name: 'test-name' };
      
      expect(() => validateParams(params, ['id', 'name'])).not.toThrow();
    });

    it('should throw ParamsResolutionError when required params are missing', () => {
      const params = { id: 'test-id' };
      
      expect(() => validateParams(params, ['id', 'name'])).toThrow(ParamsResolutionError);
      expect(() => validateParams(params, ['id', 'name'])).toThrow('Missing required parameters: name');
    });
  });

  describe('getBillingStatementId', () => {
    it('should return valid billing statement ID', () => {
      const params: BillingRouteParams = { id: 'billing-123' };
      
      const result = getBillingStatementId(params);
      
      expect(result).toBe('billing-123');
    });

    it('should throw error for empty ID', () => {
      const params: BillingRouteParams = { id: '' };
      
      expect(() => getBillingStatementId(params)).toThrow(ParamsResolutionError);
      expect(() => getBillingStatementId(params)).toThrow('Invalid billing statement ID');
    });

    it('should throw error for whitespace-only ID', () => {
      const params: BillingRouteParams = { id: '   ' };
      
      expect(() => getBillingStatementId(params)).toThrow(ParamsResolutionError);
      expect(() => getBillingStatementId(params)).toThrow('Invalid billing statement ID');
    });

    it('should trim whitespace from valid ID', () => {
      const params: BillingRouteParams = { id: '  billing-123  ' };
      
      const result = getBillingStatementId(params);
      
      expect(result).toBe('billing-123');
    });
  });

  describe('getDeliveryReceiptId', () => {
    it('should return valid delivery receipt ID', () => {
      const params: DeliveryRouteParams = { id: 'delivery-456' };
      
      const result = getDeliveryReceiptId(params);
      
      expect(result).toBe('delivery-456');
    });

    it('should throw error for invalid ID', () => {
      const params: DeliveryRouteParams = { id: '' };
      
      expect(() => getDeliveryReceiptId(params)).toThrow(ParamsResolutionError);
      expect(() => getDeliveryReceiptId(params)).toThrow('Invalid delivery receipt ID');
    });
  });

  describe('getSalesInvoiceId', () => {
    it('should return valid sales invoice ID', () => {
      const params: SalesInvoiceRouteParams = { id: 'invoice-789' };
      
      const result = getSalesInvoiceId(params);
      
      expect(result).toBe('invoice-789');
    });

    it('should throw error for invalid ID', () => {
      const params: SalesInvoiceRouteParams = { id: '' };
      
      expect(() => getSalesInvoiceId(params)).toThrow(ParamsResolutionError);
      expect(() => getSalesInvoiceId(params)).toThrow('Invalid sales invoice ID');
    });
  });

  describe('ParamsResolutionError', () => {
    it('should create error with message and original error', () => {
      const originalError = new Error('Original error');
      const error = new ParamsResolutionError('Test message', originalError);
      
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('ParamsResolutionError');
      expect(error.originalError).toBe(originalError);
    });

    it('should be identifiable by type guard', () => {
      const error = new ParamsResolutionError('Test message');
      const regularError = new Error('Regular error');
      
      expect(isParamsResolutionError(error)).toBe(true);
      expect(isParamsResolutionError(regularError)).toBe(false);
      expect(isParamsResolutionError('not an error')).toBe(false);
    });
  });
});