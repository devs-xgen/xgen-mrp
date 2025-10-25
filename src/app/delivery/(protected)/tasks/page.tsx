import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryTasks } from "@/components/module/delivery/tasks";
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
  title: "Delivery Tasks",
  description: "View and update your delivery tasks",
};

export default async function DeliveryTasksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/delivery/login");
  }

  const assignments = await getDeliveryAssignments(session.user.id);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Delivery Tasks</PageTitle>
          <PageDescription>
            Review active assignments, update statuses, and keep routes on schedule.
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody>
        <DeliveryTasks assignments={assignments} />
      </PageBody>
    </PageContainer>
  );
}
