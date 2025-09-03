"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { CustomerOrderV2Table } from "./CustomerOrderV2Table";
import { CustomerOrderFilters } from "./CustomerOrderFilters";

import { useToast } from "@/hooks/use-toast";
import { CustomerOrder, Customer } from "@/types/admin/customer-order";
import { Product } from "@/types/admin/product";
import { Status } from "@prisma/client";
import { SectionCard } from "@/components/shared/page-layout";
import { CustomerOrderV2HeaderActions } from "@/components/module/admin/customer-order-ver/CustomerOrderV2HeaderActions";

interface CustomerOrderV2ClientProps {
  initialOrders: CustomerOrder[];
  customers: Customer[];
  products: Product[];
}

interface FilterState {
  search: string;
  status: Status[];
  customerId: string;
  dateFrom: string;
  dateTo: string;
  fulfillmentType: string;
  fulfillmentStatus: string;
}

export function CustomerOrderV2Client({
  initialOrders,
  customers,
  products,
}: CustomerOrderV2ClientProps) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<CustomerOrder[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    customerId: "",
    dateFrom: "",
    dateTo: "",
    fulfillmentType: "",
    fulfillmentStatus: "",
  });

  // Filter orders based on current filter state
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customer.name.toLowerCase().includes(searchLower) ||
          order.orderLines?.some(line => 
            line.product?.name.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(order.status)) {
        return false;
      }

      // Customer filter
      if (filters.customerId && order.customerId !== filters.customerId) {
        return false;
      }

      // Date filters
      if (filters.dateFrom) {
        const orderDate = new Date(order.orderDate);
        const fromDate = new Date(filters.dateFrom);
        if (orderDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const orderDate = new Date(order.orderDate);
        const toDate = new Date(filters.dateTo);
        if (orderDate > toDate) return false;
      }

      // Fulfillment type filter
      if (filters.fulfillmentType) {
        const hasFulfillmentType = order.orderLines?.some(line => 
          line.fulfillmentType === filters.fulfillmentType
        );
        if (!hasFulfillmentType) return false;
      }

      // Fulfillment status filter
      if (filters.fulfillmentStatus) {
        const hasFulfillmentStatus = order.orderLines?.some(line => 
          line.fulfillmentStatus === filters.fulfillmentStatus
        );
        if (!hasFulfillmentStatus) return false;
      }

      return true;
    });
  }, [orders, filters]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement refresh logic
      // const refreshedOrders = await getAllCustomerOrders();
      // setOrders(refreshedOrders);
      toast({
        title: "Orders refreshed",
        description: "Customer orders have been updated with the latest data.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh customer orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export started",
      description: "Your order data is being prepared for download.",
    });
  };

  const handleOrderCreated = (newOrder: CustomerOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    toast({
      title: "Order created",
      description: `Order ${newOrder.orderNumber} has been created successfully.`,
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: [],
      customerId: "",
      dateFrom: "",
      dateTo: "",
      fulfillmentType: "",
      fulfillmentStatus: "",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <CustomerOrderV2HeaderActions />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <CustomerOrderFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
          onClearFilters={clearFilters}
          customers={customers}
        />
      )}


      {/* Orders Table - Wrapped in SectionCard for consistent UI */}
      <SectionCard heading="All Customer Orders">
        <CustomerOrderV2Table 
          orders={filteredOrders}
          customers={customers}
          onOrderUpdate={(updatedOrder) => {
            setOrders(prev => prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            ));
          }}
        />
      </SectionCard>


    </div>
  );
}
