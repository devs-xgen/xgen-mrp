import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryDashboard } from "@/components/module/delivery/dashboard";
import { getDeliveryAssignments } from "@/lib/actions/delivery/delivery-assignment";

export const metadata: Metadata = {
  title: "Delivery Dashboard",
  description: "View and manage your delivery tasks",
};

export default async function DeliveryDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/delivery/login");
  }

  try {
    // Fetch delivery assignments for the current user
    const deliveryAssignments = await getDeliveryAssignments(session.user.id);

    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Delivery Dashboard</h1>
        <DeliveryDashboard assignments={deliveryAssignments} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching delivery assignments:", error);
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Delivery Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error loading delivery assignments. Please try again later.</p>
        </div>
      </div>
    );
  }
}
