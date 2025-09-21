# CSV and Excel Export Guide (Next.js + Prisma)

This guide documents the pattern I implemented for reliable exports you can reuse across pages. It covers both CSV (Excel-friendly) and native Excel (.xlsx) exports.

- Target UI: client components in `src/components/...`
- Server actions: in `src/lib/actions/...`
- Auth: `getServerSession(authOptions)` is used to gate exporting

---

## What you get
- CSV download that opens cleanly in Windows Excel (UTF-8 BOM + CRLF newlines)
- Native Excel (.xlsx) with typed columns and basic formatting
- Consistent file naming (e.g., `sales-invoices-export-YYYY-MM-DD.csv|.xlsx`)

---

## Client-side (UI) pattern

Add two actions in your UI:
- Export CSV (quick, runs `exportXxxData` server action)
- Export Excel (.xlsx) (runs `exportXxxExcel` server action and downloads base64)

Example client component snippet:

```tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

// Adjust paths for your page/module
import { exportSalesInvoicesData, exportSalesInvoicesExcel } from '@/lib/actions/sales-invoices';

export function ExportButtons({ className }: { className?: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const result = await exportSalesInvoicesData(); // optionally pass filters
      // Excel-friendly CSV: prepend BOM and convert to CRLF
      const bom = '\uFEFF';
      const crlfContent = result.csvContent.replace(/\n/g, '\r\n');
      const blob = new Blob([bom + crlfContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 100);
      toast({ title: 'Export complete', description: 'CSV downloaded successfully.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Export failed', description: 'Could not export CSV', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      toast({ title: 'Export started', description: 'Generating Excel...' });
      const res = await exportSalesInvoicesExcel(); // optionally pass filters
      if (!res?.base64) throw new Error('No Excel data returned');
      const byteChars = atob(res.base64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNums);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename || 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 100);
      toast({ title: 'Export complete', description: 'Excel downloaded successfully.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Export failed', description: 'Could not export Excel', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={className}>
      <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={isExporting}>
        <Download className="mr-2 h-4 w-4" /> Export CSV
      </Button>
      <Button onClick={handleExportExcel} variant="outline" size="sm" disabled={isExporting} className="ml-2">
        <Download className="mr-2 h-4 w-4" /> Export Excel (.xlsx)
      </Button>
    </div>
  );
}
```

---

## Server-side: CSV export action

Pattern for `exportXxxData(filters?)` returning `{ csvContent, filename }`.

```ts
'use server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

export async function exportSalesInvoicesData(filters?: any): Promise<{ csvContent: string; filename: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized: Please log in to export data');

  // 1) Parse and validate filters (use your existing zod schema if available)
  const where: any = {};
  if (filters?.status?.length) where.status = { in: filters.status };
  if (filters?.dateRange) where.invoiceDate = { gte: filters.dateRange.start, lte: filters.dateRange.end };
  if (filters?.amountRange) where.totalAmount = { gte: new Decimal(filters.amountRange.min), lte: new Decimal(filters.amountRange.max) };
  if (filters?.search) {
    where.OR = [
      { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
      { poNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // 2) Fetch records
  const invoices = await prisma.salesInvoice.findMany({
    where,
    orderBy: { invoiceDate: 'desc' },
    include: {
      billingStatement: { select: { statementNumber: true, customerName: true, customer: { select: { email: true } } } },
      createdByUser: { select: { email: true } },
    },
  });

  // 3) CSV headers
  const headers = [
    'Invoice Number',
    'Invoice Date',
    'Status',
    'Customer',
    'Total Amount',
  ];

  const fmtDate = (d: Date | null) => (d ? new Date(d).toISOString().split('T')[0] : '');
  const toNum = (v: any) => (typeof v === 'number' ? v : v?.toNumber ? v.toNumber() : Number(v ?? 0));
  const esc = (val: any) => {
    const s = val == null ? '' : String(val);
    return s.includes('"') || s.includes(',') || s.includes('\n') ? '"' + s.replaceAll('"', '""') + '"' : s;
  };

  // 4) Build rows
  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    fmtDate(inv.invoiceDate),
    inv.status,
    inv.billingStatement?.customerName || '',
    toNum(inv.totalAmount),
  ].map(esc).join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const today = new Date();
  const filename = `sales-invoices-export-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.csv`;

  return { csvContent, filename };
}
```

---

## Server-side: Excel export action

Pattern for `exportXxxExcel(filters?)` returning `{ base64, filename }`.

Important: use dynamic import so Next.js only loads exceljs when needed.

```ts
'use server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

export async function exportSalesInvoicesExcel(filters?: any): Promise<{ base64: string; filename: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Authentication required.');

  // Only import exceljs at runtime (reduces bundling issues)
  const { default: ExcelJS } = await import('exceljs');

  // Build your where clause the same way as CSV
  const where: any = {};
  if (filters?.status?.length) where.status = { in: filters.status };
  if (filters?.dateRange) where.invoiceDate = { gte: filters.dateRange.start, lte: filters.dateRange.end };
  if (filters?.amountRange) where.totalAmount = { gte: new Decimal(filters.amountRange.min), lte: new Decimal(filters.amountRange.max) };

  const invoices = await prisma.salesInvoice.findMany({
    where,
    orderBy: { invoiceDate: 'desc' },
    include: {
      billingStatement: { select: { statementNumber: true, customerName: true, customer: { select: { email: true, code: true } } } },
      createdByUser: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
    },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sales Invoices');
  const headers = [
    'Invoice Number', 'Invoice Date', 'Status', 'Customer', 'Total Amount', 'Created By', 'Created Date'
  ];
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true };

  invoices.forEach((inv) => {
    const createdBy = inv.createdByUser?.profile
      ? `${inv.createdByUser.profile.firstName} ${inv.createdByUser.profile.lastName}`
      : inv.createdByUser?.email || '';

    ws.addRow([
      inv.invoiceNumber,
      inv.invoiceDate ? new Date(inv.invoiceDate) : null,
      inv.status,
      inv.billingStatement?.customerName || '',
      Number(inv.totalAmount),
      createdBy,
      inv.createdAt ? new Date(inv.createdAt) : null,
    ]);
  });

  // Column formatting: dates and currency
  ws.getColumn(2).numFmt = 'yyyy-mm-dd';
  ws.getColumn(5).numFmt = '#,##0.00';

  // Auto width
  ws.columns.forEach((c) => {
    let max = 10;
    c.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value as any;
      const len = v ? String(v).length : 0;
      if (len > max) max = len;
    });
    c.width = Math.min(42, max + 2);
  });

  const buffer = await wb.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const ts = new Date().toISOString().split('T')[0];
  return { base64, filename: `sales-invoices-export-${ts}.xlsx` };
}
```

---

## Dependency

- Install exceljs

```bash
npm install exceljs
```

Tip: Prefer dynamic `await import('exceljs')` inside the server action instead of a top-level `import ExcelJS from 'exceljs'` to avoid SSR bundling / module resolution headaches. This is what we use in production code in `src/lib/actions/billing-statements.ts`.

---

## Checklist to replicate on a new page

1. **Server action (CSV)**
   - Add `exportXxxData(filters?)` in `src/lib/actions/[module].ts`.
   - Return `{ csvContent, filename }`.
   - Escape values and join with commas; ensure RFC-safe quoting.

2. **Server action (Excel)**
   - Add `exportXxxExcel(filters?)` in `src/lib/actions/[module].ts`.
   - Use dynamic import: `const { default: ExcelJS } = await import('exceljs')`.
   - Build workbook, add header row, add data rows.
   - Apply number/date formats, auto width.
   - Return `{ base64, filename }`.

3. **Client UI**
   - Add two buttons/menu items in your component (CSV and Excel).
   - CSV: prepend BOM + convert `\n` to `\r\n` before `Blob`.
   - Excel: decode base64 and trigger download.

4. **Filters (optional)**
   - If your page has filters, pass them to server actions (e.g., status/date range/text search). You can use the page’s Zod filter schema for validation.

5. **Auth & Errors**
   - Server: guard with `getServerSession(authOptions)`.
   - Client: show toasts on success/failure.

---

## Troubleshooting

- **Module not found: exceljs**
  - Run `npm install exceljs`.
  - Prefer dynamic import inside the export action.

- **'import/export cannot be used outside module code'**
  - Ensure your `export...Excel()` function is not nested inside another function by mistake.
  - Keep exports at the top level of the module.

- **Excel opens CSV with wrong characters**
  - Ensure you prepend the UTF-8 BOM and use CRLF line endings on the client when creating the Blob.

- **Dates show as text in Excel**
  - Write actual `Date` objects into the sheet and set `numFmt` (e.g., `yyyy-mm-dd`).

---

## References in this repo

- Billing Statements UI: `src/components/module/admin/billing/billing-statements-export-button.tsx`
- Billing Statements actions: `src/lib/actions/billing-statements.ts` (`exportBillingStatementsData`, `exportBillingStatementsExcel`)
- Sales Invoices UI: `src/components/module/admin/billing/sales-invoices/csv-export-button.tsx`
- Sales Invoices actions: `src/lib/actions/sales-invoices.ts` (`exportSalesInvoicesData`, `exportSalesInvoicesExcel`)

Use these as working examples when wiring up other modules (e.g., Delivery Receipts, Purchase Orders, etc.).

---

## Billing-style dropdown export button (exact UI used in Billing)

This is the same dropdown pattern used in Billing (see `src/components/module/admin/billing/billing-statements-export-button.tsx`). Copy-paste and adjust the imports to your module’s actions.

```tsx
'use client';

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

// 1) Change these imports to your module
// Example for Sales Invoices:
// import { exportSalesInvoicesData as exportXxxData, exportSalesInvoicesExcel as exportXxxExcel } from "@/lib/actions/sales-invoices";
import { exportBillingStatementsData as exportXxxData, exportBillingStatementsExcel as exportXxxExcel } from "@/lib/actions/billing-statements";

export function ExportDropdownButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportXxxData(); // optionally pass filters
      if (!result?.csvContent) throw new Error("No CSV returned");

      // Excel-friendly CSV: prepend BOM + CRLF newlines
      const bom = "\uFEFF";
      const crlfContent = result.csvContent.replace(/\n/g, "\r\n");
      const blob = new Blob([bom + crlfContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({ title: "Export Successful", description: `CSV exported to ${result.filename}.` });
    } catch (error) {
      console.error("CSV export failed:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await exportXxxExcel(); // optionally pass filters
      if (!res?.base64) throw new Error("No Excel data returned");

      // Base64 -> Blob -> download
      const byteChars = atob(res.base64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNums);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = res.filename || 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({ title: "Export Successful", description: `Excel exported successfully.` });
    } catch (error) {
      console.error("Excel export failed:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Notes:
- The CSV path prepends UTF‑8 BOM and uses CRLF newlines so Windows Excel opens it cleanly without mojibake.
- The Excel path downloads a base64-encoded .xlsx generated server-side (see Excel action template above). Ensure `exceljs` is installed and imported dynamically in the server action.
- If your page supports filters, pass them to `exportXxxData(filters)` and `exportXxxExcel(filters)`.

---

## Where to place the button

In pages that render a `DataTable`, place the export dropdown in the table toolbar using the `customToolbarActions` prop.

- Example (Sales Invoices): `src/app/admin/(protected)/billing/sales-invoices/sales-invoices-data-table.tsx`

```tsx
import { SalesInvoicesExportButton } from "@/components/module/admin/billing/sales-invoices/sales-invoices-export-button";

return (
  <DataTable
    columns={columns}
    data={data}
    {...tableConfig}
    customToolbarActions={<SalesInvoicesExportButton />}
  />
);
```

- Example (Delivery Receipts): `src/app/admin/(protected)/billing/delivery-receipts/delivery-receipts-data-table.tsx`

```tsx
import { DeliveryReceiptsExportButton } from "@/components/module/admin/billing/delivery-receipts-export-button";

return (
  <DataTable
    columns={columns}
    data={data}
    {...tableConfig}
    customToolbarActions={<DeliveryReceiptsExportButton />}
  />
);
```

If a page does not use `DataTable` or you want the button in the page header, render it in the header actions area of the page component (e.g., near a title or filters) and keep the same dropdown component. For example:

```tsx
// Inside your page.tsx component header
<div className="flex items-center justify-between">
  <h1 className="text-xl font-semibold">Your Module</h1>
  <ExportDropdownButton />
  {/* or <SalesInvoicesExportButton /> / <DeliveryReceiptsExportButton /> */}
  {/* Keep any page filters next to it as needed */}
  {/* Render your table/content below */}
</div>
```
