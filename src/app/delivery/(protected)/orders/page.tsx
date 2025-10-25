import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryOrders } from "@/components/module/delivery/orders";
import { getDeliveryAssignments } from "@/lib/actions/delivery/delivery-assignment";
import {
  PageBody,
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeaderMain,
  PageTitle,
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
            <PageTitle>Delivery Orders</PageTitle>
            <PageDescription>
              View current orders, schedules, and completion status by route.
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>

        <PageBody>
          <DeliveryOrders assignments={deliveryAssignments} />
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error("Error fetching delivery orders:", error);
    return (
      <PageContainer>
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>Delivery Orders</PageTitle>
            <PageDescription>
              View current orders, schedules, and completion status by route.
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>

        <PageBody>
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Error loading delivery orders. Please try again later.
          </div>
        </PageBody>
      </PageContainer>
    );
  }
}
