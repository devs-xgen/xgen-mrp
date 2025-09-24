import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers } from "@/lib/actions/users";
import DeveloperUsersClient from "@/components/module/developer/users/developer-users-client";

export const metadata: Metadata = {
  title: "Developer • User Management",
  description: "Full user management for developers: edit user data, roles, and status",
};

// This page requires session (uses getServerSession via getUsers),
// so mark as dynamic to avoid static prerendering errors during build.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DeveloperUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage users with developer privileges: inline role/status changes and full edit dialog per user.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DeveloperUsersClient data={users} />
        </CardContent>
      </Card>
    </div>
  );
}
