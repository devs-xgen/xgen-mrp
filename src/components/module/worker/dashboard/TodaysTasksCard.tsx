import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, Clock } from "lucide-react";
import { Status } from "@prisma/client";
import { WorkerTask } from "@/types/worker/tasks";

export function TodaysTasksCard({ tasks }: { tasks: WorkerTask[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today&apos;s Tasks</CardTitle>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/worker/tasks">
            <span>View All</span>
            <ClipboardList className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No tasks scheduled for today
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between border-b pb-4 ${
                  task.priority === "URGENT"
                    ? "bg-red-50 p-3 rounded-md border-red-200"
                    : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{task.description}</h3>
                    {task.priority === "URGENT" && (
                      <Badge variant="destructive">URGENT</Badge>
                    )}
                    {task.priority === "HIGH" && (
                      <Badge
                        variant="outline"
                        className="bg-orange-100 text-orange-800 hover:bg-orange-100"
                      >
                        HIGH
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>{task.workCenterName}</span>
                    <span>•</span>
                    <span>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "No due time"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.status === Status.PENDING && (
                    <Badge variant="secondary">Not Started</Badge>
                  )}
                  {task.status === Status.IN_PROGRESS && (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                    >
                      In Progress
                    </Badge>
                  )}
                  {task.status === Status.COMPLETED && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 hover:bg-green-100"
                    >
                      Completed
                    </Badge>
                  )}
                  <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Link href={`/worker/tasks?id=${task.id}`}>
                      <Clock className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
