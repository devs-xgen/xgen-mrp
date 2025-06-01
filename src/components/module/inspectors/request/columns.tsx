// // src/components/module/inspectors/request/columns.tsx
// "use client";

// import { ColumnDef } from "@tanstack/react-table";
// import { ProductionOrderColumn } from "@/types/inspector/production-order";
// import { Badge } from "@/components/ui/badge";
// import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
// import { formatDate } from "@/lib/utils";
// import { ProgressIndicator } from "@/components/ui/progress-indicator";
// import { DataTableRowActions } from "./data-table-row-actions";

// export const columns: ColumnDef<ProductionOrderColumn>[] = [
//   {
//     accessorKey: "productName",
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Product" />
//     ),
//     cell: ({ row }) => {
//       return (
//         <div>
//           <div className="font-medium">{row.getValue("productName")}</div>
//           <div className="text-xs text-muted-foreground">
//             {row.original.productSku}
//           </div>
//         </div>
//       );
//     },
//   },
//   {
//     accessorKey: "quantity",
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Quantity" />
//     ),
//   },
//   {
//     accessorKey: "startDate",
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Start Date" />
//     ),
//     cell: ({ row }) => formatDate(row.getValue("startDate")),
//   },
//   {
//     accessorKey: "dueDate",
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Due Date" />
//     ),
//     cell: ({ row }) => formatDate(row.getValue("dueDate")),
//   },
//   {
//     accessorKey: "progress",
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Progress" />
//     ),
//     cell: ({ row }) => {
//       const progress = row.getValue("progress") as number;
//       const status = row.getValue("status") as string;
//       const productName = row.original.productName;
//       const dueDate = new Date(row.getValue("dueDate"));
//       const today = new Date();

//       const daysRemaining = Math.ceil(
//         (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
//       );

//       const getTooltipText = () => {
//         if (status === "COMPLETED") {
//           return `✅ Production completed for ${productName}`;
//         }
//         if (status === "IN_PROGRESS") {
//           const remainingText =
//             daysRemaining > 0
//               ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`
//               : "Due today!";
//           return `⏳ Production at ${Math.round(progress)}% for ${productName}. ${remainingText}`;
//         }
//         return `📝 Production planned for ${productName}. Not started yet.`;
//       };

//       const getVariant = () => {
//         if (status === "COMPLETED") return "success";
//         if (status === "IN_PROGRESS") {
//           return daysRemaining < 3 ? "danger" : "warning";
//         }
//         return "default";
//       };

//       return (
//         <ProgressIndicator
//           value={progress}
//           size="sm"
//           variant={getVariant()}
//           tooltipText={getTooltipText()}
//           className="min-w-[80px]"
//         />
//       );
//     },
//   },
//   {
//     accessorKey: "status",
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Status" />
//     ),
//     cell: ({ row }) => {
//       const status = row.getValue("status") as string;
//       return (
//         <Badge
//           variant={
//             status === "COMPLETED"
//               ? "default"
//               : status === "IN_PROGRESS"
//               ? "secondary"
//               : "outline"
//           }
//         >
//           {status.toLowerCase().replace("_", " ")}
//         </Badge>
//       );
//     },
//     filterFn: (row, id, value) => {
//       return value.includes(row.getValue(id));
//     },
//   },
//   {
//     accessorKey: "priority",
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Priority" />
//     ),
//     cell: ({ row }) => {
//       const priority = row.getValue("priority") as string;
//       return (
//         <Badge
//           variant={
//             priority === "HIGH"
//               ? "destructive"
//               : priority === "MEDIUM"
//               ? "default"
//               : "secondary"
//           }
//         >
//           {priority.toLowerCase()}
//         </Badge>
//       );
//     },
//     filterFn: (row, id, value) => {
//       return value.includes(row.getValue(id));
//     },
//   },
//   {
//     accessorKey: "customerOrderNumber",
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Customer Order" />
//     ),
//     cell: ({ row }) => row.getValue("customerOrderNumber") || "—",
//   },

//   // ✅ NEW COLUMN: Materials (replaces hasMaterialRequest)
//   {
//     id: "materials",
//     header: "Materials",
//     cell: ({ row }) => {
//       const materialRequests = row.original.materialRequests || [];

//       const materialNames = materialRequests.flatMap((request) =>
//         request.items.map((item) => item.inventoryItem?.name).filter(Boolean)
//       );

//       if (materialNames.length === 0) {
//         return (
//           <span className="text-sm text-muted-foreground">
//             No materials requested
//           </span>
//         );
//       }

//       return (
//         <div className="flex flex-wrap gap-1">
//           {materialNames.map((name, idx) => (
//             <Badge
//               key={idx}
//               variant="outline"
//               className="text-xs border-blue-400 text-blue-600"
//             >
//               {name}
//             </Badge>
//           ))}
//         </div>
//       );
//     },
//   },
//   {
//     id: "actions",
//     cell: ({ row }) => <DataTableRowActions row={row} />,
//   },
// ];





// src/components/module/inspectors/request/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ProductionOrderColumn,
  ProductionOrderColumnPerRequest,
} from "@/types/inspector/production-order";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { formatDate } from "@/lib/utils";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<ProductionOrderColumn & Partial<ProductionOrderColumnPerRequest>>[] = [
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.getValue("productName")}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.productSku}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantity" />
    ),
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Date" />
    ),
    cell: ({ row }) => formatDate(row.getValue("startDate")),
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => formatDate(row.getValue("dueDate")),
  },
  {
    accessorKey: "progress",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Progress" />
    ),
    cell: ({ row }) => {
      const progress = row.getValue("progress") as number;
      const status = row.getValue("status") as string;
      const productName = row.original.productName;
      const dueDate = new Date(row.getValue("dueDate"));
      const today = new Date();

      const daysRemaining = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const getTooltipText = () => {
        if (status === "COMPLETED") {
          return `✅ Production completed for ${productName}`;
        }
        if (status === "IN_PROGRESS") {
          const remainingText =
            daysRemaining > 0
              ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`
              : "Due today!";
          return `⏳ Production at ${Math.round(progress)}% for ${productName}. ${remainingText}`;
        }
        return `📝 Production planned for ${productName}. Not started yet.`;
      };

      const getVariant = () => {
        if (status === "COMPLETED") return "success";
        if (status === "IN_PROGRESS") {
          return daysRemaining < 3 ? "danger" : "warning";
        }
        return "default";
      };

      return (
        <ProgressIndicator
          value={progress}
          size="sm"
          variant={getVariant()}
          tooltipText={getTooltipText()}
          className="min-w-[80px]"
        />
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "COMPLETED"
              ? "default"
              : status === "IN_PROGRESS"
              ? "secondary"
              : "outline"
          }
        >
          {status.toLowerCase().replace("_", " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <Badge
          variant={
            priority === "HIGH"
              ? "destructive"
              : priority === "MEDIUM"
              ? "default"
              : "secondary"
          }
        >
          {priority.toLowerCase()}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "customerOrderNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer Order" />
    ),
    cell: ({ row }) => row.getValue("customerOrderNumber") || "—",
  },

  // ✅ MATERIAL COLUMN FROM PER REQUEST TYPE
  {
    id: "materials",
    header: "Materials",
    cell: ({ row }) => {
      const materialRequests = row.original.materialRequests || [];

      const materialNames = materialRequests.flatMap((req) =>
        req.items.map((item) => item.inventoryItem?.name)
      );

      if (materialNames.length === 0) {
        return (
          <span className="text-sm text-muted-foreground">
            No materials requested
          </span>
        );
      }

      return (
        <div className="flex flex-wrap gap-1">
          {materialNames.map((name, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-xs border-blue-400 text-blue-600"
            >
              {name}
            </Badge>
          ))}
        </div>
      );
    },
  },

  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
