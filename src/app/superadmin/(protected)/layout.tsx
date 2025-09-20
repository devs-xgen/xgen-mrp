import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ThemeProvider } from "@/context/ThemeContext";
import SuperAdminSidebar from "@/components/module/superadmin/SuperAdminSidebar";

export default async function SuperAdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/superadmin/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    // Fallback based on their actual role
    const role = session.user.role;
    const dashboardPath =
      role === "DEVELOPER"
        ? "/developer/dashboard"
        : role === "ADMIN"
          ? "/admin/dashboard"
          : `/${role.toLowerCase()}/dashboard`;
    redirect(dashboardPath);
  }

  return (
    <ThemeProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <div className="sticky top-0 h-[100dvh] flex-shrink-0">
          <SuperAdminSidebar />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 bg-background">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
