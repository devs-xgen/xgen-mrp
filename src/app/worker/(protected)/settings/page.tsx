// src/app/worker/(protected)/settings/page.tsx
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const metadata: Metadata = {
  title: "Worker Settings",
  description: "Manage your account settings",
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mb-6">
          Manage your account preferences and notifications
        </p>
      </div>

      <Card className="border-2 border-dashed">
        <CardHeader className="text-center">
          <Construction className="w-12 h-12 mx-auto text-muted-foreground" />
          <CardTitle className="text-2xl mt-4">
            Settings Page Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>This section is under development.</p>
          <p className="mt-2">Check back soon for account settings features!</p>
        </CardContent>
      </Card>
    </div>
  );
}
