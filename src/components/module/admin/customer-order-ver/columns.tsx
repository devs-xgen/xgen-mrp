"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CustomerOrder } from "@/types/admin/customer-order";
import {
    createSelectionColumn,
    createTextColumn,
    createStatusColumn,
    createCurrencyColumn,
    createDateColumn,
    createActionsColumn,
    createSortableHeader,
} from "@/components/global/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, Edit, BarChart3, Package, Factory } from "lucide-react";

const fulfillmentTypeColors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    STOCK: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    PRODUCTION: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    HYBRID: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export const columns: ColumnDef<CustomerOrder>[] = [
    // Order Number
    createTextColumn<CustomerOrder>("orderNumber", "Order Number"),

    // Customer Name
    {
        id: "customerName",
        header: createSortableHeader("Customer"),
        accessorFn: (row) => row.customer?.name ?? "",
        cell: ({ row }) => {
            const name = row.original.customer?.name ?? "—";
            const email = row.original.customer?.email ?? null;
            return (
                <div>
                    <div className="font-medium">{name}</div>
                    {email && (
                        <div className="text-xs text-muted-foreground">{email}</div>
                    )}
                </div>
            );
        },
    },

    // Order Date
    createDateColumn<CustomerOrder>("orderDate", "Order Date"),

    // Status
    createStatusColumn<CustomerOrder>("status", "Status"),

    // Fulfillment Progress
    {
        accessorKey: "fulfillmentProgress",
        header: "Fulfillment",
        cell: ({ row }) => {
            const order = row.original;
            if (!order.orderLines || order.orderLines.length === 0) {
                return <div className="text-sm text-muted-foreground">No items</div>;
            }

            const totalItems = order.orderLines.length;
            const fulfilledItems = order.orderLines.filter(
                (line) => line.fulfillmentStatus === "FULFILLED"
            ).length;
            const progressPercent = (fulfilledItems / totalItems) * 100;

            const fulfillmentTypes = [
                ...new Set(order.orderLines.map((line) => line.fulfillmentType).filter(Boolean)),
            ] as string[];

            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Progress value={progressPercent} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground">
                            {fulfilledItems}/{totalItems}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {fulfillmentTypes.map((type) => (
                            <Badge
                                key={type}
                                variant="outline"
                                className={`text-xs ${fulfillmentTypeColors[type || "PENDING"]}`}
                            >
                                {type === "STOCK" && <Package className="h-3 w-3 mr-1" />}
                                {type === "PRODUCTION" && <Factory className="h-3 w-3 mr-1" />}
                                {type || "Pending"}
                            </Badge>
                        ))}
                    </div>
                </div>
            );
        },
    },

    // Total Amount
    createCurrencyColumn<CustomerOrder>("totalAmount", "Total Amount"),

    // Items Count
    {
        id: "items",
        header: "Items",
        cell: ({ row }) => {
            const order = row.original;
            const itemCount = order.orderLines?.length || 0;
            const totalQuantity =
                order.orderLines?.reduce((sum, line) => sum + line.quantity, 0) || 0;

            return (
                <div className="text-center">
                    <div className="font-medium">{itemCount}</div>
                    <div className="text-xs text-muted-foreground">{totalQuantity} qty</div>
                </div>
            );
        },
    },

    // Actions
    createActionsColumn<CustomerOrder>([
        {
            label: "View Details",
            icon: Eye,
            href: (order) => `/admin/customer-orders-v2/${order.id}`,
        },
        {
            label: "Edit Order",
            icon: Edit,
            href: (order) => `/admin/customer-orders-v2/${order.id}/edit`,
        },
        {
            label: "Analyze",
            icon: BarChart3,
            href: (order) => `/admin/customer-orders-v2/${order.id}/analyze`,
        },
    ]),
];
