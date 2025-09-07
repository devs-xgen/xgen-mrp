"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavItems } from "@/config/nav";
import { getLogoutCallbackUrl } from "@/lib/utils/logout-url";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// No props needed for AppSidebar

// Define a proper type for navigation items
interface NavItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  items?: NavItem[];
}

interface NavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
  isChild?: boolean;
  onToggle?: (itemId: string) => void;
  openItemId?: string;
  itemId: string;
}

function NavItem({
  item,
  isCollapsed,
  isActive,
  isChild = false,
  onToggle,
  openItemId,
  itemId,
}: NavItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
    }
  }, [isCollapsed]);

  // Control open state based on parent's control
  useEffect(() => {
    if (openItemId !== itemId && openItemId !== undefined) {
      setIsOpen(false);
    }
  }, [openItemId, itemId]);

  const handleToggle = (state: boolean) => {
    setIsOpen(state);
    if (onToggle && state) {
      onToggle(itemId);
    } else if (onToggle && !state) {
      onToggle("");
    }
  };

  if (item.items) {
    return (
      <Collapsible open={isOpen} onOpenChange={handleToggle} className="w-full">
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors relative group",
            "min-w-0", // Prevent overflow in collapsed state
            isOpen
              ? "text-slate-100"
              : "text-slate-300 hover:bg-slate-700 hover:text-slate-100"
          )}
        >
          {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
          <span
            className={cn(
              "transition-all duration-300 truncate text-left",
              isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto flex-1",
              item.icon ? "ml-3" : "ml-0"
            )}
          >
            {item.label}
          </span>
          {!isCollapsed && (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform ml-auto",
                isOpen && "transform rotate-180"
              )}
            />
          )}
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-700 text-slate-100 text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {item.label}
            </div>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent
          forceMount
          className={cn(
            // No static padding; only when open
            "data-[state=open]:pt-1 data-[state=closed]:pt-0",
            // Collapse height when closed to prevent spacing
            "overflow-hidden transition-[max-height,opacity,transform] duration-300",
            "data-[state=open]:max-h-[1000px] data-[state=closed]:max-h-0",
            // Optional subtle fade/slide without reserving space
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
            "data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-1",
            // Named group to toggle descendant styles based on state
            "group/cc"
          )}
        >
          <div className={cn(
          "relative space-y-0.5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-px before:bg-slate-700/60 before:transition-opacity group-data-[state=closed]/cc:before:opacity-0 group-data-[state=open]/cc:before:opacity-100 min-w-0",
          isCollapsed ? "ml-0 pl-0" : "ml-4 pl-3"
        )}>
            {item.items.map((subItem, idx) => (
              <div
                key={`wrap-${subItem.href || subItem.label}`}
                className={cn(
                  "transition-all duration-200",
                  "group-data-[state=open]/cc:opacity-100 group-data-[state=open]/cc:translate-y-0",
                  "group-data-[state=closed]/cc:opacity-0 group-data-[state=closed]/cc:-translate-y-1"
                )}
                style={{ transitionDelay: `${idx * 30}ms` }}
              >
                <NavItem
                  item={subItem}
                  isCollapsed={isCollapsed}
                  isActive={pathname === subItem.href}
                  isChild={!isCollapsed}
                  itemId={`${itemId}-${subItem.label}`}
                  openItemId={openItemId}
                />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      href={item.href || "#"}
      className={cn(
        "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors relative group min-w-0",
        isActive
          ? "bg-slate-700 text-slate-100"
          : "text-slate-300 hover:bg-slate-700 hover:text-slate-100",
        isChild && !isCollapsed && "pl-9"
      )}
    >
      {item.icon && <item.icon className="h-5 w-5 shrink-0" />}

      {!isCollapsed || item.items ? (
        <span
          className={cn(
            "transition-all duration-300 truncate text-left",
            isCollapsed ? "opacity-50 w-0" : "opacity-100 w-auto flex-1",
            item.icon ? "ml-3" : "ml-0"
          )}
        >
          {item.label}
        </span>
      ) : null}

      {isCollapsed && !item.items && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-700 text-slate-100 text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          {item.label}
        </div>
      )}
    </Link>
  );
}

// Loading placeholder for nav items
function NavItemSkeleton({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex items-center rounded-lg px-3 py-2 text-sm font-medium relative">
      <div className="h-5 w-5 rounded-full bg-slate-700 animate-pulse"></div>
      {!isCollapsed && (
        <div className="h-4 w-24 ml-3 rounded bg-slate-700 animate-pulse"></div>
      )}
    </div>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openItemId, setOpenItemId] = useState<string>("");

  // Get user data from session
  const user = session?.user;
  const role = user?.role || "";

  // Determine portal type based on user role
  const getPortalFromRole = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "WORKER":
        return "Worker";
      case "INSPECTOR":
        return "Inspector";
      case "DELIVERY":
        return "Delivery";
      default:
        return "User";
    }
  };

  const portalType = getPortalFromRole(role);

  // Get navigation items based on user role
  const navItems = getNavItems(role) as NavItem[];

  // Derived user display info
  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "User");
  const initial = (displayName?.trim()?.charAt(0) || "U").toUpperCase();

  // Handle open/close of nav items to ensure only one is open at a time
  const handleNavItemToggle = (itemId: string) => {
    setOpenItemId(itemId);
  };

  // Loading state - true when session is loading
  const isLoading = status === "loading";

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-neutral-800 text-slate-100 transition-all duration-300 relative border-r border-slate-700",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header section - Fixed at top */}
      <div className="relative p-4 border-b border-slate-700 flex-shrink-0">
        <div
          className={cn(
            "transition-opacity duration-300",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}
        >
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-32 bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-slate-700 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold">{portalType} Portal</h1>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation section - Scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 space-y-2 p-4 min-h-0">
        {isLoading ? (
          // Show skeleton UI while loading
          <>
            <NavItemSkeleton isCollapsed={isCollapsed} />
            <NavItemSkeleton isCollapsed={isCollapsed} />
            <NavItemSkeleton isCollapsed={isCollapsed} />
            <NavItemSkeleton isCollapsed={isCollapsed} />
            <NavItemSkeleton isCollapsed={isCollapsed} />
          </>
        ) : navItems.length > 0 ? (
          // Show actual navigation items when loaded
          navItems.map((item, index) => (
            <NavItem
              key={item.href || item.label}
              item={item}
              isCollapsed={isCollapsed}
              isActive={pathname === item.href}
              onToggle={handleNavItemToggle}
              openItemId={openItemId}
              itemId={`nav-${index}`}
            />
          ))
        ) : (
          // Show message if no navigation items available
          <div
            className={cn(
              "text-sm text-slate-400 px-3 py-2 flex items-center",
              isCollapsed && "justify-center"
            )}
          >
            {!isCollapsed && "No navigation items"}
            {isCollapsed && <span className="h-5 w-5 text-slate-400">?</span>}
          </div>
        )}
      </nav>

      {/* Footer section - Fixed at bottom */}
      <div
        className={cn(
          "p-4 border-t border-slate-700 flex-shrink-0",
          isCollapsed ? "items-center" : ""
        )}
      >
        {/* Profile section */}
        {!isLoading && (
          <>
            {!isCollapsed ? (
              <div className="mb-3 px-3 py-2 rounded-md flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-neutral-800 border border-slate-700 text-slate-100 font-medium">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium truncate">{displayName}</div>
                  <div className="text-xs text-slate-400 truncate">{portalType} • {role || "User"}</div>
                </div>
              </div>
            ) : (
              <div className="mb-2 flex justify-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-neutral-800 border border-slate-700 text-slate-100 text-xs font-medium">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </>
        )}

        {isLoading && !isCollapsed && (
          <div className="mb-3 px-3 flex items-center">
            <Loader2 className="h-3 w-3 mr-2 animate-spin text-slate-400" />
            <div className="h-3 w-32 bg-slate-700 rounded animate-pulse"></div>
          </div>
        )}

        <Button
          variant="ghost"
          className={cn(
            "text-slate-300 hover:bg-slate-700 hover:text-slate-100 border border-slate-700",
            isCollapsed ? "w-10 p-0" : "w-full justify-start"
          )}
          onClick={() => signOut({ callbackUrl: getLogoutCallbackUrl() })}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}
