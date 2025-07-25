"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Truck, FileText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Import server actions, types, and components
import { getAllDeliveryReceipts, getDeliveryAnalytics } from "@/lib/actions/delivery-receipts";
import { DeliveryReceiptList } from "@/components/module/admin/billing/delivery-receipt-list";
import { 
  DeliveryReceiptWithBilling, 
  DeliveryReceiptFilters,
  DeliveryAnalytics,
  PaginatedResponse 
} from "@/types/admin/billing";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface DeliveryReceiptsContentProps {
  initialReceipts: DeliveryReceiptWithBilling[];
  initialAnalytics: DeliveryAnalytics;
}

export function DeliveryReceiptsClientContent({ 
  initialReceipts, 
  initialAnalytics 
}: DeliveryReceiptsContentProps) {
  const [receipts, setReceipts] = useState<DeliveryReceiptWithBilling[]>(initialReceipts);
  const [analytics, setAnalytics] = useState<DeliveryAnalytics>(initialAnalytics);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<DeliveryReceiptFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce filters to avoid too many API calls
  const debouncedFilters = useDebounce(currentFilters, 300);

  // Effect to handle filter changes with debouncing
  useEffect(() => {
    const fetchFilteredData = async () => {
      setIsLoading(true);
      try {
        const result = await getAllDeliveryReceipts(debouncedFilters, 1, 50);
        setReceipts(result.data);
        setTotalPages(result.pagination.totalPages);
        setCurrentPage(1); // Reset to first page when filters change
      } catch (error) {
        console.error('Error filtering delivery receipts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if this is not the initial load (when filters are applied)
    const hasFilters = Object.keys(debouncedFilters).some(key => 
      debouncedFilters[key as keyof DeliveryReceiptFilters] !== undefined
    );
    
    if (hasFilters) {
      fetchFilteredData();
    }
  }, [debouncedFilters]);

  // Handle filter changes (immediate state update, debounced API call)
  const handleFilterChange = useCallback((filters: DeliveryReceiptFilters) => {
    setCurrentFilters(filters);
  }, []);

  // Handle pagination
  const handlePageChange = useCallback(async (page: number) => {
    setIsLoading(true);
    setCurrentPage(page);

    try {
      const result = await getAllDeliveryReceipts(currentFilters, page, 50);
      setReceipts(result.data);
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters]);

  // Calculate additional metrics from current data
  const inTransitReceipts = receipts.filter(receipt => receipt.deliveryStatus === 'IN_TRANSIT').length;
  const withSignature = receipts.filter(receipt => receipt.signatureImage).length;
  const withPhoto = receipts.filter(receipt => receipt.photoEvidence).length;

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <Truck className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground truncate">
                Total Receipts
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {analytics.totalDeliveries}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {inTransitReceipts} In Transit
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-green-50/90 border border-green-200/70 dark:bg-green-950/30 dark:border-green-800/50 p-6">
          <div className="flex items-center space-x-4">
            <Truck className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground truncate">
                Delivered
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {analytics.successfulDeliveries}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.successRate.toFixed(1)}% Success Rate
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-red-50/90 border border-red-200/70 dark:bg-red-950/30 dark:border-red-800/50 p-6">
          <div className="flex items-center space-x-4">
            <Truck className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground truncate">
                Failed Deliveries
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {analytics.failedDeliveries}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Need Attention
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-purple-50/90 border border-purple-200/70 dark:bg-purple-950/30 dark:border-purple-800/50 p-6">
          <div className="flex items-center space-x-4">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground truncate">
                With Proof
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {withSignature}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {withPhoto} With Photos
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Delivery Receipts List with search and filter functionality */}
      <DeliveryReceiptList 
        receipts={receipts} 
        onFilterChange={handleFilterChange}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isLoading}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}