"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getProductionPhaseStatus } from "@/lib/actions/production-order";
import { ProductionWorkflowProgressDialog } from "./production-workflow-progress-dialog";

interface ProductionWorkflowProgressButtonProps {
  productionOrderId: string;
  currentStatus: string;
  onRefresh?: () => Promise<void>;
  showOverrideControls?: boolean;
  className?: string;
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

export const ProductionWorkflowProgressButton: React.FC<ProductionWorkflowProgressButtonProps> = ({
  productionOrderId,
  currentStatus,
  onRefresh,
  showOverrideControls = true,
  className = "",
}) => {
  const [phaseStatus, setPhaseStatus] = useState<PhaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (error) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    
    const overallProgress = calculateOverallProgress();
    const blockingIssues = getBlockingIssues();
    
    if (overallProgress === 100) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    
    if (blockingIssues.length > 0) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    
    return <TrendingUp className="h-4 w-4 text-blue-600" />;
  };

  const getButtonVariant = () => {
    if (error) return "destructive";
    
    const overallProgress = calculateOverallProgress();
    const blockingIssues = getBlockingIssues();
    
    if (overallProgress === 100) return "default";
    if (blockingIssues.length > 0) return "secondary";
    
    return "outline";
  };

  const getStatusText = () => {
    if (loading) return "Loading...";
    if (error) return "Error";
    
    const overallProgress = calculateOverallProgress();
    const blockingIssues = getBlockingIssues();
    
    if (overallProgress === 100) {
      return "Complete";
    }
    
    if (blockingIssues.length > 0) {
      return `${blockingIssues.length} Issue${blockingIssues.length > 1 ? 's' : ''}`;
    }
    
    return `${overallProgress}% Done`;
  };

  const getCurrentPhaseText = () => {
    if (!phaseStatus) return "";
    return phaseStatus.currentPhase.replace('_', ' ').toUpperCase();
  };

  const tooltipContent = () => {
    if (loading) return "Loading workflow status...";
    if (error) return error;
    
    const overallProgress = calculateOverallProgress();
    const blockingIssues = getBlockingIssues();
    const currentPhase = getCurrentPhaseText();
    
    if (overallProgress === 100) {
      return "All production phases completed successfully";
    }
    
    if (blockingIssues.length > 0) {
      return `Current issues in ${currentPhase} phase - Click to view details`;
    }
    
    return `Production ${overallProgress}% complete - Currently in ${currentPhase} phase`;
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getButtonVariant()}
              className={`h-auto p-3 flex flex-col items-start space-y-2 w-full min-w-[200px] ${className}`}
              onClick={() => setDialogOpen(true)}
              disabled={loading}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-medium text-sm">Workflow Progress</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getStatusText()}
                </Badge>
              </div>
              
              {!loading && !error && phaseStatus && (
                <>
                  <div className="w-full space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {getCurrentPhaseText()}
                      </span>
                      <span className="font-medium">
                        {calculateOverallProgress()}%
                      </span>
                    </div>
                    <Progress 
                      value={calculateOverallProgress()} 
                      className="h-1.5 w-full"
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs w-full text-muted-foreground">
                    <span>
                      Work: {phaseStatus.workCenters.completionPercentage}%
                    </span>
                    <span>
                      QC: {phaseStatus.inspections.completionPercentage}%
                    </span>
                    <span>
                      Delivery: {currentStatus === "COMPLETED" ? "100%" : phaseStatus.canStartDelivery ? "Ready" : "Waiting"}
                    </span>
                  </div>
                </>
              )}
              
              {error && (
                <div className="text-xs text-red-600 text-left">
                  {error}
                </div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-64">{tooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ProductionWorkflowProgressDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productionOrderId={productionOrderId}
        currentStatus={currentStatus}
        onRefresh={async () => {
          await loadPhaseStatus();
          if (onRefresh) await onRefresh();
        }}
        showOverrideControls={showOverrideControls}
      />
    </>
  );
}; 