"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Building2, Users, Package, DollarSign } from "lucide-react";
import {
  OrganizationData,
  OrganizationSettings,
  ResourceLimits,
  OrganizationStatistics,
} from "@/lib/actions/superadmin/organizations";
import { OrganizationStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

interface OrganizationDetailsProps {
  organization: OrganizationData;
  onClose: () => void;
  onUpdate: () => void;
}

export function OrganizationDetails({ organization, onClose, onUpdate }: OrganizationDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState<OrganizationStatistics | null>(null);

  // Basic info state
  const [basicInfo, setBasicInfo] = useState({
    name: organization.name,
    contactEmail: organization.contactEmail,
    contactPhone: organization.contactPhone || "",
    contactPerson: organization.contactPerson || "",
    address: organization.address || "",
    city: organization.city || "",
    country: organization.country || "",
    notes: organization.notes || "",
  });

  // Settings state
  const [settings, setSettings] = useState<OrganizationSettings>(
    organization.settings || {
      operatingHours: { start: "09:00", end: "17:00", timezone: "UTC" },
      defaults: { productionPriority: "NORMAL", leadTimeDays: 7 },
      locale: { currency: "USD", language: "en" },
      branding: { logoUrl: "", primaryColor: "#000000" },
    }
  );

  // Resource limits state
  const [limits, setLimits] = useState<ResourceLimits>(
    organization.resourceLimits || {
      maxUsers: 50,
      maxActiveOrders: 100,
      storageQuotaMB: 5000,
      apiRateLimit: 1000,
    }
  );

  const [status, setStatus] = useState<OrganizationStatus>(organization.status);

  // Load statistics when switching to statistics tab
  const handleTabChange = async (value: string) => {
    setActiveTab(value);
    if (value === "statistics" && !statistics) {
      setIsLoading(true);
      try {
        const { getOrganizationStatistics } = await import("@/lib/actions/superadmin/organizations");
        const result = await getOrganizationStatistics(organization.id);
        if (result.success && result.data) {
          setStatistics(result.data);
        }
      } catch (error) {
        console.error("Error loading statistics:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveBasicInfo = async () => {
    setIsLoading(true);
    try {
      const { updateOrganization } = await import("@/lib/actions/superadmin/organizations");
      const result = await updateOrganization(organization.id, basicInfo);

      if (result.success) {
        onUpdate();
        alert("Organization updated successfully");
      } else {
        alert(result.error || "Failed to update organization");
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const { updateOrganizationSettings } = await import("@/lib/actions/superadmin/organizations");
      const result = await updateOrganizationSettings(organization.id, settings);

      if (result.success) {
        onUpdate();
        alert("Settings updated successfully");
      } else {
        alert(result.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResourceLimits = async () => {
    setIsLoading(true);
    try {
      const { updateResourceLimits } = await import("@/lib/actions/superadmin/organizations");
      const result = await updateResourceLimits(organization.id, limits);

      if (result.success) {
        onUpdate();
        alert("Resource limits updated successfully");
      } else {
        alert(result.error || "Failed to update resource limits");
      }
    } catch (error) {
      console.error("Error updating resource limits:", error);
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: OrganizationStatus) => {
    if (!confirm(`Are you sure you want to change the status to ${newStatus}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { updateOrganizationStatus } = await import("@/lib/actions/superadmin/organizations");
      const result = await updateOrganizationStatus(organization.id, newStatus);

      if (result.success) {
        setStatus(newStatus);
        onUpdate();
        alert("Status updated successfully");
      } else {
        alert(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("An error occurred");
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{organization.name}</h2>
                {getStatusBadge(status)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Created {formatDistanceToNow(new Date(organization.createdAt), { addSuffix: true })} by{" "}
                {organization.creatorName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={status} onValueChange={(value: OrganizationStatus) => handleStatusChange(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="limits">Resource Limits</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={basicInfo.name}
                      onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Slug</Label>
                    <Input value={organization.slug} disabled />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={basicInfo.contactEmail}
                      onChange={e => setBasicInfo({ ...basicInfo, contactEmail: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={basicInfo.contactPhone}
                      onChange={e => setBasicInfo({ ...basicInfo, contactPhone: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={basicInfo.contactPerson}
                      onChange={e => setBasicInfo({ ...basicInfo, contactPerson: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Location</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={basicInfo.address}
                      onChange={e => setBasicInfo({ ...basicInfo, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={basicInfo.city}
                      onChange={e => setBasicInfo({ ...basicInfo, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={basicInfo.country}
                      onChange={e => setBasicInfo({ ...basicInfo, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={basicInfo.notes}
                  onChange={e => setBasicInfo({ ...basicInfo, notes: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBasicInfo} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0 space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Operating Hours</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={settings.operatingHours?.start || "09:00"}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          operatingHours: { ...settings.operatingHours!, start: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={settings.operatingHours?.end || "17:00"}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          operatingHours: { ...settings.operatingHours!, end: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Timezone</Label>
                    <Input
                      value={settings.operatingHours?.timezone || "UTC"}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          operatingHours: { ...settings.operatingHours!, timezone: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Defaults</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Production Priority</Label>
                    <Select
                      value={settings.defaults?.productionPriority || "NORMAL"}
                      onValueChange={value =>
                        setSettings({
                          ...settings,
                          defaults: { ...settings.defaults!, productionPriority: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Lead Time (Days)</Label>
                    <Input
                      type="number"
                      value={settings.defaults?.leadTimeDays || 7}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          defaults: { ...settings.defaults!, leadTimeDays: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Locale</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Currency</Label>
                    <Input
                      value={settings.locale?.currency || "USD"}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          locale: { ...settings.locale!, currency: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Language</Label>
                    <Input
                      value={settings.locale?.language || "en"}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          locale: { ...settings.locale!, language: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Branding</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Logo URL</Label>
                    <Input
                      value={settings.branding?.logoUrl || ""}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          branding: { ...settings.branding!, logoUrl: e.target.value },
                        })
                      }
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <Label>Primary Color</Label>
                    <Input
                      type="color"
                      value={settings.branding?.primaryColor || "#000000"}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          branding: { ...settings.branding!, primaryColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </TabsContent>

            {/* Resource Limits Tab */}
            <TabsContent value="limits" className="mt-0 space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Resource Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Configure resource usage limits for this organization
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Users</Label>
                    <Input
                      type="number"
                      value={limits.maxUsers || 50}
                      onChange={e => setLimits({ ...limits, maxUsers: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>Max Active Orders</Label>
                    <Input
                      type="number"
                      value={limits.maxActiveOrders || 100}
                      onChange={e => setLimits({ ...limits, maxActiveOrders: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>Storage Quota (MB)</Label>
                    <Input
                      type="number"
                      value={limits.storageQuotaMB || 5000}
                      onChange={e => setLimits({ ...limits, storageQuotaMB: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>API Rate Limit (req/hour)</Label>
                    <Input
                      type="number"
                      value={limits.apiRateLimit || 1000}
                      onChange={e => setLimits({ ...limits, apiRateLimit: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveResourceLimits} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Limits
                </Button>
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="mt-0 space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : statistics ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{statistics.totalUsers}</p>
                          <p className="text-xs text-muted-foreground">Total Users</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                          <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{statistics.activeUsers}</p>
                          <p className="text-xs text-muted-foreground">Active Users</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                          <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{statistics.totalProductionOrders}</p>
                          <p className="text-xs text-muted-foreground">Total Orders</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                          <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{statistics.activeProductionOrders}</p>
                          <p className="text-xs text-muted-foreground">Active Orders</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">${statistics.totalRevenue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                          <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">${statistics.averageOrderValue.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Avg Order Value</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Additional Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Completed Orders</p>
                          <p className="font-medium">{statistics.completedOrders}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Activity</p>
                          <p className="font-medium">
                            {statistics.lastActivityDate
                              ? formatDistanceToNow(new Date(statistics.lastActivityDate), { addSuffix: true })
                              : "No activity"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">No statistics available</div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
