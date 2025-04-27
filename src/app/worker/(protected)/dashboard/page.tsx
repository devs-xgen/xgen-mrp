// src/app/worker/(protected)/dashboard/page.tsx
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkerDashboard } from "@/components/worker/dashboard";

export const metadata: Metadata = {
  title: "Worker Dashboard",
  description: "View and manage your production tasks",
};

export default async function WorkerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/worker/login");
  }

  try {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Worker Dashboard</h1>
        <WorkerDashboard userId={session.user.id} />
      </div>
    );
  } catch (error) {
    console.error("Error loading worker dashboard:", error);
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Worker Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error loading dashboard. Please try again later.</p>
        </div>
      </div>
    );
  }
}
