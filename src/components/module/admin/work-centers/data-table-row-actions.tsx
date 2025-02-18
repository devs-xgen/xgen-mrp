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
} from "@/components/ui/dropdown-menu";
import { WorkCenterDialog } from "./create-work-center-dialog";
import { DeleteWorkCenterDialog } from "./delete-work-center-dialog";
import { WorkCenterColumn } from "@/types/admin/work-center";

interface DataTableRowActionsProps {
  row: Row<WorkCenterColumn>;
  onSuccess?: () => Promise<void>;
}

export function DataTableRowActions({
  row,
  onSuccess,
}: DataTableRowActionsProps) {
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
      <DropdownMenuContent align="end" className="w-[160px]">
        <WorkCenterDialog workCenter={row.original} onSuccess={onSuccess}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
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
            Delete
          </DropdownMenuItem>
        </DeleteWorkCenterDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
