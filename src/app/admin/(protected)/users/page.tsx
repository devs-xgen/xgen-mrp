'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/module/admin/users/data-table'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import type { UserData } from "@/types/admin/user"
import { columns } from '@/components/module/admin/users/columns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { CreateUserDialog } from '@/components/module/admin/users/create-user-dialog'
import { EditUserDialog } from '@/components/module/admin/users/edit-user-dialog'
import { DeleteUserDialog } from '@/components/module/admin/users/delete-user-dialog'
import { useToast } from "@/hooks/use-toast"

export default function UserManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreate = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (user: UserData) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (user: UserData) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    await fetchUsers()
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">User Management</CardTitle>
              <CardDescription>Manage system users and their roles</CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<UserData>
            columns={columns}
            data={users}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          fetchUsers()
          toast({
            title: "Success",
            description: "User created successfully."
          })
        }}
      />

      {selectedUser && (
        <>
          <EditUserDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            user={selectedUser}
            onSuccess={() => {
              setIsEditDialogOpen(false)
              setSelectedUser(null)
              fetchUsers()
              toast({
                title: "Success",
                description: "User updated successfully."
              })
            }}
          />
          <DeleteUserDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            user={selectedUser}
            onSuccess={() => {
              setIsDeleteDialogOpen(false)
              setSelectedUser(null)
              fetchUsers()
              toast({
                title: "Success",
                description: "User deleted successfully."
              })
            }}
          />
        </>
      )}
    </div>
  )
}