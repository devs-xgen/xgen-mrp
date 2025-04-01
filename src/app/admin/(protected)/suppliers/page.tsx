'use client'

import { useState, useEffect } from 'react'
import { SupplierDataTable } from '@/components/module/admin/suppliers/data-table'
// import { PlusCircle } from 'lucide-react'
// import { Button } from '@/components/ui/button'
import type { Supplier } from "@prisma/client"
import { createColumns } from '@/components/module/admin/suppliers/columns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { CreateSupplierDialog } from '@/components/module/admin/suppliers/create-supplier-dialog'
import { EditSupplierDialog } from '@/components/module/admin/suppliers/edit-supplier-dialog'
import { DeleteSupplierDialog } from '@/components/module/admin/suppliers/delete-supplier-dialog'
import { useToast } from "@/hooks/use-toast"
import { Button } from '@/components/ui/button'

export default function SupplierPage() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Fetch suppliers from the API
  const fetchSuppliers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/suppliers')
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      const data = await response.json()
      setSuppliers(data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch suppliers. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsDeleteDialogOpen(true)
  }

  const handleStatusChange = async (supplierId: string, newStatus: string) => {
    await fetchSuppliers()
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Supplier Management</CardTitle>
              <CardDescription>Manage system suppliers and their details</CardDescription>
            </div>
            {/* Replace Button with CreateSupplierDialog */}
            <CreateSupplierDialog
              onSuccess={async () => {
                fetchSuppliers()
                toast({
                  title: "Success",
                  description: "Supplier created successfully."
                })
                return
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <SupplierDataTable
            columns={createColumns({ onSuccess: fetchSuppliers })}
            data={suppliers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {selectedSupplier && (
        <>
          <EditSupplierDialog
            open={isEditDialogOpen}
            trigger={<Button onClick={() => setIsEditDialogOpen(true)}>Edit</Button>}
            supplier={selectedSupplier}
            onSuccess={() => {
              setIsEditDialogOpen(false)
              setSelectedSupplier(null)
              fetchSuppliers()
              toast({
                title: "Success",
                description: "Supplier updated successfully."
              })
            }}
          />
          <DeleteSupplierDialog
            open={isDeleteDialogOpen}
            trigger={<Button onClick={() => setIsDeleteDialogOpen(true)}>Edit</Button>}
            supplier={selectedSupplier}
            onSuccess={() => {
              setIsDeleteDialogOpen(false)
              setSelectedSupplier(null)
              fetchSuppliers()
              toast({
                title: "Success",
                description: "Supplier deleted successfully."
              })
            }}
          />
        </>
      )}
    </div>
  )
}
