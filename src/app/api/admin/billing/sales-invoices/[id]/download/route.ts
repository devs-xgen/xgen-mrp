import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSalesInvoiceById } from '@/lib/actions/sales-invoices';
import { generateSalesInvoicePDF, createPDFDownloadResponse } from '@/lib/services/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Get the sales invoice with all required data
    const invoice = await getSalesInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Sales invoice not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generateSalesInvoicePDF(invoice);

    // Create filename
    const filename = `sales-invoice-${invoice.invoiceNumber}.pdf`;

    // Return PDF as download
    return createPDFDownloadResponse(pdfBuffer, filename);
  } catch (error) {
    console.error('Error downloading sales invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}