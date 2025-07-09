"use client";

import { WorkerTask } from "@/types/worker/tasks";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Status } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCard } from "./TaskCard";

interface TasksListProps {
  tasks: WorkerTask[];
  workflowDataMap?: Map<string, any>;
}

export function TasksList({ tasks, workflowDataMap }: TasksListProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Group tasks by status
  const notStarted = tasks.filter((task) => task.status === Status.PENDING);
  const inProgress = tasks.filter((task) => task.status === Status.IN_PROGRESS);
  const completed = tasks.filter((task) => task.status === Status.COMPLETED);
  
  // Group tasks by active status
  const activeTasks = tasks.filter((task) => task.isActive === true);
  const inactiveTasks = tasks.filter((task) => task.isActive === false);

  // Get tasks for current tab
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
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  // Helper function to get workflow data for a task
  const getWorkflowDataForTask = (task: WorkerTask) => {
    if (!workflowDataMap || !task.productionOrderId) {
      return undefined;
    }
    return workflowDataMap.get(task.productionOrderId);
  };

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
            <TabsTrigger value="all">All Tasks ({tasks.length})</TabsTrigger>
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
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    workflowData={getWorkflowDataForTask(task)}
                  />
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
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    workflowData={getWorkflowDataForTask(task)}
                  />
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
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    workflowData={getWorkflowDataForTask(task)}
                  />
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
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    workflowData={getWorkflowDataForTask(task)}
                  />
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
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    workflowData={getWorkflowDataForTask(task)}
                  />
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
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      workflowData={getWorkflowDataForTask(task)}
                    />
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
