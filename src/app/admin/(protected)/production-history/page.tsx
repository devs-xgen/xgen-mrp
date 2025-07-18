// // import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// // import { Badge } from "@/components/ui/badge"
// // import { format, parseISO } from "date-fns"
// // import { ActivityIcon } from "lucide-react"
// // import { prisma } from "@/lib/db"

// // // Helper function to render JSON details
// // const renderDetails = (details: any) => {
// //   if (!details) return "N/A"
// //   return (
// //     <div className="text-xs text-muted-foreground max-w-[300px] truncate">
// //       {Object.entries(details).map(([key, value]) => (
// //         <div key={key}>
// //           <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>{" "}
// //           {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}
// //         </div>
// //       ))}
// //     </div>
// //   )
// // }

// // export default async function ActivityLogPage() {
// //   const activityLogs = await prisma.activityLog.findMany({
// //     orderBy: {
// //       createdAt: "desc",
// //     },
// //     take: 50, // Limit to last 50 entries for performance
// //     include: {
// //       user: true, // Include the related User model
// //     },
// //   })

// //   const getBadgeColor = (type: string) => {
// //     switch (type) {
// //       case "PRODUCTION_STATUS_CHANGE":
// //         return "bg-blue-500 hover:bg-blue-500/80"
// //       case "PRODUCT_STOCK_INCREMENT":
// //         return "bg-green-500 hover:bg-green-500/80"
// //       case "PRODUCTION_ORDER_DELETED":
// //         return "bg-red-500 hover:bg-red-500/80"
// //       case "MATERIAL_RELEASED":
// //         return "bg-orange-500 hover:bg-orange-500/80"
// //       default:
// //         return "bg-gray-500 hover:bg-gray-500/80"
// //     }
// //   }

// //   return (
// //     <div className="flex flex-col gap-6 p-6 md:p-10">
// //       <Card>
// //         <CardHeader>
// //           <CardTitle className="flex items-center gap-2">
// //             <ActivityIcon className="w-6 h-6" />
// //             Activity Log
// //           </CardTitle>
// //           <CardDescription>A chronological record of significant actions and events within the system.</CardDescription>
// //         </CardHeader>
// //         <CardContent>
// //           <div className="overflow-x-auto">
// //             <Table>
// //               <TableHeader>
// //                 <TableRow>
// //                   <TableHead className="w-[180px]">Event Type</TableHead>
// //                   <TableHead className="w-[150px]">User</TableHead> {/* Changed from User ID to User */}
// //                   <TableHead>Details</TableHead>
// //                   <TableHead className="w-[180px]">Timestamp</TableHead>
// //                 </TableRow>
// //               </TableHeader>
// //               <TableBody>
// //                 {activityLogs.length === 0 ? (
// //                   <TableRow>
// //                     <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
// //                       No activity logs found.
// //                     </TableCell>
// //                   </TableRow>
// //                 ) : (
// //                   activityLogs.map((log) => (
// //                     <TableRow key={log.id}>
// //                       <TableCell>
// //                         <Badge className={`${getBadgeColor(log.type)} text-white`}>{log.type.replace(/_/g, " ")}</Badge>
// //                       </TableCell>
// //                       <TableCell className="font-mono text-xs">
// //                         {log.user?.name || log.userId} {/* Display user name or fallback to ID */}
// //                       </TableCell>
// //                       <TableCell>{renderDetails(log.details)}</TableCell>
// //                       <TableCell className="text-sm text-muted-foreground">
// //                         {format(parseISO(log.createdAt.toISOString()), "MMM dd, yyyy HH:mm:ss")}
// //                       </TableCell>
// //                     </TableRow>
// //                   ))
// //                 )}
// //               </TableBody>
// //             </Table>
// //           </div>
// //         </CardContent>
// //       </Card>
// //     </div>
// //   )
// // }
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { format, parseISO } from "date-fns"
// import { ActivityIcon } from "lucide-react"
// import { prisma } from "@/lib/db"

// // Helper function to render JSON details
// const renderDetails = (details: any) => {
//   if (!details) return "N/A"
//   return (
//     <div className="text-xs text-muted-foreground max-w-[300px] truncate">
//       {Object.entries(details).map(([key, value]) => (
//         <div key={key}>
//           <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>{" "}
//           {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}
//         </div>
//       ))}
//     </div>
//   )
// }

// export default async function ActivityLogPage() {
//   const activityLogs = await prisma.activityLog.findMany({
//     orderBy: {
//       createdAt: "desc",
//     },
//     take: 50, // Limit to last 50 entries for performance
//     include: {
//       user: true, // Include the related User model
//     },
//   })

//   const getBadgeColor = (type: string) => {
//     switch (type) {
//       case "PRODUCTION_STATUS_CHANGE":
//         return "bg-blue-500 hover:bg-blue-500/80"
//       case "PRODUCT_STOCK_INCREMENT":
//         return "bg-green-500 hover:bg-green-500/80"
//       case "PRODUCTION_ORDER_DELETED":
//         return "bg-red-500 hover:bg-red-500/80"
//       case "MATERIAL_RELEASED":
//         return "bg-orange-500 hover:bg-orange-500/80"
//       default:
//         return "bg-gray-500 hover:bg-gray-500/80"
//     }
//   }

//   return (
//     <div className="flex flex-col gap-6 p-6 md:p-10">
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <ActivityIcon className="w-6 h-6" />
//             Activity Log
//           </CardTitle>
//           <CardDescription>A chronological record of significant actions and events within the system.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead className="w-[180px]">Event Type</TableHead>
//                   <TableHead className="w-[150px]">User</TableHead> {/* Changed from User ID to User */}
//                   <TableHead>Details</TableHead>
//                   <TableHead className="w-[180px]">Timestamp</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {activityLogs.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
//                       No activity logs found.
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   activityLogs.map((log) => (
//                     <TableRow key={log.id}>
//                       <TableCell>
//                         <Badge className={`${getBadgeColor(log.type)} text-white`}>{log.type.replace(/_/g, " ")}</Badge>
//                       </TableCell>
//                       <TableCell className="font-mono text-xs">
//                         {log.user?.name || log.userId} {/* Display user name or fallback to ID */}
//                       </TableCell>
//                       <TableCell>{renderDetails(log.details)}</TableCell>
//                       <TableCell className="text-sm text-muted-foreground">
//                         {format(parseISO(log.createdAt.toISOString()), "MMM dd, yyyy HH:mm:ss")}
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityIcon } from "lucide-react"
import { getProductionOrders, getProductionLogs } from "@/lib/actions/production-order"
import { ProductionOrderActivityCard } from "@/components/module/admin/production/production-order-activity-card" // Import the new component

export default async function ActivityLogPage() {
  const productionOrders = await getProductionOrders()

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="w-6 h-6" />
            Production Order Activity Overview
          </CardTitle>
          <CardDescription>
            A grouped chronological record of significant actions and events, organized by production order.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {productionOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No production orders found to display activity logs.
            </CardContent>
          </Card>
        ) : (
          await Promise.all(
            productionOrders.map(async (order) => {
              const activityLogs = await getProductionLogs(order.id)
              return <ProductionOrderActivityCard key={order.id} order={order} activityLogs={activityLogs} />
            }),
          )
        )}
      </div>
    </div>
  )
}
