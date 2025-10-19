/**
 * Report Export Utilities
 * Handles exporting report data to various formats (CSV, Excel, PDF, JSON)
 */

import { ReportConfig } from "@/lib/actions/superadmin/analytics/reports";

// ============================================================================
// CSV Export
// ============================================================================

export function exportToCSV(data: any[], filename: string = "report.csv") {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);

  // Build CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Handle special cases
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  // Create download
  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
}

// ============================================================================
// Excel Export (CSV format compatible with Excel)
// ============================================================================

export function exportToExcel(data: any[], filename: string = "report.xlsx") {
  // For now, we'll use CSV format which Excel can open
  // In a production app, you'd use a library like xlsx or exceljs
  const csvFilename = filename.replace(".xlsx", ".csv");
  exportToCSV(data, csvFilename);
}

// ============================================================================
// JSON Export
// ============================================================================

export function exportToJSON(data: any[], config: ReportConfig, filename: string = "report.json") {
  const exportData = {
    metadata: {
      reportName: config.name || "Unnamed Report",
      description: config.description || "",
      exportedAt: new Date().toISOString(),
      totalRows: data.length,
      entities: config.entities,
      fields: config.fields,
      filters: config.filters,
    },
    data,
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, filename, "application/json;charset=utf-8;");
}

// ============================================================================
// PDF Export (Basic table format)
// ============================================================================

export async function exportToPDF(data: any[], config: ReportConfig, filename: string = "report.pdf") {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // For PDF, we'll create an HTML table and print it
  // In production, use a library like jsPDF or pdfmake

  const headers = Object.keys(data[0]);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${config.name || "Report"}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 {
          font-size: 20px;
          margin-bottom: 5px;
        }
        .metadata {
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        th {
          background-color: #4a5568;
          color: white;
          padding: 8px;
          text-align: left;
          font-weight: 600;
        }
        td {
          border: 1px solid #e2e8f0;
          padding: 6px 8px;
        }
        tr:nth-child(even) {
          background-color: #f7fafc;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <h1>${config.name || "Report"}</h1>
      <div class="metadata">
        ${config.description ? `<p>${config.description}</p>` : ""}
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Rows: ${data.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              row => `
            <tr>
              ${headers.map(h => `<td>${formatCellValue(row[h])}</td>`).join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open in new window and trigger print
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "object" && value instanceof Date) {
    return new Date(value).toLocaleDateString();
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    // ISO date string
    return new Date(value).toLocaleDateString();
  }
  return String(value);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ============================================================================
// Format helpers for specific data types
// ============================================================================

export function formatReportData(data: any[]): any[] {
  return data.map(row => {
    const formatted: any = {};
    for (const [key, value] of Object.entries(row)) {
      formatted[key] = formatCellValue(value);
    }
    return formatted;
  });
}
