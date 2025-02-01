"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface PurchaseOrderLine {
    id: string;
    material: {
        id: string;
        name: string;
        costPerUnit: number;
    };
    quantity: number;
    unitPrice: number;
    totalCost: number; // Ensure totalCost exists here
}

interface PurchaseOrderLineDetailsProps {
    orderLines: PurchaseOrderLine[];
}

export function PurchaseOrderLineDetails({ orderLines }: PurchaseOrderLineDetailsProps) {
    // Ensure totalCost is calculated properly
    const enrichedOrderLines = orderLines.map(line => ({
        ...line,
        totalCost: line.quantity * line.unitPrice, // Calculate totalCost dynamically
    }));

    const totalCost = enrichedOrderLines.reduce((acc, line) => acc + line.totalCost, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Purchase Order Lines</CardTitle>
                <CardDescription>Details of the materials ordered</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enrichedOrderLines.map((line) => (
                            <TableRow key={line.id}>
                                <TableCell>{line.material.name}</TableCell>
                                <TableCell className="text-right">{line.quantity}</TableCell>
                                <TableCell className="text-right">${line.unitPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right">${line.totalCost.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">
                                Total Cost
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                ${totalCost.toFixed(2)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
