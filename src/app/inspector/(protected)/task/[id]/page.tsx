import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskUpdateForm } from "@/components/module/inspectors/task-update-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Task Details",
  description: "View and update task details",
};

interface TaskDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function TaskDetailsPage({
  params,
}: TaskDetailsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/inspector/login");
  }

  const task = await prisma.operation.findFirst({
    where: {
      id: params.id,
      assignedToId: session.user.id,
    },
    include: {
      productionOrder: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!task) {
    redirect("/inspector/dashboard");
  }

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
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Task Details</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Status</h3>
              <div className="mt-1">{getStatusBadge(task.status)}</div>
            </div>

            <div>
              <h3 className="font-medium">Product</h3>
              <div className="mt-1">
                {task.productionOrder?.product.name || "N/A"}
              </div>
            </div>

            <div>
              <h3 className="font-medium">Production Order</h3>
              <div className="mt-1">{task.productionOrder?.id || "N/A"}</div>
            </div>

            <div>
              <h3 className="font-medium">Start Time</h3>
              <div className="mt-1">
                {task.startTime
                  ? format(new Date(task.startTime), "PPP p")
                  : "Not started"}
              </div>
            </div>

            <div>
              <h3 className="font-medium">End Time</h3>
              <div className="mt-1">
                {task.endTime
                  ? format(new Date(task.endTime), "PPP p")
                  : "Not completed"}
              </div>
            </div>

            <div>
              <h3 className="font-medium">Notes</h3>
              <div className="mt-1">{task.notes || "No notes"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskUpdateForm
              task={{
                id: task.id,
                notes: task.notes,
                status: task.status,
                startTime: task.startTime,
                endTime: task.endTime,
                productionOrder: task.productionOrder
                  ? {
                      id: task.productionOrder.id,
                      status: task.productionOrder.status,
                    }
                  : null,
              }}
              inspectorId={session.user.id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
