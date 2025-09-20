"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getNavItems } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role ?? "SUPER_ADMIN";
  const navItems = getNavItems(role) as Array<{
    label: string;
    href?: string;
    icon?: any;
    items?: Array<{ label: string; href?: string; icon?: any }>;
  }>;

  const displayName = session?.user?.name || session?.user?.email || "Super Admin";
  const initial = (displayName?.trim()?.charAt(0) || "S").toUpperCase();

  return (
    <aside className="h-[100dvh] w-72 bg-neutral-900 text-slate-100 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500" />
          <div>
            <div className="text-lg font-semibold leading-tight">Super Admin</div>
            <div className="text-xs text-slate-400">System Control Center</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon as any;
          const isActive = pathname === item.href;
          const hasChildren = Array.isArray(item.items) && item.items.length > 0;

          if (hasChildren) {
            return (
              <div key={item.label} className="space-y-1">
                <div className="px-3 text-xs uppercase tracking-wide text-slate-500 mt-3">
                  {item.label}
                </div>
                <div className="ml-2 space-y-1">
                  {item.items!.map((child) => {
                    const CIcon = child.icon as any;
                    const active = pathname === child.href;
                    return (
                      <Link
                        key={child.href || child.label}
                        href={child.href || "#"}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                          active
                            ? "bg-slate-800 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        {CIcon && <CIcon className="h-4 w-4" />}
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.href || item.label}
              href={item.href || "#"}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-neutral-800 border border-slate-700 text-slate-100 text-xs font-medium">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{displayName}</div>
            <div className="text-xs text-slate-400 truncate">SUPER_ADMIN</div>
          </div>
        </div>
        <ThemeToggle className="w-full justify-start text-slate-300 hover:bg-slate-800 border border-slate-700" />
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-slate-800 border border-slate-700"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </aside>
  );
}
