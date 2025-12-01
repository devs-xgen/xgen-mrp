"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
    CustomerOrder,
    ProductionWorkflowPhase,
} from "@/types/admin/customer-order";
import {
    createSelectionColumn,
    createTextColumn,
    createStatusColumn,
    createCurrencyColumn,
    createDateColumn,
    createActionsColumn,
    createSortableHeader,
} from "@/components/global/table";
import { Eye, Edit, Factory, ClipboardCheck, Truck, CheckCircle2, PauseCircle, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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
            const customerId = row.original.customer?.id;
            return (
                <div>
                    <div className="font-medium flex items-center gap-1">
                        {customerId ? (
                            <Link
                                href={`/admin/customers/${customerId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                                {name}
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                        ) : (
                            name
                        )}
                    </div>
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

    // Production Workflow
    {
        id: "productionWorkflow",
        header: "Production",
        cell: ({ row }) => {
            const workflow = row.original.productionWorkflow;

            if (!workflow || !workflow.hasProduction) {
                return <span className="text-xs text-muted-foreground">Start its PO</span>;
            }

            const phaseConfig: Record<ProductionWorkflowPhase, { label: string; badgeClass: string; Icon: any; description: string }> = {
                NOT_STARTED: {
                    label: "Not Started",
                    badgeClass: "bg-gray-100 text-gray-700",
                    Icon: PauseCircle,
                    description: "Production order created, awaiting kickoff",
                },
                WORKER: {
                    label: "Worker",
                    badgeClass: "bg-amber-100 text-amber-800",
                    Icon: Factory,
                    description: "Work centers currently processing",
                },
                INSPECTOR: {
                    label: "Inspector",
                    badgeClass: "bg-blue-100 text-blue-800",
                    Icon: ClipboardCheck,
                    description: "Inspection phase in progress",
                },
                DELIVERY: {
                    label: "Delivery",
                    badgeClass: "bg-purple-100 text-purple-800",
                    Icon: Truck,
                    description: "Delivery coordination ongoing",
                },
                COMPLETED: {
                    label: "Completed",
                    badgeClass: "bg-emerald-100 text-emerald-800",
                    Icon: CheckCircle2,
                    description: "All production and delivery steps done",
                },
            };

            const config = phaseConfig[workflow.phase];

            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Badge className={`gap-1 font-normal cursor-pointer ${config.badgeClass}`}>
                            <config.Icon className="h-3.5 w-3.5" />
                            {config.label}
                        </Badge>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="space-y-2 text-xs max-w-xs">
                        <p className="font-medium">{workflow.description || config.description}</p>
                        <div className="grid gap-1">
                            <div>
                                <span className="font-semibold">Worker:</span> {workflow.worker.completed}/{workflow.worker.totalOperations || 0} ops
                            </div>
                            <div>
                                <span className="font-semibold">Inspector:</span> {workflow.inspector.completed}/{workflow.inspector.totalChecks || 0} checks
                            </div>
                            <div>
                                <span className="font-semibold">Delivery:</span> {workflow.delivery.completed}/{workflow.delivery.assigned || 0} assigned
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
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
            label: "Production Planning",
            icon: Factory,
            href: (order) => `/admin/customer-orders-v2/${order.id}/production-planning`,
        },
    ]),
];
