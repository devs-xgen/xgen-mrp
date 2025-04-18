"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Link,
  LinkOff,
  Edit,
  Eye,
  Trash,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  deleteInspector,
  toggleInspectorStatus,
  type Inspector,
} from "@/lib/actions/inspector";
import { formatPhoneNumber } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditInspectorDialog } from "./edit-inspection-dialog";
import { DeleteInspectorDialog } from "./delete-inspection-dialog";
import { ViewInspectorDialog } from "./view-inspector-dialog";
import { LinkUserDialog } from "./link-user-dialog";
import { unlinkUserFromInspector } from "@/lib/actions/user-inspector";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const columns: ColumnDef<Inspector>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ row }) => {
      const firstName = row.original.firstName;
      const lastName = row.original.lastName;

      // Check if this inspector has a linked user
      const hasUser = !!row.original.userId;

      return (
        <div className="flex items-center space-x-2">
          <div>
            <div className="font-medium">
              {firstName} {lastName}
            </div>
            <div className="text-sm text-muted-foreground">
              {row.original.email}
            </div>
          </div>
          {hasUser && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-600 border-blue-200 ml-2"
                  >
                    <Link className="h-3 w-3 mr-1" />
                    User Linked
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This inspector is linked to a user account</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "isActive",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return isActive ? (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="mr-1 h-3 w-3" /> Active
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="mr-1 h-3 w-3" /> Inactive
        </Badge>
      );
    },
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => {
      const department = row.getValue("department");
      return department ? (
        <div>{department as string}</div>
      ) : (
        <div className="text-muted-foreground text-sm">Not assigned</div>
      );
    },
  },
  {
    accessorKey: "specialization",
    header: "Specialization",
    cell: ({ row }) => {
      const specialization = row.getValue("specialization");
      return specialization ? (
        <div>{specialization as string}</div>
      ) : (
        <div className="text-muted-foreground text-sm">None</div>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => {
      const phoneNumber = row.getValue("phoneNumber") as string | null;
      return phoneNumber ? (
        <div>{formatPhoneNumber(phoneNumber)}</div>
      ) : (
        <div className="text-muted-foreground text-sm">Not provided</div>
      );
    },
  },
  {
    accessorKey: "yearsOfExperience",
    header: "Experience",
    cell: ({ row }) => {
      const years = row.getValue("yearsOfExperience") as number | null;
      return years !== null && years !== undefined ? (
        <div>
          {years} {years === 1 ? "year" : "years"}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">N/A</div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const inspector = row.original;
      const isActive = inspector.isActive;
      const hasUser = !!inspector.userId;

      // Create stateful components using a function that returns a component
      function ActionsCell() {
        const router = useRouter();
        const { toast } = useToast();
        const [showViewDialog, setShowViewDialog] = useState(false);
        const [showEditDialog, setShowEditDialog] = useState(false);
        const [showDeleteDialog, setShowDeleteDialog] = useState(false);
        const [showLinkDialog, setShowLinkDialog] = useState(false);
        const [isLoading, setIsLoading] = useState(false);

        const handleStatusToggle = async () => {
          try {
            setIsLoading(true);
            await toggleInspectorStatus(inspector.inspectorId, !isActive);
            toast({
              title: "Success",
              description: `Inspector ${
                isActive ? "deactivated" : "activated"
              } successfully`,
            });
            router.refresh();
          } catch (error) {
            toast({
              title: "Error",
              description:
                error instanceof Error
                  ? error.message
                  : `Failed to ${
                      isActive ? "deactivate" : "activate"
                    } inspector`,
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        };

        const handleUnlinkUser = async () => {
          if (!inspector.inspectorId) return;

          if (
            !confirm(
              "Are you sure you want to unlink the user from this inspector?"
            )
          ) {
            return;
          }

          try {
            setIsLoading(true);
            await unlinkUserFromInspector(inspector.inspectorId);
            toast({
              title: "Success",
              description: "User unlinked from inspector successfully",
            });
            router.refresh();
          } catch (error) {
            toast({
              title: "Error",
              description:
                error instanceof Error
                  ? error.message
                  : "Failed to unlink user",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
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
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleStatusToggle}
                  disabled={isLoading}
                >
                  {isActive ? (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {hasUser ? (
                  <DropdownMenuItem
                    onClick={handleUnlinkUser}
                    disabled={isLoading}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Unlink User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setShowLinkDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Link User
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ViewInspectorDialog
              inspector={inspector}
              open={showViewDialog}
              onOpenChange={setShowViewDialog}
              onEdit={() => {
                setShowViewDialog(false);
                setShowEditDialog(true);
              }}
              onDelete={() => {
                setShowViewDialog(false);
                setShowDeleteDialog(true);
              }}
            />

            <EditInspectorDialog
              inspector={inspector}
              departments={[]}
              specializations={[]}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
            />

            <DeleteInspectorDialog
              inspector={inspector}
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            />

            <LinkUserDialog
              inspector={inspector}
              open={showLinkDialog}
              onOpenChange={setShowLinkDialog}
              onSuccess={() => {
                router.refresh();
              }}
            />
          </>
        );
      }

      return <ActionsCell />;
    },
  },
];
