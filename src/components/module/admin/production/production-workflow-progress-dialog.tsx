"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Eye,
  TrendingUp,
  Shield,
  AlertCircle,
} from "lucide-react";
import { getProductionPhaseStatus } from "@/lib/actions/production-order";
import { WorkflowOverrideDialog } from "./workflow-override-dialog";

interface ProductionWorkflowProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export const ProductionWorkflowProgressDialog: React.FC<ProductionWorkflowProgressDialogProps> = ({
  open,
  onOpenChange,
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
    if (open) {
      loadPhaseStatus();
    }
  }, [open, productionOrderId]);

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
    
    return getBlockingIssues().length > 0 || currentStatus === "PENDING";
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Production Workflow Progress
            </DialogTitle>
            <DialogDescription>
              Monitor the progress of your production workflow across all phases.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading workflow status...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Workflow Status Error
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <Button variant="outline" size="sm" onClick={loadPhaseStatus}>
            Retry
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const overallProgress = calculateOverallProgress();
  const blockingIssues = getBlockingIssues();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Production Workflow Progress
            </DialogTitle>
            <DialogDescription>
              Real-time monitoring of production phases and dependencies for this order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm font-medium">Overall Progress</div>
                  <div className="text-xs text-muted-foreground">
                    Phase: {phaseStatus!.currentPhase.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-32">
                  <Progress value={overallProgress} className="h-3" />
                  <div className="text-xs font-medium mt-1 text-center">
                    {overallProgress}%
                  </div>
                </div>
              </div>
              
              {showOverrideControls && hasOverrideOpportunities() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOverrideDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Override Controls
                </Button>
              )}
            </div>

                                      {/* Phase Overview - 3 Column Flex Layout */}
             <div className="flex flex-col lg:flex-row gap-6">
               {/* Work Centers Phase */}
               <div className="flex-1">
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className={`p-6 rounded-lg border-2 transition-all h-full ${getPhaseStatusColor(
                         phaseStatus!.workCenters.allCompleted,
                         phaseStatus!.currentPhase === "work_centers"
                       )}`}>
                         <div className="flex flex-col h-full">
                           <div className="flex items-center gap-3 mb-4">
                             {getPhaseIcon("work_centers", phaseStatus!.workCenters.allCompleted, phaseStatus!.currentPhase === "work_centers")}
                             <div className="flex-1">
                               <div className="font-medium text-base">Work Centers</div>
                               <div className="text-sm text-muted-foreground">
                                 {phaseStatus!.workCenters.completedCount}/{phaseStatus!.workCenters.totalOperations} operations
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex-1 flex flex-col justify-between">
                             <div className="space-y-3">
                               <Progress 
                                 value={phaseStatus!.workCenters.completionPercentage} 
                                 className="h-3"
                               />
                               <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium">
                                   {phaseStatus!.workCenters.completionPercentage}%
                                 </span>
                                 {phaseStatus!.workCenters.allCompleted && (
                                   <CheckCircle2 className="h-5 w-5 text-green-600" />
                                 )}
                               </div>
                             </div>
                             
                             <div className="mt-4">
                               <Badge 
                                 variant={phaseStatus!.workCenters.allCompleted ? "default" : "secondary"}
                                 className="w-full justify-center py-1"
                               >
                                 {phaseStatus!.workCenters.allCompleted ? "Complete" : "In Progress"}
                               </Badge>
                             </div>
                           </div>
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
               </div>

               {/* Quality Inspection Phase */}
               <div className="flex-1">
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className={`p-6 rounded-lg border-2 transition-all h-full ${getPhaseStatusColor(
                         phaseStatus!.inspections.allCompleted,
                         phaseStatus!.currentPhase === "inspection"
                       )}`}>
                         <div className="flex flex-col h-full">
                           <div className="flex items-center gap-3 mb-4">
                             {getPhaseIcon("inspection", phaseStatus!.inspections.allCompleted, phaseStatus!.currentPhase === "inspection")}
                             <div className="flex-1">
                               <div className="font-medium text-base">Quality Inspection</div>
                               <div className="text-sm text-muted-foreground">
                                 {phaseStatus!.inspections.completedCount}/{phaseStatus!.inspections.totalChecks} checks
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex-1 flex flex-col justify-between">
                             <div className="space-y-3">
                               <Progress 
                                 value={phaseStatus!.inspections.completionPercentage} 
                                 className="h-3"
                               />
                               <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium">
                                   {phaseStatus!.inspections.completionPercentage}%
                                 </span>
                                 {phaseStatus!.inspections.allCompleted && (
                                   <CheckCircle2 className="h-5 w-5 text-green-600" />
                                 )}
                               </div>
                             </div>
                             
                             <div className="mt-4">
                               <Badge 
                                 variant={
                                   !phaseStatus!.workCenters.allCompleted 
                                     ? "outline" 
                                     : phaseStatus!.inspections.allCompleted 
                                       ? "default" 
                                       : "secondary"
                                 }
                                 className="w-full justify-center py-1"
                               >
                                 {!phaseStatus!.workCenters.allCompleted 
                                   ? "Blocked" 
                                   : phaseStatus!.inspections.allCompleted 
                                     ? "Complete" 
                                     : "In Progress"
                                 }
                               </Badge>
                             </div>
                           </div>
                         </div>
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
               </div>

               {/* Delivery Phase */}
               <div className="flex-1">
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className={`p-6 rounded-lg border-2 transition-all h-full ${getPhaseStatusColor(
                         currentStatus === "COMPLETED",
                         phaseStatus!.currentPhase === "delivery"
                       )}`}>
                         <div className="flex flex-col h-full">
                           <div className="flex items-center gap-3 mb-4">
                             {getPhaseIcon("delivery", currentStatus === "COMPLETED", phaseStatus!.currentPhase === "delivery")}
                             <div className="flex-1">
                               <div className="font-medium text-base">Delivery</div>
                               <div className="text-sm text-muted-foreground">
                                 {currentStatus === "COMPLETED" ? "Completed" : "Pending"}
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex-1 flex flex-col justify-between">
                             <div className="space-y-3">
                               <Progress 
                                 value={currentStatus === "COMPLETED" ? 100 : phaseStatus!.canStartDelivery ? 50 : 0} 
                                 className="h-3"
                               />
                               <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium">
                                   {currentStatus === "COMPLETED" ? "100%" : phaseStatus!.canStartDelivery ? "Ready" : "0%"}
                                 </span>
                                 {currentStatus === "COMPLETED" && (
                                   <CheckCircle2 className="h-5 w-5 text-green-600" />
                                 )}
                               </div>
                             </div>
                             
                             <div className="mt-4">
                               <Badge 
                                 variant={
                                   !phaseStatus!.canStartDelivery 
                                     ? "outline" 
                                     : currentStatus === "COMPLETED" 
                                       ? "default" 
                                       : "secondary"
                                 }
                                 className="w-full justify-center py-1"
                               >
                                 {!phaseStatus!.canStartDelivery 
                                   ? "Blocked" 
                                   : currentStatus === "COMPLETED" 
                                     ? "Complete" 
                                     : "Ready"
                                 }
                               </Badge>
                             </div>
                           </div>
                         </div>
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
             </div>

            {/* Current Phase Status */}
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Current Phase</div>
                <div className="text-sm text-muted-foreground">
                  {phaseStatus!.currentPhase.replace('_', ' ').toUpperCase()}
                </div>
                <Badge variant="outline" className="capitalize w-fit">
                  {phaseStatus!.currentPhase.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="font-medium">Overall Status</div>
                <div className="text-sm text-muted-foreground">
                  {overallProgress === 100 ? "Production Complete" : `${overallProgress}% Complete`}
                </div>
                <Badge 
                  variant={overallProgress === 100 ? "default" : "secondary"} 
                  className="w-fit"
                >
                  {overallProgress === 100 ? "Ready" : "In Progress"}
                </Badge>
              </div>
            </div>

            {/* Blocking Issues */}
            {blockingIssues.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Current Blocking Issues ({blockingIssues.length})
                  </div>
                  <div className="grid gap-2">
                    {blockingIssues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{issue.phase}</div>
                          <div className="text-xs text-muted-foreground">{issue.issue}</div>
                        </div>
                        <Badge 
                          variant={issue.severity === "high" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Button variant="outline" onClick={loadPhaseStatus} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Refresh Status
              </Button>
              
              <div className="flex gap-2">
                {showOverrideControls && hasOverrideOpportunities() && (
                  <Button
                    variant="destructive"
                    onClick={() => setOverrideDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Emergency Override
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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