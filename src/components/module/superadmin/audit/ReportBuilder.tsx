"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, FileText, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { AuditReportConfig, ReportType } from "@/lib/actions/superadmin/audit-reports";

interface ReportBuilderProps {
  config: AuditReportConfig;
  onConfigChange: (config: AuditReportConfig) => void;
}

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: "all_activity",
    label: "All Activity",
    description: "Complete activity log for all users and actions",
  },
  {
    value: "superadmin_activity",
    label: "SuperAdmin Activity",
    description: "All SuperAdmin actions and overrides",
  },
  {
    value: "production",
    label: "Production Audit Trail",
    description: "Production order changes, BOM modifications, status updates",
  },
  {
    value: "financial",
    label: "Financial Audit",
    description: "Billing, invoices, payments, and financial transactions",
  },
  {
    value: "user_access",
    label: "User Access Report",
    description: "Logins, role changes, account modifications",
  },
  {
    value: "data_modification",
    label: "Data Modifications",
    description: "All CREATE, UPDATE, DELETE operations",
  },
];

export function ReportBuilder({ config, onConfigChange }: ReportBuilderProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const { getAvailableUsers, getAvailableActionTypes, getAvailableEntityTypes } = await import(
        "@/lib/actions/superadmin/audit-reports"
      );

      const [usersResult, actionsResult, entitiesResult] = await Promise.all([
        getAvailableUsers(),
        getAvailableActionTypes(),
        getAvailableEntityTypes(),
      ]);

      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }

      if (actionsResult.success && actionsResult.data) {
        setActionTypes(actionsResult.data);
      }

      if (entitiesResult.success && entitiesResult.data) {
        setEntityTypes(entitiesResult.data);
      }
    } catch (error) {
      console.error("Error loading options:", error);
    }
  };

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    onConfigChange({
      ...config,
      startDate: start,
      endDate: end,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Report Configuration</h3>
      </div>

      <div className="space-y-6">
        {/* Report Type */}
        <div className="space-y-2">
          <Label>Report Type *</Label>
          <Select
            value={config.reportType}
            onValueChange={value =>
              onConfigChange({ ...config, reportType: value as ReportType })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range *</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !config.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.startDate ? format(config.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.startDate}
                    onSelect={date => date && onConfigChange({ ...config, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !config.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.endDate ? format(config.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.endDate}
                    onSelect={date => date && onConfigChange({ ...config, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Range Buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickRange(1)}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickRange(7)}>
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickRange(30)}>
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickRange(90)}>
              Last 90 Days
            </Button>
          </div>
        </div>

        {/* Optional Filters */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label>Optional Filters</Label>
          </div>

          {/* Filter by User */}
          <div className="space-y-2">
            <Label className="text-sm">Filter by User</Label>
            <Select
              value={config.filters?.userId || ""}
              onValueChange={value =>
                onConfigChange({
                  ...config,
                  filters: { ...config.filters, userId: value || undefined },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter by Action Type */}
          <div className="space-y-2">
            <Label className="text-sm">Filter by Action Type</Label>
            <Select
              value={config.filters?.actionTypes?.[0] || ""}
              onValueChange={value =>
                onConfigChange({
                  ...config,
                  filters: {
                    ...config.filters,
                    actionTypes: value ? [value] : undefined,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All action types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All action types</SelectItem>
                {actionTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter by Entity Type */}
          <div className="space-y-2">
            <Label className="text-sm">Filter by Entity Type</Label>
            <Select
              value={config.filters?.entityTypes?.[0] || ""}
              onValueChange={value =>
                onConfigChange({
                  ...config,
                  filters: {
                    ...config.filters,
                    entityTypes: value ? [value] : undefined,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All entity types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All entity types</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {(config.filters?.userId || config.filters?.actionTypes || config.filters?.entityTypes) && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
              <span className="text-sm font-medium">Active Filters:</span>
              {config.filters?.userId && (
                <Badge variant="secondary">
                  User: {users.find(u => u.id === config.filters?.userId)?.name || "Selected"}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() =>
                      onConfigChange({
                        ...config,
                        filters: { ...config.filters, userId: undefined },
                      })
                    }
                  />
                </Badge>
              )}
              {config.filters?.actionTypes && config.filters.actionTypes.length > 0 && (
                <Badge variant="secondary">
                  Action: {config.filters.actionTypes[0]}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() =>
                      onConfigChange({
                        ...config,
                        filters: { ...config.filters, actionTypes: undefined },
                      })
                    }
                  />
                </Badge>
              )}
              {config.filters?.entityTypes && config.filters.entityTypes.length > 0 && (
                <Badge variant="secondary">
                  Entity: {config.filters.entityTypes[0]}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() =>
                      onConfigChange({
                        ...config,
                        filters: { ...config.filters, entityTypes: undefined },
                      })
                    }
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
