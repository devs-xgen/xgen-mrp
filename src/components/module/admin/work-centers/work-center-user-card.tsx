"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkCenterUser {
  userId: string;
  user: {
    profile?: {
      firstName: string;
      lastName: string;
    } | null;
    email: string;
    role: string;
  };
  isResponsible: boolean;
}

interface WorkCenterUserCardProps {
  workCenterId: string;
  users: WorkCenterUser[];
  loading?: boolean;
}

export function WorkCenterUserCard({
  workCenterId,
  users,
  loading = false,
}: WorkCenterUserCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  // Determine how many users to display
  const displayUsers = expanded ? users : users.slice(0, 3);
  const hasMore = users.length > 3 && !expanded;

  // Handle role badge color based on role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "WORKER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "INSPECTOR":
        return "bg-green-100 text-green-800 border-green-200";
      case "DELIVERY":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="border rounded-md p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Assigned Users ({users.length})</h3>
        </div>
        <Link href={`/admin/work-centers/${workCenterId}/users`}>
          <Button variant="outline" size="sm">
            Manage Users
          </Button>
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No users assigned to this work center.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              router.push(`/admin/work-centers/${workCenterId}/users`)
            }
          >
            Assign Users
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displayUsers.map((user) => (
              <div
                key={user.userId}
                className="flex justify-between items-center text-sm py-1 px-2 hover:bg-muted/50 rounded-sm"
              >
                <div className="flex items-center gap-2">
                  <span>
                    {user.user.profile
                      ? `${user.user.profile.firstName} ${user.user.profile.lastName}`
                      : user.user.email}
                  </span>
                  {user.isResponsible && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 text-xs"
                    >
                      Responsible
                    </Badge>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`${getRoleBadgeColor(user.user.role)} text-xs`}
                >
                  {user.user.role}
                </Badge>
              </div>
            ))}
          </div>

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1 text-xs"
              onClick={() => setExpanded(true)}
            >
              Show {users.length - 3} more users
            </Button>
          )}

          {expanded && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1 text-xs"
              onClick={() => setExpanded(false)}
            >
              Show fewer users
            </Button>
          )}
        </>
      )}
    </div>
  );
}
