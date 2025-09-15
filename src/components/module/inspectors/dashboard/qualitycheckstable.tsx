// src/components/module/inspectors/dashboard/QualityChecksTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Define the type for your data
interface QualityCheck {
  id: string;
  checkDate: Date;
  status: "Passed" | "Failed" | "Pending"; // Adjust based on your enum
  defectsFound?: string | null;
  actionTaken?: string | null;
  notes?: string | null;
  productionOrder: {
    orderNumber: string;
  };
}

interface QualityChecksTableProps {
  data: QualityCheck[];
}

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "Passed":
      return "bg-green-500 text-white";
    case "Failed":
      return "bg-red-500 text-white";
    case "Pending":
      return "bg-yellow-500 text-black";
    default:
      return "bg-gray-500 text-white";
  }
};

export function QualityChecksTable({ data }: QualityChecksTableProps) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No quality checks found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Defects Found</TableHead>
            <TableHead>Action Taken</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((check) => (
            <TableRow key={check.id}>
              <TableCell className="font-medium">{check.productionOrder.orderNumber}</TableCell>
              <TableCell>{new Date(check.checkDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(check.status)}>{check.status}</Badge>
              </TableCell>
              <TableCell>{check.defectsFound || "None"}</TableCell>
              <TableCell>{check.actionTaken || "N/A"}</TableCell>
              <TableCell className="max-w-[200px] whitespace-normal">
                {check.notes || "No notes"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}