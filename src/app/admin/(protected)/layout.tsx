import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ThemeProvider } from "@/context/ThemeContext"; // ThemeProvider is fine in server components
import LayoutWithTheme from "@/components/shared/LayoutWithTheme"; // Import the new client component

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect if no session or not an admin
  if (!session?.user) {
    redirect("/admin/login");
  }

  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/worker/dashboard");
  }

  return (
    <ThemeProvider>
      <LayoutWithTheme>{children}</LayoutWithTheme>
    </ThemeProvider>
  );
}
