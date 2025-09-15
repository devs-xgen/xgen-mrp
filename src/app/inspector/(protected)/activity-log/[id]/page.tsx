// src/app/inspector/tasks/[id]/page.tsx

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { TaskUpdateForm } from "@/components/module/inspectors/task-update-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { QualityCheck as TQualityCheck, Status } from "@prisma/client";

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
  const { id } = params; 
  
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/inspector/login");
  }

  const task = await prisma.operation.findFirst({
    where: {
      id: id,
      assignedToId: session.user.id,
    },
    include: {
      productionOrder: {
        include: {
          product: true,
          qualityChecks: {
            orderBy: { checkDate: 'desc' },
          },
        },
      },
    },
  });

  if (!task || !task.productionOrder) {
    redirect("/inspector/dashboard");
  }
  
  // Get the most recent quality check from the pre-fetched data
  const mostRecentQualityCheck = task.productionOrder.qualityChecks.length > 0
    ? task.productionOrder.qualityChecks[0]
    : null;

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">In Progress</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
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
              <h3 className="font-medium">Status</h3>
              <div className="mt-1">{getStatusBadge(task.status)}</div>
            </div>
            {/* Add more fields as needed */}
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
                description: task.description || "",
                status: task.status,
                productionOrderId: task.productionOrder.id,
              }}
              initialData={mostRecentQualityCheck}
              onClose={() => redirect(`/inspector/tasks/${task.id}`)}
              onSubmit={async (data, qcId) => {
                "use server";
                const { updateQualityCheck, createQualityCheck } = await import("@/lib/actions/inspector/production-order");
                
                if (qcId) {
                  await updateQualityCheck(qcId, data);
                } else {
                  await createQualityCheck({
                    ...data,
                    productionOrderId: task.productionOrder.id,
                    inspectorId: session.user.id,
                  });
                }
                redirect(`/inspector/tasks/${task.id}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}