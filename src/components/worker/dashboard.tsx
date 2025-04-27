import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Package, Clock, CheckCircle } from "lucide-react";
import { getWorkerTasks, Stat, Task } from "@/lib/actions/worker-tasks";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface WorkerDashboardProps {
  userId: string;
}

export async function WorkerDashboard({ userId }: WorkerDashboardProps) {
  // Fetch worker tasks and stats
  const { tasks, stats } = await getWorkerTasks(userId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat: Stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon === "ClipboardList" && (
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              )}
              {stat.icon === "Clock" && (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              {stat.icon === "CheckCircle" && (
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              )}
              {stat.icon === "Package" && (
                <Package className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task: Task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <h3 className="font-medium">
                      {task.notes || "Task #" + task.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {task.startTime
                        ? format(new Date(task.startTime), "PPP")
                        : "Not started"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(task.status)}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/worker/tasks/${task.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No tasks assigned.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
