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
  ArrowRight,
  Users,
  Truck,
  Factory,
  Search,
  RefreshCw,
  TrendingUp,
  Target,
} from "lucide-react";
import { getWorkCenterCompletionStatus } from "@/lib/actions/worker/tasks";
import { useToast } from "@/hooks/use-toast";

interface WorkflowImpactCardProps {
  productionOrderId: string;
  productName?: string;
  refreshTrigger?: number;
}

interface CompletionStatus {
  allCompleted: boolean;
  completionPercentage: number;
  completedOperations: number;
  totalOperations: number;
  remainingOperations: Array<{
    id: string;
    workCenterName: string;
    status: string;
    startTime: Date;
    endTime: Date;
  }>;
}

export function WorkflowImpactCard({ 
  productionOrderId, 
  productName,
  refreshTrigger 
}: WorkflowImpactCardProps) {
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCompletionStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const status = await getWorkCenterCompletionStatus(productionOrderId);
      setCompletionStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to check completion status";
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
    fetchCompletionStatus();
  }, [productionOrderId, refreshTrigger]);

  const getDownstreamImpact = () => {
    if (!completionStatus) return null;

    const { allCompleted, completionPercentage } = completionStatus;

    if (allCompleted) {
      return {
        message: "🎉 All work centers complete! Inspectors can now begin quality checks.",
        nextPhase: "Quality Inspection",
        impact: "enabled",
        description: "Your team's completion has unlocked the next phase of production.",
      };
    } else if (completionPercentage >= 75) {
      return {
        message: "🚀 Almost there! You're close to enabling quality inspections.",
        nextPhase: "Quality Inspection",
        impact: "almost",
        description: `Just ${completionStatus.totalOperations - completionStatus.completedOperations} operation(s) remaining.`,
      };
    } else if (completionPercentage >= 50) {
      return {
        message: "⚡ Great progress! Keep going to unlock quality inspections.",
        nextPhase: "Quality Inspection",
        impact: "progress",
        description: "You're making good progress toward the next production phase.",
      };
    } else {
      return {
        message: "🏭 Work in progress. Your completion will enable downstream processes.",
        nextPhase: "Quality Inspection",
        impact: "early",
        description: "Each completed operation brings the product closer to inspection.",
      };
    }
  };

  if (loading) {
    return (
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Production Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">Checking production status...</p>
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
            <Factory className="w-5 h-5 text-red-600" />
            Production Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={fetchCompletionStatus} 
            className="w-full mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!completionStatus) return null;

  const downstreamImpact = getDownstreamImpact();
  if (!downstreamImpact) return null;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "enabled": return "border-green-200 bg-green-50";
      case "almost": return "border-yellow-200 bg-yellow-50";
      case "progress": return "border-blue-200 bg-blue-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-gray-500";
  };

  return (
    <Card className={`border-2 ${getImpactColor(downstreamImpact.impact)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Production Impact
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchCompletionStatus}
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
        {/* Impact Message */}
        <Alert className={getImpactColor(downstreamImpact.impact)}>
          <Target className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium text-sm">{downstreamImpact.message}</p>
              <p className="text-xs">{downstreamImpact.description}</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Work Center Operations</span>
            <Badge 
              variant={completionStatus.allCompleted ? "default" : "secondary"}
              className="text-xs"
            >
              {completionStatus.completedOperations} / {completionStatus.totalOperations}
            </Badge>
          </div>
          <div className="space-y-2">
            <Progress 
              value={completionStatus.completionPercentage} 
              className="h-3"
            />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{completionStatus.completionPercentage}% complete</span>
              <span>
                {completionStatus.allCompleted 
                  ? "✅ Ready for next phase" 
                  : `${completionStatus.totalOperations - completionStatus.completedOperations} remaining`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Workflow Flow */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Production Flow Impact</h4>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Work Centers</span>
              <Badge 
                variant={completionStatus.allCompleted ? "default" : "secondary"}
                className="text-xs"
              >
                {completionStatus.allCompleted ? "✅ Complete" : "🕐 In Progress"}
              </Badge>
            </div>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
            
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Quality Inspection</span>
              <Badge 
                variant={completionStatus.allCompleted ? "secondary" : "outline"}
                className="text-xs"
              >
                {completionStatus.allCompleted ? "🔓 Ready" : "🔒 Waiting"}
              </Badge>
            </div>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
            
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-green-600" />
              <span className="font-medium">Delivery</span>
              <Badge variant="outline" className="text-xs">
                ⏳ Future
              </Badge>
            </div>
          </div>
        </div>

        {/* Remaining Operations */}
        {!completionStatus.allCompleted && completionStatus.remainingOperations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Remaining Operations</h4>
            <div className="space-y-2">
              {completionStatus.remainingOperations.slice(0, 3).map((operation) => (
                <div 
                  key={operation.id} 
                  className="flex items-center justify-between text-sm bg-white p-2 rounded border"
                >
                  <div className="flex items-center gap-2">
                    <Factory className="w-3 h-3 text-gray-600" />
                    <span>{operation.workCenterName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {operation.status}
                  </Badge>
                </div>
              ))}
              {completionStatus.remainingOperations.length > 3 && (
                <p className="text-xs text-gray-600 text-center">
                  ... and {completionStatus.remainingOperations.length - 3} more operations
                </p>
              )}
            </div>
          </div>
        )}

        {/* Team Impact Message */}
        <div className="border-t pt-3">
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-gray-600">
              {completionStatus.allCompleted ? (
                <p>
                  <span className="font-medium text-green-700">Great teamwork!</span> Your completion enables 
                  inspectors to begin quality checks and moves this order closer to delivery.
                </p>
              ) : (
                <p>
                  <span className="font-medium text-blue-700">Your work matters!</span> Each completed operation 
                  brings the team closer to enabling quality inspections and delivery.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 