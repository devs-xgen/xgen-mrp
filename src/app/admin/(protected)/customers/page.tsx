// src/app/admin/(protected)/customers/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Customer } from "@prisma/client"
import { columns } from '@/components/module/admin/customers/columns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { CreateCustomerDialog } from '@/components/module/admin/customers/create-customer-dialog'
import { EditCustomerDialog } from '@/components/module/admin/customers/edit-customer-dialog'
import { DeleteCustomerDialog } from '@/components/module/admin/customers/delete-customer-dialog'
import { useToast } from "@/hooks/use-toast"
import { DataTable } from '@/components/module/admin/customers/data-table'

export default function CustomersPage() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch customers. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleEdit = useCallback((customer: Customer) => {
    setSelectedCustomer(customer)
    setIsEditDialogOpen(true)
  }, [])

  const handleDelete = useCallback((customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleStatusChange = useCallback(async (customerId: string, newStatus: string) => {
    await fetchCustomers()
  }, [fetchCustomers])

  const handleSuccess = useCallback(async () => {
    await fetchCustomers()
  }, [fetchCustomers])

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Customer Management</CardTitle>
              <CardDescription>Manage system customers and their details</CardDescription>
            </div>
            <CreateCustomerDialog
              onSuccess={handleSuccess}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={customers}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {selectedCustomer && (
        <>
          <EditCustomerDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            customer={selectedCustomer}
            onSuccess={async () => {
              setIsEditDialogOpen(false)
              setSelectedCustomer(null)
              await handleSuccess()
              toast({
                title: "Success",
                description: "Customer updated successfully."
              })
            }}
          />
          <DeleteCustomerDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            customer={selectedCustomer}
            onSuccess={async () => {
              setIsDeleteDialogOpen(false)
              setSelectedCustomer(null)
              await handleSuccess()
              toast({
                title: "Success",
                description: "Customer deleted successfully."
              })
            }}
          />
        </>
      )}
    </div>
  )
}
