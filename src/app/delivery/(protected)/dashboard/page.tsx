import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryDashboard } from "@/components/module/delivery/dashboard";
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
      <PageContainer>
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>Delivery Dashboard</PageTitle>
            <PageDescription>
              Track assignments, progress, and recent activity across your delivery routes.
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>

        <PageBody>
          <DeliveryDashboard assignments={deliveryAssignments} />
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error("Error fetching delivery assignments:", error);
    return (
      <PageContainer>
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>Delivery Dashboard</PageTitle>
            <PageDescription>
              Track assignments, progress, and recent activity across your delivery routes.
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>

        <PageBody>
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Error loading delivery assignments. Please try again later.
          </div>
        </PageBody>
      </PageContainer>
    );
  }
}
