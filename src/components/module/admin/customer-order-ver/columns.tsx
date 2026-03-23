"use client";

import { useState } from "react";
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
    createSortableHeader,
} from "@/components/global/table";
import { Eye, Edit, Factory, ClipboardCheck, Truck, CheckCircle2, PauseCircle, ExternalLink, Archive, MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { softDeleteCustomerOrder } from "@/lib/actions/customer-order";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function CustomerOrderActionsCell({ order }: { order: CustomerOrder }) {
    const router = useRouter();
    const { toast } = useToast();
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [archiveReason, setArchiveReason] = useState("");
    const [isArchiving, setIsArchiving] = useState(false);

    const handleArchive = async () => {
        try {
            setIsArchiving(true);
            await softDeleteCustomerOrder(order.id, archiveReason || undefined);
            toast({
                title: "Order Archived",
                description: `Order ${order.orderNumber} moved to Trash. It can be restored within 30 days.`,
            });
            setArchiveOpen(false);
            setArchiveReason("");
            router.refresh();
        } catch (error) {
            toast({
                title: "Archive Failed",
                description:
                    error instanceof Error ? error.message : "Failed to archive order",
                variant: "destructive",
            });
        } finally {
            setIsArchiving(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuItem onClick={() => router.push(`/admin/customer-orders-v2/${order.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/admin/customer-orders-v2/${order.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Order
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/admin/customer-orders-v2/${order.id}/production-planning`)}>
                        <Factory className="mr-2 h-4 w-4" />
                        Production Planning
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setArchiveOpen(true)}
                        className="text-amber-600 focus:text-amber-600"
                    >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Archive Order</DialogTitle>
                        <DialogDescription>
                            Archive order {order.orderNumber} by moving it to Trash.
                            It can be restored within 30 days before being permanently deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor={`archive-reason-${order.id}`}>Reason (optional)</Label>
                        <Textarea
                            id={`archive-reason-${order.id}`}
                            placeholder="Why is this order being archived?"
                            value={archiveReason}
                            onChange={(event) => setArchiveReason(event.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setArchiveOpen(false);
                                setArchiveReason("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleArchive} disabled={isArchiving}>
                            <Archive className="mr-2 h-4 w-4" />
                            {isArchiving ? "Archiving..." : "Archive"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

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

    {
        id: "actions",
        cell: ({ row }) => <CustomerOrderActionsCell order={row.original} />,
    },
];
