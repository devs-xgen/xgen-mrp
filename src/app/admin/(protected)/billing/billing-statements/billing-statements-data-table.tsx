"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/global/table/data-table";
import { 
  createSelectionColumn,
  createTextColumn,
  createStatusColumn,
  createCurrencyColumn,
  createDateColumn,
} from "@/components/global/table/column-helpers";
import { getTableConfig } from "@/components/global/table/table-utils";
import { BillingStatementWithRelations, BillingStatus } from "@/types/admin/billing";
import { SerializableData } from "@/lib/utils/decimal-serializer";
import { MoreHorizontal, FileText, Download, Share2, Eye, Edit, Trash2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "@/components/global/table/table-utils";
import { ShareLinkDialog } from "@/components/shared/ShareLinkDialog";

// Type alias for serialized billing statement data
type SerializedBillingStatement = SerializableData<BillingStatementWithRelations>;

interface BillingStatementsDataTableProps {
  data: SerializedBillingStatement[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onRefresh: () => void;
}

// Helper function to get status badge variant
function getStatusBadge(status: BillingStatus) {
  const statusConfig = {
    DRAFT: { variant: "outline" as const, label: "Draft" },
    SENT: { variant: "secondary" as const, label: "Sent" },
    PAID: { variant: "default" as const, label: "Paid" },
    OVERDUE: { variant: "destructive" as const, label: "Overdue" },
    PARTIALLY_PAID: { variant: "secondary" as const, label: "Partially Paid" },
    CANCELLED: { variant: "destructive" as const, label: "Cancelled" },
  };
  return statusConfig[status] || { variant: "outline" as const, label: status };
}

// Billing Statement Actions Cell Component
function BillingStatementActionsCell({ 
  statement, 
  onRefresh 
}: { 
  statement: SerializedBillingStatement; 
  onRefresh: () => void;
}) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/admin/billing/billing-statements/${statement.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/billing/billing-statements/${statement.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Statement
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Link
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/billing/billing-statements/${statement.id}/pdf`}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareLinkDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        document={{
          id: statement.id,
          type: 'billing-statement',
          title: `Billing Statement ${statement.statementNumber}`,
          description: `Statement for ${statement.customerName || 'Customer'}`
        }}
        onSuccess={() => {
          setShareDialogOpen(false);
          onRefresh();
        }}
      />
    </>
  );
}

export function BillingStatementsDataTable({ 
  data, 
  pagination,
  onRefresh 
}: BillingStatementsDataTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle URL-based filtering (inherited from original client component)
  const handleFiltersChange = (filters: {
    search?: string;
    status?: BillingStatus[];
    dateRange?: { start: Date; end: Date };
  }) => {
    const params = new URLSearchParams(searchParams);
    
    if (filters.search !== undefined) {
      if (filters.search) {
        params.set("search", filters.search);
      } else {
        params.delete("search");
      }
    }
    
    if (filters.status !== undefined) {
      if (filters.status.length > 0) {
        params.set("status", filters.status.join(","));
      } else {
        params.delete("status");
      }
    }
    
    if (filters.dateRange !== undefined) {
      if (filters.dateRange.start && filters.dateRange.end) {
        params.set("dateFrom", filters.dateRange.start.toISOString());
        params.set("dateTo", filters.dateRange.end.toISOString());
      } else {
        params.delete("dateFrom");
        params.delete("dateTo");
      }
    }
    
    // Reset to first page when filters change
    params.set("page", "1");
    
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  // Create columns using global table helpers
  const columns = [
    createSelectionColumn<SerializedBillingStatement>(),
    {
      accessorKey: "statementNumber",
      header: "Statement #",
      cell: ({ row }) => {
        const statement = row.original;
        return (
          <div className="font-medium">
            <Link 
              href={`/admin/billing/billing-statements/${statement.id}`}
              className="hover:underline"
            >
              {statement.statementNumber}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => {
        const statement = row.original;
        return (
          <div>
            <div className="font-medium">{statement.customerName || "Unknown Customer"}</div>
            {statement.customerOrder && (
              <div className="text-sm text-blue-600">
                Order #{statement.customerOrder.orderNumber}
              </div>
            )}
            {statement.billingType && (
              <Badge variant="outline" className="text-xs">
                {statement.billingType}
              </Badge>
            )}
          </div>
        );
      },
    },
    createStatusColumn<SerializedBillingStatement>("status", "Status", {
      DRAFT: { variant: "outline", label: "Draft" },
      SENT: { variant: "secondary", label: "Sent" },
      PAID: { variant: "default", label: "Paid" },
      OVERDUE: { variant: "destructive", label: "Overdue" },
      PARTIALLY_PAID: { variant: "secondary", label: "Partially Paid" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
    }),
    createCurrencyColumn<SerializedBillingStatement>("totalAmount", "Total Amount", "PHP"),
    {
      accessorKey: "paidAmount",
      header: "Paid Amount",
      cell: ({ row }) => {
        const statement = row.original;
        // Calculate paid amount based on sales invoice if it exists and is PAID
        const paidAmount = statement.salesInvoice?.status === 'PAID' ? 
          Number(statement.salesInvoice?.totalAmount || 0) : 0;
        return (
          <div className="font-medium">
            {new Intl.NumberFormat("en-PH", {
              style: "currency",
              currency: "PHP",
            }).format(paidAmount)}
          </div>
        );
      },
    },
    {
      accessorKey: "remainingBalance",
      header: "Balance",
      cell: ({ row }) => {
        const statement = row.original;
        const totalAmount = Number(statement.totalAmount || 0);
        // Calculate paid amount based on sales invoice if it exists and is PAID
        const paidAmount = statement.salesInvoice?.status === 'PAID' ? 
          Number(statement.salesInvoice?.totalAmount || 0) : 0;
        const remaining = totalAmount - paidAmount;
        
        return (
          <div className={`font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {new Intl.NumberFormat("en-PH", {
              style: "currency",
              currency: "PHP",
            }).format(remaining)}
          </div>
        );
      },
    },
    createDateColumn<SerializedBillingStatement>("billingDate", "Billing Date"),
    createDateColumn<SerializedBillingStatement>("dueDate", "Due Date"),
    {
      accessorKey: "paymentTerms",
      header: "Terms",
      cell: ({ row }) => {
        const terms = row.getValue("paymentTerms") as string;
        return <Badge variant="outline">{terms || "Standard"}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const statement = row.original;
        return (
          <BillingStatementActionsCell
            statement={statement}
            onRefresh={onRefresh}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // Get predefined table config
  const tableConfig = getTableConfig("billing-statements");

  return (
    <DataTable
      columns={columns}
      data={data}
      {...tableConfig}
    />
  );
}
