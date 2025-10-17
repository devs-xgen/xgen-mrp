"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Users, 
  Factory, 
  ShieldCheck, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  Star,
  User,
  Settings,
  Award,
  Calendar,
  AlertCircle,
  Play,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getProductionOrderWithAssignments, startProductionWithValidation } from "@/lib/actions/production-order";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Status } from "@prisma/client";

interface PreProductionVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: string;
  onProceedToProduction?: () => Promise<void>;
}

export const PreProductionVerificationDialog: React.FC<
  PreProductionVerificationDialogProps
> = ({ open, onOpenChange, productionOrderId, onProceedToProduction }) => {
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proceeding, setProceeding] = useState(false);
  const [currentTab, setCurrentTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    if (open && productionOrderId) {
      setLoading(true);
      setError(null);
      getProductionOrderWithAssignments(productionOrderId)
        .then((data) => setAssignmentData(data))
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Failed to fetch assignments")
        )
        .finally(() => setLoading(false));
    } else {
      setAssignmentData(null);
      setError(null);
    }
  }, [open, productionOrderId]);

  const handleProceedToProduction = async () => {
    if (!productionOrderId) return;
    
    setProceeding(true);
    try {
      // Use the new validation function to start production
      const result = await startProductionWithValidation(productionOrderId);
      
      toast({
        title: "✅ Production Started",
        description: result.message || "Production order has been started successfully",
      });
      
      // Call the optional callback if provided
      if (onProceedToProduction) {
        await onProceedToProduction();
      }
      
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err?.message || "Failed to start production",
        variant: "destructive",
      });
    } finally {
      setProceeding(false);
    }
  };

  // Check if all required assignments are in place (STRICT validation)
  const getReadinessStatus = () => {
    if (!assignmentData) return { ready: false, issues: [] };
    
    const issues = [];
    
    // STRICT: Check work centers and workers (REQUIRED)
    if (assignmentData.workCenters.length === 0) {
      issues.push("❌ No work centers assigned - REQUIRED for production");
    } else {
      const workCentersWithoutWorkers = assignmentData.workCenters.filter(
        (wc: any) => wc.assignedUsers.length === 0
      );
      if (workCentersWithoutWorkers.length > 0) {
        issues.push(
          `❌ ${workCentersWithoutWorkers.length} work center(s) have no assigned workers - REQUIRED for production`
        );
      }
    }
    
    // STRICT: Check inspectors (REQUIRED)
    if (assignmentData.inspectors.length === 0) {
      issues.push("❌ No quality control inspectors assigned - REQUIRED for production");
    }
    
    // OPTIONAL: Check delivery (recommended but not blocking)
    if (!assignmentData.delivery) {
      issues.push("⚠️ No delivery personnel assigned - RECOMMENDED for order fulfillment");
    }
    
    // Only consider ready if NO critical issues (work centers, workers, inspectors)
    const criticalIssues = issues.filter(issue => issue.includes("❌"));
    
    return {
      ready: criticalIssues.length === 0,
      issues,
      criticalIssues: criticalIssues.length,
      warningIssues: issues.length - criticalIssues.length,
    };
  };

  const readinessStatus = assignmentData ? getReadinessStatus() : { ready: false, issues: [] };

  // Tab navigation
  const tabs = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "workcenters", label: "Work Centers", icon: Factory, count: assignmentData?.workCenters?.length || 0 },
    { id: "inspectors", label: "Inspectors", icon: ShieldCheck, count: assignmentData?.inspectors?.length || 0 },
    { id: "delivery", label: "Delivery", icon: Truck, hasData: !!assignmentData?.delivery },
  ];

  const getCurrentTabIndex = () => tabs.findIndex(tab => tab.id === currentTab);
  
  const goToNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1].id);
    }
  };

  const goToPrevTab = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1].id);
    }
  };

  const UserCard = ({ user, role, additional }: any) => (
    <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/50">
      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        <User className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
            {user.phoneNumber && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {user.phoneNumber}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {role}
          </Badge>
        </div>
        {(user.department || user.position) && (
          <div className="flex gap-2 mt-1">
            {user.department && (
              <Badge variant="secondary" className="text-xs">
                {user.department}
              </Badge>
            )}
            {user.position && (
              <Badge variant="secondary" className="text-xs">
                {user.position}
              </Badge>
            )}
          </div>
        )}
        {additional && (
          <div className="mt-2 text-xs text-muted-foreground">
            {additional}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Pre-Production Verification
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : assignmentData ? (
          <div className="space-y-4">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-full grid-cols-4">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.count !== undefined && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {tab.count}
                          </Badge>
                        )}
                        {tab.hasData !== undefined && !tab.hasData && (
                          <AlertTriangle className="w-3 h-3 text-red-500 ml-1" />
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                {/* Navigation arrows */}
                <div className="flex gap-1 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevTab}
                    disabled={getCurrentTabIndex() === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextTab}
                    disabled={getCurrentTabIndex() === tabs.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="max-h-[60vh] mt-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Production Order Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Factory className="w-5 h-5" />
                        Production Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Product</p>
                          <p className="font-medium">{assignmentData.productionOrder.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {assignmentData.productionOrder.product.sku}
                          </p>
                        </div>
                        {assignmentData.productionOrder.productVariant && (
                          <div>
                            <p className="text-sm text-muted-foreground">Variant</p>
                            <p className="font-medium">
                              {assignmentData.productionOrder.productVariant.displayName}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="font-medium">{assignmentData.productionOrder.quantity} units</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Due Date</p>
                          <p className="font-medium">
                            {formatDate(assignmentData.productionOrder.dueDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge 
                            variant={
                              assignmentData.productionOrder.status === "PENDING" 
                                ? "outline" 
                                : "default"
                            }
                          >
                            {assignmentData.productionOrder.status.toLowerCase().replace("_", " ")}
                          </Badge>
                        </div>
                        {assignmentData.productionOrder.customerOrder && (
                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">Customer Order</p>
                            <p className="font-medium">
                              {assignmentData.productionOrder.customerOrder.orderNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignmentData.productionOrder.customerOrder.customer.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Readiness Status */}
                  <Alert 
                    variant={readinessStatus.ready ? "default" : "destructive"}
                  >
                    <div className="flex items-center gap-2">
                      {readinessStatus.ready ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {readinessStatus.ready 
                            ? "✅ Ready for Production" 
                            : readinessStatus.criticalIssues > 0
                              ? "❌ Cannot Start Production"
                              : "⚠️ Production Ready with Warnings"
                          }
                        </p>
                        {readinessStatus.issues.length > 0 && (
                          <AlertDescription className="mt-2">
                            <div className="space-y-2">
                              {readinessStatus.criticalIssues > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-red-600 mb-1">
                                    Critical Issues (must be resolved):
                                  </p>
                                  <ul className="list-none space-y-1">
                                    {readinessStatus.issues
                                      .filter(issue => issue.includes("❌"))
                                      .map((issue, index) => (
                                        <li key={index} className="text-sm">{issue}</li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                              {readinessStatus.warningIssues > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-amber-600 mb-1">
                                    Warnings (recommended to resolve):
                                  </p>
                                  <ul className="list-none space-y-1">
                                    {readinessStatus.issues
                                      .filter(issue => issue.includes("⚠️"))
                                      .map((issue, index) => (
                                        <li key={index} className="text-sm">{issue}</li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        )}
                      </div>
                    </div>
                  </Alert>

                  {/* Quick Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="flex items-center gap-4 p-6">
                        <div className="p-3 bg-blue-500/10 rounded-full">
                          <Factory className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{assignmentData.workCenters.length}</p>
                          <p className="text-sm text-muted-foreground">Work Centers</p>
                          <p className="text-xs text-muted-foreground">
                            {assignmentData.workCenters.reduce((acc: number, wc: any) => 
                              acc + wc.assignedUsers.length, 0
                            )} Workers Assigned
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="flex items-center gap-4 p-6">
                        <div className="p-3 bg-green-500/10 rounded-full">
                          <ShieldCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{assignmentData.inspectors.length}</p>
                          <p className="text-sm text-muted-foreground">Inspectors</p>
                          <p className="text-xs text-muted-foreground">Quality Control</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="flex items-center gap-4 p-6">
                        <div className={`p-3 rounded-full ${
                          assignmentData.delivery ? 'bg-purple-500/10' : 'bg-red-500/10'
                        }`}>
                          <Truck className={`w-6 h-6 ${
                            assignmentData.delivery ? 'text-purple-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {assignmentData.delivery ? "1" : "0"}
                          </p>
                          <p className="text-sm text-muted-foreground">Delivery</p>
                          <p className="text-xs text-muted-foreground">
                            {assignmentData.delivery ? "Assigned" : "Not Assigned"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Work Centers Tab */}
                <TabsContent value="workcenters" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Factory className="w-5 h-5" />
                      Work Centers ({assignmentData.workCenters.length})
                    </h3>
                    <Badge variant="outline">
                      {assignmentData.workCenters.reduce((acc: number, wc: any) => 
                        acc + wc.assignedUsers.length, 0
                      )} Total Workers
                    </Badge>
                  </div>

                  {assignmentData.workCenters.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No Work Centers Assigned</p>
                        <p className="text-sm text-muted-foreground text-center">
                          This production order has no work centers assigned. Please assign work centers before starting production.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {assignmentData.workCenters.map((workCenter: any, index: number) => (
                        <Card key={workCenter.id}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                                  {index + 1}
                                </Badge>
                                <span>{workCenter.name}</span>
                                <Badge 
                                  variant={workCenter.status === "ACTIVE" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {workCenter.status}
                                </Badge>
                              </div>
                              <Badge variant="outline">
                                {workCenter.assignedUsers.length} Workers
                              </Badge>
                            </CardTitle>
                            {workCenter.description && (
                              <p className="text-sm text-muted-foreground">
                                {workCenter.description}
                              </p>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Work Center Stats */}
                              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="text-xs text-muted-foreground">Capacity</p>
                                  <p className="font-medium">{workCenter.capacityPerHour}/hour</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Efficiency</p>
                                  <p className="font-medium">{Number(workCenter.efficiencyRate)}%</p>
                                </div>
                              </div>

                              {/* Assigned Workers */}
                              {workCenter.assignedUsers.length === 0 ? (
                                <Alert variant="destructive">
                                  <AlertTriangle className="w-4 h-4" />
                                  <AlertDescription>
                                    No workers assigned to this work center
                                  </AlertDescription>
                                </Alert>
                              ) : (
                                <div className="space-y-3">
                                  <h4 className="font-medium text-sm">Assigned Workers ({workCenter.assignedUsers.length})</h4>
                                  <div className="grid gap-3">
                                    {workCenter.assignedUsers.map((assignment: any) => (
                                      <UserCard
                                        key={`${assignment.id}-${assignment.assignmentType}`}
                                        user={assignment}
                                        role={assignment.role}
                                        additional={
                                          <div className="flex gap-2">
                                            <Badge variant="outline" className="text-xs">
                                              {assignment.assignmentType === "WorkCenterAssignment" 
                                                ? (assignment.isPrimary ? "Primary" : "Secondary")
                                                : (assignment.isResponsible ? "Responsible" : "Member")
                                              }
                                            </Badge>
                                          </div>
                                        }
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Operations */}
                              {workCenter.operations.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">Operations ({workCenter.operations.length})</h4>
                                  <div className="space-y-2">
                                    {workCenter.operations.map((operation: any) => (
                                      <div key={operation.id} className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                              {operation.status}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                              {formatDate(operation.startTime)} - {formatDate(operation.endTime)}
                                            </span>
                                          </div>
                                          {operation.assignedTo && (
                                            <span className="text-xs text-muted-foreground">
                                              {operation.assignedTo.profile 
                                                ? `${operation.assignedTo.profile.firstName} ${operation.assignedTo.profile.lastName}`
                                                : operation.assignedTo.email
                                              }
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Inspectors Tab */}
                <TabsContent value="inspectors" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Quality Inspectors ({assignmentData.inspectors.length})
                    </h3>
                  </div>

                  {assignmentData.inspectors.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="text-lg font-medium">No Inspectors Assigned</p>
                        <p className="text-sm text-muted-foreground text-center">
                          Quality control inspectors are required for production. Please assign inspectors before starting production.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {assignmentData.inspectors.map((inspector: any, index: number) => (
                        <Card key={inspector.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0 flex-shrink-0">
                                {index + 1}
                              </Badge>
                              <div className="flex-1">
                                <UserCard
                                  user={inspector}
                                  role="INSPECTOR"
                                  additional={
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap gap-1">
                                        {inspector.specialization && (
                                          <Badge variant="secondary" className="text-xs">
                                            {inspector.specialization}
                                          </Badge>
                                        )}
                                        {inspector.certificationLevel && (
                                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                                            <Award className="w-3 h-3" />
                                            {inspector.certificationLevel}
                                          </Badge>
                                        )}
                                        {inspector.yearsOfExperience && (
                                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                                            <Star className="w-3 h-3" />
                                            {inspector.yearsOfExperience} years exp.
                                          </Badge>
                                        )}
                                      </div>
                                      {inspector.notes && (
                                        <div className="p-2 bg-muted/50 rounded text-xs">
                                          <strong>Notes:</strong> {inspector.notes}
                                        </div>
                                      )}
                                    </div>
                                  }
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Delivery Tab */}
                <TabsContent value="delivery" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Delivery Assignment
                    </h3>
                  </div>

                  {!assignmentData.delivery ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Truck className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No Delivery Personnel Assigned</p>
                        <p className="text-sm text-muted-foreground text-center">
                          Delivery assignment is optional but recommended for order fulfillment tracking.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <UserCard
                            user={assignmentData.delivery.user}
                            role="DELIVERY"
                            additional={
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  {assignmentData.delivery.scheduledDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>Scheduled: {formatDate(assignmentData.delivery.scheduledDate)}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {assignmentData.delivery.status}
                                    </Badge>
                                  </div>
                                </div>
                                {assignmentData.delivery.deliveryAddress && (
                                  <div className="p-2 bg-muted/50 rounded">
                                    <div className="flex items-start gap-1 text-xs">
                                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <strong>Delivery Address:</strong>
                                        <br />
                                        {assignmentData.delivery.deliveryAddress}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {assignmentData.delivery.notes && (
                                  <div className="p-2 bg-muted/50 rounded text-xs">
                                    <strong>Delivery Notes:</strong>
                                    <br />
                                    {assignmentData.delivery.notes}
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        ) : null}

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={proceeding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProceedToProduction}
            disabled={
              !assignmentData || 
              !readinessStatus.ready || 
              proceeding ||
              assignmentData?.productionOrder.status !== Status.PENDING
            }
            className="min-w-[120px]"
          >
            {proceeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Production
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 