"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Info, Package, Factory, Truck, Box, CheckCircle2, ArrowDown, ArrowUp } from "lucide-react";

export function InventoryFlowInfoSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4" />
          How Inventory Works
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">How Product & Material Inventory Works</SheetTitle>
          <SheetDescription>
            Understanding how quantities are automatically tracked through production and delivery
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Overview */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Overview</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Our system automatically tracks product and material quantities at every step of the production process.
              You don't need to manually update inventory—everything happens automatically based on your actions.
            </p>
          </div>

          {/* Material Flow */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-lg">Material Quantity Flow</h3>
            </div>

            <div className="space-y-4 pl-4 border-l-2 border-orange-200 dark:border-orange-800">
              {/* Step 1: Production Created */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-full bg-orange-100 dark:bg-orange-900">
                    <Factory className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Step 1: Production Order Created</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      When you create a production order, the system checks the Bill of Materials (BOM) to see what materials are needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Materials Reserved */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-full bg-red-100 dark:bg-red-900">
                    <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Step 2: Materials Are Immediately Deducted</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-red-600 dark:text-red-400">Material quantities are reduced right away</span> when the production order is created.
                      This prevents other production orders from using the same materials.
                    </p>
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                      Example: If you have 100 units of fabric and create a production order needing 20 units,
                      your fabric stock immediately shows 80 units available.
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Production in Progress */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900">
                    <Factory className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Step 3: Materials Used During Production</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      As workers consume materials, the system tracks the usage for reporting purposes.
                      <span className="font-medium"> No additional deduction happens</span> since materials were already reserved in Step 2.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Result:</strong> Material quantities are always accurate and prevent overselling materials.
              </p>
            </div>
          </div>

          {/* Product Flow */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Product Quantity Flow</h3>
            </div>

            <div className="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
              {/* Step 1: Production Completed */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-full bg-green-100 dark:bg-green-900">
                    <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Step 1: Production Completed</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      When the inspector marks a production order as "Completed," the system <span className="font-medium text-green-600 dark:text-green-400">adds the finished products</span> to your inventory.
                    </p>
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                      Example: Production order for 50 shirts is completed → Your shirt inventory increases by 50 units.
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Products in Stock */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Step 2: Products Available in Stock</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      The products are now part of your inventory and ready to be sold or shipped to customers.
                      You can see the current stock quantity on the products page.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: Delivery Confirmed */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-full bg-red-100 dark:bg-red-900">
                    <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Step 3: Delivery Confirmed</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      When a delivery receipt is confirmed as "Delivered," the system <span className="font-medium text-red-600 dark:text-red-400">subtracts the delivered products</span> from your inventory.
                    </p>
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                      Example: Customer receives 30 shirts → Your shirt inventory decreases by 30 units.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Result:</strong> Product quantities always reflect real inventory—what you see is what you have.
              </p>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-lg">Complete Tracking & Audit Trail</h3>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Every quantity change is automatically recorded with:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                  <span><strong>What changed:</strong> Material used, product added, product shipped</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                  <span><strong>How much:</strong> Exact quantity that was added or removed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                  <span><strong>When it happened:</strong> Date and time of the change</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                  <span><strong>Why it changed:</strong> Production order completed, delivery confirmed, etc.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                  <span><strong>Previous & new stock:</strong> Clear record of before and after quantities</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Key Benefits</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong>No manual updates needed</strong> - Everything happens automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong>Real-time accuracy</strong> - Inventory is always up to date</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong>Prevent overselling</strong> - Materials are reserved immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong>Complete audit trail</strong> - Track every change for accountability</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong>Safe and reliable</strong> - All changes are protected by transactions</span>
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
