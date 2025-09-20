import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryOrders } from "@/components/module/delivery/orders";
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
  title: "Delivery Orders",
  description: "View and manage delivery orders",
};

export default async function DeliveryOrdersPage() {
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
            <PageTitle>Delivery Dashboard</PageTitle>
            <PageDescription>
              Dashboard details and analytics for user{" "}
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>

        <PageHeaderActions></PageHeaderActions>
        <PageBody>
          <DeliveryOrders assignments={deliveryAssignments} />
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error("Error fetching delivery orders:", error);
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Delivery Orders</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error loading delivery orders. Please try again later.</p>
        </div>
      </div>
    );
  }
}
