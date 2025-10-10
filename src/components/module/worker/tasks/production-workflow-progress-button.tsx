"use client";

import React, { useState, useEffect } from "react";
// Mocked shadcnd/ui components - assuming they are available or simplified.
// In a real environment, you would import these correctly.
const Button = ({ variant, className, onClick, disabled, children }) => <button className={`p-2 rounded ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
const Badge = ({ variant, className, children }) => <span className={`text-xs p-1 rounded ${className}`}>{children}</span>;
const Progress = ({ value, className }) => <div className={`h-2 bg-gray-200 rounded ${className}`} style={{ width: `${value}%` }}><div className="h-full bg-blue-500 rounded"></div></div>;
const Tooltip = ({ children }) => <div>{children}</div>;
const TooltipProvider = ({ children }) => <div>{children}</div>;
const TooltipTrigger = ({ children }) => <div>{children}</div>;
const TooltipContent = ({ children }) => <div className="p-2 text-sm bg-gray-800 text-white rounded shadow-lg">{children}</div>;

import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

// --- START: MOCK DEPENDENCIES TO RESOLVE COMPILATION ERRORS ---

// Mock data structure and function for server action `getProductionPhaseStatus`
// This simulates the expected output from the backend action
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

// MOCK FUNCTION: Simulates the server action that fetches progress data
const getProductionPhaseStatus = async (productionOrderId: string): Promise<PhaseStatus> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Use productionOrderId to determine mock status for demo purposes
  if (productionOrderId === "PO-ERROR-001") {
    throw new Error("Simulated backend communication error.");
  }
  
  // Simulate common in-progress status
  return {
    workCenters: {
      allCompleted: false,
      completedCount: 7,
      totalOperations: 10,
      completionPercentage: 70,
    },
    inspections: {
      allCompleted: false,
      completedCount: 0,
      totalChecks: 3,
      completionPercentage: 0,
    },
    canStartDelivery: false,
    currentPhase: "work_centers",
    overallProgress: {
      workCentersComplete: false,
      inspectionsComplete: false,
      readyForDelivery: false,
    },
  };
};

// MOCK COMPONENT: Simulates the missing dialog component
const ProductionWorkflowProgressDialog = ({ open, onOpenChange, productionOrderId, currentStatus, onRefresh, showOverrideControls }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Workflow Details for {productionOrderId}</h2>
        <p>Current Status: {currentStatus}</p>
        <p className="mt-2">This is the detail view. The component is currently mocked to fix compilation errors.</p>
        <div className="flex justify-end space-x-2 mt-4">
          <button 
            className="p-2 bg-gray-200 rounded" 
            onClick={() => onRefresh().then(() => onOpenChange(false))}
          >
            Refresh & Close
          </button>
          <button 
            className="p-2 bg-blue-500 text-white rounded" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- END: MOCK DEPENDENCIES ---

interface ProductionWorkflowWorkerProgressButtonProps {
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

export const ProductionWorkflowWorkerProgressButton: React.FC<ProductionWorkflowWorkerProgressButtonProps> = ({
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
      // Calls the newly defined backend function
      const status = await getProductionPhaseStatus(productionOrderId);
      setPhaseStatus(status);
    } catch (err) {
      // Ensure the error is cast to string/Error for message extraction
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhaseStatus();
  }, [productionOrderId]);

  const calculateOverallProgress = () => {
    if (!phaseStatus) return 0;
    
    // Total progress is divided into 3 phases: Work Centers (33), Inspection (33), Delivery/Completion (34)
    let progress = 0;
    // Work Centers: 33% weight
    if (phaseStatus.workCenters.allCompleted) {
        progress += 33;
    } else {
        // If not complete, contribute proportional progress within this 33% segment
        progress += Math.floor(phaseStatus.workCenters.completionPercentage * 0.33);
    }

    // Inspections: 33% weight (only starts contributing after Work Centers are complete)
    if (phaseStatus.workCenters.allCompleted) {
        if (phaseStatus.inspections.allCompleted) {
             progress += 33;
        } else {
             // If not complete, contribute proportional progress within this 33% segment
             progress += Math.floor(phaseStatus.inspections.completionPercentage * 0.33);
        }
    }
    
    // Delivery/Completion: 34% weight (only contributes when work is ready and status is completed)
    if (phaseStatus.canStartDelivery && currentStatus === "COMPLETED") {
        progress += 34;
    }
    
    return Math.min(100, progress); // Cap at 100%
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
    
    // Only check for QC issues if work centers are done (QC is the next step)
    if (phaseStatus.workCenters.allCompleted && !phaseStatus.inspections.allCompleted) {
      issues.push({
        phase: "Quality Inspections",
        issue: `${phaseStatus.inspections.totalChecks - phaseStatus.inspections.completedCount} inspections remaining`,
        severity: "medium",
      });
    }
    
    // Check if delivery is ready but the order status hasn't been officially changed to COMPLETED
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
    
    if (overallProgress >= 99) { // Using 99 to account for potential rounding issues
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
    
    if (overallProgress >= 99) return "default";
    if (blockingIssues.length > 0) return "secondary";
    
    return "outline";
  };

  const getStatusText = () => {
    if (loading) return "Loading...";
    if (error) return "Error";
    
    const overallProgress = calculateOverallProgress();
    const blockingIssues = getBlockingIssues();
    
    if (overallProgress >= 99) {
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
    
    if (overallProgress >= 99) {
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
          <TooltipTrigger>
            <Button
              variant={getButtonVariant()}
              className={`h-auto p-3 flex flex-col items-start space-y-2 w-full min-w-[200px] bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition ${className}`}
              onClick={() => setDialogOpen(true)}
              disabled={loading}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-medium text-sm text-gray-800">Workflow Progress</span>
                </div>
                <Badge variant="outline" className="text-xs bg-gray-100 border-gray-400">
                  {getStatusText()}
                </Badge>
              </div>
              
              {!loading && !error && phaseStatus && (
                <>
                  <div className="w-full space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span className="text-muted-foreground">
                        {getCurrentPhaseText()}
                      </span>
                      <span className="font-medium text-gray-800">
                        {calculateOverallProgress()}%
                      </span>
                    </div>
                    <Progress 
                      value={calculateOverallProgress()} 
                      className="h-1.5 w-full"
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs w-full text-muted-foreground text-gray-500">
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
                  Error loading status: {error}
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
