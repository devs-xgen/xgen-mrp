import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpcomingOperationItem } from "@/lib/actions/worker/dashboard";
import { CalendarClock } from "lucide-react";

export function UpcomingDeadlinesCard({ items }: { items: UpcomingOperationItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Deadlines (7 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No upcoming operations</div>
        ) : (
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{it.productName} ({it.productSku})</div>
                    <div className="text-xs text-muted-foreground">{it.workCenterName}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(it.endTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
