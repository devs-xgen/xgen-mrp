"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Eye, 
  Calendar,
  Package,
  User,
  MapPin,
  Filter,
  Clock,
  Truck,
  Route,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

interface DeliveryManagementProps {
  assignments: any[];
}

export function DeliveryManagement({ assignments }: DeliveryManagementProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Filter assignments
  const filteredAssignments = assignments
    .filter((assignment) => {
      const matchesSearch =
        assignment.productionOrder.product.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.productionOrder.customerOrder?.customer?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || assignment.status === statusFilter;

      let matchesDate = true;
      if (dateFilter !== "all") {
        const today = new Date();
        const assignmentDate = assignment.scheduledDate 
          ? new Date(assignment.scheduledDate) 
          : null;

        switch (dateFilter) {
          case "today":
            if (assignmentDate) {
              matchesDate = assignmentDate.toDateString() === today.toDateString();
            } else {
              matchesDate = false;
            }
            break;
          case "tomorrow":
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (assignmentDate) {
              matchesDate = assignmentDate.toDateString() === tomorrow.toDateString();
            } else {
              matchesDate = false;
            }
            break;
          case "overdue":
            if (assignmentDate) {
              matchesDate = assignmentDate < today && 
                          assignment.status !== "COMPLETED" && 
                          assignment.status !== "CANCELLED";
            } else {
              matchesDate = false;
            }
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      // Sort by status priority: IN_PROGRESS, PENDING, others
      const statusPriority = {
        'IN_PROGRESS': 0,
        'PENDING': 1,
        'COMPLETED': 2,
        'CANCELLED': 3
      };
      
      const aStatus = statusPriority[a.status as keyof typeof statusPriority] ?? 4;
      const bStatus = statusPriority[b.status as keyof typeof statusPriority] ?? 4;
      
      if (aStatus !== bStatus) {
        return aStatus - bStatus;
      }
      
      // Then sort by scheduled date
      if (!a.scheduledDate && !b.scheduledDate) return 0;
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDeliveryAddress = (assignment: any) => {
    return (
      assignment.deliveryAddress ||
      assignment.productionOrder.customerOrder?.shippingAddress ||
      "No address specified"
    );
  };

  const isOverdue = (assignment: any) => {
    if (!assignment.scheduledDate) return false;
    const today = new Date();
    const scheduledDate = new Date(assignment.scheduledDate);
    return scheduledDate < today && 
           assignment.status !== "COMPLETED" && 
           assignment.status !== "CANCELLED";
  };

  const getStatusCounts = () => {
    return {
      total: assignments.length,
      pending: assignments.filter(a => a.status === "PENDING").length,
      inProgress: assignments.filter(a => a.status === "IN_PROGRESS").length,
      completed: assignments.filter(a => a.status === "COMPLETED").length,
      overdue: assignments.filter(a => isOverdue(a)).length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Management */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Management</CardTitle>
          <CardDescription>
            Manage your delivery routes and schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deliveries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deliveries Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No deliveries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow 
                      key={assignment.id}
                      className={isOverdue(assignment) ? "bg-red-50" : ""}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {assignment.productionOrder.product.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            SKU: {assignment.productionOrder.product.sku}
                          </span>
                          {assignment.productionOrder.productVariant && (
                            <span className="text-sm text-muted-foreground">
                              Variant: {assignment.productionOrder.productVariant.displayName}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            Qty: {assignment.productionOrder.quantity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {assignment.productionOrder.customerOrder?.customer?.name || "N/A"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Order #{assignment.productionOrder.customerOrder?.orderNumber || "N/A"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(assignment.status)}
                          {isOverdue(assignment) && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span>
                              {assignment.scheduledDate
                                ? format(new Date(assignment.scheduledDate), "PPP")
                                : "Not scheduled"}
                            </span>
                            {assignment.scheduledDate && (
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(assignment.scheduledDate), "p")}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 max-w-[200px]">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm truncate">
                              {getDeliveryAddress(assignment)}
                            </span>
                            {assignment.productionOrder.customerOrder?.customer?.phone && (
                              <span className="text-xs text-muted-foreground">
                                📞 {assignment.productionOrder.customerOrder.customer.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px]">
                          <span className="text-sm text-muted-foreground truncate">
                            {assignment.notes || "No notes"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/delivery/orders/${assignment.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 