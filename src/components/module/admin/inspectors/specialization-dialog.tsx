"use client"

import { useState } from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Plus, Trash } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define the form schema
const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface Specialization {
  id: string
  name: string
  description?: string | null
}

interface SpecializationDialogProps {
  specializations: Specialization[]
  onSuccess: () => Promise<any>
}

export function SpecializationDialog({ specializations, onSuccess }: SpecializationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSpecialization, setSelectedSpecialization] = useState<Specialization | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const resetForm = () => {
    form.reset({
      id: undefined,
      name: "",
      description: "",
    })
    setEditMode(false)
  }

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)

      if (editMode && data.id) {
        // Update existing specialization
        const response = await fetch(`/api/specializations/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            description: data.description,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update specialization")
        }

        toast({
          title: "Success",
          description: "Specialization updated successfully",
        })
      } else {
        // Create new specialization
        const response = await fetch("/api/specializations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            description: data.description,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create specialization")
        }

        toast({
          title: "Success",
          description: "Specialization created successfully",
        })
      }

      resetForm()
      await onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (specialization: Specialization) => {
    form.reset({
      id: specialization.id,
      name: specialization.name,
      description: specialization.description || "",
    })
    setEditMode(true)
  }

  const handleDelete = async () => {
    if (!selectedSpecialization) return

    try {
      setLoading(true)
      const response = await fetch(`/api/specializations/${selectedSpecialization.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete specialization")
      }

      toast({
        title: "Success",
        description: "Specialization deleted successfully",
      })

      setDeleteDialogOpen(false)
      setSelectedSpecialization(null)
      await onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openDeleteDialog = (specialization: Specialization) => {
    setSelectedSpecialization(specialization)
    setDeleteDialogOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => {
        setOpen(open)
        if (!open) resetForm()
      }}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Specializations
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Inspector Specializations</DialogTitle>
            <DialogDescription>
              Manage inspector specializations. These are used to categorize inspector expertise.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Form for adding/editing specializations */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Specialization name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  {editMode && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editMode ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </Form>

            {/* Table of existing specializations */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specializations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No specializations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    specializations.map((specialization) => (
                      <TableRow key={specialization.id}>
                        <TableCell className="font-medium">{specialization.name}</TableCell>
                        <TableCell>{specialization.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(specialization)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(specialization)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the specialization
              {selectedSpecialization && <> &quot;{selectedSpecialization.name}&quot;</>}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}