"use client";

import { useState } from "react"
import { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Trash } from "lucide-react"
// Import the Material type directly from your project
import { Material } from "@/types/admin/materials"
// We need to convert Decimal values to number
import { EditMaterialDialog } from "./edit-material-dialog"
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteMaterial } from "@/lib/actions/materials"

interface DataTableRowActionsProps {
  row: Row<Material>
  materialTypes: { id: string; name: string }[]
  unitOfMeasures: { id: string; name: string; symbol: string }[]
  suppliers: { id: string; name: string }[]
  onSuccess?: () => Promise<void>
}

export function DataTableRowActions({ 
  row, 
  materialTypes, 
  unitOfMeasures, 
  suppliers,
  onSuccess 
}: DataTableRowActionsProps) {
  const material = row.original
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const supplierName = suppliers.find(s => s.id === material.supplierId)?.name || "Unknown Supplier"
  const materialTypeName = materialTypes.find(t => t.id === material.typeId)?.name || "Unknown Type"
  const unitOfMeasureInfo = unitOfMeasures.find(u => u.id === material.unitOfMeasureId)

    // Create an enhanced material object with the related data
  const enhancedMaterial = {
      ...material,
      // Convert any Decimal types to number
      costPerUnit: typeof material.costPerUnit === 'object' && 'toNumber' in material.costPerUnit 
        ? material.costPerUnit.toNumber() 
        : Number(material.costPerUnit),
      // Add the related data objects
      supplier: { 
        id: material.supplierId, 
        name: supplierName 
      },
      type: { 
        id: material.typeId, 
        name: materialTypeName 
      },
      unitOfMeasure: unitOfMeasureInfo ? {
        id: unitOfMeasureInfo.id,
        name: unitOfMeasureInfo.name,
        symbol: unitOfMeasureInfo.symbol
      } : undefined
    }
  

  const handleDelete = async () => {
    try {
      await deleteMaterial(material.id)
      setShowDeleteDialog(false)
      if (onSuccess) await onSuccess()
      toast({
        title: "Material deleted",
        description: `${material.name} has been deleted successfully.`,
      })
    } catch (error) {
      console.error("Error deleting material:", error)
      toast({
        title: "Error",
        description: "Failed to delete material. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Convert Decimal to number for the dialog component
  // const formatMaterialForDialog = () => {
  //   if (!material) return undefined;
    
  //   return {
  //     ...material,
  //     // Convert Decimal types to numbers
  //     costPerUnit: typeof material.costPerUnit === 'object' && 'toNumber' in material.costPerUnit 
  //       ? material.costPerUnit.toNumber() 
  //       : Number(material.costPerUnit),
  //     // Convert any other Decimal fields if needed
  //   };
  // };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <EditMaterialDialog
            material={enhancedMaterial}
            materialTypes={materialTypes}
            unitOfMeasures={unitOfMeasures}
            suppliers={suppliers}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            }
            onSuccess={onSuccess}
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive"
            onSelect={() => setShowDeleteDialog(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the material "{material.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}