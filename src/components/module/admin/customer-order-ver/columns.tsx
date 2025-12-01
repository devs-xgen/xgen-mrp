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
import { Eye, Edit, Factory } from "lucide-react";

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

    // Status (primary state admins care about)
    createStatusColumn<CustomerOrder>("status", "Status"),

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
            label: "Production Planning",
            icon: Factory,
            href: (order) => `/admin/customer-orders-v2/${order.id}/production-planning`,
        },
    ]),
];
