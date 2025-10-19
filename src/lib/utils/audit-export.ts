/**
 * Audit Report Export Utilities
 * Handles exporting audit report data to various formats (CSV, Excel, PDF, JSON)
 */

import { AuditReportData, AuditLogEntry } from "@/lib/actions/superadmin/audit-reports";

// ============================================================================
// CSV Export
// ============================================================================

export function exportAuditToCSV(reportData: AuditReportData, filename: string = "audit-report.csv") {
  if (reportData.entries.length === 0) {
    alert("No data to export");
    return;
  }

  // CSV Headers
  const headers = [
    "Timestamp",
    "User Name",
    "User Email",
    "Role",
    "Action Type",
    "Entity Type",
    "Entity ID",
    "Description",
    "IP Address",
  ];

  // Build CSV rows
  const rows = reportData.entries.map(entry => [
    new Date(entry.timestamp).toLocaleString(),
    entry.userName,
    entry.userEmail,
    entry.userRole,
    entry.actionType,
    entry.entityType || "-",
    entry.entityId || "-",
    entry.description || "-",
    entry.ipAddress || "-",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row =>
      row.map(cell => {
        // Escape cells with commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(",")
    ),
  ].join("\n");

  // Add summary header
  const summaryHeader = [
    `# Audit Report: ${reportData.summary.reportType}`,
    `# Period: ${reportData.summary.period}`,
    `# Total Entries: ${reportData.summary.totalEntries}`,
    `# Unique Users: ${reportData.summary.uniqueUsers}`,
    `# Generated: ${new Date(reportData.summary.generatedAt).toLocaleString()}`,
    "",
  ].join("\n");

  const fullContent = summaryHeader + csvContent;

  downloadFile(fullContent, filename, "text/csv;charset=utf-8;");
}

// ============================================================================
// Excel Export (CSV format compatible with Excel)
// ============================================================================

export function exportAuditToExcel(reportData: AuditReportData, filename: string = "audit-report.xlsx") {
  // For simplicity, export as CSV which Excel can open
  // In production, use a library like exceljs for true .xlsx format
  const csvFilename = filename.replace(".xlsx", ".csv");
  exportAuditToCSV(reportData, csvFilename);
}

// ============================================================================
// JSON Export
// ============================================================================

export function exportAuditToJSON(reportData: AuditReportData, filename: string = "audit-report.json") {
  const exportData = {
    metadata: {
      reportType: reportData.summary.reportType,
      period: reportData.summary.period,
      totalEntries: reportData.summary.totalEntries,
      uniqueUsers: reportData.summary.uniqueUsers,
      generatedAt: reportData.summary.generatedAt,
      actionBreakdown: reportData.summary.actionBreakdown,
    },
    entries: reportData.entries,
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, filename, "application/json;charset=utf-8;");
}

// ============================================================================
// PDF Export
// ============================================================================

export async function exportAuditToPDF(reportData: AuditReportData, filename: string = "audit-report.pdf") {
  if (reportData.entries.length === 0) {
    alert("No data to export");
    return;
  }

  // Create HTML for printing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportData.summary.reportType}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 15mm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          margin: 0;
          padding: 0;
        }
        .header {
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        h1 {
          font-size: 18px;
          margin: 0 0 10px 0;
        }
        .metadata {
          font-size: 10px;
          color: #666;
        }
        .metadata p {
          margin: 3px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          margin-top: 15px;
        }
        th {
          background-color: #4a5568;
          color: white;
          padding: 8px 6px;
          text-align: left;
          font-weight: 600;
        }
        td {
          border: 1px solid #e2e8f0;
          padding: 6px;
          vertical-align: top;
        }
        tr:nth-child(even) {
          background-color: #f7fafc;
        }
        .summary {
          margin-top: 20px;
          padding: 15px;
          background-color: #f0f4f8;
          border-radius: 5px;
        }
        .summary h2 {
          font-size: 14px;
          margin: 0 0 10px 0;
        }
        .action-breakdown {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          font-size: 9px;
        }
        .action-item {
          padding: 5px;
          background: white;
          border-radius: 3px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportData.summary.reportType}</h1>
        <div class="metadata">
          <p><strong>Period:</strong> ${reportData.summary.period}</p>
          <p><strong>Generated:</strong> ${new Date(reportData.summary.generatedAt).toLocaleString()}</p>
          <p><strong>Total Entries:</strong> ${reportData.summary.totalEntries.toLocaleString()}</p>
          <p><strong>Unique Users:</strong> ${reportData.summary.uniqueUsers}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 12%;">Timestamp</th>
            <th style="width: 15%;">User</th>
            <th style="width: 10%;">Role</th>
            <th style="width: 15%;">Action</th>
            <th style="width: 12%;">Entity</th>
            <th style="width: 28%;">Description</th>
            <th style="width: 8%;">IP</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.entries
            .slice(0, 500) // Limit to 500 for PDF
            .map(
              entry => `
            <tr>
              <td>${new Date(entry.timestamp).toLocaleString()}</td>
              <td>${escapeHtml(entry.userName)}<br/><small style="color: #666;">${escapeHtml(entry.userEmail)}</small></td>
              <td>${escapeHtml(entry.userRole)}</td>
              <td>${escapeHtml(entry.actionType)}</td>
              <td>${entry.entityType ? escapeHtml(entry.entityType) : "-"}<br/><small style="color: #666;">${entry.entityId || "-"}</small></td>
              <td>${entry.description ? escapeHtml(entry.description.substring(0, 100)) : "-"}</td>
              <td><small>${entry.ipAddress || "-"}</small></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      ${
        reportData.entries.length > 500
          ? `<p style="margin-top: 10px; color: #666; font-style: italic;">Note: Showing first 500 of ${reportData.entries.length} entries. Export to CSV/JSON for complete data.</p>`
          : ""
      }

      <div class="summary">
        <h2>Action Breakdown</h2>
        <div class="action-breakdown">
          ${Object.entries(reportData.summary.actionBreakdown)
            .sort((a, b) => b[1] - a[1])
            .map(
              ([action, count]) => `
            <div class="action-item">
              <strong>${escapeHtml(action)}:</strong> ${count}
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <p class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
          Print / Save as PDF
        </button>
      </p>
    </body>
    </html>
  `;

  // Open in new window for printing
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

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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
