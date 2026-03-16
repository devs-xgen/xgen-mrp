import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
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
              Review assignment specifics, scheduled stops, and delivery
              progress.
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

    const isNotFound =
      error instanceof Error &&
      error.message === "Delivery assignment not found";

    if (isNotFound) {
      return notFound();
    }

    return (
      <PageContainer>
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>Delivery Order Details</PageTitle>
            <PageDescription>
              Review assignment specifics, scheduled stops, and delivery
              progress.
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>

        <PageBody>
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">Unable to load delivery assignment.</p>
            <p className="mt-1 text-xs text-destructive/80">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred."}
            </p>
            <Link
              href="/delivery/tasks"
              className="mt-3 inline-block text-xs underline underline-offset-2"
            >
              Return to Tasks
            </Link>
          </div>
        </PageBody>
      </PageContainer>
    );
  }
}
