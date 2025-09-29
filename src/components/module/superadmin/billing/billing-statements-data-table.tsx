"use client";

import { useState } from "react";
import Link from "next/link";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShareLinkDialog } from "@/components/shared/ShareLinkDialog";
import { deleteBillingStatement } from "@/lib/actions/superadmin/billing-statements";
import { toast } from "sonner";
import { SuperAdminBillingStatementsExportButton } from "./billing-statements-export-button";

type SerializedBillingStatement = SerializableData<BillingStatementWithRelations>;

interface SuperAdminBillingStatementsDataTableProps {
  data: SerializedBillingStatement[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onRefresh: () => void;
}

const STATUS_BADGE: Record<
  BillingStatus,
  { variant: "outline" | "secondary" | "default" | "destructive"; label: string }
> = {
  DRAFT: { variant: "outline", label: "Draft" },
  SENT: { variant: "secondary", label: "Sent" },
  PAID: { variant: "default", label: "Paid" },
  OVERDUE: { variant: "destructive", label: "Overdue" },
  CANCELLED: { variant: "destructive", label: "Cancelled" },
  DISPUTED: { variant: "destructive", label: "Disputed" },
  PARTIAL: { variant: "secondary", label: "Partially Paid" },
};

function BillingStatementActions({
  statement,
  onRefresh,
}: {
  statement: SerializedBillingStatement;
  onRefresh: () => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
            <Link href={`/superadmin/billing/billing-statements/${statement.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/superadmin/billing/billing-statements/${statement.id}?edit=1`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Statement
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ShareLinkDialog
            documentType="billing-statement"
            documentId={statement.id as string}
            documentTitle={`Billing Statement ${statement.statementNumber}`}
            onOpenChange={(open) => {
              if (!open) onRefresh();
            }}
            trigger={
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem asChild>
            <Link href={`/superadmin/billing/billing-statements/${statement.id}/pdf`}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Billing Statement</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the billing statement
              {statement.status !== "DRAFT" ? " (only DRAFT statements can be deleted)." : "."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  setIsDeleting(true);
                  const res = await deleteBillingStatement(statement.id as string);
                  if (res?.success) {
                    toast.success("Billing statement deleted successfully");
                    setDeleteDialogOpen(false);
                    onRefresh();
                  } else {
                    toast.error(res?.error || "Failed to delete billing statement");
                  }
                } catch (error) {
                  console.error(error);
                  toast.error("Failed to delete billing statement");
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function SuperAdminBillingStatementsDataTable({
  data,
  onRefresh,
}: SuperAdminBillingStatementsDataTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const columns = [
    createSelectionColumn<SerializedBillingStatement>(),
    createTextColumn<SerializedBillingStatement>("statementNumber", "Statement #"),
    createTextColumn<SerializedBillingStatement>("customerName", "Customer"),
    createStatusColumn<SerializedBillingStatement>("status", "Status"),
    createCurrencyColumn<SerializedBillingStatement>("totalAmount", "Total Amount", "PHP"),
    createTextColumn<SerializedBillingStatement>("paidAmount", "Paid Amount"),
    {
      id: "balance",
      header: createStatusColumn<SerializedBillingStatement>("status").header,
      cell: ({ row }: { row: { original: SerializedBillingStatement } }) => {
        const statement = row.original;
        const total = Number(statement.totalAmount || 0);
        const paid =
          statement.salesInvoice?.status === "PAID"
            ? Number(statement.salesInvoice.totalAmount || 0)
            : 0;
        const balance = total - paid;
        return (
          <div className={`font-medium ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
            {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(balance)}
          </div>
        );
      },
    },
    createDateColumn<SerializedBillingStatement>("billingDate", "Billing Date"),
    createDateColumn<SerializedBillingStatement>("dueDate", "Due Date"),
    createTextColumn<SerializedBillingStatement>("paymentTerms", "Terms"),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: SerializedBillingStatement } }) => (
        <BillingStatementActions statement={row.original} onRefresh={onRefresh} />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const tableConfig = getTableConfig("billing-statements");

  return (
    <DataTable
      columns={columns}
      data={data}
      {...tableConfig}
      customToolbarActions={<SuperAdminBillingStatementsExportButton />}
    />
  );
}
