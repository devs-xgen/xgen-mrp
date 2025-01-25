// src/app/admin/(protected)/purchase-orders/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { PurchaseOrder } from "@prisma/client"
import { createColumns } from '@/components/module/admin/purchase-orders/columns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { CreatePurchaseOrderDialog } from '@/components/module/admin/purchase-orders/create-purchase-dialog'
import { EditPurchaseOrderDialog } from '@/components/module/admin/purchase-orders/edit-purchase-dialog'
import { DeletePurchaseOrderDialog } from '@/components/module/admin/purchase-orders/delete-purchase-dialog'
import { useToast } from "@/hooks/use-toast"
import { ProductDataTable } from '@/components/module/admin/purchase-orders/data-table'

export default function PurchaseOrdersPage() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/purchase-orders')
      if (!response.ok) throw new Error('Failed to fetch purchase orders')
      const data = await response.json()
      setPurchaseOrders(data)
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch purchase orders. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  const handleEdit = useCallback((purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder)
    setIsEditDialogOpen(true)
  }, [])

  const handleDelete = useCallback((purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleStatusChange = useCallback(async (purchaseOrderId: string, newStatus: string) => {
    await fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  const handleSuccess = useCallback(async () => {
    await fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Purchase Order Management</CardTitle>
              <CardDescription>Manage purchase orders and their details</CardDescription>
            </div>
            <CreatePurchaseOrderDialog
              onSuccess={handleSuccess} suppliers={[]}            />
          </div>
        </CardHeader>
        <CardContent>
          <ProductDataTable
            data={purchaseOrders}
            columns={createColumns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {selectedPurchaseOrder && (
        <>
          <EditPurchaseOrderDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            purchaseOrder={selectedPurchaseOrder}
            onSuccess={async () => {
              setIsEditDialogOpen(false)
              setSelectedPurchaseOrder(null)
              await handleSuccess()
              toast({
                title: "Success",
                description: "Purchase order updated successfully."
              })
            }}
          />
          <DeletePurchaseOrderDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            purchaseOrder={selectedPurchaseOrder}
            onSuccess={async () => {
              setIsDeleteDialogOpen(false)
              setSelectedPurchaseOrder(null)
              await handleSuccess()
              toast({
                title: "Success",
                description: "Purchase order deleted successfully."
              })
            }}
          />
        </>
      )}
    </div>
  )
}
