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
import { exportSalesInvoicesData } from "@/lib/actions/sales-invoices";
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

  const handleQuickExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      toast({
        title: "Export started",
        description: "Your sales invoices CSV is being generated...",
      });

      // Export all invoices without filters
      const result = await exportSalesInvoicesData();
      
      // Create blob from CSV content
      const blob = new Blob([result.csvContent], { type: 'text/csv' });
      
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
      console.error('Error exporting CSV:', error);
      toast({
        title: "Export failed",
        description: "Failed to export sales invoices CSV. Please try again.",
        variant: "destructive",
      });
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

      // Export with filters
      const result = await exportSalesInvoicesData(filters);
      
      // Create blob from CSV content
      const blob = new Blob([result.csvContent], { type: 'text/csv' });
      
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
        description: "Filtered sales invoices CSV has been downloaded successfully.",
      });
      
      // Close dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error exporting filtered CSV:', error);
      toast({
        title: "Export failed",
        description: "Failed to export filtered sales invoices CSV. Please try again.",
        variant: "destructive",
      });
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