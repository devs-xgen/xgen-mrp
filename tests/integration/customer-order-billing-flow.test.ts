import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getCustomerOrdersForBilling, 
  validateOrderForBilling,
  mapOrderItemsToInvoiceItems,
  getCustomerOrderForBilling
} from '@/lib/actions/customer-order';
import { Status } from '@prisma/client';
import { prisma } from '@/lib/db';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    customerOrder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    salesInvoice: {
      findFirst: vi.fn(),
    },
  },
}));

describe('Customer Order Billing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCustomerOrdersForBilling', () => {
    it('should fetch customer orders with enhanced data for billing', async () => {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'CO-2024-0001',
          customerId: 'customer-1',
          orderDate: new Date('2024-01-01'),
          requiredDate: new Date('2024-01-15'),
          status: Status.PENDING,
          totalAmount: 1000,
          notes: 'Test order',
          customer: {
            id: 'customer-1',
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '+1234567890',
            address: '123 Test St',
            paymentTerms: 'Net 30',
            creditLimit: 5000,
          },
          orderLines: [
            {
              id: 'line-1',
              productId: 'product-1',
              productVariantId: null,
              quantity: 10,
              unitPrice: 100,
              status: Status.PENDING,
              product: {
                id: 'product-1',
                name: 'Test Product',
                sku: 'TEST-001',
                sellingPrice: 100,
                description: 'Test product description',
                unitOfMeasure: 'PCS',
              },
              productVariant: null,
            },
          ],
          productionOrders: [],
          _count: {
            productionOrders: 0,
            orderLines: 1,
          },
          createdAt: new Date('2024-01-01'),
        },
      ];

      (prisma.customerOrder.findMany as any).mockResolvedValue(mockOrders);

      const result = await getCustomerOrdersForBilling();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        orderNumber: 'CO-2024-0001',
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+1234567890',
          paymentTerms: 'Net 30',
        },
        orderLines: [
          {
            productId: 'product-1',
            quantity: 10,
            unitPrice: 100,
            product: {
              name: 'Test Product',
              sku: 'TEST-001',
              description: 'Test product description',
            },
          },
        ],
      });
    });

    it('should apply search filter correctly', async () => {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'CO-2024-0001',
          customerId: 'customer-1',
          orderDate: new Date('2024-01-01'),
          requiredDate: new Date('2024-01-15'),
          status: Status.CONFIRMED,
          totalAmount: 1000,
          notes: 'Test order',
          customer: {
            id: 'customer-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: null,
            address: null,
            paymentTerms: null,
            creditLimit: null,
          },
          orderLines: [],
          productionOrders: [],
          _count: { productionOrders: 0, orderLines: 0 },
          createdAt: new Date('2024-01-01'),
        },
      ];

      (prisma.customerOrder.findMany as any).mockResolvedValue(mockOrders);

      await getCustomerOrdersForBilling({ search: 'john' });

      expect(prisma.customerOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { orderNumber: { contains: 'john', mode: 'insensitive' } },
              { customer: { name: { contains: 'john', mode: 'insensitive' } } },
              { customer: { email: { contains: 'john', mode: 'insensitive' } } },
              { notes: { contains: 'john', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should apply status filter correctly', async () => {
      (prisma.customerOrder.findMany as any).mockResolvedValue([]);

      await getCustomerOrdersForBilling({ 
        status: [Status.PENDING, Status.IN_PROGRESS] 
      });

      expect(prisma.customerOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [Status.PENDING, Status.IN_PROGRESS] },
          }),
        })
      );
    });
  });

  describe('validateOrderForBilling', () => {
    it('should validate a valid order successfully', async () => {
      const mockOrder = {
        id: '1',
        status: Status.PENDING,
        totalAmount: 1000,
        customer: { id: 'customer-1', name: 'Test Customer' },
        orderLines: [
          {
            id: 'line-1',
            productId: 'product-1',
            quantity: 10,
            product: { id: 'product-1', name: 'Test Product' },
          },
        ],
        productionOrders: [],
      };

      (prisma.customerOrder.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.salesInvoice.findFirst as any).mockResolvedValue(null);

      const result = await validateOrderForBilling('1');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject cancelled orders', async () => {
      const mockOrder = {
        id: '1',
        status: Status.CANCELLED,
        totalAmount: 1000,
        customer: { id: 'customer-1', name: 'Test Customer' },
        orderLines: [
          {
            id: 'line-1',
            productId: 'product-1',
            quantity: 10,
            product: { id: 'product-1', name: 'Test Product' },
          },
        ],
        productionOrders: [],
      };

      (prisma.customerOrder.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.salesInvoice.findFirst as any).mockResolvedValue(null);

      const result = await validateOrderForBilling('1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot create billing for cancelled orders');
    });

    it('should reject orders with no items', async () => {
      const mockOrder = {
        id: '1',
        status: Status.PENDING,
        totalAmount: 1000,
        customer: { id: 'customer-1', name: 'Test Customer' },
        orderLines: [],
        productionOrders: [],
      };

      (prisma.customerOrder.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.salesInvoice.findFirst as any).mockResolvedValue(null);

      const result = await validateOrderForBilling('1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Order has no items to bill');
    });

    it('should warn about existing billing statements', async () => {
      const mockOrder = {
        id: '1',
        status: Status.PENDING,
        totalAmount: 1000,
        customer: { id: 'customer-1', name: 'Test Customer' },
        orderLines: [
          {
            id: 'line-1',
            productId: 'product-1',
            quantity: 10,
            product: { id: 'product-1', name: 'Test Product' },
          },
        ],
        productionOrders: [],
      };

      const mockExistingBilling = {
        id: 'invoice-1',
        customerOrderId: '1',
      };

      (prisma.customerOrder.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.salesInvoice.findFirst as any).mockResolvedValue(mockExistingBilling);

      const result = await validateOrderForBilling('1');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('A billing statement already exists for this order');
    });
  });

  describe('mapOrderItemsToInvoiceItems', () => {
    it('should map order lines to invoice items correctly', () => {
      const orderLines = [
        {
          id: 'line-1',
          productId: 'product-1',
          productVariantId: undefined,
          quantity: 10,
          unitPrice: 100,
          status: Status.PENDING,
          product: {
            id: 'product-1',
            name: 'Test Product',
            sku: 'TEST-001',
            unitOfMeasure: 'PCS',
          },
          productVariant: undefined,
        },
        {
          id: 'line-2',
          productId: 'product-2',
          productVariantId: 'variant-1',
          quantity: 5,
          unitPrice: 200,
          status: Status.PENDING,
          product: {
            id: 'product-2',
            name: 'Test Product 2',
            sku: 'TEST-002',
            unitOfMeasure: 'KG',
          },
          productVariant: {
            id: 'variant-1',
            sku: 'TEST-002-RED',
            displayName: 'Red Variant',
            sizeName: 'Large',
            colorName: 'Red',
            unitPrice: 200,
          },
        },
      ];

      const result = mapOrderItemsToInvoiceItems(orderLines);

      expect(result).toHaveLength(2);
      
      // First item (no variant)
      expect(result[0]).toMatchObject({
        productId: 'product-1',
        productVariantId: undefined,
        description: 'Test Product',
        quantity: 10,
        unitPrice: 100,
        productCode: 'TEST-001',
        unit: 'PCS',
        discountPercent: 0,
        taxable: true,
      });

      // Second item (with variant)
      expect(result[1]).toMatchObject({
        productId: 'product-2',
        productVariantId: 'variant-1',
        description: 'Test Product 2 (Red Variant)',
        quantity: 5,
        unitPrice: 200,
        productCode: 'TEST-002-RED',
        unit: 'KG',
        discountPercent: 0,
        taxable: true,
      });
    });

    it('should handle missing product information gracefully', () => {
      const orderLines = [
        {
          id: 'line-1',
          productId: 'product-1',
          productVariantId: undefined,
          quantity: 10,
          unitPrice: 100,
          status: Status.PENDING,
          product: undefined,
          productVariant: undefined,
        },
      ];

      const result = mapOrderItemsToInvoiceItems(orderLines);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        productId: 'product-1',
        description: 'Unknown Product',
        quantity: 10,
        unitPrice: 100,
        productCode: '',
        unit: 'PCS',
      });
    });
  });

  describe('getCustomerOrderForBilling', () => {
    it('should fetch a specific order with enhanced billing data', async () => {
      const mockOrder = {
        id: '1',
        orderNumber: 'CO-2024-0001',
        customerId: 'customer-1',
        orderDate: new Date('2024-01-01'),
        requiredDate: new Date('2024-01-15'),
        status: Status.CONFIRMED,
        totalAmount: 1000,
        notes: 'Test order',
        customer: {
          id: 'customer-1',
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+1234567890',
          address: '123 Test St',
          paymentTerms: 'Net 30',
          creditLimit: 5000,
        },
        orderLines: [
          {
            id: 'line-1',
            productId: 'product-1',
            productVariantId: null,
            quantity: 10,
            unitPrice: 100,
            status: Status.PENDING,
            product: {
              id: 'product-1',
              name: 'Test Product',
              sku: 'TEST-001',
              sellingPrice: 100,
              description: 'Test product description',
              unitOfMeasure: 'PCS',
            },
            productVariant: null,
          },
        ],
        productionOrders: [],
        _count: {
          productionOrders: 0,
          orderLines: 1,
        },
      };

      (prisma.customerOrder.findUnique as any).mockResolvedValue(mockOrder);

      const result = await getCustomerOrderForBilling('1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
      expect(result?.customer.name).toBe('Test Customer');
      expect(result?.orderLines).toHaveLength(1);
      expect(result?.orderLines[0].product?.description).toBe('Test product description');
    });

    it('should return null for non-existent order', async () => {
      (prisma.customerOrder.findUnique as any).mockResolvedValue(null);

      const result = await getCustomerOrderForBilling('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('Integration Flow', () => {
    it('should complete full customer order billing flow', async () => {
      // Step 1: Fetch orders for billing
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'CO-2024-0001',
          customerId: 'customer-1',
          orderDate: new Date('2024-01-01'),
          requiredDate: new Date('2024-01-15'),
          status: Status.PENDING,
          totalAmount: 1000,
          notes: 'Test order',
          customer: {
            id: 'customer-1',
            name: 'Test Customer',
            email: 'test@example.com',
            phone: null,
            address: null,
            paymentTerms: 'Net 30',
            creditLimit: null,
          },
          orderLines: [
            {
              id: 'line-1',
              productId: 'product-1',
              productVariantId: null,
              quantity: 10,
              unitPrice: 100,
              status: Status.PENDING,
              product: {
                id: 'product-1',
                name: 'Test Product',
                sku: 'TEST-001',
                sellingPrice: 100,
                description: 'Test product description',
                unitOfMeasure: 'PCS',
              },
              productVariant: null,
            },
          ],
          productionOrders: [],
          _count: { productionOrders: 0, orderLines: 1 },
          createdAt: new Date('2024-01-01'),
        },
      ];

      (prisma.customerOrder.findMany as any).mockResolvedValue(mockOrders);
      (prisma.customerOrder.findUnique as any).mockResolvedValue(mockOrders[0]);
      (prisma.salesInvoice.findFirst as any).mockResolvedValue(null);

      // Step 1: Get orders for billing
      const orders = await getCustomerOrdersForBilling();
      expect(orders).toHaveLength(1);

      // Step 2: Select an order
      const selectedOrder = orders[0];
      expect(selectedOrder.id).toBe('1');

      // Step 3: Validate the order
      const validation = await validateOrderForBilling(selectedOrder.id);
      expect(validation.isValid).toBe(true);

      // Step 4: Map order items to invoice items
      const invoiceItems = mapOrderItemsToInvoiceItems(selectedOrder.orderLines);
      expect(invoiceItems).toHaveLength(1);
      expect(invoiceItems[0].description).toBe('Test Product');
      expect(invoiceItems[0].quantity).toBe(10);
      expect(invoiceItems[0].unitPrice).toBe(100);

      // Step 5: Get detailed order for billing
      const detailedOrder = await getCustomerOrderForBilling(selectedOrder.id);
      expect(detailedOrder).not.toBeNull();
      expect(detailedOrder?.customer.paymentTerms).toBe('Net 30');
    });
  });
});