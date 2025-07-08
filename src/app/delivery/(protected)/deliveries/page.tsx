import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryManagement } from "@/components/module/delivery/deliveries";
import { getDeliveryAssignments } from "@/lib/actions/delivery/delivery-assignment";

export const metadata: Metadata = {
  title: "Delivery Management",
  description: "Manage your deliveries and routes",
};

export default async function DeliveriesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/delivery/login");
  }

  try {
    // Fetch delivery assignments for the current user
    const deliveryAssignments = await getDeliveryAssignments(session.user.id);

    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Delivery Management</h1>
        </div>
        <DeliveryManagement assignments={deliveryAssignments} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Delivery Management</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error loading deliveries. Please try again later.</p>
        </div>
      </div>
    );
  }
} 