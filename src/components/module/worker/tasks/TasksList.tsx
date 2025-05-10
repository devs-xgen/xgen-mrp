"use client";

import { WorkerTask } from "@/types/worker/tasks";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Status } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCard } from "./TaskCard";

interface TasksListProps {
  tasks: WorkerTask[];
}

export function TasksList({ tasks }: TasksListProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Group tasks by status
  const notStarted = tasks.filter((task) => task.status === Status.PENDING);
  const inProgress = tasks.filter((task) => task.status === Status.IN_PROGRESS);
  const completed = tasks.filter((task) => task.status === Status.COMPLETED);

  // Get tasks for current tab
  const getFilteredTasks = () => {
    switch (activeTab) {
      case "not-started":
        return notStarted;
      case "in-progress":
        return inProgress;
      case "completed":
        return completed;
      default:
        return tasks;
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
          <TabsList className="mb-4">
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
