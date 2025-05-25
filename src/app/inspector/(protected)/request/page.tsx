// app/inspector/(protected)/tasks/page.tsx

import { Metadata } from "next";
import { getMyTasks, getTaskStatistics } from "@/lib/actions/inspector/tasks";
import { getInventoryItems } from "@/lib/actions/inspector/inventory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TasksPageClient } from "@/components/module/inspectors/request/taskpageclient";


export const metadata: Metadata = {
  title: "My Tasks",
  description: "View and manage your assigned tasks",
};

export default async function TasksPage() {
  const [tasks, stats] = await Promise.all([getMyTasks(), getTaskStatistics()]);
  const inventoryItems = await getInventoryItems();
  const session = await getServerSession(authOptions);

  // You may want to fetch or create a materialRequestId here
  // For demo, we'll use a dummy string
  const materialRequestId = "your-material-request-id";

  return (
    <TasksPageClient
      tasks={tasks}
      stats={stats}
      inventoryItems={inventoryItems}
      materialRequestId={materialRequestId}
      userId={session?.user?.id || ""}
    />
  );
}
