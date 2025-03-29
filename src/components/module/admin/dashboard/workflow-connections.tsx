// src/components/module/admin/dashboard/workflow-connections.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Factory,
  ClipboardCheck,
  ArrowRight,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function WorkflowConnections() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const handleStepHover = (step: number | null) => {
    setActiveStep(step);
  };

  const workflowSteps = [
    {
      id: 1,
      title: "Customer Orders",
      description: "Customer places an order for products",
      icon: ShoppingCart,
      path: "/admin/customer-orders",
      color: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
    },
    {
      id: 2,
      title: "Inventory Check",
      description: "System checks if products are in stock",
      icon: Package,
      path: "/admin/products",
      color:
        "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
    },
    {
      id: 3,
      title: "Production Planning",
      description: "Create production orders for out-of-stock items",
      icon: Factory,
      path: "/admin/production",
      color:
        "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100",
    },
    {
      id: 4,
      title: "Quality Control",
      description: "Perform quality checks on manufactured products",
      icon: ClipboardCheck,
      path: "/admin/quality-checks",
      color:
        "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100",
    },
  ];

  const isActiveOrPrevious = (id: number) => {
    return activeStep === null || id <= activeStep;
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Manufacturing Workflow</CardTitle>
        <CardDescription>
          The complete process from customer order to product delivery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
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
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      step.color
                    } transition-all duration-300 ${
                      isActiveOrPrevious(step.id)
                        ? "opacity-100 scale-100"
                        : "opacity-50 scale-95"
                    }`}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>
                </Link>
                <div className="mt-2 text-center">
                  <h3 className="text-sm font-medium">{step.title}</h3>
                  <p className="hidden md:block text-xs text-muted-foreground">
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
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/work-centers">
            <Settings className="mr-2 h-4 w-4" />
            Configure Work Centers
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="#" className="text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4" />
            View All Processes
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
