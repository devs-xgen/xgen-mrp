import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivityItem } from "@/lib/actions/worker/dashboard";

function formatTime(d: Date) {
  try {
    return new Date(d).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function RecentActivityCard({ items }: { items: RecentActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recent activity</div>
        ) : (
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{it.type.replaceAll("_", " ")}</div>
                  {it.details ? (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-1">
                      {typeof it.details === "string"
                        ? it.details
                        : JSON.stringify(it.details, null, 2).slice(0, 200)}
                    </pre>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(it.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
