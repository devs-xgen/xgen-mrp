import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkCenterUsers } from "@/components/module/admin/work-centers/work-center-users";
import {
  getUsersInWorkCenter,
  getAvailableUsers,
  getWorkCenterDetails,
} from "@/lib/actions/work-center-users";

export const metadata: Metadata = {
  title: "Work Center Users",
  description: "Manage users in a work center",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function WorkCenterUsersPage({ params }: PageProps) {
  const workCenterId = params.id;

  try {
    // Fetch work center details to display name
    const workCenter = await getWorkCenterDetails(workCenterId);

    // Fetch assigned users
    const assignedUsers = await getUsersInWorkCenter(workCenterId);

    // Fetch available users
    const availableUsers = await getAvailableUsers(workCenterId);

    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/work-centers/${workCenterId}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Work Center
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {workCenter.name} - Manage Users
          </h1>
        </div>

        <WorkCenterUsers
          workCenterId={workCenterId}
          workCenterName={workCenter.name}
          assignedUsers={assignedUsers}
          availableUsers={availableUsers}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading work center users:", error);
    notFound();
  }
}
