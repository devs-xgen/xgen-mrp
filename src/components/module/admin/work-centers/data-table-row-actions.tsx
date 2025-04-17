// src/components/module/admin/work-centers/data-table-row-actions.tsx
"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { WorkCenterDialog } from "./create-work-center-dialog";
import { DeleteWorkCenterDialog } from "./delete-work-center-dialog";
import { WorkCenterColumn } from "@/types/admin/work-center";
import { Decimal } from "@prisma/client/runtime/library";
import Link from "next/link";
import { Eye, Users, Edit, Trash } from "lucide-react";

interface DataTableRowActionsProps {
  row: Row<WorkCenterColumn>;
  onSuccess?: () => Promise<void>;
}

export function DataTableRowActions({
  row,
  onSuccess,
}: DataTableRowActionsProps) {
  if (!row.original) {
    console.error("Row original data is undefined.", row);
    return null;
  }

  const workCenterData = {
    ...row.original,
    createdAt: row.original.createdAt ?? new Date(),
    efficiencyRate: row.original.efficiencyRate,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <Link
          href={`/admin/work-centers/${row.original.id}`}
          legacyBehavior
          passHref
        >
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        </Link>

        <Link
          href={`/admin/work-centers/${row.original.id}/users`}
          legacyBehavior
          passHref
        >
          <DropdownMenuItem>
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <WorkCenterDialog workCenter={workCenterData} onSuccess={onSuccess}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        </WorkCenterDialog>

        <DeleteWorkCenterDialog
          workCenterId={row.original.id}
          workCenterName={row.original.name}
          onSuccess={onSuccess}
        >
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DeleteWorkCenterDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
