"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Truck,
  Factory,
  ClipboardCheck,
  Package,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowPhase {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  status: "completed" | "in_progress" | "pending" | "blocked";
  progress: number;
  completedCount: number;
  totalCount: number;
  canStart: boolean;
  details?: string[];
}

interface ProductionWorkflowProgressProps {
  phaseStatus: {
    workCenters: {
      allCompleted: boolean;
      totalOperations: number;
      completedCount: number;
      inProgressCount: number;
      pendingCount: number;
      completionPercentage: number;
    };
    inspections: {
      allCompleted: boolean;
      totalChecks: number;
      completedCount: number;
      inProgressCount: number;
      pendingCount: number;
      completionPercentage: number;
    };
    canStartDelivery: boolean;
    currentPhase: "work_centers" | "inspection" | "delivery" | "completed";
  };
  deliveryInfo: {
    status: string;
    canStart: boolean;
    canComplete: boolean;
  } | null;
}

export function ProductionWorkflowProgress({ 
  phaseStatus, 
  deliveryInfo 
}: ProductionWorkflowProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Define workflow phases
  const phases: WorkflowPhase[] = [
    {
      id: "work_centers",
      title: "Work Centers",
      icon: Factory,
      status: phaseStatus.workCenters.allCompleted 
        ? "completed" 
        : phaseStatus.workCenters.inProgressCount > 0 
          ? "in_progress" 
          : "pending",
      progress: phaseStatus.workCenters.completionPercentage,
      completedCount: phaseStatus.workCenters.completedCount,
      totalCount: phaseStatus.workCenters.totalOperations,
      canStart: true, // Work centers can always start
      details: [
        `${phaseStatus.workCenters.completedCount} of ${phaseStatus.workCenters.totalOperations} operations completed`,
        ...(phaseStatus.workCenters.inProgressCount > 0 ? [`${phaseStatus.workCenters.inProgressCount} in progress`] : []),
        ...(phaseStatus.workCenters.pendingCount > 0 ? [`${phaseStatus.workCenters.pendingCount} pending`] : []),
      ],
    },
    {
      id: "inspection",
      title: "Quality Inspection",
      icon: ClipboardCheck,
      status: phaseStatus.inspections.allCompleted 
        ? "completed" 
        : phaseStatus.inspections.inProgressCount > 0 
          ? "in_progress" 
          : phaseStatus.workCenters.allCompleted 
            ? "pending" 
            : "blocked",
      progress: phaseStatus.inspections.completionPercentage,
      completedCount: phaseStatus.inspections.completedCount,
      totalCount: phaseStatus.inspections.totalChecks,
      canStart: phaseStatus.workCenters.allCompleted,
      details: [
        `${phaseStatus.inspections.completedCount} of ${phaseStatus.inspections.totalChecks} inspections completed`,
        ...(phaseStatus.inspections.inProgressCount > 0 ? [`${phaseStatus.inspections.inProgressCount} in progress`] : []),
        ...(phaseStatus.inspections.pendingCount > 0 ? [`${phaseStatus.inspections.pendingCount} pending`] : []),
        ...(!phaseStatus.workCenters.allCompleted ? ["Waiting for work centers to complete"] : []),
      ],
    },
    {
      id: "delivery",
      title: "Delivery",
      icon: Truck,
      status: deliveryInfo?.status === "COMPLETED" 
        ? "completed" 
        : deliveryInfo?.status === "IN_PROGRESS" 
          ? "in_progress" 
          : phaseStatus.canStartDelivery 
            ? "pending" 
            : "blocked",
      progress: deliveryInfo?.status === "COMPLETED" 
        ? 100 
        : deliveryInfo?.status === "IN_PROGRESS" 
          ? 50 
          : 0,
      completedCount: deliveryInfo?.status === "COMPLETED" ? 1 : 0,
      totalCount: 1,
      canStart: phaseStatus.canStartDelivery,
      details: [
        deliveryInfo ? `Status: ${deliveryInfo.status}` : "No delivery assignment",
        ...(!phaseStatus.canStartDelivery ? [
          "Waiting for work centers and inspections to complete"
        ] : []),
        ...(deliveryInfo?.canStart ? ["Ready to start delivery"] : []),
        ...(deliveryInfo?.canComplete ? ["Ready to complete delivery"] : []),
      ],
    },
  ];

  const getStatusIcon = (status: WorkflowPhase["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "pending":
        return <Package className="h-5 w-5 text-yellow-600" />;
      case "blocked":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: WorkflowPhase["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "blocked":
        return "bg-red-100 text-red-800 border-red-200";
    }
  };

  // Handle minimize/maximize toggle
  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setIsExpanded(true); // When maximizing, also expand details
    }
  };

  // Compact summary for minimized view
  const getCompactSummary = () => {
    const currentPhaseInfo = phases.find(phase => 
      phase.status === "in_progress" || 
      (phase.status === "pending" && phases.findIndex(p => p.id === phase.id) === phases.findIndex(p => p.status === "in_progress" || p.status === "pending"))
    ) || phases.find(phase => phase.status === "pending");
    
    return {
      currentPhase: currentPhaseInfo?.title || "Completed",
      currentIcon: currentPhaseInfo?.icon || Package,
      currentStatus: currentPhaseInfo?.status || "completed",
      overallProgress: Math.round(
        phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length
      )
    };
  };

  const compactSummary = getCompactSummary();

  if (isMinimized) {
    const CurrentIcon = compactSummary.currentIcon;
    
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              Workflow Progress
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleMinimize}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Compact progress summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CurrentIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">{compactSummary.currentPhase}</span>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getStatusColor(compactSummary.currentStatus))}
                >
                  {compactSummary.currentStatus.replace("_", " ")}
                </Badge>
              </div>
              <span className="text-xs text-gray-500">{compactSummary.overallProgress}%</span>
            </div>
            <Progress value={compactSummary.overallProgress} className="h-1.5" />
            
            {/* Mini phase indicators */}
            <div className="flex items-center gap-1">
              {phases.map((phase) => {
                const Icon = phase.icon;
                return (
                  <div 
                    key={phase.id}
                    className={cn(
                      "w-6 h-6 rounded-full border flex items-center justify-center",
                      getStatusColor(phase.status)
                    )}
                    title={`${phase.title}: ${phase.status.replace("_", " ")}`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Production Workflow Progress
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleMinimize}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            
            return (
              <div key={phase.id} className="relative">
                {/* Connection line to next phase */}
                {index < phases.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-200" />
                )}
                
                <div className="flex items-start gap-4">
                  {/* Phase icon and status */}
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-full border-2 flex items-center justify-center",
                      getStatusColor(phase.status)
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  
                  {/* Phase content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{phase.title}</h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(phase.status)}
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(phase.status)}
                        >
                          {phase.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>
                          {phase.completedCount} of {phase.totalCount} completed
                        </span>
                        <span>{phase.progress}%</span>
                      </div>
                      <Progress 
                        value={phase.progress} 
                        className="h-2"
                      />
                    </div>
                    
                    {/* Phase details - collapsible */}
                    {isExpanded && (
                      <div className="space-y-1">
                        {phase.details?.map((detail, detailIndex) => (
                          <p 
                            key={detailIndex}
                            className="text-sm text-gray-600 flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                            {detail}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {/* Blocking indicator */}
                    {phase.status === "blocked" && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">Blocked:</span>
                        </div>
                        <span>Complete previous phases before proceeding</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Overall status summary */}
        {isExpanded && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Current Phase:
              </span>
              <Badge variant="outline" className="capitalize">
                {phaseStatus.currentPhase.replace("_", " ")}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 