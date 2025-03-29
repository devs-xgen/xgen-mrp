// src/components/module/admin/purchase-orders/order-lines-table.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Status } from "@prisma/client";

interface OrderLine {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  status: Status;
  material: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    unitOfMeasure: {
      symbol: string;
    };
  };
  // Add any other fields your OrderLine might have
  poId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  notes?: string | null;
}

interface OrderLinesTableProps {
  orderLines: OrderLine[];
  onEditLine?: (line: OrderLine) => void;
  allowEdit?: boolean;
}

export function OrderLinesTable({
  orderLines,
  onEditLine,
  allowEdit = false,
}: OrderLinesTableProps) {
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Material</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            {allowEdit && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderLines.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={allowEdit ? 7 : 6}
                className="h-24 text-center"
              >
                No order lines found.
              </TableCell>
            </TableRow>
          ) : (
            orderLines.map((line) => {
              const lineTotal = Number(line.quantity) * Number(line.unitPrice);
              return (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">
                    {line.material.sku}
                  </TableCell>
                  <TableCell>{line.material.name}</TableCell>
                  <TableCell className="text-right">
                    {line.quantity} {line.material.unitOfMeasure.symbol}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PHP",
                    }).format(Number(line.unitPrice))}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PHP",
                    }).format(lineTotal)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(line.status) as any}>
                      {line.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  {allowEdit && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEditLine && onEditLine(line)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
