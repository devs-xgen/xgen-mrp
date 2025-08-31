// src\app\admin\(protected)\work-centers\page.tsx
import { Metadata } from "next";
import { getWorkCenters } from "@/lib/actions/work-center";
import { columns } from "@/components/module/admin/work-centers/columns";
import { DataTable } from "@/components/module/admin/work-centers/data-table";
import { WorkCenterDialog } from "@/components/module/admin/work-centers/create-work-center-dialog";
import { WorkCenterUserCard } from "@/components/module/admin/work-centers/work-center-user-card";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Decimal } from "@prisma/client/runtime/library";
import { getUsersInWorkCenter } from "@/lib/actions/work-center-users";
import Link from "next/link";
import {
  LucideLayoutGrid,
  LucideList,
  LucideActivity,
  LucideUsers,
  LucideSettings,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Work Centers",
  description: "Manage work centers and production capacity",
};

export default async function WorkCentersPage() {
  const workCenters = await getWorkCenters();

  // Format work centers data for table
  const formattedWorkCentersForTable = workCenters.map((wc) => ({
    id: wc.id,
    name: wc.name,
    description: wc.description,
    capacityPerHour: wc.capacityPerHour,
    operatingHours: wc.operatingHours,
    efficiencyRate:
      wc.efficiencyRate instanceof Decimal
        ? wc.efficiencyRate.toString()
        : String(wc.efficiencyRate), // Convert to string for table
    status: wc.status,
    createdAt: wc.createdAt,
    updatedAt: wc.updatedAt,
  }));

  // Format work centers data for card view with users
  const formattedWorkCentersForCards = await Promise.all(
    workCenters.map(async (wc) => {
      // Fetch users for each work center
      const workCenterUsers = await getUsersInWorkCenter(wc.id);

      // Calculate utilization (random for demo purposes)
      // In a real app, this would come from actual operation data
      const utilization = Math.floor(Math.random() * 100);

      // Calculate daily capacity
      const dailyCapacity = wc.capacityPerHour * wc.operatingHours;

      return {
        id: wc.id,
        name: wc.name,
        description: wc.description,
        capacityPerHour: wc.capacityPerHour,
        operatingHours: wc.operatingHours,
        dailyCapacity,
        utilization,
        efficiencyRate: +(wc.efficiencyRate instanceof Decimal
          ? wc.efficiencyRate.toNumber()
          : wc.efficiencyRate),
        status: wc.status,
        createdAt: wc.createdAt,
        updatedAt: wc.updatedAt,
        users: workCenterUsers,
      };
    })
  );

  // Calculate statistics
  const totalWorkCenters = workCenters.length;
  const activeWorkCenters = workCenters.filter(
    (wc) => wc.status === "ACTIVE"
  ).length;
  const inactiveWorkCenters = workCenters.filter(
    (wc) => wc.status === "INACTIVE"
  ).length;
  const totalWorkers = formattedWorkCentersForCards.reduce(
    (acc, wc) => acc + wc.users.length,
    0
  );

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Work Centers</PageTitle>
          <PageDescription>
            Manage your production work centers and their capacities
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <WorkCenterDialog />
        </PageHeaderActions>
      </PageHeader>

      {/* Statistics Cards - Following Design System Pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <LucideSettings className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Total Work Centers
                </p>
                <p className="text-2xl font-bold mt-1">
                  {totalWorkCenters}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Production facilities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <LucideActivity className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Active Centers
                </p>
                <p className="text-2xl font-bold mt-1">
                  {activeWorkCenters}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Currently operational
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <LucideUsers className="h-8 w-8 text-amber-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Assigned Workers
                </p>
                <p className="text-2xl font-bold mt-1">
                  {totalWorkers}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Total workforce
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <LucideSettings className="h-8 w-8 text-purple-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Inactive Centers
                </p>
                <p className="text-2xl font-bold mt-1">
                  {inactiveWorkCenters}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Not in operation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="table" className="w-full space-y-4">
        <div className="flex justify-end">
          <TabsList>
            <TabsTrigger value="table">
              <LucideList className="h-4 w-4 mr-2" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="cards">
              <LucideLayoutGrid className="h-4 w-4 mr-2" />
              Card View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="table">
          <SectionCard heading="All Work Centers">
            <DataTable
              columns={columns}
              data={formattedWorkCentersForTable}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="cards">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formattedWorkCentersForCards.map((workCenter) => (
              <Card key={workCenter.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <Link
                    href={`/admin/work-centers/${workCenter.id}`}
                    className="hover:underline group"
                  >
                    <CardTitle className="flex items-center justify-between">
                      <span className="group-hover:underline">
                        {workCenter.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          workCenter.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {workCenter.status}
                      </span>
                    </CardTitle>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workCenter.description || "No description available"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Capacity/Hr
                      </p>
                      <p className="font-medium">
                        {workCenter.capacityPerHour} units
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Hours</p>
                      <p className="font-medium">
                        {workCenter.operatingHours} hrs
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Daily Capacity
                      </p>
                      <p className="font-medium">
                        {workCenter.dailyCapacity} units
                      </p>
                    </div>
                  </div>

                  {/* Efficiency Rate */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-muted-foreground text-xs">
                        Efficiency
                      </p>
                      <p className="text-xs font-medium">
                        {workCenter.efficiencyRate}%
                      </p>
                    </div>
                    {workCenter.efficiencyRate > 80 ? (
                      <Progress
                        value={workCenter.efficiencyRate}
                        className="h-2 [&>div]:bg-green-500"
                      />
                    ) : workCenter.efficiencyRate > 60 ? (
                      <Progress
                        value={workCenter.efficiencyRate}
                        className="h-2 [&>div]:bg-amber-500"
                      />
                    ) : (
                      <Progress
                        value={workCenter.efficiencyRate}
                        className="h-2 [&>div]:bg-red-500"
                      />
                    )}
                  </div>

                  {/* Utilization Rate */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-muted-foreground text-xs">
                        Current Utilization
                      </p>
                      <p className="text-xs font-medium">
                        {workCenter.utilization}%
                      </p>
                    </div>
                    {workCenter.utilization > 90 ? (
                      <Progress
                        value={workCenter.utilization}
                        className="h-2 [&>div]:bg-red-500"
                      />
                    ) : workCenter.utilization > 70 ? (
                      <Progress
                        value={workCenter.utilization}
                        className="h-2 [&>div]:bg-green-500"
                      />
                    ) : (
                      <Progress
                        value={workCenter.utilization}
                        className="h-2 [&>div]:bg-amber-500"
                      />
                    )}
                  </div>

                  <WorkCenterUserCard
                    workCenterId={workCenter.id}
                    users={workCenter.users}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
