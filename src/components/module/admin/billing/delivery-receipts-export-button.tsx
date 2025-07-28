"use client";

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
import { exportDeliveryReceiptsData } from "@/lib/actions/delivery-receipts";

export function DeliveryReceiptsExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportDeliveryReceiptsData();
      
      if (!result || !result.csvContent) {
        throw new Error("No data received from export function");
      }

      const { csvContent, filename } = result;
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({
        title: "Export Successful",
        description: `Delivery receipts exported to ${filename} successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Export Failed",
        description: `Failed to export delivery receipts: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const result = await exportDeliveryReceiptsData();
      
      if (!result || !result.csvContent) {
        throw new Error("No data received from export function");
      }

      const { csvContent, filename } = result;
      
      // Create and download the CSV file (can be opened in Excel)
      const excelFilename = filename.replace('.csv', '.csv'); // Keep as CSV for Excel compatibility
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = excelFilename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({
        title: "Export Successful",
        description: `Delivery receipts exported to ${excelFilename} successfully. The CSV file can be opened in Excel.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Export Failed",
        description: `Failed to export delivery receipts: ${errorMessage}`,
        variant: "destructive",
      });
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
          Export as CSV (Excel Compatible)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}