import { Metadata } from "next";  
import { getWorkCenters } from "@/lib/actions/work-center";  
import { columns } from "@/components/module/admin/work-centers/columns";  
import { DataTable } from "@/components/module/admin/work-centers/data-table";  
import { WorkCenterDialog } from "@/components/module/admin/work-centers/create-work-center-dialog";  
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";  
import { Decimal } from "@prisma/client/runtime/library";  

export const metadata: Metadata = {  
  title: "Work Centers",  
  description: "Manage work centers and production capacity",  
};  

export default async function WorkCentersPage() {  
  const workCenters = await getWorkCenters();  
  
  console.log(workCenters);  

  const formattedWorkCenters = workCenters.map((wc: { id: any; name: any; description: any; capacityPerHour: any; operatingHours: any; efficiencyRate: { toNumber: () => any; }; status: any; createdAt: any; updatedAt: any; }) => ({  
    id: wc.id,  
    name: wc.name,  
    description: wc.description,  
    capacityPerHour: wc.capacityPerHour,  
    operatingHours: wc.operatingHours,  
    efficiencyRate: +(wc.efficiencyRate instanceof Decimal ? wc.efficiencyRate.toNumber() : wc.efficiencyRate), // Convert Decimal to number  
    status: wc.status,  
    createdAt: wc.createdAt,  
    updatedAt: wc.updatedAt,  
  }));  

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

      <Card>  
        <CardHeader>  
          <CardTitle>All Work Centers</CardTitle>  
        </CardHeader>  
        <CardContent>  
          <DataTable  
            columns={columns}  
            data={formattedWorkCenters} // Pass formatted data directly  
          />  
        </CardContent>  
      </Card>  
    </div>  
  );  
}  