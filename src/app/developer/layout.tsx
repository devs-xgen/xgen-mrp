"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LayoutDashboard,
  MessageCircle,
  Users,
  Settings,
  LogOut,
  Code
} from "lucide-react";

interface NavItem {
  icon: any;
  label: string;
  href: string;
  description: string;
}

const developerNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/developer/dashboard",
    description: "Developer overview and system metrics",
  },
  {
    icon: MessageCircle,
    label: "Support Management",
    href: "/developer/support",
    description: "Manage all customer support tickets",
  },
  {
    icon: Users,
    label: "User Management",
    href: "/admin/users",
    description: "Manage system users",
  },
  {
    icon: Settings,
    label: "System Settings",
    href: "/admin/settings",
    description: "System configuration and maintenance",
  },
];

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Check if user is developer
  const isDeveloper = session?.user?.role === "DEVELOPER";

  if (!isDeveloper) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Code className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-red-600">Access denied. Developer privileges required.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Code className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Developer Portal</h1>
                <p className="text-sm text-gray-600">
                  Welcome, {session?.user?.name || session?.user?.email || "Developer"}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {developerNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
