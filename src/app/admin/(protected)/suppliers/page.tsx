import { Metadata } from "next";
import { CreateSupplierDialog } from '@/components/module/admin/suppliers/create-supplier-dialog'
import { EditSupplierDialog } from '@/components/module/admin/suppliers/edit-supplier-dialog'
import { DeleteSupplierDialog } from '@/components/module/admin/suppliers/delete-supplier-dialog'
import { getAllSuppliers } from "@/lib/actions/suppliers"
import { Supplier } from "@prisma/client"
import { Pencil, Trash, MoreHorizontal } from "lucide-react"
import { revalidatePath } from "next/cache"
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout"
import { DataTable } from "@/components/global/table/data-table"
import { 
  createSelectionColumn,
  createTextColumn,
  createStatusColumn,
} from "@/components/global/table/column-helpers"
import { getTableConfig } from "@/components/global/table/table-utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const metadata: Metadata = {
  title: "Suppliers",
  description: "Manage your suppliers and vendor relationships",
};

// Server action to refresh data
async function refreshData() {
  "use server";
  revalidatePath("/admin/suppliers");
}

export default async function SuppliersPage() {
  const suppliers = await getAllSuppliers();

  // Create columns using the global table helpers
  const columns = [
    createSelectionColumn<Supplier>(),
    createTextColumn<Supplier>("name", "Supplier Name", "code"),
    {
      accessorKey: "contactPerson",
      header: "Contact Person",
      cell: ({ row }) => {
        const contactPerson = row.getValue("contactPerson") as string;
        const email = row.original.email;
        const phone = row.original.phone;
        return (
          <div>
            <div className="font-medium">{contactPerson}</div>
            <div className="text-xs text-muted-foreground">{email}</div>
            <div className="text-xs text-muted-foreground">{phone}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: "Location",
      cell: ({ row }) => {
        const address = row.original.address;
        const city = row.original.city;
        const country = row.original.country;
        if (!address && !city && !country) return "-";
        return (
          <div className="text-sm">
            {address && <div>{address}</div>}
            {(city || country) && (
              <div className="text-muted-foreground">
                {[city, country].filter(Boolean).join(", ")}
              </div>
            )}
          </div>
        );
      },
    },
    createStatusColumn<Supplier>("status"),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <EditSupplierDialog
                supplier={supplier}
                onSuccess={refreshData}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                }
              />
              <DeleteSupplierDialog
                supplier={supplier}
                onSuccess={refreshData}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // Get predefined table config
  const tableConfig = getTableConfig("suppliers");

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Suppliers</PageTitle>
          <PageDescription>
            Manage your suppliers and vendor relationships
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <CreateSupplierDialog onSuccess={refreshData} />
        </PageHeaderActions>
      </PageHeader>

      <SectionCard heading="All Suppliers">
        <DataTable
          columns={columns}
          data={suppliers}
          {...tableConfig}
        />
      </SectionCard>
    </PageContainer>
  );
}
