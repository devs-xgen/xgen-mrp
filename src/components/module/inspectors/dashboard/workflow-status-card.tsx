"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  RefreshCw,
  ArrowRight,
  Factory,
  Search,
  Truck,
} from "lucide-react";
import { canStartInspection } from "@/lib/actions/inspector/tasks";
import { useToast } from "@/hooks/use-toast";

interface WorkflowStatusCardProps {
  productionOrderId: string;
  productName?: string;
  refreshTrigger?: number;
}

interface DependencyStatus {
  canStart: boolean;
  workCenterStatus: {
    allCompleted: boolean;
    completionPercentage: number;
    completedCount: number;
    totalOperations: number;
  };
  currentPhase: "work_centers" | "inspection" | "delivery" | "completed";
  blockingReasons: string[];
  recommendations: string[];
}

export function WorkflowStatusCard({ 
  productionOrderId, 
  productName,
  refreshTrigger 
}: WorkflowStatusCardProps) {
  const [dependencyStatus, setDependencyStatus] = useState<DependencyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDependencyStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const status = await canStartInspection(productionOrderId);
      setDependencyStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to check workflow status";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencyStatus();
  }, [productionOrderId, refreshTrigger]);

  const getPhaseIcon = (phase: string, isActive: boolean, isCompleted: boolean) => {
    const baseClasses = "w-5 h-5";
    const activeClasses = isActive ? "text-blue-600" : "text-gray-400";
    const completedClasses = isCompleted ? "text-green-600" : "text-gray-400";
    
    const iconClasses = isCompleted ? completedClasses : activeClasses;

    switch (phase) {
      case "work_centers":
        return <Factory className={`${baseClasses} ${iconClasses}`} />;
      case "inspection":
        return <Search className={`${baseClasses} ${iconClasses}`} />;
      case "delivery":
        return <Truck className={`${baseClasses} ${iconClasses}`} />;
      default:
        return <CheckCircle className={`${baseClasses} ${iconClasses}`} />;
    }
  };

  const getPhaseStatus = (phase: string, currentPhase: string, workCenterCompleted: boolean) => {
    if (phase === "work_centers") {
      return workCenterCompleted ? "completed" : currentPhase === "work_centers" ? "in_progress" : "pending";
    }
    if (phase === "inspection") {
      if (!workCenterCompleted) return "blocked";
      return currentPhase === "inspection" ? "in_progress" : 
             currentPhase === "delivery" || currentPhase === "completed" ? "completed" : "pending";
    }
    if (phase === "delivery") {
      if (!workCenterCompleted) return "blocked";
      return currentPhase === "delivery" ? "in_progress" : 
             currentPhase === "completed" ? "completed" : "pending";
    }
    return "pending";
  };

  if (loading) {
    return (
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Workflow Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">Checking workflow dependencies...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Workflow Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={fetchDependencyStatus} 
            className="w-full mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dependencyStatus) return null;

  const phases = [
    {
      id: "work_centers",
      label: "Work Centers",
      description: "Manufacturing operations",
    },
    {
      id: "inspection",
      label: "Quality Inspection",
      description: "Quality checks & testing",
    },
    {
      id: "delivery",
      label: "Delivery",
      description: "Shipping & fulfillment",
    },
  ];

  return (
    <Card className={`border-2 ${dependencyStatus.canStart ? "border-green-200" : "border-yellow-200"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {dependencyStatus.canStart ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-600" />
            )}
            Sequential Workflow Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDependencyStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {productName && (
          <p className="text-sm text-gray-600">
            Production Order: {productName}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Status Alert */}
        <Alert className={dependencyStatus.canStart ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          {dependencyStatus.canStart ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Clock className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription>
            {dependencyStatus.canStart ? (
              "✅ Ready for inspection! All work center operations are complete."
            ) : (
              "⏳ Waiting for work centers to complete before inspection can begin."
            )}
          </AlertDescription>
        </Alert>

        {/* Workflow Progress */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Production Workflow</h4>
          
          {phases.map((phase, index) => {
            const isCurrentPhase = dependencyStatus.currentPhase === phase.id;
            const phaseStatus = getPhaseStatus(
              phase.id, 
              dependencyStatus.currentPhase, 
              dependencyStatus.workCenterStatus.allCompleted
            );
            
            return (
              <div key={phase.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {getPhaseIcon(
                    phase.id, 
                    isCurrentPhase, 
                    phaseStatus === "completed"
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{phase.label}</span>
                      <Badge 
                        variant={
                          phaseStatus === "completed" ? "default" :
                          phaseStatus === "in_progress" ? "secondary" :
                          phaseStatus === "blocked" ? "destructive" : "outline"
                        }
                        className="text-xs"
                      >
                        {phaseStatus === "completed" ? "✅ Complete" :
                         phaseStatus === "in_progress" ? "🕐 In Progress" :
                         phaseStatus === "blocked" ? "❌ Blocked" : "⏳ Pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{phase.description}</p>
                  </div>
                </div>
                
                {index < phases.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            );
          })}
        </div>

        {/* Work Center Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Work Center Operations</span>
            <span className="text-sm text-gray-600">
              {dependencyStatus.workCenterStatus.completedCount} / {dependencyStatus.workCenterStatus.totalOperations}
            </span>
          </div>
          <Progress 
            value={dependencyStatus.workCenterStatus.completionPercentage} 
            className="h-2"
          />
          <p className="text-xs text-gray-600">
            {dependencyStatus.workCenterStatus.completionPercentage}% complete
          </p>
        </div>

        {/* Blocking Reasons */}
        {dependencyStatus.blockingReasons.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-sm">Blocking Issues:</p>
                <ul className="list-disc list-inside space-y-1">
                  {dependencyStatus.blockingReasons.map((reason, index) => (
                    <li key={index} className="text-xs">{reason}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        {dependencyStatus.recommendations.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-sm">Recommendations:</p>
                <ul className="list-disc list-inside space-y-1">
                  {dependencyStatus.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-xs">{recommendation}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 