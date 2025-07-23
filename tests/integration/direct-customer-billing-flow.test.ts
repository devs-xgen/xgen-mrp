import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllCustomers, searchCustomers, getCustomerById, validateCustomerForBilling } from '@/lib/actions/customers';
import { prisma } from '@/lib/db';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

const mockCustomers = [
  {
    id: '1',
    name: 'Acme Corporation',
    code: 'ACME-001',
    contactPerson: 'John Smith',
    email: 'john@acme.com',
    phone: '+63 912 345 6789',
    address: '123 Business St',
    city: 'Manila',
    state: 'Metro Manila',
    country: 'Philippines',
    postalCode: '1000',
    tinNumber: '123-456-789-000',
    creditLimit: 100000,
    paymentTerms: 'Net 30',
    status: 'ACTIVE',
    notes: 'Premium customer',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Tech Solutions Inc',
    code: 'TECH-002',
    contactPerson: 'Jane Doe',
    email: 'jane@techsolutions.com',
    phone: '+63 917 123 4567',
    address: '456 Tech Ave',
    city: 'Quezon City',
    state: 'Metro Manila',
    country: 'Philippines',
    postalCode: '1100',
    tinNumber: '987-654-321-000',
    creditLimit: 50000,
    paymentTerms: 'Net 15',
    status: 'ACTIVE',
    notes: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Inactive Corp',
    code: 'INACT-003',
    contactPerson: 'Bob Johnson',
    email: 'bob@inactive.com',
    phone: '+63 918 987 6543',
    address: null,
    city: null,
    state: null,
    country: null,
    postalCode: null,
    tinNumber: null,
    creditLimit: null,
    paymentTerms: null,
    status: 'INACTIVE',
    notes: 'Suspended account',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

const mockCustomerWithRelations = {
  ...mockCustomers[0],
  orders: [
    {
      id: 'order-1',
      orderNumber: 'ORD-001',
      orderDate: new Date('2024-01-15'),
      totalAmount: 25000,
      status: 'COMPLETED',
    },
    {
      id: 'order-2',
      orderNumber: 'ORD-002',
      orderDate: new Date('2024-01-10'),
      totalAmount: 15000,
      status: 'ACTIVE',
    },
  ],
  billingStatements: [
    {
      id: 'bill-1',
      statementNumber: 'BILL-001',
      billingDate: new Date('2024-01-16'),
      totalAmount: 25000,
      status: 'PAID',
    },
    {
      id: 'bill-2',
      statementNumber: 'BILL-002',
      billingDate: new Date('2024-01-12'),
      totalAmount: 15000,
      status: 'SENT',
    },
  ],
};

describe('Direct Customer Billing Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllCustomers', () => {
    it('should fetch all active customers by default', async () => {
      const activeCustomers = mockCustomers.filter(c => c.status === 'ACTIVE');
      (prisma.customer.findMany as any).mockResolvedValue(activeCustomers);

      const result = await getAllCustomers();

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        select: expect.objectContaining({
          id: true,
          name: true,
          code: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          tinNumber: true,
          creditLimit: true,
          paymentTerms: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        }),
        orderBy: { name: 'asc' },
        take: 100,
        skip: 0,
      });

      expect(result).toEqual(activeCustomers);
    });

    it('should filter customers by search term', async () => {
      const searchTerm = 'acme';
      const filteredCustomers = [mockCustomers[0]];
      (prisma.customer.findMany as any).mockResolvedValue(filteredCustomers);

      const result = await getAllCustomers({ search: searchTerm });

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { code: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
            { contactPerson: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: expect.any(Object),
        orderBy: { name: 'asc' },
        take: 100,
        skip: 0,
      });

      expect(result).toEqual(filteredCustomers);
    });

    it('should handle pagination parameters', async () => {
      (prisma.customer.findMany as any).mockResolvedValue([]);

      await getAllCustomers({ limit: 50, offset: 25 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 25,
        })
      );
    });

    it('should handle different status filters', async () => {
      const inactiveCustomers = [mockCustomers[2]];
      (prisma.customer.findMany as any).mockResolvedValue(inactiveCustomers);

      const result = await getAllCustomers({ status: 'INACTIVE' });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'INACTIVE' },
        })
      );

      expect(result).toEqual(inactiveCustomers);
    });

    it('should handle database errors gracefully', async () => {
      (prisma.customer.findMany as any).mockRejectedValue(new Error('Database error'));

      await expect(getAllCustomers()).rejects.toThrow('Failed to fetch customers');
    });
  });

  describe('searchCustomers', () => {
    it('should return empty array for empty search term', async () => {
      const result = await searchCustomers('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only search term', async () => {
      const result = await searchCustomers('   ');
      expect(result).toEqual([]);
    });

    it('should search customers with valid term', async () => {
      const searchResults = [mockCustomers[0]];
      (prisma.customer.findMany as any).mockResolvedValue(searchResults);

      const result = await searchCustomers('acme');

      expect(result).toEqual(searchResults);
    });

    it('should limit search results', async () => {
      const searchResults = mockCustomers.slice(0, 2);
      (prisma.customer.findMany as any).mockResolvedValue(searchResults);

      await searchCustomers('tech', 2);

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 2,
        })
      );
    });

    it('should handle search errors gracefully', async () => {
      (prisma.customer.findMany as any).mockRejectedValue(new Error('Search error'));

      await expect(searchCustomers('test')).rejects.toThrow('Failed to search customers');
    });
  });

  describe('getCustomerById', () => {
    it('should fetch customer with relations', async () => {
      (prisma.customer.findUnique as any).mockResolvedValue(mockCustomerWithRelations);

      const result = await getCustomerById('1');

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.objectContaining({
          id: true,
          name: true,
          code: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          tinNumber: true,
          creditLimit: true,
          paymentTerms: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          orders: expect.any(Object),
          billingStatements: expect.any(Object),
        }),
      });

      expect(result).toEqual(mockCustomerWithRelations);
    });

    it('should throw error for non-existent customer', async () => {
      (prisma.customer.findUnique as any).mockResolvedValue(null);

      await expect(getCustomerById('non-existent')).rejects.toThrow('Failed to fetch customer details');
    });

    it('should handle database errors gracefully', async () => {
      (prisma.customer.findUnique as any).mockRejectedValue(new Error('Database error'));

      await expect(getCustomerById('1')).rejects.toThrow('Failed to fetch customer details');
    });
  });

  describe('validateCustomerForBilling', () => {
    it('should validate active customer successfully', async () => {
      (prisma.customer.findUnique as any).mockResolvedValue(mockCustomerWithRelations);

      const result = await validateCustomerForBilling('1');

      expect(result.isValid).toBe(true);
      expect(result.customer).toEqual(mockCustomerWithRelations);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject inactive customer', async () => {
      const inactiveCustomer = { ...mockCustomerWithRelations, status: 'INACTIVE' };
      (prisma.customer.findUnique as any).mockResolvedValue(inactiveCustomer);

      const result = await validateCustomerForBilling('3');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Customer status is INACTIVE. Only active customers can be billed.');
    });

    it('should warn about credit limit exceeded', async () => {
      const customerWithHighOutstanding = {
        ...mockCustomerWithRelations,
        creditLimit: 10000,
        billingStatements: [
          {
            id: 'bill-1',
            statementNumber: 'BILL-001',
            billingDate: new Date('2024-01-16'),
            totalAmount: 8000,
            status: 'SENT', // Outstanding
          },
          {
            id: 'bill-2',
            statementNumber: 'BILL-002',
            billingDate: new Date('2024-01-12'),
            totalAmount: 3000,
            status: 'SENT', // Outstanding
          },
        ],
      };
      (prisma.customer.findUnique as any).mockResolvedValue(customerWithHighOutstanding);

      const result = await validateCustomerForBilling('1');

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Customer has reached credit limit');
    });

    it('should warn about missing email', async () => {
      const customerWithoutEmail = { ...mockCustomerWithRelations, email: null };
      (prisma.customer.findUnique as any).mockResolvedValue(customerWithoutEmail);

      const result = await validateCustomerForBilling('1');

      expect(result.warnings).toContain('Customer email is missing. This may affect billing delivery.');
    });

    it('should warn about missing address', async () => {
      const customerWithoutAddress = { ...mockCustomerWithRelations, address: null };
      (prisma.customer.findUnique as any).mockResolvedValue(customerWithoutAddress);

      const result = await validateCustomerForBilling('1');

      expect(result.warnings).toContain('Customer address is missing. This may affect delivery.');
    });

    it('should handle validation errors gracefully', async () => {
      (prisma.customer.findUnique as any).mockRejectedValue(new Error('Database error'));

      const result = await validateCustomerForBilling('1');

      expect(result.isValid).toBe(false);
      expect(result.customer).toBe(null);
      expect(result.errors).toContain('Failed to validate customer information');
    });
  });

  describe('Customer Selection Business Rules', () => {
    it('should calculate outstanding amount correctly', async () => {
      const customerWithMixedBillings = {
        ...mockCustomerWithRelations,
        creditLimit: 50000,
        billingStatements: [
          { id: '1', statementNumber: 'BILL-001', billingDate: new Date(), totalAmount: 10000, status: 'PAID' },
          { id: '2', statementNumber: 'BILL-002', billingDate: new Date(), totalAmount: 15000, status: 'SENT' },
          { id: '3', statementNumber: 'BILL-003', billingDate: new Date(), totalAmount: 5000, status: 'CANCELLED' },
          { id: '4', statementNumber: 'BILL-004', billingDate: new Date(), totalAmount: 8000, status: 'OVERDUE' },
        ],
      };
      (prisma.customer.findUnique as any).mockResolvedValue(customerWithMixedBillings);

      const result = await validateCustomerForBilling('1');

      // Outstanding should be SENT (15000) + OVERDUE (8000) = 23000
      // PAID and CANCELLED should not count
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0); // 23000 < 50000, so no credit limit warning
    });

    it('should handle customer with no credit limit', async () => {
      const customerWithoutCreditLimit = {
        ...mockCustomerWithRelations,
        creditLimit: null,
      };
      (prisma.customer.findUnique as any).mockResolvedValue(customerWithoutCreditLimit);

      const result = await validateCustomerForBilling('1');

      expect(result.isValid).toBe(true);
      expect(result.warnings).not.toContain(
        expect.stringContaining('credit limit')
      );
    });

    it('should handle customer with zero credit limit', async () => {
      const customerWithZeroCreditLimit = {
        ...mockCustomerWithRelations,
        creditLimit: 0,
      };
      (prisma.customer.findUnique as any).mockResolvedValue(customerWithZeroCreditLimit);

      const result = await validateCustomerForBilling('1');

      expect(result.isValid).toBe(true);
      expect(result.warnings).not.toContain(
        expect.stringContaining('credit limit')
      );
    });
  });

  describe('Auto-population Logic', () => {
    it('should provide customer data for auto-population', async () => {
      (prisma.customer.findUnique as any).mockResolvedValue(mockCustomerWithRelations);

      const result = await getCustomerById('1');

      // Verify all necessary fields for auto-population are present
      expect(result).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        code: expect.any(String),
        email: expect.any(String),
        phone: expect.any(String),
        contactPerson: expect.any(String),
        paymentTerms: expect.any(String),
      });

      // Verify optional fields are handled correctly
      expect(result.address).toBeDefined();
      expect(result.creditLimit).toBeDefined();
      expect(result.tinNumber).toBeDefined();
    });

    it('should handle customers with minimal information', async () => {
      const minimalCustomer = {
        id: '4',
        name: 'Minimal Corp',
        code: 'MIN-004',
        contactPerson: 'Contact Person',
        email: 'contact@minimal.com',
        phone: '+63 900 000 0000',
        address: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        tinNumber: null,
        creditLimit: null,
        paymentTerms: null,
        status: 'ACTIVE',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        orders: [],
        billingStatements: [],
      };
      (prisma.customer.findUnique as any).mockResolvedValue(minimalCustomer);

      const result = await getCustomerById('4');

      expect(result).toEqual(minimalCustomer);
      expect(result.address).toBeNull();
      expect(result.creditLimit).toBeNull();
      expect(result.paymentTerms).toBeNull();
    });
  });
});