import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryTasks } from "@/components/module/delivery/tasks";
import { getDeliveryAssignments } from "@/lib/actions/delivery/delivery-assignment";

export const metadata: Metadata = {
  title: "Delivery Tasks",
  description: "View and update your delivery tasks",
};

export default async function DeliveryTasksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/delivery/login");
  }

  const assignments = await getDeliveryAssignments(session.user.id);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Delivery Tasks</h1>
      </div>
      <DeliveryTasks assignments={assignments} />
    </div>
  );
}
