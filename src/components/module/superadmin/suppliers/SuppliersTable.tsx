"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SuppliersTableProps {
  initialData: any[];
}

export function SuppliersTable({ initialData }: SuppliersTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const filteredData = initialData.filter(item =>
    item.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
    item.contactName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
    item.email?.toLowerCase().includes(globalFilter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>POs</TableHead>
              <TableHead>Materials</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{supplier.contactName || "N/A"}</div>
                      <div className="text-muted-foreground">{supplier.email || ""}</div>
                    </div>
                  </TableCell>
                  <TableCell>{supplier.tenant?.name || "N/A"}</TableCell>
                  <TableCell>{supplier._count?.purchaseOrders || 0}</TableCell>
                  <TableCell>{supplier._count?.materials || 0}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.status === "ACTIVE" ? "default" : "secondary"}>
                      {supplier.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No suppliers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
