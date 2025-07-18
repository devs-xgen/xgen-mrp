// // src/components/module/admin/production/data-table-row-actions.tsx
// "use client"

// import { useState } from "react"
// import { Row } from "@tanstack/react-table"
// import { useRouter } from "next/navigation"
// import { 
//   MoreHorizontal, 
//   EyeIcon, 
//   PlayCircle, 
//   Trash2, 
//   AlertTriangle,
//   Loader2,
//   ShieldAlert,
//   Calendar,
//   Package,
//   Clock
// } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Badge } from "@/components/ui/badge"
// import { Separator } from "@/components/ui/separator"
// import { useToast } from "@/hooks/use-toast"
// import { deleteProductionOrder } from "@/lib/actions/production-order"
// import { ProductionOrderColumn } from "@/types/admin/production-order"
// import { ProductionOrderActionDialog } from './production-order-action-dialog'
// import { PreProductionVerificationDialog } from './pre-production-verification-dialog'
// import { formatDate } from "@/lib/utils"

// interface DataTableRowActionsProps {
//   row: Row<ProductionOrderColumn>
//   onSuccess?: () => Promise<void>
// }

// export function DataTableRowActions({ row, onSuccess }: DataTableRowActionsProps) {
//   const router = useRouter()
//   const { toast } = useToast()
//   const [isLoading, setIsLoading] = useState(false)
//   const [dialogOpen, setDialogOpen] = useState(false)
//   const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [confirmationText, setConfirmationText] = useState("")
  
//   const productionOrder = row.original

//   const handleView = () => {
//     router.push(`/admin/production/${productionOrder.id}`)
//   }

//   const handleStartProduction = async () => {
//     // This will be called from the verification dialog
//     try {
//       const { updateProductionOrderStatus } = await import("@/lib/actions/production-order")
//       await updateProductionOrderStatus(productionOrder.id, "IN_PROGRESS")
      
//       toast({
//         title: "✅ Production Started",
//         description: `Production for "${productionOrder.productName}" has been started successfully`,
//       })
      
//       // Refresh the page to update the list
//       if (onSuccess) {
//         await onSuccess()
//       } else {
//         window.location.reload()
//       }
//     } catch (error) {
//       throw error // Re-throw to let the dialog handle it
//     }
//   }

//   const handleDelete = async () => {
//     try {
//       setIsDeleting(true)
      
//       await deleteProductionOrder(productionOrder.id)
      
//       toast({
//         title: "✅ Success",
//         description: `Production order "${productionOrder.productName}" has been deleted successfully`,
//       })
      
//       setDeleteDialogOpen(false)
//       setConfirmationText("")
      
//       // Refresh the page to update the list
//       if (onSuccess) {
//         await onSuccess()
//       } else {
//         window.location.reload()
//       }
//     } catch (error) {
//       toast({
//         title: "❌ Delete Failed", 
//         description: error instanceof Error ? error.message : "Failed to delete production order",
//         variant: "destructive",
//       })
//     } finally {
//       setIsDeleting(false)
//     }
//   }

//   const handleCancelDelete = () => {
//     setDeleteDialogOpen(false)
//     setConfirmationText("")
//   }

//   // Check if order can be deleted (business rules)
//   const canDelete = productionOrder.status === "PENDING" || productionOrder.status === "CANCELLED"
//   const deleteTooltip = canDelete 
//     ? "Delete this production order"
//     : "Cannot delete orders that are in progress or completed"

//   // Check if confirmation text matches
//   const confirmationRequired = "DELETE"
//   const isConfirmationValid = confirmationText.toUpperCase() === confirmationRequired

//   // Get status color
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "PENDING": return "bg-yellow-500"
//       case "IN_PROGRESS": return "bg-blue-500"
//       case "COMPLETED": return "bg-green-500"
//       case "CANCELLED": return "bg-red-500"
//       default: return "bg-gray-500"
//     }
//   }

//   return (
//     <>
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button 
//             variant="ghost" 
//             className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
//           >
//             <span className="sr-only">Open menu</span>
//             <MoreHorizontal className="h-4 w-4" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end" className="w-[180px]">
//           <DropdownMenuItem onClick={handleView}>
//             <EyeIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
//             View Details
//           </DropdownMenuItem>
          
//           {/* Pre-Production Verification - Only show for PENDING orders */}
//           {productionOrder.status === "PENDING" && (
//             <DropdownMenuItem
//               disabled={isLoading}
//               onClick={() => setVerificationDialogOpen(true)}
//             >
//               <ShieldAlert className="mr-2 h-3.5 w-3.5 text-blue-600" />
//               Verify & Start
//             </DropdownMenuItem>
//           )}
          
//           <DropdownMenuItem
//             disabled={isLoading}
//             onClick={() => setDialogOpen(true)}
//           >
//             <PlayCircle className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
//             Manage
//           </DropdownMenuItem>
          
//           <DropdownMenuSeparator />
          
//           <DropdownMenuItem
//             disabled={!canDelete || isDeleting}
//             onClick={() => setDeleteDialogOpen(true)}
//             className="text-destructive focus:text-destructive"
//             title={deleteTooltip}
//           >
//             <Trash2 className="mr-2 h-3.5 w-3.5" />
//             Delete
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>

//       {/* Pre-Production Verification Dialog */}
//       <PreProductionVerificationDialog
//         open={verificationDialogOpen}
//         onOpenChange={setVerificationDialogOpen}
//         productionOrderId={productionOrder.id}
//         onProceedToProduction={handleStartProduction}
//       />

//       {/* Production Order Action Dialog */}
//       <ProductionOrderActionDialog
//         open={dialogOpen}
//         onOpenChange={setDialogOpen}
//         productionOrderId={productionOrder.id}
//         onSuccess={onSuccess}
//       />

//       {/* Enhanced Delete Confirmation Dialog */}
//       <AlertDialog open={deleteDialogOpen} onOpenChange={handleCancelDelete}>
//         <AlertDialogContent className="max-w-lg">
//           <AlertDialogHeader>
//             <AlertDialogTitle className="flex items-center gap-2 text-destructive">
//               <ShieldAlert className="w-5 h-5" />
//               Confirm Production Order Deletion
//             </AlertDialogTitle>
//             <AlertDialogDescription asChild>
//               <div className="space-y-4">
//                 {/* Order Information */}
//                 <div className="bg-muted/50 p-4 rounded-lg space-y-3">
//                   <div className="flex items-center justify-between">
//                     <h4 className="font-medium flex items-center gap-2">
//                       <Package className="w-4 h-4" />
//                       Production Order Details
//                     </h4>
//                     <Badge 
//                       variant="outline" 
//                       className={`${getStatusColor(productionOrder.status)} text-white border-0`}
//                     >
//                       {productionOrder.status}
//                     </Badge>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-2 text-sm">
//                     <div>
//                       <span className="text-muted-foreground">Product:</span>
//                       <p className="font-medium">{productionOrder.productName}</p>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">SKU:</span>
//                       <p className="font-mono text-xs">{productionOrder.productSku}</p>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Quantity:</span>
//                       <p className="font-medium">{productionOrder.quantity} units</p>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Due Date:</span>
//                       <p className="text-xs">{formatDate(productionOrder.dueDate)}</p>
//                     </div>
//                   </div>
//                 </div>

//                 <Separator />

//                 {/* Warning Section */}
//                 <div className="space-y-3">
//                   <div className="flex items-center gap-2 text-destructive">
//                     <AlertTriangle className="w-4 h-4" />
//                     <h4 className="font-medium">This action will permanently:</h4>
//                   </div>
                  
//                   <ul className="text-sm space-y-2 pl-4">
//                     <li className="flex items-center gap-2">
//                       <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
//                       <span>Delete the production order record</span>
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
//                       <span>Release any reserved materials back to inventory</span>
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
//                       <span>Remove all associated work center operations</span>
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
//                       <span>Delete quality check records and inspections</span>
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
//                       <span>Remove BOM and material consumption data</span>
//                     </li>
//                   </ul>
//                 </div>

//                 <Separator />

//                 {/* Confirmation Input */}
//                 <div className="space-y-3">
//                   <Label htmlFor="confirmation" className="text-sm font-medium">
//                     To confirm this action, type{" "}
//                     <code className="bg-muted px-1.5 py-0.5 rounded text-destructive font-mono">
//                       {confirmationRequired}
//                     </code>{" "}
//                     below:
//                   </Label>
//                   <Input
//                     id="confirmation"
//                     value={confirmationText}
//                     onChange={(e) => setConfirmationText(e.target.value)}
//                     placeholder="Type DELETE to confirm"
//                     className={`${
//                       confirmationText && !isConfirmationValid 
//                         ? "border-destructive focus:border-destructive" 
//                         : ""
//                     }`}
//                     disabled={isDeleting}
//                   />
//                   {confirmationText && !isConfirmationValid && (
//                     <p className="text-xs text-destructive">
//                       Please type &quot;DELETE&quot; exactly as shown above
//                     </p>
//                   )}
//                 </div>

//                 <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
//                   <p className="text-sm font-medium text-red-800">
//                     ⚠️ This action cannot be undone
//                   </p>
//                   <p className="text-xs text-red-600 mt-1">
//                     Make sure you have backed up any important data before proceeding.
//                   </p>
//                 </div>
//               </div>
//             </AlertDialogDescription>
//           </AlertDialogHeader>
          
//           <AlertDialogFooter className="gap-2">
//             <AlertDialogCancel 
//               disabled={isDeleting}
//               onClick={handleCancelDelete}
//             >
//               <Clock className="mr-2 h-4 w-4" />
//               Cancel
//             </AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDelete}
//               disabled={!isConfirmationValid || isDeleting}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
//             >
//               {isDeleting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Deleting...
//                 </>
//               ) : (
//                 <>
//                   <Trash2 className="mr-2 h-4 w-4" />
//                   Permanently Delete
//                 </>
//               )}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   )
// }

"use client"

import { useState } from "react"
import type { Row } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  EyeIcon,
  PlayCircle,
  Trash2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Package,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
// Import the new deleteProductionOrder from your actions file
import { deleteProductionOrder, updateProductionOrderStatus } from "@/lib/actions/production-order"
import type { ProductionOrderColumn } from "@/types/admin/production-order"
import { ProductionOrderActionDialog } from "./production-order-action-dialog"
import { PreProductionVerificationDialog } from "./pre-production-verification-dialog"
import { formatDate } from "@/lib/utils"

interface DataTableRowActionsProps {
  row: Row<ProductionOrderColumn>
  onSuccess?: () => Promise<void>
}

export function DataTableRowActions({ row, onSuccess }: DataTableRowActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmationText, setConfirmationText] = useState("")

  const productionOrder = row.original

  const handleView = () => {
    router.push(`/admin/production/${productionOrder.id}`)
  }

  const handleStartProduction = async (notes?: string) => {
    // This will be called from the verification dialog
    try {
      // The updateProductionOrderStatus is already imported from "@/lib/actions/production-order"
      await updateProductionOrderStatus(productionOrder.id, "IN_PROGRESS", notes)

      toast({
        title: "✅ Production Started",
        description: `Production for "${productionOrder.productName}" has been started successfully. ${notes ? `Notes: ${notes}` : ""}`,
      })

      // Refresh the page to update the list
      if (onSuccess) {
        await onSuccess()
      } else {
        window.location.reload()
      }
    } catch (error) {
      throw error // Re-throw to let the dialog handle it
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      // Call the updated deleteProductionOrder action with confirmation text as notes
      await deleteProductionOrder(productionOrder.id, `User confirmed deletion by typing "${confirmationText}"`)

      toast({
        title: "✅ Success",
        description: `Production order "${productionOrder.productName}" has been deleted successfully`,
      })

      setDeleteDialogOpen(false)
      setConfirmationText("")

      // Refresh the page to update the list
      if (onSuccess) {
        await onSuccess()
      } else {
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "❌ Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete production order",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false)
    setConfirmationText("")
  }

  // Check if order can be deleted (business rules)
  const canDelete = productionOrder.status === "PENDING" || productionOrder.status === "CANCELLED"
  const deleteTooltip = canDelete
    ? "Delete this production order"
    : "Cannot delete orders that are in progress or completed"

  // Check if confirmation text matches
  const confirmationRequired = "DELETE"
  const isConfirmationValid = confirmationText.toUpperCase() === confirmationRequired

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500"
      case "IN_PROGRESS":
        return "bg-blue-500"
      case "COMPLETED":
        return "bg-green-500"
      case "CANCELLED":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={handleView}>
            <EyeIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View Details
          </DropdownMenuItem>

          {/* Pre-Production Verification - Only show for PENDING orders */}
          {productionOrder.status === "PENDING" && (
            <DropdownMenuItem disabled={isLoading} onClick={() => setVerificationDialogOpen(true)}>
              <ShieldAlert className="mr-2 h-3.5 w-3.5 text-blue-600" />
              Verify & Start
            </DropdownMenuItem>
          )}

          <DropdownMenuItem disabled={isLoading} onClick={() => setDialogOpen(true)}>
            <PlayCircle className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Manage
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!canDelete || isDeleting}
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
            title={deleteTooltip}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Pre-Production Verification Dialog */}
      <PreProductionVerificationDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
        productionOrderId={productionOrder.id}
        onProceedToProduction={handleStartProduction} // Pass handleStartProduction to the dialog
      />

      {/* Production Order Action Dialog */}
      <ProductionOrderActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productionOrderId={productionOrder.id}
        onSuccess={onSuccess}
        // You might want to pass a callback to ProductionOrderActionDialog
        // that allows it to log actions with specific notes.
        // For example: onUpdateStatus={(status, notes) => updateProductionOrderStatus(productionOrder.id, status, notes)}
      />

      {/* Enhanced Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={handleCancelDelete}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              Confirm Production Order Deletion
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {/* Order Information */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Production Order Details
                    </h4>
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(productionOrder.status)} text-white border-0`}
                    >
                      {productionOrder.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Product:</span>
                      <p className="font-medium">{productionOrder.productName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SKU:</span>
                      <p className="font-mono text-xs">{productionOrder.productSku}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <p className="font-medium">{productionOrder.quantity} units</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>
                      <p className="text-xs">{formatDate(productionOrder.dueDate)}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                {/* Warning Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="font-medium">This action will permanently:</h4>
                  </div>

                  <ul className="text-sm space-y-2 pl-4">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                      <span>Delete the production order record</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                      <span>Release any reserved materials back to inventory</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                      <span>Remove all associated work center operations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                      <span>Delete quality check records and inspections</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                      <span>Remove BOM and material consumption data</span>
                    </li>
                  </ul>
                </div>
                <Separator />
                {/* Confirmation Input */}
                <div className="space-y-3">
                  <Label htmlFor="confirmation" className="text-sm font-medium">
                    To confirm this action, type{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-destructive font-mono">
                      {confirmationRequired}
                    </code>{" "}
                    below:
                  </Label>
                  <Input
                    id="confirmation"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className={`${
                      confirmationText && !isConfirmationValid ? "border-destructive focus:border-destructive" : ""
                    }`}
                    disabled={isDeleting}
                  />
                  {confirmationText && !isConfirmationValid && (
                    <p className="text-xs text-destructive">Please type &quot;DELETE&quot; exactly as shown above</p>
                  )}
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="text-sm font-medium text-red-800">⚠️ This action cannot be undone</p>
                  <p className="text-xs text-red-600 mt-1">
                    Make sure you have backed up any important data before proceeding.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting} onClick={handleCancelDelete}>
              <Clock className="mr-2 h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!isConfirmationValid || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Permanently Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
