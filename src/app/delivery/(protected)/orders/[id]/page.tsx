import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryOrderDetails } from "@/components/module/delivery/order-details";
import { getDeliveryAssignmentById } from "@/lib/actions/delivery/delivery-assignment";
import {
  PageBody,
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeaderMain,
  PageTitle,
} from "@/components/shared/page-layout";

export const metadata: Metadata = {
  title: "Delivery Order Details",
  description: "View and manage delivery order details",
};

interface DeliveryOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DeliveryOrderPage({
  params,
}: DeliveryOrderPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return notFound();
  }

  try {
    const assignment = await getDeliveryAssignmentById(id);

    // Check if the assignment is assigned to the current user
    if (assignment.userId !== session.user.id) {
      return notFound();
    }

    return (
      <PageContainer>
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>Delivery Order Details</PageTitle>
            <PageDescription>
              Review assignment specifics, scheduled stops, and delivery progress.
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>

        <PageBody>
          <DeliveryOrderDetails assignment={assignment} />
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error("Error fetching delivery assignment:", error);
    return notFound();
  }
}
