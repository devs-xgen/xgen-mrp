import { NextRequest, NextResponse } from 'next/server';
import { 
  generateBillingStatementPDF, 
  generateSalesInvoicePDF, 
  generateDeliveryReceiptPDF,
  createPDFDownloadResponse 
} from '@/lib/services/pdf-generator';
import { BillingStatus, InvoiceStatus, DeliveryStatus } from '@/types/admin/billing';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and id' },
        { status: 400 }
      );
    }

    // Mock data for testing - in real implementation, fetch from database
    const mockBillingStatement = {
      id: 'bs-1',
      statementNumber: 'BS-2024-001',
      customerId: 'cust-1',
      customerOrderId: null,
      customerName: 'Test Customer Inc.',
      productionOrderId: null,
      totalAmount: 1150,
      taxAmount: 100,
      discountAmount: 50,
      netAmount: 1200,
      status: BillingStatus.SENT,
      billingDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      paidDate: null,
      notes: 'Thank you for your business. Payment terms: Net 30 days.',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1',
      modifiedBy: null,
      customer: {
        name: 'Test Customer Inc.',
        email: 'billing@testcustomer.com',
        phone: '+1 (555) 123-4567',
        address: '456 Customer Street, Customer City, CC 67890',
      },
      salesInvoice: {
        id: 'si-1',
        invoiceNumber: 'INV-2024-001',
        billingStatementId: 'bs-1',
        invoiceDate: new Date('2024-01-15'),
        subtotal: 1100,
        taxRate: 10,
        taxAmount: 100,
        discountAmount: 50,
        totalAmount: 1150,
        paymentTerms: 'Net 30 days',
        dueDate: new Date('2024-02-15'),
        status: InvoiceStatus.SENT,
        poNumber: 'PO-2024-123',
        terms: 'Standard terms and conditions apply. All sales are final.',
        footerNotes: 'Thank you for choosing XGen Manufacturing for your production needs.',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        modifiedBy: null,
        invoiceItems: [
          {
            id: 'item-1',
            salesInvoiceId: 'si-1',
            productId: 'prod-1',
            description: 'Custom Manufacturing Component A',
            quantity: 10,
            unitPrice: 75,
            totalPrice: 750,
            productCode: 'CMA-001',
            unit: 'pcs',
            discountPercent: 0,
            taxable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'item-2',
            salesInvoiceId: 'si-1',
            productId: 'prod-2',
            description: 'Premium Assembly Kit B',
            quantity: 5,
            unitPrice: 80,
            totalPrice: 350,
            productCode: 'PAK-002',
            unit: 'kits',
            discountPercent: 12.5,
            taxable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    };

    const mockDeliveryReceipt = {
      id: 'dr-1',
      receiptNumber: 'DR-2024-001',
      billingStatementId: 'bs-1',
      deliveryDate: new Date('2024-01-20'),
      deliveryAddress: '456 Customer Street, Customer City, CC 67890',
      receivedBy: 'John Smith',
      receivedByTitle: 'Warehouse Manager',
      signatureImage: null,
      photoEvidence: null,
      trackingNumber: 'XGN123456789',
      courierService: 'XGen Express Delivery',
      deliveryStatus: DeliveryStatus.DELIVERED,
      deliveryNotes: 'Items delivered in excellent condition. Customer satisfied with quality.',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1',
      modifiedBy: null,
      billingStatement: mockBillingStatement,
    };

    let pdfBuffer: Buffer;
    let filename: string;

    switch (type) {
      case 'billing-statement':
        pdfBuffer = await generateBillingStatementPDF(mockBillingStatement);
        filename = `billing-statement-${mockBillingStatement.statementNumber}.pdf`;
        break;

      case 'sales-invoice':
        pdfBuffer = await generateSalesInvoicePDF(mockBillingStatement.salesInvoice!);
        filename = `sales-invoice-${mockBillingStatement.salesInvoice!.invoiceNumber}.pdf`;
        break;

      case 'delivery-receipt':
        pdfBuffer = await generateDeliveryReceiptPDF(mockDeliveryReceipt);
        filename = `delivery-receipt-${mockDeliveryReceipt.receiptNumber}.pdf`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid PDF type. Supported types: billing-statement, sales-invoice, delivery-receipt' },
          { status: 400 }
        );
    }

    return createPDFDownloadResponse(pdfBuffer, filename);

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and data' },
        { status: 400 }
      );
    }

    let pdfBuffer: Buffer;
    let filename: string;

    switch (type) {
      case 'billing-statement':
        pdfBuffer = await generateBillingStatementPDF(data);
        filename = `billing-statement-${data.statementNumber || 'draft'}.pdf`;
        break;

      case 'sales-invoice':
        pdfBuffer = await generateSalesInvoicePDF(data);
        filename = `sales-invoice-${data.invoiceNumber || 'draft'}.pdf`;
        break;

      case 'delivery-receipt':
        pdfBuffer = await generateDeliveryReceiptPDF(data);
        filename = `delivery-receipt-${data.receiptNumber || 'draft'}.pdf`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid PDF type. Supported types: billing-statement, sales-invoice, delivery-receipt' },
          { status: 400 }
        );
    }

    return createPDFDownloadResponse(pdfBuffer, filename);

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}