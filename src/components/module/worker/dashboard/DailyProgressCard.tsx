import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock } from "lucide-react";
import { TaskStatistics } from "@/types/worker/tasks";

export function DailyProgressCard({ stats }: { stats: TaskStatistics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm font-medium">{stats.completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completed} of {stats.total} tasks completed today
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h4 className="text-sm font-medium mb-1">Tasks Breakdown</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Not Started:</span>
                  <span>{stats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>In Progress:</span>
                  <span>{stats.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span>{stats.completed}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-1">Priority Distribution</h4>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.urgentTasks} Urgent
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {stats.inProgress} Active
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
