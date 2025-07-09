"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Settings,
  CheckSquare,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Zap,
  Eye,
  TrendingUp,
  Shield,
  AlertCircle,
} from "lucide-react";
import { getProductionPhaseStatus } from "@/lib/actions/production-order";
import { WorkflowOverrideDialog } from "./workflow-override-dialog";
import { formatDate } from "@/lib/utils";

interface ProductionWorkflowProgressProps {
  productionOrderId: string;
  currentStatus: string;
  onRefresh?: () => Promise<void>;
  showOverrideControls?: boolean;
}

interface PhaseStatus {
  workCenters: {
    allCompleted: boolean;
    completedCount: number;
    totalOperations: number;
    completionPercentage: number;
  };
  inspections: {
    allCompleted: boolean;
    completedCount: number;
    totalChecks: number;
    completionPercentage: number;
  };
  canStartDelivery: boolean;
  currentPhase: "work_centers" | "inspection" | "delivery" | "completed";
  overallProgress: {
    workCentersComplete: boolean;
    inspectionsComplete: boolean;
    readyForDelivery: boolean;
  };
}

export const ProductionWorkflowProgress: React.FC<ProductionWorkflowProgressProps> = ({
  productionOrderId,
  currentStatus,
  onRefresh,
  showOverrideControls = true,
}) => {
  const [phaseStatus, setPhaseStatus] = useState<PhaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhaseStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await getProductionPhaseStatus(productionOrderId);
      setPhaseStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load phase status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhaseStatus();
  }, [productionOrderId]);

  const getPhaseStatusColor = (completed: boolean, isActive: boolean) => {
    if (completed) return "text-green-600 bg-green-50 border-green-200";
    if (isActive) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-gray-500 bg-gray-50 border-gray-200";
  };

  const getPhaseIcon = (phase: string, completed: boolean, isActive: boolean) => {
    const iconClass = completed ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-400";
    
    switch (phase) {
      case "work_centers":
        return <Settings className={`h-5 w-5 ${iconClass}`} />;
      case "inspection":
        return <CheckSquare className={`h-5 w-5 ${iconClass}`} />;
      case "delivery":
        return <Truck className={`h-5 w-5 ${iconClass}`} />;
      default:
        return <Clock className={`h-5 w-5 ${iconClass}`} />;
    }
  };

  const calculateOverallProgress = () => {
    if (!phaseStatus) return 0;
    
    let progress = 0;
    if (phaseStatus.workCenters.allCompleted) progress += 33;
    if (phaseStatus.inspections.allCompleted) progress += 33;
    if (phaseStatus.canStartDelivery && currentStatus === "COMPLETED") progress += 34;
    
    return progress;
  };

  const getBlockingIssues = () => {
    if (!phaseStatus) return [];
    
    const issues = [];
    
    if (!phaseStatus.workCenters.allCompleted) {
      issues.push({
        phase: "Work Centers",
        issue: `${phaseStatus.workCenters.totalOperations - phaseStatus.workCenters.completedCount} operations remaining`,
        severity: "medium",
      });
    }
    
    if (phaseStatus.workCenters.allCompleted && !phaseStatus.inspections.allCompleted) {
      issues.push({
        phase: "Quality Inspections",
        issue: `${phaseStatus.inspections.totalChecks - phaseStatus.inspections.completedCount} inspections remaining`,
        severity: "medium",
      });
    }
    
    if (phaseStatus.canStartDelivery && currentStatus !== "COMPLETED") {
      issues.push({
        phase: "Delivery",
        issue: "Ready for delivery but not yet completed",
        severity: "low",
      });
    }
    
    return issues;
  };

  const hasOverrideOpportunities = () => {
    if (!phaseStatus) return false;
    
    // Show override options if there are any blocking issues
    return getBlockingIssues().length > 0 || currentStatus === "PENDING";
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Production Workflow Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading workflow status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Workflow Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-sm">{error}</div>
          <Button variant="outline" size="sm" onClick={loadPhaseStatus} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const overallProgress = calculateOverallProgress();
  const blockingIssues = getBlockingIssues();

  return (
    <>
      <Card className="w-full sticky top-4 z-10 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Production Workflow Progress
            </CardTitle>
            {showOverrideControls && hasOverrideOpportunities() && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOverrideDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Override Controls
                </Button>
              </div>
            )}
          </div>
          
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Phase Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Work Centers Phase */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`p-4 rounded-lg border-2 transition-all ${getPhaseStatusColor(
                    phaseStatus!.workCenters.allCompleted,
                    phaseStatus!.currentPhase === "work_centers"
                  )}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {getPhaseIcon("work_centers", phaseStatus!.workCenters.allCompleted, phaseStatus!.currentPhase === "work_centers")}
                      <div>
                        <div className="font-medium text-sm">Work Centers</div>
                        <div className="text-xs text-muted-foreground">
                          {phaseStatus!.workCenters.completedCount}/{phaseStatus!.workCenters.totalOperations} operations
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={phaseStatus!.workCenters.completionPercentage} 
                      className="h-1.5"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium">
                        {phaseStatus!.workCenters.completionPercentage}%
                      </span>
                      {phaseStatus!.workCenters.allCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {phaseStatus!.workCenters.allCompleted 
                      ? "All work center operations completed"
                      : `${phaseStatus!.workCenters.totalOperations - phaseStatus!.workCenters.completedCount} operations remaining`
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Inspections Phase */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`p-4 rounded-lg border-2 transition-all ${getPhaseStatusColor(
                    phaseStatus!.inspections.allCompleted,
                    phaseStatus!.currentPhase === "inspection"
                  )}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {getPhaseIcon("inspection", phaseStatus!.inspections.allCompleted, phaseStatus!.currentPhase === "inspection")}
                      <div>
                        <div className="font-medium text-sm">Quality Inspection</div>
                        <div className="text-xs text-muted-foreground">
                          {phaseStatus!.inspections.completedCount}/{phaseStatus!.inspections.totalChecks} checks
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={phaseStatus!.inspections.completionPercentage} 
                      className="h-1.5"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium">
                        {phaseStatus!.inspections.completionPercentage}%
                      </span>
                      {phaseStatus!.inspections.allCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    {!phaseStatus!.workCenters.allCompleted && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Blocked
                        </Badge>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {!phaseStatus!.workCenters.allCompleted 
                      ? "Waiting for work centers to complete"
                      : phaseStatus!.inspections.allCompleted 
                        ? "All quality inspections completed"
                        : `${phaseStatus!.inspections.totalChecks - phaseStatus!.inspections.completedCount} inspections remaining`
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Delivery Phase */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`p-4 rounded-lg border-2 transition-all ${getPhaseStatusColor(
                    currentStatus === "COMPLETED",
                    phaseStatus!.currentPhase === "delivery"
                  )}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {getPhaseIcon("delivery", currentStatus === "COMPLETED", phaseStatus!.currentPhase === "delivery")}
                      <div>
                        <div className="font-medium text-sm">Delivery</div>
                        <div className="text-xs text-muted-foreground">
                          {currentStatus === "COMPLETED" ? "Completed" : "Pending"}
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={currentStatus === "COMPLETED" ? 100 : phaseStatus!.canStartDelivery ? 50 : 0} 
                      className="h-1.5"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium">
                        {currentStatus === "COMPLETED" ? "100%" : phaseStatus!.canStartDelivery ? "Ready" : "0%"}
                      </span>
                      {currentStatus === "COMPLETED" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    {!phaseStatus!.canStartDelivery && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Blocked
                        </Badge>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {!phaseStatus!.canStartDelivery 
                      ? "Waiting for work centers and inspections to complete"
                      : currentStatus === "COMPLETED" 
                        ? "Order completed and delivered"
                        : "Ready for delivery"
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Current Phase Status */}
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Current Phase</div>
              <div className="text-xs text-muted-foreground">
                {phaseStatus!.currentPhase.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {phaseStatus!.currentPhase.replace('_', ' ')}
            </Badge>
          </div>

          {/* Blocking Issues */}
          {blockingIssues.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Current Blocking Issues
                </div>
                {blockingIssues.map((issue, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-orange-50 rounded">
                    <span><strong>{issue.phase}:</strong> {issue.issue}</span>
                    <Badge 
                      variant={issue.severity === "high" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={loadPhaseStatus}>
              <Eye className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            
            {showOverrideControls && hasOverrideOpportunities() && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setOverrideDialogOpen(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Emergency Override
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <WorkflowOverrideDialog
        open={overrideDialogOpen}
        onOpenChange={setOverrideDialogOpen}
        productionOrderId={productionOrderId}
        onSuccess={async () => {
          await loadPhaseStatus();
          if (onRefresh) await onRefresh();
        }}
      />
    </>
  );
}; 