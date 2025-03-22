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
  issuingBody: z.string().min(1, "Issuing body is required"),
  validityPeriod: z.coerce.number().int().min(0, "Must be a positive number"),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface Certification {
  id: string
  name: string
  issuingBody: string
  validityPeriod: number
  description?: string | null
}

interface CertificationDialogProps {
  certifications: Certification[]
  onSuccess: () => Promise<any>
}

export function CertificationDialog({ certifications, onSuccess }: CertificationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      issuingBody: "",
      validityPeriod: 12, // Default validity period of 12 months
      description: "",
    },
  })

  const resetForm = () => {
    form.reset({
      id: undefined,
      name: "",
      issuingBody: "",
      validityPeriod: 12,
      description: "",
    })
    setEditMode(false)
  }

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)

      if (editMode && data.id) {
        // Update existing certification
        const response = await fetch(`/api/certifications/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            issuingBody: data.issuingBody,
            validityPeriod: data.validityPeriod,
            description: data.description,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update certification")
        }

        toast({
          title: "Success",
          description: "Certification updated successfully",
        })
      } else {
        // Create new certification
        const response = await fetch("/api/certifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            issuingBody: data.issuingBody,
            validityPeriod: data.validityPeriod,
            description: data.description,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create certification")
        }

        toast({
          title: "Success",
          description: "Certification created successfully",
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

  const handleEdit = (certification: Certification) => {
    form.reset({
      id: certification.id,
      name: certification.name,
      issuingBody: certification.issuingBody,
      validityPeriod: certification.validityPeriod,
      description: certification.description || "",
    })
    setEditMode(true)
  }

  const handleDelete = async () => {
    if (!selectedCertification) return

    try {
      setLoading(true)
      const response = await fetch(`/api/certifications/${selectedCertification.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete certification")
      }

      toast({
        title: "Success",
        description: "Certification deleted successfully",
      })

      setDeleteDialogOpen(false)
      setSelectedCertification(null)
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

  const openDeleteDialog = (certification: Certification) => {
    setSelectedCertification(certification)
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
            Certifications
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Inspector Certifications</DialogTitle>
            <DialogDescription>
              Manage inspector certifications. These validate inspector qualifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Form for adding/editing certifications */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Certification name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="issuingBody"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuing Body</FormLabel>
                      <FormControl>
                        <Input placeholder="Organization that issues this certification" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="validityPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity Period (months)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
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

            {/* Table of existing certifications */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Issuing Body</TableHead>
                    <TableHead>Validity (months)</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No certifications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    certifications.map((certification) => (
                      <TableRow key={certification.id}>
                        <TableCell className="font-medium">{certification.name}</TableCell>
                        <TableCell>{certification.issuingBody}</TableCell>
                        <TableCell>{certification.validityPeriod}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(certification)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(certification)}
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
              This will permanently delete the certification
              {selectedCertification && <> &quot;{selectedCertification.name}&quot;</>}.
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