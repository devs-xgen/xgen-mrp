// // src/app/admin/(protected)/production/[id]/page.tsx
// import { ArrowLeft } from "lucide-react";
// import { Metadata } from "next";
// import Link from "next/link";
// import { notFound } from "next/navigation";
// import { ProductionQRGenerator } from "@/components/module/admin/production/production-qr-generator";
// import { ProductionWorkflowProgressButton } from "@/components/module/admin/production/production-workflow-progress-button";
// import { Button } from "@/components/ui/button";
// import { getDeliveryUsers, getDeliveryAssignment } from "@/lib/actions/delivery/delivery-assignment";
// import { getActiveInspectors } from "@/lib/actions/inspector";
// import { getProductionOrderWithPhaseStatus } from "@/lib/actions/production-order";
// import { convertDecimals } from "@/lib/convertDecimals";

// import { getAvailableWorkCenters } from "@/lib/actions/inspector/production-order";
// import { ProductionOrderDetails } from "@/components/module/admin/production/production-order-details";

// interface ProductionOrderPageProps {
//   params: Promise<{
//     id: string;
//   }>;
// }

// export async function generateMetadata({
//   params,
// }: ProductionOrderPageProps): Promise<Metadata> {
//   const { id } = await params;
//   const orderData = await getProductionOrderWithPhaseStatus(id);
//   if (!orderData) return { title: "Production Order Not Found" };

//   return {
//     title: `Production Order - ${orderData.product.name}`,
//     description: `Details for production order of ${orderData.quantity} units of ${orderData.product.name}`,
//   };
// }

// export default async function ProductionOrderPage({
//   params,
// }: ProductionOrderPageProps) {
//   const { id } = await params;
  
//   // Get enhanced production order data with phase status
//   const [orderDataRaw, workCenters, deliveryUsers] = await Promise.all([
//     getProductionOrderWithPhaseStatus(id),
//     getAvailableWorkCenters(),
//     getDeliveryUsers(),
//   ]);

//   if (!orderDataRaw) notFound();

//   // Convert Decimal fields to numbers for client component compatibility
//   const orderData = convertDecimals(orderDataRaw);

//   console.log("Enhanced order data with phase status:", JSON.stringify(orderData, null, 2));

//   const allInspectors = await getActiveInspectors(); // fetch once
//   const inspectorsMap = new Map();

//   for (const inspector of allInspectors) {
//     inspectorsMap.set(inspector.inspectorId, `${inspector.firstName} ${inspector.lastName}`);
//   }

//   // Transform the data to include all required properties (Decimals already converted)
//   const order = {
//     ...orderData,
    
//     // Transform qualityChecks to include all required properties
//     qualityChecks: orderData.qualityChecks.map((check: any) => ({
//       id: check.id,
//       productionOrderId: check.productionOrderId,
//       inspectorId: check.inspectorId,
//       inspectorName: inspectorsMap.get(check.inspectorId) || "Unknown",
//       checkDate: check.checkDate.toISOString(),
//       status: check.status,
//       defectsFound: check.defectsFound,
//       actionTaken: check.actionTaken,
//       notes: check.notes,
//       createdAt: check.createdAt,
//       updatedAt: check.updatedAt,
//       productionOrder: {
//         product: {
//           name: orderData.product.name,
//           sku: orderData.product.sku,
//         },
//       },
//     })),
    
//     // Use the enhanced delivery info
//     deliveryAssignment: orderData.deliveryInfo,
//   };

//   return (
//     <div className="container mx-auto px-4 py-6 max-w-7xl">
//       <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div className="flex items-center">
//           <Link href="/admin/production" className="mr-4">
//             <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0 mr-2">
//               <ArrowLeft className="h-5 w-5" />
//               <span className="sr-only">Back</span>
//             </Button>
//           </Link>
//           <div>
//             <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
//               {order.product.name}
//               {order.productVariant && (
//                 <span className="text-lg font-normal text-muted-foreground">
//                   - {order.productVariant.displayName}
//                 </span>
//               )}
//             </h1>
//             <p className="text-muted-foreground">
//               Production Order #{order.id.substring(0, 8)}
//               {order.productVariant && (
//                 <span className="ml-2 text-xs">
//                   (Variant: {order.productVariant.sku})
//                 </span>
//               )}
//             </p>
//           </div>
//         </div>
        
//         <div className="flex flex-col sm:flex-row gap-3">
//           <ProductionWorkflowProgressButton
//             productionOrderId={orderData.id}
//             currentStatus={orderData.status}
//             className="sm:w-auto"
//           />
          
//           <ProductionQRGenerator
//             order={{
//               id: orderData.id,
//               product: {
//                 name: orderData.product.name,
//                 sku: orderData.product.sku,
//               },
//               productVariant: orderData.productVariant ? {
//                 displayName: orderData.productVariant.displayName,
//                 sku: orderData.productVariant.sku,
//               } : undefined,
//               quantity: orderData.quantity,
//               startDate: orderData.startDate,
//               dueDate: orderData.dueDate,
//               status: orderData.status,
//               priority: orderData.priority,
//               delivery: {
//                 address: orderData.deliveryInfo?.deliveryAddress || "Not Assigned",
//                 contactName: orderData.deliveryInfo?.userName || "Not Assigned",
//                 contactPhone: "Not Assigned",
//                 estimatedDelivery: orderData.deliveryInfo?.scheduledDate || new Date(),
//                 instructions: orderData.deliveryInfo?.notes || "Not Assigned"
//               },
//               assignments: {
//                 qualityInspector: order.qualityChecks?.[0]?.inspectorName || "Not Assigned",
//                 logisticsCoordinator: orderData.deliveryInfo?.userName || "Not Assigned"
//               }
//             }}
//           />
//         </div>
//       </div>

//       {/* Production Order Details - Full width now */}
//       <div className="w-full">
//         <ProductionOrderDetails
//           order={order as any}
//           workCenters={workCenters}
//           deliveryUsers={deliveryUsers}
//         />
//       </div>
//     </div>
//   );
// }
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ProductionQRGenerator } from "@/components/module/admin/production/production-qr-generator"
import { ProductionWorkflowProgressButton } from "@/components/module/admin/production/production-workflow-progress-button"
import { Button } from "@/components/ui/button"
import { getDeliveryUsers } from "@/lib/actions/delivery/delivery-assignment" // Removed getDeliveryAssignment as it's fetched within ProductionOrderDetails
import { getActiveInspectors } from "@/lib/actions/inspector"
import { getProductionOrderWithPhaseStatus } from "@/lib/actions/production-order"
import { convertDecimals } from "@/lib/convertDecimals"
import { getAvailableWorkCenters } from "@/lib/actions/inspector/production-order"
import { ProductionOrderDetails } from "@/components/module/admin/production/production-order-details"

interface ProductionOrderPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ProductionOrderPageProps): Promise<Metadata> {
  const { id } = params
  const orderData = await getProductionOrderWithPhaseStatus(id)
  if (!orderData) return { title: "Production Order Not Found" }
  return {
    title: `Production Order - ${orderData.product.name}`,
    description: `Details for production order of ${orderData.quantity} units of ${orderData.product.name}`,
  }
}

export default async function ProductionOrderPage({ params }: ProductionOrderPageProps) {
  const { id } = params

  // Get enhanced production order data with phase status
  const [orderDataRaw, workCenters, deliveryUsers] = await Promise.all([
    getProductionOrderWithPhaseStatus(id),
    getAvailableWorkCenters(),
    getDeliveryUsers(),
  ])

  if (!orderDataRaw) notFound()

  // Convert Decimal fields to numbers for client component compatibility
  const orderData = convertDecimals(orderDataRaw)
  console.log("Enhanced order data with phase status:", JSON.stringify(orderData, null, 2))

  const allInspectors = await getActiveInspectors() // fetch once
  const inspectorsMap = new Map()
  for (const inspector of allInspectors) {
    inspectorsMap.set(inspector.inspectorId, `${inspector.firstName} ${inspector.lastName}`)
  }

  // Transform the data to include all required properties (Decimals already converted)
  const order = {
    ...orderData,

    // Transform qualityChecks to include all required properties
    qualityChecks: orderData.qualityChecks.map((check: any) => ({
      id: check.id,
      productionOrderId: check.productionOrderId,
      inspectorId: check.inspectorId,
      inspectorName: inspectorsMap.get(check.inspectorId) || "Unknown",
      checkDate: check.checkDate, // Removed .toISOString()
      status: check.status,
      defectsFound: check.defectsFound,
      actionTaken: check.actionTaken,
      notes: check.notes,
      createdAt: check.createdAt,
      updatedAt: check.updatedAt,
      productionOrder: {
        product: {
          name: orderData.product.name,
          sku: orderData.product.sku,
        },
      },
    })),

    // Use the enhanced delivery info and map it to deliveryAssignment
    deliveryAssignment: orderData.deliveryInfo, // Ensure this matches the expected type in ProductionOrderDetails
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Link href="/admin/production" className="mr-4">
            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0 mr-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {order.product.name}
              {order.productVariant && (
                <span className="text-lg font-normal text-muted-foreground"> - {order.productVariant.displayName}</span>
              )}
            </h1>
            <p className="text-muted-foreground">
              Production Order #{order.id.substring(0, 8)}
              {order.productVariant && <span className="ml-2 text-xs">(Variant: {order.productVariant.sku})</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <ProductionWorkflowProgressButton
            productionOrderId={orderData.id}
            currentStatus={orderData.status}
            className="sm:w-auto"
          />

          <ProductionQRGenerator
            order={{
              id: orderData.id,
              product: {
                name: orderData.product.name,
                sku: orderData.product.sku,
              },
              productVariant: orderData.productVariant
                ? {
                    displayName: orderData.productVariant.displayName,
                    sku: orderData.productVariant.sku,
                  }
                : undefined,
              quantity: orderData.quantity,
              startDate: orderData.startDate,
              dueDate: orderData.dueDate,
              status: orderData.status,
              priority: orderData.priority,
              delivery: {
                address: orderData.deliveryInfo?.deliveryAddress || "Not Assigned",
                contactName: orderData.deliveryInfo?.userName || "Not Assigned",
                contactPhone: "Not Assigned", // Assuming this is not in deliveryInfo
                estimatedDelivery: orderData.deliveryInfo?.scheduledDate || new Date(),
                instructions: orderData.deliveryInfo?.notes || "Not Assigned",
              },
              assignments: {
                qualityInspector: order.qualityChecks?.[0]?.inspectorName || "Not Assigned",
                logisticsCoordinator: orderData.deliveryInfo?.userName || "Not Assigned",
              },
            }}
          />
        </div>
      </div>
      {/* Production Order Details - Full width now */}
      <div className="w-full">
        <ProductionOrderDetails
          order={order as any} // Cast to any if types are still not perfectly aligned
          workCenters={workCenters}
          deliveryUsers={deliveryUsers}
        />
      </div>
    </div>
  )
}
