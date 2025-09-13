"use client";

import { InspectorsTask } from "@/types/inspector/task";
import { QualityCheck } from "@prisma/client"; 
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Status } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTaskCard } from "./EnhancedTaskCard";
import { TaskCard } from "./TaskCard";

interface QualityCheckData {
  id: string;
  status: Status;
  productionOrderId: string;
}

interface TasksListProps {
  tasks: InspectorsTask[];
  qualityChecks: QualityCheckData[];
}

export function TasksList({ tasks, qualityChecks }: TasksListProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const normalizedTasks = tasks.map((task) => {
    // Check if this task corresponds to a quality check
    const qualityCheck = qualityChecks.find(
      (check) => check.productionOrderId === task.productionOrderId
    );

    if (qualityCheck) {
      // If a corresponding quality check is found, use its status
      return {
        ...task,
        status: qualityCheck.status,
      };
    }
    // Otherwise, use the original task status
    return task;
  });

  // Now, use the normalizedTasks array for all filtering logic
  const notStarted = normalizedTasks.filter((task) => task.status === Status.PENDING);
  const inProgress = normalizedTasks.filter((task) => task.status === Status.IN_PROGRESS);
  const completed = normalizedTasks.filter((task) => task.status === Status.COMPLETED);

  const activeTasks = normalizedTasks.filter((task) => task.isActive === true);
  const inactiveTasks = normalizedTasks.filter((task) => task.isActive === false);

  const getFilteredTasks = () => {
    switch (activeTab) {
      case "not-started":
        return notStarted;
      case "in-progress":
        return inProgress;
      case "completed":
        return completed;
      case "active":
        return activeTasks;
      case "inactive":
        return inactiveTasks;
      default:
        return normalizedTasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task List</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4 flex flex-wrap">
            <TabsTrigger value="all">All Tasks ({normalizedTasks.length})</TabsTrigger>
            <TabsTrigger value="not-started">
              Not Started ({notStarted.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completed.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeTasks.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactive ({inactiveTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No tasks found
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="not-started" className="mt-0">
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No tasks in this category
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="in-progress" className="mt-0">
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No tasks in this category
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No tasks in this category
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="active" className="mt-0">
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No active tasks available
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="inactive" className="mt-0">
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No inactive tasks
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 p-3 rounded border border-amber-200 mb-4">
                    <p className="text-sm text-amber-800">
                      These tasks are from production orders that have not been started by admin.
                      They will become available once the production is started.
                    </p>
                  </div>
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} /> 
                  ))}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
