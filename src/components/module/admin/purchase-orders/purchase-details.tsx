"use client"

import { PurchaseOrder, Supplier, Material } from "@prisma/client"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface PurchaseOrderDetailsProps {
    purchaseOrder: PurchaseOrder & {
        supplier: Supplier
        materials: (Material & {
            quantityOrdered: number
            costPerUnit: number
        })[]
    }
}

export function PurchaseOrderDetails({ purchaseOrder }: PurchaseOrderDetailsProps) {
    // Calculate total cost of materials in the purchase order
    const totalOrderCost = purchaseOrder.materials.reduce((acc, material) => {
        return acc + Number(material.quantityOrdered) * Number(material.costPerUnit)
    }, 0)

    return (
        <Tabs defaultValue="overview" className="w-full">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="supplier">Supplier Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <span className="font-medium">PO Number: </span>
                                {purchaseOrder.poNumber}
                            </div>
                            <div>
                                <span className="font-medium">Order Date: </span>
                                {new Date(purchaseOrder.orderDate).toLocaleDateString()}
                            </div>
                            <div>
                                <span className="font-medium">Status: </span>
                                <Badge
                                    variant={
                                        purchaseOrder.status === "COMPLETED"
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {purchaseOrder.status.toLowerCase()}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Total Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${totalOrderCost.toFixed(2)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Total cost of all materials in this purchase order
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="materials">
                <Card>
                    <CardHeader>
                        <CardTitle>Materials in Purchase Order</CardTitle>
                        <CardDescription>
                            Details of materials ordered in this purchase order
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Material</TableHead>
                                    <TableHead className="text-right">Quantity Ordered</TableHead>
                                    <TableHead className="text-right">Cost per Unit</TableHead>
                                    <TableHead className="text-right">Total Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrder.materials.map((material) => (
                                    <TableRow key={material.id}>
                                        <TableCell>{material.name}</TableCell>
                                        <TableCell className="text-right">
                                            {Number(material.quantityOrdered).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${Number(material.costPerUnit).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${(
                                                Number(material.quantityOrdered) *
                                                Number(material.costPerUnit)
                                            ).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right font-medium">
                                        Total
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${totalOrderCost.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="supplier">
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="font-medium">Supplier Name: </span>
                            {purchaseOrder.supplier.name}
                        </div>
                        <div>
                            <span className="font-medium">Contact: </span>
                            {purchaseOrder.supplier.contactInfo || "N/A"}
                        </div>
                        <div>
                            <span className="font-medium">Address: </span>
                            {purchaseOrder.supplier.address || "N/A"}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
