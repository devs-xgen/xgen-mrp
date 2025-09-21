"use client";

import { useState } from "react";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { exportSalesInvoicesData, exportSalesInvoicesExcel } from "@/lib/actions/sales-invoices";
import { InvoiceStatus, SalesInvoiceFilters } from "@/types/admin/billing";

interface CSVExportButtonProps {
  className?: string;
}

export function CSVExportButton({ className }: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus[]>([]);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const exportCSV = async (filters?: SalesInvoiceFilters, attempt: number = 1): Promise<void> => {
    try {
      // Export with or without filters
      const result = await exportSalesInvoicesData(filters);
      
      // Create Excel-friendly CSV (prepend UTF-8 BOM and use CRLF)
      const bom = "\uFEFF";
      const crlfContent = result.csvContent.replace(/\n/g, "\r\n");
      const blob = new Blob([bom + crlfContent], { type: 'text/csv' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "Sales invoices CSV has been downloaded successfully.",
      });
    } catch (error) {
      console.error(`CSV export attempt ${attempt} failed:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const maxRetries = 3;
      
      // Check if we should retry based on error type
      const shouldRetry = attempt < maxRetries && (
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('network') ||
        errorMessage.includes('Database connection error')
      );

      if (shouldRetry) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        
        toast({
          title: `Export failed (Attempt ${attempt}/${maxRetries})`,
          description: `Retrying in ${delay / 1000} seconds...`,
          variant: "destructive",
        });

        setTimeout(() => {
          exportCSV(filters, attempt + 1);
        }, delay);
      } else {
        // Final failure or non-retryable error
        let userFriendlyMessage = "Failed to export sales invoices CSV.";
        let actionMessage = "Please try again.";

        if (errorMessage.includes('Authentication required')) {
          userFriendlyMessage = "Your session has expired.";
          actionMessage = "Please refresh the page and log in again.";
        } else if (errorMessage.includes('Admin access required')) {
          userFriendlyMessage = "You don't have permission to export invoices.";
          actionMessage = "Please contact your administrator.";
        } else if (errorMessage.includes('Export too large')) {
          userFriendlyMessage = "The export is too large.";
          actionMessage = "Please apply filters to reduce the data size.";
        } else if (errorMessage.includes('Invalid filter parameters')) {
          userFriendlyMessage = "Invalid filter settings.";
          actionMessage = "Please check your selections and try again.";
        } else if (attempt >= maxRetries) {
          userFriendlyMessage = `Failed to export after ${maxRetries} attempts.`;
          actionMessage = "Please try again later or contact support.";
        }

        toast({
          title: "Export failed",
          description: `${userFriendlyMessage} ${actionMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleQuickExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      toast({
        title: "Export started",
        description: "Your sales invoices CSV is being generated...",
      });

      await exportCSV();
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilteredExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      toast({
        title: "Export started",
        description: "Your filtered sales invoices CSV is being generated...",
      });

      // Build filters object
      const filters: SalesInvoiceFilters = {};
      
      if (selectedStatus.length > 0) {
        filters.status = selectedStatus;
      }
      
      if (dateFrom && dateTo) {
        filters.dateRange = { start: dateFrom, end: dateTo };
      }

      await exportCSV(filters);
      
      // Close dialog on success
      setIsDialogOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      setSelectedStatus([]);
    } else {
      const status = value as InvoiceStatus;
      if (selectedStatus.includes(status)) {
        setSelectedStatus(selectedStatus.filter(s => s !== status));
      } else {
        setSelectedStatus([...selectedStatus, status]);
      }
    }
  };

  const clearFilters = () => {
    setSelectedStatus([]);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Export Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleQuickExport}
        disabled={isExporting}
        className={className}
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "Exporting..." : "Export CSV"}
      </Button>

      {/* Quick Excel Export Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          if (isExporting) return;
          setIsExporting(true);
          try {
            toast({ title: "Export started", description: "Your sales invoices Excel is being generated..." });
            const res = await exportSalesInvoicesExcel();
            if (!res?.base64) throw new Error("No Excel data returned");
            const byteChars = atob(res.base64);
            const byteNums = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
            const byteArray = new Uint8Array(byteNums);
            const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = res.filename || 'sales-invoices.xlsx';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }, 100);
            toast({ title: "Export complete", description: "Sales invoices Excel has been downloaded successfully." });
          } catch (error) {
            console.error('Excel export failed:', error);
            toast({ title: "Export failed", description: "Failed to export sales invoices Excel.", variant: "destructive" });
          } finally {
            setIsExporting(false);
          }
        }}
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "Exporting..." : "Export Excel (.xlsx)"}
      </Button>

      {/* Filtered Export Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Export with Filters
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Sales Invoices CSV</DialogTitle>
            <DialogDescription>
              Configure filters to export specific sales invoices data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Status Filter */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Select onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {selectedStatus.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Selected: {selectedStatus.join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Date From</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Date To</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFilteredExport}
                disabled={isExporting}
              >
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}