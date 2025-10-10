import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Check, Clock, Package, Puzzle, User } from "lucide-react"

// Types used in the worker context (assuming these types exist in a shared types file)
interface ProductVariant { id: string; sku: string; displayName: string | null; sizeName: string | null; colorName: string | null; }
interface WorkCenter { id: string; name: string; description: string | null; }
interface Operation {
  id: string;
  name: string;
  sequence: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  workCenter: { id: string; name: string; description: string | null; };
  durationMinutes: number;
  assignedTo: { id: string; email: string } | null;
  performedBy: { id: string; email: string } | null;
  startTime: Date | null;
  endTime: Date | null;
}
interface ProductionOrder {
  id: string;
  quantity: number;
  product: { id: string; name: string; sku: string };
  productVariant: ProductVariant | null;
  customerOrder: { id: string; orderNumber: string; customerName?: string } | null;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  operations: Operation[];
}

interface WorkerProductionDetailsProps {
  order: ProductionOrder;
  workCenters: WorkCenter[]; // Available work centers for context
}

// Map production status to badge styles
const statusMap: Record<ProductionOrder['status'], { text: string; className: string }> = {
  PENDING: { text: 'Pending', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500' },
  ACTIVE: { text: 'In Progress', className: 'bg-blue-500/10 text-blue-600 border-blue-500 animate-pulse' },
  COMPLETED: { text: 'Completed', className: 'bg-green-500/10 text-green-600 border-green-500' },
  CANCELLED: { text: 'Cancelled', className: 'bg-red-500/10 text-red-600 border-red-500' },
}

// Map operation status to badge styles
const operationStatusMap: Record<Operation['status'], { text: string; className: string; icon: React.ReactNode }> = {
  PENDING: { text: 'To Do', className: 'bg-gray-100 text-gray-600 border-gray-300', icon: <Clock className="h-3 w-3" /> },
  ACTIVE: { text: 'Working', className: 'bg-blue-100 text-blue-700 border-blue-300', icon: <Clock className="h-3 w-3" /> },
  COMPLETED: { text: 'Done', className: 'bg-green-100 text-green-700 border-green-300', icon: <Check className="h-3 w-3" /> },
  CANCELLED: { text: 'Skipped', className: 'bg-red-100 text-red-700 border-red-300', icon: <Check className="h-3 w-3" /> },
}

const formatDate = (date: Date | string | null) => {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export function WorkerProductionDetails({ order }: WorkerProductionDetailsProps) {
  const currentStatus = statusMap[order.status] || statusMap.PENDING;

  return (
    <div className="space-y-6">
      {/* Primary Job Overview Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            Job Summary
            <Badge variant="outline" className={`text-sm font-semibold px-3 py-1 border-2 ${currentStatus.className}`}>
              {currentStatus.text}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Package className="w-5 h-5 text-indigo-500 mr-3" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Product:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-semibold">{order.product.name}</span>
            </div>
            {order.productVariant && (
              <div className="flex items-center text-sm">
                <Puzzle className="w-5 h-5 text-indigo-500 mr-3" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Variant SKU:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{order.productVariant.sku}</span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <User className="w-5 h-5 text-indigo-500 mr-3" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Customer Order:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {order.customerOrder?.orderNumber || 'Internal Job'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Quantity:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-bold text-lg">{order.quantity}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Started:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {formatDate(order.operations.find(op => op.status === 'ACTIVE' || op.status === 'COMPLETED')?.startTime || null)}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Due Date:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-semibold text-red-500">
                {formatDate(order.operations.at(-1)?.startTime)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations / Workflow Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Production Workflow Steps (Operations)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.operations.length > 0 ? (
            <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-6">
              {order.operations.map((op, index) => {
                const opStatus = operationStatusMap[op.status] || operationStatusMap.PENDING;
                
                // Determine icon background based on status
                let iconClass = 'absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900';
                if (op.status === 'COMPLETED') {
                  iconClass += ' bg-green-500 text-white';
                } else if (op.status === 'ACTIVE') {
                  iconClass += ' bg-blue-500 text-white animate-bounce';
                } else {
                  iconClass += ' bg-gray-300 text-gray-700';
                }

                return (
                  <li key={op.id} className="ml-6">
                    <span className={iconClass}>
                      {opStatus.icon}
                    </span>
                    <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {op.name}
                      <Badge variant="outline" className={`ml-3 px-2 py-0.5 border ${opStatus.className}`}>
                        {opStatus.text}
                      </Badge>
                    </h3>
                    
                    <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Work Center:</span> {op.workCenter.name}
                      <span className="mx-3 text-gray-300">|</span>
                      <span className="font-medium">Duration:</span> {op.durationMinutes} min
                    </p>
                    
                    {/* Worker Assignments */}
                    <div className="text-xs mt-1 text-gray-600 dark:text-gray-300">
                      <p>
                        <span className="font-medium">Assigned:</span> {op.assignedTo?.email || 'Unassigned'}
                      </p>
                      {op.performedBy && (
                        <p>
                          <span className="font-medium">Performed By:</span> {op.performedBy.email}
                        </p>
                      )}
                    </div>

                    {/* Start/End Times */}
                    <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                      <p>
                        <span className="font-medium">Start:</span> {formatDate(op.startTime)}
                        {op.endTime && (
                          <>
                            <span className="mx-3 text-gray-300">|</span>
                            <span className="font-medium">End:</span> {formatDate(op.endTime)}
                          </>
                        )}
                      </p>
                    </div>

                    {/* Add a separator if it's not the last item for visual break */}
                    {index < order.operations.length - 1 && <Separator className="mt-4" />}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-center text-muted-foreground py-4">No operations defined for this production job.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
