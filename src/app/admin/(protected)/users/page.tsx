import { Metadata } from "next";
import { UserDataTable } from "@/components/module/admin/users/data-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateUserDialog } from "@/components/module/admin/users/create-user-dialog";
import { getUsers } from "@/lib/actions/users";

export const metadata: Metadata = {
  title: "Users",
  description: "Manage system users and their roles",
};

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page Header - Following Sales Invoices Pattern */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground mt-1">
            Manage system users and their roles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateUserDialog />
        </div>
      </div>

      {/* Data Table - Following Design System Pattern */}
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserDataTable data={users} />
        </CardContent>
      </Card>
    </div>
  );
}
