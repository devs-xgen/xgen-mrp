// app/inspector/(protected)/tasks/TasksPageClient.tsx

"use client";

import { Suspense, useState } from "react";
import { TasksList } from "@/components/module/inspectors/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertTriangle, ClipboardList, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Status } from "@prisma/client";
import Link from "next/link";
import { MaterialRequestForm } from "../inventory";

export function TasksPageClient({
  tasks,
  stats,
  inventoryItems,
  materialRequestId,
  userId,
}) {
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  // Your grouping/filtering code
  const notStarted = tasks.filter((task) => task.status === Status.PENDING);
  const inProgress = tasks.filter((task) => task.status === Status.IN_PROGRESS);
  const completed = tasks.filter((task) => task.status === Status.COMPLETED);
  const urgentTasks = tasks.filter((task) => task.priority === "URGENT");
  const activeTasks = tasks.filter((task) => task.isActive === true);
  const inactiveTasks = tasks.filter((task) => task.isActive === false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Tasks</h2>
          <p className="text-muted-foreground">
            View and manage your assigned production tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowMaterialModal(true)}>
            Request Material
          </Button>
          <Link href="/inspector/report-issue">
            <Button variant="default">
              Report Inventory Issue
            </Button>
          </Link>
        </div>
      </div>

      {inactiveTasks.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Some tasks are not active</p>
              <p className="text-sm text-amber-700 mt-1">
                {stats.inactiveTasks || inactiveTasks.length} task(s) are from production orders that have not been started by admin.
                These tasks will be available once the admin starts the production process.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ...your summary cards... */}
      </div>

      <Suspense fallback={<div>Loading tasks...</div>}>
        <TasksList tasks={tasks} />
      </Suspense>

      {/* Material Request Modal */}
      <Dialog open={showMaterialModal} onOpenChange={setShowMaterialModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Material</DialogTitle>
          </DialogHeader>
          <MaterialRequestForm
            inventoryItems={inventoryItems}
            materialRequestId={materialRequestId}
            onSuccess={() => setShowMaterialModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
