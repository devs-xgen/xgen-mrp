'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestPDFPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const downloadPDF = async (type: string) => {
    setLoading(type);
    try {
      const response = await fetch(`/api/billing/pdf?type=${type}&id=test-1`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `test-${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">PDF Generator Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Billing Statement PDF</CardTitle>
            <CardDescription>
              Generate a sample billing statement PDF with company branding and customer information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => downloadPDF('billing-statement')}
              disabled={loading === 'billing-statement'}
              className="w-full"
            >
              {loading === 'billing-statement' ? 'Generating...' : 'Download Billing Statement'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Invoice PDF</CardTitle>
            <CardDescription>
              Generate a sample sales invoice PDF with itemized billing and tax calculations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => downloadPDF('sales-invoice')}
              disabled={loading === 'sales-invoice'}
              className="w-full"
            >
              {loading === 'sales-invoice' ? 'Generating...' : 'Download Sales Invoice'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Receipt PDF</CardTitle>
            <CardDescription>
              Generate a sample delivery receipt PDF with delivery details and signature section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => downloadPDF('delivery-receipt')}
              disabled={loading === 'delivery-receipt'}
              className="w-full"
            >
              {loading === 'delivery-receipt' ? 'Generating...' : 'Download Delivery Receipt'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Features</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>Company branding with XGen Manufacturing information</li>
          <li>Professional PDF styling with proper typography</li>
          <li>Responsive table layouts for invoice items</li>
          <li>Currency formatting and tax calculations</li>
          <li>Status badges and document metadata</li>
          <li>Footer with generation timestamp</li>
        </ul>
      </div>
    </div>
  );
}