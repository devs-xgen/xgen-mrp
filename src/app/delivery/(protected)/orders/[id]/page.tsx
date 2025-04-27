import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryOrderDetails } from "@/components/module/delivery/order-details";
import { getDeliveryAssignmentById } from "@/lib/actions/delivery/delivery-assignment";

export const metadata: Metadata = {
  title: "Delivery Order Details",
  description: "View and manage delivery order details",
};

interface DeliveryOrderPageProps {
  params: {
    id: string;
  };
}

export default async function DeliveryOrderPage({
  params,
}: DeliveryOrderPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return notFound();
  }

  try {
    const assignment = await getDeliveryAssignmentById(params.id);

    // Check if the assignment is assigned to the current user
    if (assignment.userId !== session.user.id) {
      return notFound();
    }

    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Delivery Order Details</h1>
        <DeliveryOrderDetails assignment={assignment} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching delivery assignment:", error);
    return notFound();
  }
}
