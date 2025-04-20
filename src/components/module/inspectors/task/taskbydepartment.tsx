'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { getLoggedInInspectorProductionOrderIds, markTaskAsComplete } from '@/lib/actions/inspectors'; // Import your Server Actions
import { toast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  productionOrder?: {
    id: string;
    orderNumber: string;
    // Add other relevant ProductionOrder fields
  };
  // Add other relevant task properties
}

export function TaskActions() {
  const { status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [errorTasks, setErrorTasks] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchTasks = async () => {
        setLoadingTasks(true);
        setErrorTasks(null);
        try {
          const data = await getLoggedInInspectorProductionOrderIds();
          if (data) {
            setTasks(data);
          }
        } catch (error: any) {
          setErrorTasks(error.message || 'Failed to fetch tasks.');
        } finally {
          setLoadingTasks(false);
        }
      };

      fetchTasks();
    }
  }, [status]);

  const handleMarkComplete = async (taskId: string) => {
    try {
      const result = await markTaskAsComplete(taskId);
      if (result?.success) {
        toast({ title: 'Task Completed', description: `Task ${taskId} marked as complete.` });
        // Optimistically update the UI
        setTasks(tasks.map((task) =>
          task.id === taskId ? { ...task, status: 'COMPLETED' } : task
        ));
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result?.error || 'Failed to mark task as complete.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to mark task as complete.' });
    }
  };

  if (loadingTasks) return <Card>Loading tasks...</Card>;
  if (errorTasks) return <Card><p className="text-red-500">Error loading tasks: {errorTasks}</p></Card>;
  if (!tasks || tasks.length === 0) return <Card><CardContent>No tasks assigned to you.</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Actions</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead className="hidden md:block">Production Order</TableHead>
              <TableHead className="hidden md:block">Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.title}</TableCell>
                <TableCell className="hidden md:block">
                  {task.productionOrder?.orderNumber || 'N/A'}
                </TableCell>
                <TableCell className="hidden md:block">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>{task.status}</TableCell>
                <TableCell className="text-right">
                  {task.status !== 'COMPLETED' && (
                    <Button size="sm" onClick={() => handleMarkComplete(task.id)}>
                      Mark Complete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}