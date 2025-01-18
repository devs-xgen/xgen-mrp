"use client"

import { Material, MaterialType, UnitOfMeasure, Supplier } from "@prisma/client"
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

interface MaterialDetailsProps {
    material: Material & {
        type: MaterialType
        unitOfMeasure: UnitOfMeasure
        supplier: Supplier
    }
}

export function MaterialDetails({ material }: MaterialDetailsProps) {
    return (
        <Tabs defaultValue="overview" className="w-full">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="supplier">Supplier Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <span className="font-medium">Name: </span>
                                {material.name}
                            </div>
                            <div>
                                <span className="font-medium">Type: </span>
                                {material.type.name}
                            </div>
                            <div>
                                <span className="font-medium">Unit: </span>
                                {material.unitOfMeasure.name} ({material.unitOfMeasure.symbol})
                            </div>
                            <div>
                                <span className="font-medium">Status: </span>
                                <Badge variant={material.status === "ACTIVE" ? "default" : "secondary"}>
                                    {material.status.toLowerCase()}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Color Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                {material.color && (
                                    <div 
                                        className="w-6 h-6 rounded-full border"
                                        style={{ backgroundColor: material.color }}
                                    />
                                )}
                                <span>{material.color || "No color specified"}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="inventory">
                <Card>
                    <CardHeader>
                        <CardTitle>Inventory Details</CardTitle>
                        <CardDescription>
                            Current stock levels and inventory management information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="font-medium mb-4">Stock Information</h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-medium">Current Stock: </span>
                                        {material.currentStock} {material.unitOfMeasure.symbol}
                                    </div>
                                    <div>
                                        <span className="font-medium">Minimum Stock Level: </span>
                                        {material.minimumStockLevel} {material.unitOfMeasure.symbol}
                                    </div>
                                    <div>
                                        <span className="font-medium">Lead Time: </span>
                                        {material.leadTime} days
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-4">Stock Status</h4>
                                <Badge
                                    variant={material.currentStock <= material.minimumStockLevel ? "destructive" : "default"}
                                >
                                    {material.currentStock <= material.minimumStockLevel ? "Low Stock" : "In Stock"}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="supplier">
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Information</CardTitle>
                        <CardDescription>
                            Details about the material supplier
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Supplier Details</h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-medium">Name: </span>
                                        {material.supplier.name}
                                    </div>
                                    <div>
                                        <span className="font-medium">Contact Person: </span>
                                        {material.supplier.contactPerson}
                                    </div>
                                    <div>
                                        <span className="font-medium">Email: </span>
                                        {material.supplier.email}
                                    </div>
                                    <div>
                                        <span className="font-medium">Phone: </span>
                                        {material.supplier.phone}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="pricing">
                <Card>
                    <CardHeader>
                        <CardTitle>Pricing Information</CardTitle>
                        <CardDescription>
                            Cost details for the material
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Cost Information</h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-medium">Cost Per Unit: </span>
                                        {new Intl.NumberFormat("en-PH", {
                                            style: "currency",
                                            currency: "PHP",
                                        }).format(Number(material.costPerUnit))}
                                        /{material.unitOfMeasure.symbol}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
} 