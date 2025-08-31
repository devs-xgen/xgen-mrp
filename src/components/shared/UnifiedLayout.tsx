import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ThemeProvider } from "@/context/ThemeContext";
import LayoutWithTheme from "@/components/shared/LayoutWithTheme";

interface UnifiedLayoutProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackRoute: string;
  loginRoute: string;
}

export default async function UnifiedLayout({
  children,
  allowedRoles,
  fallbackRoute,
  loginRoute,
}: UnifiedLayoutProps) {
  const session = await getServerSession(authOptions);

  // Redirect if no session
  if (!session?.user) {
    redirect(loginRoute);
  }

  // Check if user role is allowed
  if (!allowedRoles.includes(session.user.role)) {
    redirect(fallbackRoute);
  }

  return (
    <ThemeProvider>
      <LayoutWithTheme>
        {children}
      </LayoutWithTheme>
    </ThemeProvider>
  );
} 