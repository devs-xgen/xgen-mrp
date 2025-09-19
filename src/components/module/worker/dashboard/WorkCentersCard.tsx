import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignedWorkCenter } from "@/lib/actions/worker/dashboard";
import { Factory } from "lucide-react";

export function WorkCentersCard({ centers }: { centers: AssignedWorkCenter[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Work Centers</CardTitle>
      </CardHeader>
      <CardContent>
        {centers.length === 0 ? (
          <div className="text-sm text-muted-foreground">No work centers assigned</div>
        ) : (
          <ul className="space-y-3">
            {centers.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Factory className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{c.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">Capacity: {c.capacityPerHour}/hr</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
