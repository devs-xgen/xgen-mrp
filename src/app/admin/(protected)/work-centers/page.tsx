// src\app\admin\(protected)\work-centers\page.tsx
import { Metadata } from "next";
import { getWorkCenters } from "@/lib/actions/work-center";
import { columns } from "@/components/module/admin/work-centers/columns";
import { DataTable } from "@/components/module/admin/work-centers/data-table";
import { WorkCenterDialog } from "@/components/module/admin/work-centers/create-work-center-dialog";
import { WorkCenterUserCard } from "@/components/module/admin/work-centers/work-center-user-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Decimal } from "@prisma/client/runtime/library";
import { getUsersInWorkCenter } from "@/lib/actions/work-center-users";
import Link from "next/link";
import { LucideLayoutGrid, LucideList } from "lucide-react";

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

      return {
        id: wc.id,
        name: wc.name,
        description: wc.description,
        capacityPerHour: wc.capacityPerHour,
        operatingHours: wc.operatingHours,
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

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Work Centers</h2>
          <p className="text-muted-foreground">
            Manage your production work centers and their capacities
          </p>
        </div>
        <WorkCenterDialog />
      </div>

      <Tabs defaultValue="table" className="w-full">
        <div className="flex justify-end mb-4">
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
          <Card>
            <CardHeader>
              <CardTitle>All Work Centers</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={formattedWorkCentersForTable}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        Efficiency
                      </p>
                      <p className="font-medium">
                        {typeof workCenter.efficiencyRate === "number"
                          ? workCenter.efficiencyRate
                          : 0}
                        %
                      </p>
                    </div>
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
    </div>
  );
}
