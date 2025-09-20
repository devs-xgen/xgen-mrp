import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryManagement } from "@/components/module/delivery/deliveries";
import { getDeliveryAssignments } from "@/lib/actions/delivery/delivery-assignment";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  PageBody,
} from "@/components/shared/page-layout";

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
      <PageContainer>
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>Delivery Management</PageTitle>
            <PageDescription>
              Dashboard details and analytics for user{" "}
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>

        <PageHeaderActions></PageHeaderActions>
        <PageBody>
          <DeliveryManagement assignments={deliveryAssignments} />
        </PageBody>
      </PageContainer>
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
