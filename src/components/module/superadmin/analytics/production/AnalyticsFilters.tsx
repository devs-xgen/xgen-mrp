"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { Calendar as CalendarIcon, Download, RefreshCw } from "lucide-react";
import { ProductionAnalyticsFilters } from "@/lib/actions/superadmin/analytics/production";

interface AnalyticsFiltersProps {
  filters: ProductionAnalyticsFilters;
  tenants: Array<{ id: string; name: string }>;
  onFiltersChange: (filters: ProductionAnalyticsFilters) => void;
  onRefresh: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export function AnalyticsFilters({
  filters,
  tenants,
  onFiltersChange,
  onRefresh,
  onExport,
  isLoading,
}: AnalyticsFiltersProps) {
  const updateFilter = (key: keyof ProductionAnalyticsFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const applyPreset = (preset: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (preset) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case "last7days":
        startDate = subDays(now, 7);
        break;
      case "last30days":
        startDate = subDays(now, 30);
        break;
      case "thisMonth":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "thisYear":
        startDate = startOfYear(now);
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      startDate,
      endDate,
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Range Presets */}
          <div className="space-y-2">
            <Label>Quick Range</Label>
            <Select onValueChange={applyPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select preset..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    format(filters.startDate, "MMM dd, yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => date && updateFilter("startDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? (
                    format(filters.endDate, "MMM dd, yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => date && updateFilter("endDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tenant Filter */}
          <div className="space-y-2">
            <Label>Tenant</Label>
            <Select
              value={filters.tenantId || "all"}
              onValueChange={(value) => updateFilter("tenantId", value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Label>Actions</Label>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
              {onExport && (
                <Button variant="outline" onClick={onExport} disabled={isLoading}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Filters (Optional - can be expanded) */}
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status (Optional)</Label>
            <Select
              value={filters.status?.[0] || "all"}
              onValueChange={(value) =>
                updateFilter("status", value === "all" ? undefined : [value])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <Label>Priority (Optional)</Label>
            <Select
              value={filters.priority?.[0] || "all"}
              onValueChange={(value) =>
                updateFilter("priority", value === "all" ? undefined : [value])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
