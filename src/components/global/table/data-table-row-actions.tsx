// src/components/global/table/data-table-row-actions.tsx
"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableRowActionsProps, RowAction } from "./types";

export function DataTableRowActions<TData>({
  row,
  actions = [],
}: DataTableRowActionsProps<TData>) {
  if (actions.length === 0) {
    return null;
  }

  const router = useRouter();

  const handleAction = (action: RowAction<TData>) => {
    const isDisabled = action.disabled ? action.disabled(row) : false;
    if (isDisabled) {
      return;
    }

    if (typeof action.onClick === "function") {
      action.onClick(row);
      return;
    }

    if (action.href) {
      const targetHref =
        typeof action.href === "function" ? action.href(row) : action.href;

      if (targetHref) {
        router.push(targetHref);
      }
    }
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
      <DropdownMenuContent align="end" className="w-[160px]">
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => handleAction(action)}
            disabled={action.disabled ? action.disabled(row) : false}
            className={
              action.variant === "destructive"
                ? "text-destructive focus:text-destructive"
                : ""
            }
          >
            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
