"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { Status } from "@prisma/client";
import { Customer } from "@/types/admin/customer";

interface FilterState {
  search: string;
  status: Status[];
  customerId: string;
  dateFrom: string;
  dateTo: string;
  fulfillmentType: string;
  fulfillmentStatus: string;
}

interface CustomerOrderFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  customers: Customer[];
}

const statusOptions: { value: Status; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "ARCHIVED", label: "Archived" },
];

const fulfillmentTypeOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "STOCK", label: "From Stock" },
  { value: "PRODUCTION", label: "Production" },
  { value: "HYBRID", label: "Hybrid" },
];

const fulfillmentStatusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "ALLOCATED", label: "Allocated" },
  { value: "PARTIALLY_FULFILLED", label: "Partially Fulfilled" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function CustomerOrderFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  customers,
}: CustomerOrderFiltersProps) {
  
  const handleStatusToggle = (status: Status) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ status: newStatus });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.status.length > 0 ||
    filters.customerId ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.fulfillmentType ||
    filters.fulfillmentStatus;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Filters</h3>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, customer, or product..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Customer Filter */}
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select 
                value={filters.customerId} 
                onValueChange={(value) => onFiltersChange({ customerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
              />
            </div>

            {/* Fulfillment Type */}
            <div className="space-y-2">
              <Label>Fulfillment Type</Label>
              <Select 
                value={filters.fulfillmentType} 
                onValueChange={(value) => onFiltersChange({ fulfillmentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {fulfillmentTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Order Status</Label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => {
                const isSelected = filters.status.includes(status.value);
                return (
                  <Badge
                    key={status.value}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleStatusToggle(status.value)}
                  >
                    {status.label}
                    {isSelected && <X className="h-3 w-3 ml-1" />}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Fulfillment Status */}
          <div className="space-y-2">
            <Label>Fulfillment Status</Label>
            <Select 
              value={filters.fulfillmentStatus} 
              onValueChange={(value) => onFiltersChange({ fulfillmentStatus: value })}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="All fulfillment statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All fulfillment statuses</SelectItem>
                {fulfillmentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Active filters:</span>
                {filters.search && (
                  <Badge variant="secondary">Search: {filters.search}</Badge>
                )}
                {filters.status.length > 0 && (
                  <Badge variant="secondary">Status: {filters.status.length} selected</Badge>
                )}
                {filters.customerId && (
                  <Badge variant="secondary">
                    Customer: {customers.find(c => c.id === filters.customerId)?.name}
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge variant="secondary">From: {filters.dateFrom}</Badge>
                )}
                {filters.dateTo && (
                  <Badge variant="secondary">To: {filters.dateTo}</Badge>
                )}
                {filters.fulfillmentType && (
                  <Badge variant="secondary">
                    Type: {fulfillmentTypeOptions.find(o => o.value === filters.fulfillmentType)?.label}
                  </Badge>
                )}
                {filters.fulfillmentStatus && (
                  <Badge variant="secondary">
                    Status: {fulfillmentStatusOptions.find(o => o.value === filters.fulfillmentStatus)?.label}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
