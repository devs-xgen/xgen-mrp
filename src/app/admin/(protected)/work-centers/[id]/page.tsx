import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getUsersInWorkCenter,
  getWorkCenterDetails,
} from "@/lib/actions/work-center-users";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work Center Details",
  description: "View work center details",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function WorkCenterDetailsPage({ params }: PageProps) {
  const workCenterId = params.id;

  try {
    // Fetch work center details
    const workCenter = await getWorkCenterDetails(workCenterId);

    // Fetch users assigned to this work center
    const assignedUsers = await getUsersInWorkCenter(workCenterId);

    // Calculate number of responsible users
    const responsibleUsers = assignedUsers.filter(
      (u) => u.isResponsible
    ).length;

    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/work-centers">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Work Centers
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{workCenter.name}</h1>
            <Badge
              variant={workCenter.status === "ACTIVE" ? "default" : "secondary"}
              className="ml-2"
            >
              {workCenter.status}
            </Badge>
          </div>
          <Link href={`/admin/work-centers/${workCenterId}/users`}>
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Manage Users ({assignedUsers.length})
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Work Center Information</CardTitle>
              <CardDescription>Details about this work center</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-lg">{workCenter.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p className="text-lg">{workCenter.status}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-lg">
                  {workCenter.description || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Capacity Per Hour
                  </p>
                  <p className="text-lg">{workCenter.capacityPerHour} units</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Operating Hours
                  </p>
                  <p className="text-lg">{workCenter.operatingHours} hrs</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Efficiency Rate
                  </p>
                  <p className="text-lg">
                    {typeof workCenter.efficiencyRate === "object" &&
                    "toNumber" in workCenter.efficiencyRate
                      ? workCenter.efficiencyRate.toNumber()
                      : workCenter.efficiencyRate}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Assignment</CardTitle>
              <CardDescription>
                Users assigned to this work center
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Assigned Users
                  </p>
                  <p className="text-lg">{assignedUsers.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Responsible Users
                  </p>
                  <p className="text-lg">{responsibleUsers}</p>
                </div>
              </div>

              {assignedUsers.length > 0 ? (
                <div className="border rounded-md p-4 mt-4">
                  <h3 className="font-medium mb-2">Recent Assignments</h3>
                  <ul className="space-y-2">
                    {assignedUsers.slice(0, 5).map((assignment) => (
                      <li
                        key={assignment.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span>
                          {assignment.user.profile
                            ? `${assignment.user.profile.firstName} ${assignment.user.profile.lastName}`
                            : assignment.user.email}
                          {assignment.isResponsible && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-green-50 text-green-700 border-green-200"
                            >
                              Responsible
                            </Badge>
                          )}
                        </span>
                        <span className="text-muted-foreground">
                          {assignment.user.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {assignedUsers.length > 5 && (
                    <div className="mt-3 text-center">
                      <Link href={`/admin/work-centers/${workCenterId}/users`}>
                        <Button variant="link" size="sm">
                          View all {assignedUsers.length} assigned users
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed rounded-md p-6 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                  <h3 className="font-medium mb-1">No Users Assigned</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This work center doesn't have any users assigned to it yet.
                  </p>
                  <Link href={`/admin/work-centers/${workCenterId}/users`}>
                    <Button variant="secondary" size="sm">
                      Assign Users
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading work center details:", error);
    notFound();
  }
}
