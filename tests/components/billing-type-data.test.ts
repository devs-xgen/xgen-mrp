import { describe, test, expect } from 'vitest'
import { 
  billingTypeOptions, 
  getBillingTypeOption, 
  getRecommendedBillingType 
} from '@/components/module/admin/billing/billing-type-data'

describe('Billing Type Data', () => {
  describe('billingTypeOptions', () => {
    test('contains exactly 3 billing type options', () => {
      expect(billingTypeOptions).toHaveLength(3)
    })

    test('contains all required billing types', () => {
      const ids = billingTypeOptions.map(option => option.id)
      expect(ids).toContain('customer-order')
      expect(ids).toContain('direct-customer')
      expect(ids).toContain('manual-customer')
    })

    test('each option has required properties', () => {
      billingTypeOptions.forEach(option => {
        expect(option).toHaveProperty('id')
        expect(option).toHaveProperty('title')
        expect(option).toHaveProperty('description')
        expect(option).toHaveProperty('icon')
        expect(option).toHaveProperty('features')
        
        expect(typeof option.id).toBe('string')
        expect(typeof option.title).toBe('string')
        expect(typeof option.description).toBe('string')
        expect(typeof option.icon).toBe('function')
        expect(Array.isArray(option.features)).toBe(true)
      })
    })

    test('customer-order option has correct properties', () => {
      const customerOrderOption = billingTypeOptions.find(opt => opt.id === 'customer-order')
      
      expect(customerOrderOption).toBeDefined()
      expect(customerOrderOption?.title).toBe('Customer Order Billing')
      expect(customerOrderOption?.description).toBe('Create billing from an existing customer order with pre-filled details')
      expect(customerOrderOption?.recommended).toBe(true)
      expect(customerOrderOption?.features).toContain('Auto-populated customer information')
      expect(customerOrderOption?.features).toContain('Pre-filled order items and amounts')
    })

    test('direct-customer option has correct properties', () => {
      const directCustomerOption = billingTypeOptions.find(opt => opt.id === 'direct-customer')
      
      expect(directCustomerOption).toBeDefined()
      expect(directCustomerOption?.title).toBe('Direct Customer Billing')
      expect(directCustomerOption?.description).toBe('Create billing for an existing customer from your database')
      expect(directCustomerOption?.recommended).toBeUndefined()
      expect(directCustomerOption?.features).toContain('Select from existing customers')
      expect(directCustomerOption?.features).toContain('Access to customer payment terms')
    })

    test('manual-customer option has correct properties', () => {
      const manualCustomerOption = billingTypeOptions.find(opt => opt.id === 'manual-customer')
      
      expect(manualCustomerOption).toBeDefined()
      expect(manualCustomerOption?.title).toBe('Manual Customer Entry')
      expect(manualCustomerOption?.description).toBe('Create billing with manually entered customer information')
      expect(manualCustomerOption?.recommended).toBeUndefined()
      expect(manualCustomerOption?.features).toContain('Quick customer name entry')
      expect(manualCustomerOption?.features).toContain('No customer database required')
    })

    test('all options have at least 3 features', () => {
      billingTypeOptions.forEach(option => {
        expect(option.features.length).toBeGreaterThanOrEqual(3)
      })
    })
  })

  describe('getBillingTypeOption', () => {
    test('returns correct option for valid id', () => {
      const option = getBillingTypeOption('customer-order')
      expect(option).toBeDefined()
      expect(option?.id).toBe('customer-order')
      expect(option?.title).toBe('Customer Order Billing')
    })

    test('returns correct option for direct-customer id', () => {
      const option = getBillingTypeOption('direct-customer')
      expect(option).toBeDefined()
      expect(option?.id).toBe('direct-customer')
      expect(option?.title).toBe('Direct Customer Billing')
    })

    test('returns correct option for manual-customer id', () => {
      const option = getBillingTypeOption('manual-customer')
      expect(option).toBeDefined()
      expect(option?.id).toBe('manual-customer')
      expect(option?.title).toBe('Manual Customer Entry')
    })

    test('returns undefined for invalid id', () => {
      const option = getBillingTypeOption('invalid-id')
      expect(option).toBeUndefined()
    })

    test('returns undefined for empty string', () => {
      const option = getBillingTypeOption('')
      expect(option).toBeUndefined()
    })
  })

  describe('getRecommendedBillingType', () => {
    test('returns the recommended billing type', () => {
      const recommended = getRecommendedBillingType()
      expect(recommended).toBeDefined()
      expect(recommended?.recommended).toBe(true)
      expect(recommended?.id).toBe('customer-order')
    })

    test('returns customer-order as recommended type', () => {
      const recommended = getRecommendedBillingType()
      expect(recommended?.id).toBe('customer-order')
      expect(recommended?.title).toBe('Customer Order Billing')
    })
  })

  describe('data consistency', () => {
    test('all billing type ids are unique', () => {
      const ids = billingTypeOptions.map(option => option.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids).toHaveLength(uniqueIds.length)
    })

    test('all billing type titles are unique', () => {
      const titles = billingTypeOptions.map(option => option.title)
      const uniqueTitles = [...new Set(titles)]
      expect(titles).toHaveLength(uniqueTitles.length)
    })

    test('only one option is marked as recommended', () => {
      const recommendedOptions = billingTypeOptions.filter(option => option.recommended)
      expect(recommendedOptions).toHaveLength(1)
      expect(recommendedOptions[0].id).toBe('customer-order')
    })

    test('all features are non-empty strings', () => {
      billingTypeOptions.forEach(option => {
        option.features.forEach(feature => {
          expect(typeof feature).toBe('string')
          expect(feature.length).toBeGreaterThan(0)
          expect(feature.trim()).toBe(feature) // No leading/trailing whitespace
        })
      })
    })

    test('all descriptions are meaningful length', () => {
      billingTypeOptions.forEach(option => {
        expect(option.description.length).toBeGreaterThan(20)
        expect(option.description.length).toBeLessThan(200)
      })
    })

    test('all titles are meaningful length', () => {
      billingTypeOptions.forEach(option => {
        expect(option.title.length).toBeGreaterThan(5)
        expect(option.title.length).toBeLessThan(50)
      })
    })
  })
})