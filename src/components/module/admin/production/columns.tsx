// src/components/module/admin/production/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ProductionOrderColumn } from "@/types/admin/production-order";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { formatCurrencyPHP } from "@/lib/constant";

export const columns: ColumnDef<ProductionOrderColumn>[] = [
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => {
      const variantDisplayName = row.original.variantDisplayName;
      return (
        <div>
          <div className="font-medium">{row.getValue("productName")}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.productSku}
            {variantDisplayName && (
              <Badge variant="outline" className="ml-2 text-xs">
                {variantDisplayName}
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantity" />
    ),
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Date" />
    ),
    cell: ({ row }) => formatDate(row.getValue("startDate")),
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => formatDate(row.getValue("dueDate")),
  },
  {
    accessorKey: "progress",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Progress" />
    ),
    cell: ({ row }) => {
      const progress = row.getValue("progress") as number;
      const status = row.getValue("status") as string;
      const productName = row.original.productName;
      const dueDate = new Date(row.getValue("dueDate"));
      const today = new Date();

      // Calculate days remaining
      const daysRemaining = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create tooltip text based on status and progress
      const getTooltipText = () => {
        if (status === "COMPLETED") {
          return `✅ Production completed for ${productName}`;
        }

        if (status === "IN_PROGRESS") {
          const remainingText =
            daysRemaining > 0
              ? `${daysRemaining} day${
                  daysRemaining !== 1 ? "s" : ""
                } remaining`
              : "Due today!";

          return `⏳ Production at ${Math.round(
            progress
          )}% for ${productName}. ${remainingText}`;
        }

        return `📝 Production planned for ${productName}. Not started yet.`;
      };

      // Determine variant based on status and days remaining
      const getVariant = () => {
        if (status === "COMPLETED") return "success";
        if (status === "IN_PROGRESS") {
          return daysRemaining < 3 ? "danger" : "warning";
        }
        return "default";
      };

      return (
        <ProgressIndicator
          value={progress}
          size="sm"
          variant={getVariant()}
          tooltipText={getTooltipText()}
          className="min-w-[80px]"
        />
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "COMPLETED"
              ? "default"
              : status === "IN_PROGRESS"
              ? "secondary"
              : "outline"
          }
        >
          {status.toLowerCase().replace("_", " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <Badge
          variant={
            priority === "HIGH"
              ? "destructive"
              : priority === "MEDIUM"
              ? "default"
              : "secondary"
          }
        >
          {priority.toLowerCase()}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "customerOrderNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer Order" />
    ),
    cell: ({ row }) => row.getValue("customerOrderNumber") || "—",
  },
  {
    accessorKey: "plannedMaterialCost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Planned Cost" />
    ),
    cell: ({ row }) => {
      const cost = row.getValue("plannedMaterialCost") as number;
      return (
        <div className="text-right font-medium">
          {formatCurrencyPHP(cost)}
        </div>
      );
    },
  },
  {
    accessorKey: "actualMaterialCost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actual Cost" />
    ),
    cell: ({ row }) => {
      const cost = row.getValue("actualMaterialCost") as number;
      return (
        <div className="text-right font-medium">
          {formatCurrencyPHP(cost)}
        </div>
      );
    },
  },
  {
    accessorKey: "materialVariance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Variance" />
    ),
    cell: ({ row }) => {
      const variance = row.getValue("materialVariance") as number;
      const isPositive = variance >= 0;
      return (
        <div className={`text-right font-medium ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}>
          {isPositive ? "+" : ""}{formatCurrencyPHP(Math.abs(variance))}
        </div>
      );
    },
  },
  {
    accessorKey: "completedQuantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Completed" />
    ),
    cell: ({ row }) => {
      const completed = row.getValue("completedQuantity") as number;
      const total = row.getValue("quantity") as number;
      return (
        <div className="text-center">
          <span className="font-medium">{completed}</span>
          <span className="text-muted-foreground"> / {total}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
