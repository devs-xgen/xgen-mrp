"use client";

import { WorkerTask } from "@/types/worker/tasks";
import { Status } from "@prisma/client";
import {
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  Search,
  Truck,
  Target,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface WorkflowImpactCardProps {
  task: WorkerTask;
  workflowData: {
    phaseStatus?: any;
    workCenterStatus?: any;
    inspectionStatus?: any;
    currentPhase?: string;
    canStartInspection?: boolean;
    canStartDelivery?: boolean;
  };
  className?: string;
}

export function WorkflowImpactCard({ 
  task, 
  workflowData, 
  className 
}: WorkflowImpactCardProps) {
  const { currentPhase, workCenterStatus, canStartInspection, canStartDelivery } = workflowData;

  // Don't show if task is already completed
  if (task.status === Status.COMPLETED) {
    return null;
  }

  // Calculate impact based on current phase and task status
  const getWorkflowImpact = () => {
    if (currentPhase === "work_centers") {
      const remaining = workCenterStatus?.remainingOperations?.length || 0;
      const completed = workCenterStatus?.completedOperations || 0;
      const total = (workCenterStatus?.totalOperations || 0);
      const isLastTask = remaining === 1 && task.status !== Status.COMPLETED;
      
      return {
        isInCriticalPhase: true,
        impactLevel: isLastTask ? "high" : remaining <= 2 ? "medium" : "low",
        message: isLastTask 
          ? "🎯 You're the final work center operation! Complete this to enable quality inspection."
          : remaining <= 2 
          ? `🔥 Critical task! Only ${remaining} work center operations remaining before inspection can begin.`
          : `⚡ Your completion moves the team forward! ${completed}/${total} work centers completed.`,
        nextPhase: "Quality Inspection",
        teamImpact: isLastTask 
          ? "Your completion will immediately notify inspectors and enable the next phase!"
          : `${remaining - 1} more work center tasks after yours before inspection begins.`,
        progressData: {
          current: completed,
          total: total,
          percentage: total > 0 ? (completed / total) * 100 : 0
        }
      };
    } else if (currentPhase === "inspection" && canStartInspection) {
      return {
        isInCriticalPhase: false,
        impactLevel: "low",
        message: "✅ Work centers complete! Quality inspection is now in progress.",
        nextPhase: "Delivery",
        teamImpact: "Focus on quality - inspectors are now working on your production output.",
        progressData: null
      };
    } else if (currentPhase === "delivery" && canStartDelivery) {
      return {
        isInCriticalPhase: false,
        impactLevel: "low",
        message: "🚚 All phases complete! Delivery is now possible.",
        nextPhase: "Customer",
        teamImpact: "Excellent work! Your production is ready for delivery.",
        progressData: null
      };
    }

    return null;
  };

  const impact = getWorkflowImpact();
  
  if (!impact) {
    return null;
  }

  const getImpactColor = (level: string) => {
    switch (level) {
      case "high":
        return "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20";
      case "medium":
        return "border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-950/20";
      case "low":
        return "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20";
      default:
        return "border-gray-500 dark:border-gray-400 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  const getImpactIcon = (level: string) => {
    switch (level) {
      case "high":
        return <Target className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "medium":
        return <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case "low":
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-600 dark:text-gray-300" />;
    }
  };

  return (
    <div className={cn(
      "border rounded-lg p-3 transition-all duration-200",
      getImpactColor(impact.impactLevel),
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getImpactIcon(impact.impactLevel)}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Production Flow Impact</h4>
            <Badge variant="outline" className="text-xs">
              {impact.isInCriticalPhase ? "Critical Path" : "Supporting"}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {impact.message}
          </p>
          
          {impact.progressData && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Work Center Progress</span>
                <span>{impact.progressData.current}/{impact.progressData.total} completed</span>
              </div>
              <Progress 
                value={impact.progressData.percentage} 
                className="h-2"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{impact.teamImpact}</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs font-medium">
              <span>Next:</span>
              <span className="text-blue-600 dark:text-blue-400">{impact.nextPhase}</span>
              <ArrowRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          {impact.isInCriticalPhase && (
            <div className="flex items-center gap-1 pt-1">
              <div className="flex-1 flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">Work Centers</span>
                <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                <Search className={`h-3 w-3 ${canStartInspection ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className={canStartInspection ? "text-green-700 dark:text-green-300" : "text-gray-500 dark:text-gray-400"}>
                  Quality Check
                </span>
                <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                <Truck className={`h-3 w-3 ${canStartDelivery ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className={canStartDelivery ? "text-green-700 dark:text-green-300" : "text-gray-500 dark:text-gray-400"}>
                  Delivery
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 