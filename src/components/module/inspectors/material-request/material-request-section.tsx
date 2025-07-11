"use client"

import { useState, useEffect } from "react"
import { MaterialRequestForm } from "@/components/module/inspectors/material-request/request-form/material-request-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Package, Calendar, User } from "lucide-react"
import { format } from "date-fns"

interface WorkCenter {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  name: string
  sku: string
  unit: string
  availableQuantity: number
}

interface ProductionOrder {
  id: string
  product: {
    name: string
    sku: string
  }
  quantity: number
  status: string
  priority: string
}

interface MaterialRequest {
  id: string
  requestDate: Date
  status: string
  priority: string
  requiredDate: Date
  notes?: string
  productionOrderId?: string
  workCenter: {
    name: string
  }
  requestedBy: {
    name: string
  }
  items: {
    id: string
    quantityRequested: number
    quantityApproved?: number
    quantityFulfilled?: number
    unit: string
    notes?: string
    status: string
    inventoryItem: {
      name: string
      sku: string
    }
  }[]
}

interface MaterialRequestSectionProps {
  workCenters: WorkCenter[]
  inventoryItems: InventoryItem[]
  productionOrders: ProductionOrder[]
}

export function MaterialRequestSection({ workCenters, inventoryItems, productionOrders }: MaterialRequestSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchMaterialRequests()
  }, [])

  const fetchMaterialRequests = async () => {
    try {
      const { getMaterialRequests } = await import("../../../../lib/actions/material-request")
      const requests = await getMaterialRequests()
      setMaterialRequests(requests)
    } catch (error) {
      console.error("Error fetching material requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      const { createMaterialRequest } = await import("../../../../lib/actions/material-request")
      const result = await createMaterialRequest(data)

      if (result.success) {
        alert("Material request created successfully!")
        setShowForm(false)
        fetchMaterialRequests() // Refresh the list
      } else {
        alert("Failed to create material request")
      }
    } catch (error) {
      console.error("Error submitting request:", error)
      alert("Error creating material request")
    }
  }

  const filteredRequests = materialRequests.filter(
    (request) =>
      request.workCenter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.notes && request.notes.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-blue-100 text-blue-800"
      case "FULFILLED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="p-6">Loading material requests...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Material Requests</h3>
          <p className="text-muted-foreground">Create and manage material requests for production</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Material Request
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search material requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Material Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {searchTerm ? "No material requests match your search" : "No material requests found"}
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <CardTitle className="text-lg">Material Request #{request.id.slice(-8)}</CardTitle>
                    <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                    <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(request.requestDate), "MMM dd, yyyy")}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Request Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Requested by: {request.requestedBy.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Work Center: {request.workCenter.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Required: {format(new Date(request.requiredDate), "MMM dd, yyyy")}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-700">{request.notes}</p>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h4 className="font-medium mb-2">Requested Items ({request.items.length})</h4>
                    <div className="space-y-2">
                      {request.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <div className="font-medium">{item.inventoryItem.name}</div>
                            <div className="text-sm text-muted-foreground">SKU: {item.inventoryItem.sku}</div>
                            {item.notes && <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {item.quantityRequested} {item.unit}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantityApproved && `Approved: ${item.quantityApproved} ${item.unit}`}
                              {item.quantityFulfilled && ` | Fulfilled: ${item.quantityFulfilled} ${item.unit}`}
                            </div>
                            <Badge className={getStatusColor(item.status)} variant="outline">
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Material Request Form Modal */}
      {showForm && (
        <MaterialRequestForm
          workCenters={workCenters}
          inventoryItems={inventoryItems}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
