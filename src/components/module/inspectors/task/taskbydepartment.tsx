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
import { getLoggedInInspectorProductionOrderIds, markQualityCheckAsComplete } from '@/lib/actions/inspectors'; // Your server actions
import { toast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  productionOrder?: {
    id: string;
    orderNumber: string;
  };
  qualityChecks?: {
    id: string;
    defectsFound?: string;
    actionTaken?: string;
    notes?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  }[];
}

export function TaskActions() {
  const { status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]); // Updated with correct type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to handle defectsFound, actionTaken, and notes for each task
  const [taskDetails, setTaskDetails] = useState<{
    [taskId: string]: {
      defectsFound: string;
      actionTaken: string;
      notes: string;
    };
  }>({});

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getLoggedInInspectorProductionOrderIds(); // Fetch full objects
          if (data) {
            setTasks(data);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to fetch tasks.');
        } finally {
          setLoading(false);
        }
      };
      fetchTasks();
    }
  }, [status]);

  const handleMarkComplete = async (
    qualityCheckId: string,
    productionOrderId: string
  ) => {
    const { defectsFound, actionTaken, notes } = taskDetails[qualityCheckId] || {
      defectsFound: '',
      actionTaken: '',
      notes: '',
    };
  
    try {
      const result = await markQualityCheckAsComplete(
        productionOrderId, // must be the production order ID
        qualityCheckId,    // must be the quality check ID
        defectsFound,
        actionTaken,
        notes
      );
  
      if (result?.success) {
        toast({
          title: 'Task Completed',
          description: `Quality Check ${qualityCheckId} marked as complete.`,
        });
        setTasks((prev) =>
          prev.map((task) =>
            task.qualityChecks?.[0]?.id === qualityCheckId
              ? { ...task, status: 'COMPLETED' }
              : task
          )
        );
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result?.error || 'Failed to mark task as complete.',
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to mark task as complete.',
      });
    }
  };
  
  const handleFieldChange = (
    qualityCheckId: string,
    field: string,
    value: string
  ) => {
    setTaskDetails((prevDetails) => ({
      ...prevDetails,
      [qualityCheckId]: {
        ...prevDetails[qualityCheckId],
        [field]: value,
      },
    }));
  };
  
  if (loading) return <Card>Loading tasks...</Card>;
  if (error) return <Card><p className="text-red-500">Error: {error}</p></Card>;
  if (tasks.length === 0) return <Card><CardContent>No tasks assigned to you.</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Actions</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Production Order</TableHead>
              <TableHead>Quality Check ID</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.productionOrder?.orderNumber || 'N/A'}</TableCell>
                <TableCell>{task.qualityChecks?.[0]?.id || 'N/A'}</TableCell>
                <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>{task.status}</TableCell>
                <TableCell>
                  {task.status !== 'COMPLETED' ? (
                    <div>
                      {/* Defects Found Input */}
                      <input
                        type="text"
                        placeholder="Defects Found"
                        value={taskDetails[task.id]?.defectsFound || task.qualityChecks?.[0]?.defectsFound || ''}
                        onChange={(e) => handleFieldChange(task.id, 'defectsFound', e.target.value)}
                        className="border p-1 rounded mt-2 w-full"
                      />
                      {/* Action Taken Input */}
                      <input
                        type="text"
                        placeholder="Action Taken"
                        value={taskDetails[task.id]?.actionTaken || task.qualityChecks?.[0]?.actionTaken || ''}
                        onChange={(e) => handleFieldChange(task.id, 'actionTaken', e.target.value)}
                        className="border p-1 rounded mt-2 w-full"
                      />
                      {/* Notes Input */}
                      <input
                        type="text"
                        placeholder="Notes"
                        value={taskDetails[task.id]?.notes || task.qualityChecks?.[0]?.notes || ''}
                        onChange={(e) => handleFieldChange(task.id, 'notes', e.target.value)}
                        className="border p-1 rounded mt-2 w-full"
                      />
                      <Button
                       onClick={() => handleMarkComplete(task.qualityChecks?.[0]?.id,
                        task.id)}
                        className="bg-green-500 text-white hover:bg-green-600 mt-2"
                      >
                        Mark Complete
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-green-500">Completed</span>
                      <span className="ml-2 text-gray-500">Action: {task.qualityChecks?.[0]?.actionTaken || 'N/A'}</span>
                      <span className="ml-2 text-gray-500">Notes: {task.qualityChecks?.[0]?.notes || 'N/A'}</span>
                    </div>
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
