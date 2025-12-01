"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { cn } from "@/lib/utils";

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

  const loadPhaseStatus = useCallback(async () => {
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
  }, [productionOrderId]);

  useEffect(() => {
    loadPhaseStatus();
  }, [loadPhaseStatus]);

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
    if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (error) return <AlertTriangle className="h-4 w-4 text-destructive" />;

    const overallProgress = calculateOverallProgress();
    const blockingIssues = getBlockingIssues();

    if (overallProgress === 100) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />;
    }

    if (blockingIssues.length > 0) {
      return <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-300" />;
    }

    return <TrendingUp className="h-4 w-4 text-sky-500 dark:text-sky-300" />;
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
              className={cn(
                "h-auto w-full min-w-[240px] rounded-2xl border border-border/80 bg-card/80 p-4 text-left shadow-sm transition-colors",
                "hover:border-primary/40 hover:bg-card",
                "flex flex-col space-y-3",
                className,
              )}
              onClick={() => setDialogOpen(true)}
              disabled={loading}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {getStatusIcon()}
                  <span>Workflow Progress</span>
                </div>
                <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
                  {getStatusText()}
                </Badge>
              </div>

              {!loading && !error && phaseStatus && (
                <>
                  <div className="w-full space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {getCurrentPhaseText()}
                      </span>
                      <span className="font-semibold text-foreground">
                        {calculateOverallProgress()}%
                      </span>
                    </div>
                    <Progress
                      value={calculateOverallProgress()}
                      className="h-1.5 w-full"
                    />
                  </div>

                  <div className="grid w-full grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                    <div className="rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-center">
                      <p className="font-medium text-foreground">Work</p>
                      <p>{phaseStatus.workCenters.completionPercentage}%</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-center">
                      <p className="font-medium text-foreground">QC</p>
                      <p>{phaseStatus.inspections.completionPercentage}%</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-center">
                      <p className="font-medium text-foreground">Delivery</p>
                      <p>
                        {currentStatus === "COMPLETED"
                          ? "100%"
                          : phaseStatus.canStartDelivery
                            ? "Ready"
                            : "Waiting"}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="text-xs text-destructive">
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