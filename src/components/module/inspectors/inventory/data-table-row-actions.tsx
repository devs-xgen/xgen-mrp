// src/components/module/inspector/inventory/data-table-row-actions.tsx
"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, MoveHorizontal, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onSuccess?: () => Promise<void>;
}

export function DataTableRowActions<TData>({ row, onSuccess }: DataTableRowActionsProps<TData>) {
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const reportIssue = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowIssueDialog(false);
      toast({
        title: "Issue reported",
        description: `Issue reported for ${row.getValue("name")}`,
      });
    }, 1000);
  };

  const recordMovement = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowMovementDialog(false);
      toast({
        title: "Movement recorded",
        description: `Movement recorded for ${row.getValue("name")}`,
      });
    }, 1000);
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
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setShowMovementDialog(true)}>
            <MoveHorizontal className="mr-2 h-4 w-4" />
            Record Movement
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowIssueDialog(true)}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report Issue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Issue</DialogTitle>
            <DialogDescription>
              Report a discrepancy or issue for **{row.getValue("name")}**.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowIssueDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={reportIssue} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Movement</DialogTitle>
            <DialogDescription>
              Record consumption or transfer of **{row.getValue("name")}**.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMovementDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={recordMovement} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Movement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}