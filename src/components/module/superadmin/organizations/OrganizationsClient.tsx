"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Edit, Archive, CheckCircle2, Loader2, Building2 } from "lucide-react";
import { OrganizationData } from "@/lib/actions/superadmin/organizations";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";
import { OrganizationDetails } from "./OrganizationDetails";
import { formatDistanceToNow } from "date-fns";

export function OrganizationsClient() {
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationData | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadOrganizations(), loadStatistics()]);
    setIsLoading(false);
  };

  const loadOrganizations = async () => {
    try {
      const { getAllOrganizations } = await import("@/lib/actions/superadmin/organizations");
      const result = await getAllOrganizations();

      if (result.success && result.data) {
        setOrganizations(result.data);
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      const { getOrganizationsDashboard } = await import("@/lib/actions/superadmin/organizations");
      const result = await getOrganizationsDashboard();

      if (result.success && result.data) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleCreate = async () => {
    setShowCreateDialog(false);
    await loadData();
  };

  const handleArchive = async (orgId: string) => {
    const reason = prompt("Enter reason for archiving (min 15 characters):");
    if (!reason || reason.trim().length < 15) {
      alert("Archive reason must be at least 15 characters");
      return;
    }

    setArchivingId(orgId);
    try {
      const { archiveOrganization } = await import("@/lib/actions/superadmin/organizations");
      const result = await archiveOrganization(orgId, reason);

      if (result.success) {
        await loadData();
      } else {
        alert(result.error || "Failed to archive organization");
      }
    } catch (error) {
      console.error("Error archiving organization:", error);
      alert("An error occurred");
    } finally {
      setArchivingId(null);
    }
  };

  const handleReactivate = async (orgId: string) => {
    if (!confirm("Are you sure you want to reactivate this organization?")) {
      return;
    }

    try {
      const { reactivateOrganization } = await import("@/lib/actions/superadmin/organizations");
      const result = await reactivateOrganization(orgId);

      if (result.success) {
        await loadData();
      } else {
        alert(result.error || "Failed to reactivate organization");
      }
    } catch (error) {
      console.error("Error reactivating organization:", error);
      alert("An error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: "default", label: "Active" },
      TRIAL: { variant: "secondary", label: "Trial" },
      SUSPENDED: { variant: "destructive", label: "Suspended" },
      ARCHIVED: { variant: "outline", label: "Archived" },
    };

    const config = variants[status] || variants.ACTIVE;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedOrg) {
    return (
      <OrganizationDetails
        organization={selectedOrg}
        onClose={() => setSelectedOrg(null)}
        onUpdate={async () => {
          await loadData();
          // Refresh selected org
          const result = await import("@/lib/actions/superadmin/organizations").then(m =>
            m.getOrganizationById(selectedOrg.id)
          );
          if (result.success && result.data) {
            setSelectedOrg(result.data);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.totalOrganizations}</p>
                <p className="text-sm text-muted-foreground">Total Organizations</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.activeOrganizations}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.trialOrganizations}</p>
                <p className="text-sm text-muted-foreground">Trial</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <Archive className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.suspendedOrganizations}</p>
                <p className="text-sm text-muted-foreground">Suspended</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Action Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Organizations</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage client organizations and their settings
            </p>
          </div>

          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
      </Card>

      {/* Organizations Table */}
      <Card>
        {organizations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No Organizations Created</p>
            <p className="text-sm mt-1">Create your first organization to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map(org => (
                  <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOrg(org)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{org.contactEmail}</p>
                        {org.contactPerson && (
                          <p className="text-xs text-muted-foreground">{org.contactPerson}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {org.city && org.country ? (
                          <p>
                            {org.city}, {org.country}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedOrg(org)}>
                            <Edit className="h-4 w-4 mr-2" />
                            View/Edit Details
                          </DropdownMenuItem>
                          {org.status === "ARCHIVED" ? (
                            <DropdownMenuItem onClick={() => handleReactivate(org.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Reactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleArchive(org.id)} disabled={archivingId === org.id}>
                              <Archive className="h-4 w-4 mr-2" />
                              {archivingId === org.id ? "Archiving..." : "Archive"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreateOrganizationDialog onClose={() => setShowCreateDialog(false)} onSuccess={handleCreate} />
      )}
    </div>
  );
}
