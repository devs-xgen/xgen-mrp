"use client";

import { DataTable } from "@/components/global/table/data-table";
import { 
  createSelectionColumn,
  createTextColumn,
  createStatusColumn,
  createCurrencyColumn,
} from "@/components/global/table/column-helpers";
import { getTableConfig } from "@/components/global/table/table-utils";
import { Customer } from "@prisma/client";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { EditCustomerDialog } from "@/components/module/admin/customers/edit-customer-dialog";
import Link from "next/link";

interface CustomersDataTableProps {
  data: Customer[];
  onRefresh: () => Promise<void>;
}

// Customer Actions Cell Component
function CustomerActionsCell({ 
  customer, 
  onRefresh 
}: { 
  customer: Customer; 
  onRefresh: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }

      toast({
        title: "✅ Success",
        description: `Customer "${customer.name}" has been deleted successfully`,
      });

      setDeleteOpen(false);
      await onRefresh();
    } catch (error) {
      toast({
        title: "❌ Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem asChild>
            <Link href={`/admin/customers/${customer.id}/orders`}>
              <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCustomerDialog
        customer={customer}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onRefresh}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{customer.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function CustomersDataTable({ data, onRefresh }: CustomersDataTableProps) {
  // Create columns using global table helpers
  const columns = [
    createSelectionColumn<Customer>(),
    {
      accessorKey: "name",
      header: "Customer Name",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="text-xs text-muted-foreground">Code: {customer.code}</div>
          </div>
        );
      },
    },
    createTextColumn<Customer>("contactPerson", "Contact Person"),
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return email || "-";
      },
    },
    {
      accessorKey: "phone",
      header: "Phone", 
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string;
        return phone || "-";
      },
    },
    createCurrencyColumn<Customer>("creditLimit", "Credit Limit", "PHP"),
    createStatusColumn<Customer>("status"),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <CustomerActionsCell
            customer={customer}
            onRefresh={onRefresh}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // Get predefined table config
  const tableConfig = getTableConfig("customers");

  return (
    <DataTable
      columns={columns}
      data={data}
      {...tableConfig}
    />
  );
}
