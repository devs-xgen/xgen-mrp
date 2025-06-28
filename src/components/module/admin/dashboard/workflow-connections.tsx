// src/components/module/admin/dashboard/workflow-connections.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Factory,
  ClipboardList,
  ArrowRight,
  Settings,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { SimpleMermaid } from "@/components/ui/simple-mermaid";
import { loadGraphFile, getGraphMetadata } from "@/lib/utils/graph-loader";

export function WorkflowConnections() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [graphContent, setGraphContent] = useState<string>("");
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);

  const handleStepHover = (step: number | null) => {
    setActiveStep(step);
  };

  // Load graph content when dialog opens
  useEffect(() => {
    if (processDialogOpen && !graphContent) {
      console.log("Loading graph content...");
      setIsLoadingGraph(true);
      loadGraphFile("production-order-process-flow")
        .then(content => {
          console.log("Graph content loaded:", content.substring(0, 100) + "...");
          setGraphContent(content);
          setIsLoadingGraph(false);
        })
        .catch(error => {
          console.error("Failed to load graph:", error);
          setIsLoadingGraph(false);
        });
    }
  }, [processDialogOpen, graphContent]);

  const workflowSteps = [
    {
      id: 1,
      title: "Customer Orders",
      description: "Customer places an order for products",
      icon: "ShoppingCart" as const,
      path: "/admin/customer-orders",
      count: "156",
      variant: analyticsCardVariants.blue,
    },
    {
      id: 2,
      title: "Inventory Check",
      description: "System checks if products are in stock",
      icon: "Package" as const,
      path: "/admin/products",
      count: "89",
      variant: analyticsCardVariants.green,
    },
    {
      id: 3,
      title: "Production Planning",
      description: "Create production orders for out-of-stock items",
      icon: "Factory" as const,
      path: "/admin/production",
      count: "42",
      variant: analyticsCardVariants.amber,
    },
    {
      id: 4,
      title: "Quality Control",
      description: "Perform quality checks on manufactured products",
      icon: "ClipboardList" as const,
      path: "/admin/quality-checks",
      count: "38",
      variant: analyticsCardVariants.purple,
    },
  ];

  const isActiveOrPrevious = (id: number) => {
    return activeStep === null || id <= activeStep;
  };

  const graphMetadata = getGraphMetadata("production-order-process-flow");

  // Simple test graph content
  const fallbackGraph = `graph TD
    A[Customer Order] --> B[Analyze Lines]
    B --> C[Check Stock]
    C --> D[Check Materials]
    D --> E[Generate Options]
    E --> F[User Decision]
    F --> G[Create Orders]
    G --> H[Create BOM]
    H --> I[Create Operations]
    I --> J[Link Order]`;

  const displayGraph = graphContent || fallbackGraph;

  return (
    <div className="space-y-6">
      {/* Main Workflow Card */}
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Manufacturing Workflow</CardTitle>
              <CardDescription className="mt-1">
                The complete process from customer order to product delivery
              </CardDescription>
            </div>
            <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  See The Process
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[90vh] w-full flex flex-col">
                <DialogHeader className="flex-shrink-0 pb-4">
                  <DialogTitle className="text-2xl">
                    Production Order Creation Process
                  </DialogTitle>
                  <DialogDescription>
                    Detailed step-by-step workflow for creating production orders from customer orders
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-auto">
                  <div className="bg-background rounded-lg border p-4 min-w-max">
                    <SimpleMermaid 
                      chart={displayGraph}
                    />
                  </div>
                  
                  {/* Process Summary */}
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Process Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">10</div>
                        <div className="text-sm text-muted-foreground">Total Steps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">Automated</div>
                        <div className="text-sm text-muted-foreground">System Driven</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">Integrated</div>
                        <div className="text-sm text-muted-foreground">End-to-End Flow</div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Analytics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((step) => (
              <Link key={step.id} href={step.path}>
                <AnalyticsCard
                  title={step.title}
                  value={step.count}
                  icon={step.icon}
                  subtitle={step.description}
                  className="transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  {...step.variant}
                />
              </Link>
            ))}
          </div>

          {/* Process Flow Visualization */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-muted/30 rounded-lg p-6">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div
                  className={`flex flex-col items-center ${
                    index !== workflowSteps.length - 1 ? "mb-6 md:mb-0" : ""
                  }`}
                  onMouseEnter={() => handleStepHover(step.id)}
                  onMouseLeave={() => handleStepHover(null)}
                >
                  <Link href={step.path}>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                        isActiveOrPrevious(step.id)
                          ? "opacity-100 scale-100"
                          : "opacity-50 scale-95"
                      }`}
                      style={{
                        backgroundColor: step.variant.bgColor.includes('blue') ? '#dbeafe' :
                                        step.variant.bgColor.includes('green') ? '#dcfce7' :
                                        step.variant.bgColor.includes('amber') ? '#fef3c7' :
                                        '#f3e8ff',
                        color: step.variant.iconColor.includes('blue') ? '#1e40af' :
                               step.variant.iconColor.includes('green') ? '#166534' :
                               step.variant.iconColor.includes('amber') ? '#92400e' :
                               '#6b21a8'
                      }}
                    >
                      {step.icon === "ShoppingCart" && <ShoppingCart className="h-6 w-6" />}
                      {step.icon === "Package" && <Package className="h-6 w-6" />}
                      {step.icon === "Factory" && <Factory className="h-6 w-6" />}
                      {step.icon === "ClipboardList" && <ClipboardList className="h-6 w-6" />}
                    </div>
                  </Link>
                  <div className="mt-2 text-center">
                    <h3 className="text-sm font-medium">{step.title}</h3>
                    <p className="hidden md:block text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>

                {index !== workflowSteps.length - 1 && (
                  <div
                    className={`hidden md:flex flex-1 items-center justify-center transition-opacity duration-300 ${
                      isActiveOrPrevious(step.id + 1)
                        ? "opacity-100"
                        : "opacity-30"
                    }`}
                  >
                    <ArrowRight className="h-5 w-5 text-muted-foreground mx-2" />
                    <div className="h-0.5 w-full bg-muted-foreground/20 relative">
                      <div
                        className={`absolute inset-0 bg-primary transition-all duration-500 ${
                          isActiveOrPrevious(step.id + 1) ? "w-full" : "w-0"
                        }`}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Manage your manufacturing workflow configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/work-centers">
                <Settings className="mr-2 h-4 w-4" />
                Configure Work Centers
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/materials">
                <Package className="mr-2 h-4 w-4" />
                Manage Materials
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/products">
                <Factory className="mr-2 h-4 w-4" />
                Manage Products
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
