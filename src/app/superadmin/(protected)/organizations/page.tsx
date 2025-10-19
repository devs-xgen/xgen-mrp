import { OrganizationsClient } from "@/components/module/superadmin/organizations";

export const metadata = {
  title: "Organizations - SuperAdmin",
  description: "Manage client organizations and their settings",
};

export default function SuperAdminOrganizationsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground mt-2">
          Manage client organizations and their settings
        </p>
      </div>

      <OrganizationsClient />
    </div>
  );
}
