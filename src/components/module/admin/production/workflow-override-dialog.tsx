"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Eye,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Status } from "@prisma/client";
import {
  adminWorkflowOverride,
  getWorkflowOverrideRecommendations,
  getWorkflowOverrideAuditTrail,
} from "@/lib/actions/production-order";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkflowOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: string;
  onSuccess?: () => Promise<void>;
}

interface OverrideRecommendation {
  type: 'START_PRODUCTION' | 'BYPASS_WORK_CENTERS' | 'BYPASS_INSPECTIONS' | 'FORCE_STATUS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  suggestedReason: string;
  blockedBy?: string[];
  targetStatus?: Status;
}

interface AuditEntry {
  id: string;
  type: string;
  reason: string;
  timestamp: string;
  adminUser: {
    id: string;
    email: string;
    name: string;
  };
  overrideDetails: any;
  createdAt: Date;
}

export const WorkflowOverrideDialog: React.FC<WorkflowOverrideDialogProps> = ({
  open,
  onOpenChange,
  productionOrderId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [overrideReason, setOverrideReason] = useState("");
  const [selectedOverride, setSelectedOverride] = useState<OverrideRecommendation | null>(null);
  const [customOverride, setCustomOverride] = useState({
    type: '',
    targetStatus: '',
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentTab, setCurrentTab] = useState("recommendations");
  const { toast } = useToast();

  // Load data when dialog opens
  useEffect(() => {
    if (open && productionOrderId) {
      loadOverrideData();
    } else {
      resetState();
    }
  }, [open, productionOrderId]);

  const resetState = () => {
    setRecommendations(null);
    setAuditTrail([]);
    setOverrideReason("");
    setSelectedOverride(null);
    setCustomOverride({ type: '', targetStatus: '' });
    setCurrentTab("recommendations");
  };

  const loadOverrideData = async () => {
    try {
      setLoading(true);
      const [recommendationsData, auditData] = await Promise.all([
        getWorkflowOverrideRecommendations(productionOrderId),
        getWorkflowOverrideAuditTrail(productionOrderId),
      ]);
      setRecommendations(recommendationsData);
      setAuditTrail(auditData);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load override data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeOverride = async () => {
    if (!selectedOverride && !customOverride.type) {
      toast({
        title: "Error",
        description: "Please select an override type",
        variant: "destructive",
      });
      return;
    }

    if (!overrideReason.trim()) {
      toast({
        title: "Error",
        description: "Override reason is required for audit trail",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExecuting(true);
      
      const overrideType = selectedOverride?.type || customOverride.type as any;
      const targetStatus = selectedOverride?.targetStatus || customOverride.targetStatus as Status;

      const result = await adminWorkflowOverride(
        productionOrderId,
        overrideType,
        overrideReason,
        targetStatus
      );

      toast({
        title: "Override Executed",
        description: result.message,
        variant: "default",
      });

      if (result.warning) {
        toast({
          title: "Security Warning",
          description: result.warning,
          variant: "destructive",
        });
      }

      if (onSuccess) await onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Override Failed",
        description: error instanceof Error ? error.message : "Failed to execute override",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  const getOverrideTypeIcon = (type: string) => {
    switch (type) {
      case 'START_PRODUCTION': return <Zap className="h-4 w-4" />;
      case 'BYPASS_WORK_CENTERS': return <Settings className="h-4 w-4" />;
      case 'BYPASS_INSPECTIONS': return <CheckCircle2 className="h-4 w-4" />;
      case 'FORCE_STATUS': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading override data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-600" />
            Admin Workflow Override
          </DialogTitle>
          <DialogDescription>
            Emergency override system for exceptional cases. All actions are logged for compliance.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Custom Override
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[60vh] mt-4">
            <TabsContent value="recommendations" className="space-y-4">
              {recommendations && (
                <>
                  {/* Current Status Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Current Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Production Status</Label>
                          <Badge variant="outline">{recommendations.currentStatus}</Badge>
                        </div>
                        <div className="flex gap-2">
                          {recommendations.isOverdue && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                          {recommendations.isUrgent && (
                            <Badge variant="secondary">High Priority</Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Phase Status */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className={`p-2 rounded ${recommendations.phaseStatus.workCenters.allCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            Work Centers
                            <div className="font-semibold">
                              {recommendations.phaseStatus.workCenters.completedCount}/{recommendations.phaseStatus.workCenters.totalOperations}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`p-2 rounded ${recommendations.phaseStatus.inspections.allCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            Inspections
                            <div className="font-semibold">
                              {recommendations.phaseStatus.inspections.completedCount}/{recommendations.phaseStatus.inspections.totalChecks}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`p-2 rounded ${recommendations.phaseStatus.canStartDelivery ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            Delivery
                            <div className="font-semibold">
                              {recommendations.phaseStatus.canStartDelivery ? 'Ready' : 'Blocked'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  {recommendations.recommendations.length > 0 ? (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Recommended Overrides</Label>
                      {recommendations.recommendations.map((rec: OverrideRecommendation, index: number) => (
                        <Card 
                          key={index}
                          className={`cursor-pointer transition-all ${
                            selectedOverride === rec ? 'ring-2 ring-primary bg-accent' : 'hover:bg-accent/50'
                          }`}
                          onClick={() => {
                            setSelectedOverride(rec);
                            setOverrideReason(rec.suggestedReason);
                            setCustomOverride({ type: '', targetStatus: '' });
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getOverrideTypeIcon(rec.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Label className="font-medium">{rec.type.replace('_', ' ')}</Label>
                                  <Badge variant={getSeverityColor(rec.severity) as any}>
                                    {rec.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {rec.reason}
                                </p>
                                {rec.blockedBy && rec.blockedBy.length > 0 && (
                                  <div className="text-xs text-orange-600">
                                    <strong>Blocked by:</strong> {rec.blockedBy.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        {recommendations.warningMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Custom overrides should only be used when recommended overrides are not suitable. 
                  Ensure you understand the implications before proceeding.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="override-type">Override Type</Label>
                  <Select 
                    value={customOverride.type} 
                    onValueChange={(value) => {
                      setCustomOverride(prev => ({ ...prev, type: value }));
                      setSelectedOverride(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select override type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="START_PRODUCTION">Start Production</SelectItem>
                      <SelectItem value="BYPASS_WORK_CENTERS">Bypass Work Centers</SelectItem>
                      <SelectItem value="BYPASS_INSPECTIONS">Bypass Inspections</SelectItem>
                      <SelectItem value="FORCE_STATUS">Force Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(customOverride.type === 'BYPASS_WORK_CENTERS' || 
                  customOverride.type === 'BYPASS_INSPECTIONS' || 
                  customOverride.type === 'FORCE_STATUS') && (
                  <div>
                    <Label htmlFor="target-status">Target Status</Label>
                    <Select 
                      value={customOverride.targetStatus} 
                      onValueChange={(value) => 
                        setCustomOverride(prev => ({ ...prev, targetStatus: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              {auditTrail.length > 0 ? (
                <div className="space-y-3">
                  {auditTrail.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Shield className="h-4 w-4 mt-1 text-orange-600" />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Label className="font-medium">{entry.type}</Label>
                                <Badge variant="secondary" className="text-xs">
                                  {entry.adminUser.name}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {entry.reason}
                              </p>
                              <div className="text-xs text-muted-foreground">
                                Status: {entry.overrideDetails.beforeStatus} → {entry.overrideDetails.afterStatus}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(entry.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No workflow overrides recorded for this production order</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {(selectedOverride || customOverride.type) && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label htmlFor="override-reason">Override Reason (Required)</Label>
              <Textarea
                id="override-reason"
                placeholder="Provide a detailed reason for this workflow override for audit compliance..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
              />
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {(selectedOverride || customOverride.type) && (
            <Button
              variant="destructive"
              onClick={executeOverride}
              disabled={isExecuting || !overrideReason.trim()}
            >
              {isExecuting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Lock className="h-4 w-4 mr-2" />
              Execute Override
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 