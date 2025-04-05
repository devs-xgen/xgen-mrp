"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, ChevronLeft, ChevronRight, ChevronDown, Moon, Sun } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavItems } from "@/config/nav";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTheme } from "@/context/ThemeContext";

// Define the props interface for AppSidebar
interface AppSidebarProps {
  theme?: string;
  toggleTheme?: () => void;
}

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
}

function NavItem({
  item,
  isCollapsed,
  isActive,
  isChild = false,
}: NavItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
    }
  }, [isCollapsed]);

  if (item.items) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors relative group",
            isOpen
              ? "text-slate-100"
              : "text-slate-300 hover:bg-slate-700 hover:text-slate-100"
          )}
        >
          {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
          <span
            className={cn(
              "transition-all duration-300",
              isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto",
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
        <CollapsibleContent className="space-y-0.5 pt-1">
          {item.items.map((subItem) => (
            <NavItem
              key={subItem.href || subItem.label}
              item={subItem}
              isCollapsed={isCollapsed}
              isActive={pathname === subItem.href}
              isChild
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      href={item.href || "#"}
      className={cn(
        "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors relative group",
        isActive
          ? "bg-slate-700 text-slate-100"
          : "text-slate-300 hover:bg-slate-700 hover:text-slate-100",
        isChild && "pl-9"
      )}
    >
      {item.icon && <item.icon className="h-5 w-5 shrink-0" />}

      {!isCollapsed || item.items ? (
      <span
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "opacity-50 w-0" : "opacity-100 w-auto",
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

export default function AppSidebar({ theme: propTheme, toggleTheme: propToggleTheme }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Type assertion to ensure navItems matches our NavItem interface
  const navItems = getNavItems(session?.user?.role || "") as NavItem[];
  const isAdmin = ["ADMIN", "MANAGER"].includes(session?.user?.role || "");
  const portalType = isAdmin ? "Admin" : "Worker";
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Use context theme if prop theme is not provided
  const themeContext = useTheme();
  const theme = propTheme || themeContext.theme;
  
  const toggleLightMode = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else {
      themeContext.setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-neutral-800 text-slate-100 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
        // If you want to color the AppSidebar based on theme:
        // theme === "light" ? "bg-white text-black" : "bg-neutral-800 text-slate-100" 
      )}
    >
      <div className="relative p-4 border-b border-slate-700">
        <div
          className={cn(
            "transition-opacity duration-300",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}
        >
          <h1 className="text-xl font-bold">{portalType} Portal</h1>
          <p className="text-sm text-slate-400 mt-1">{session?.user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
        <Button  
          variant="ghost"  
          size="icon"  
          className="absolute right-10 top-1/2 -translate-y-1/2"  
          onClick={toggleLightMode}  
        >  
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}  
        </Button>  
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavItem
            key={item.href || item.label}
            item={item}
            isCollapsed={isCollapsed}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      <div
        className={cn(
          "p-4 border-t border-slate-700",
          isCollapsed ? "items-center" : ""
        )}
      >
        {!isCollapsed && (
          <div className="mb-2 px-3 text-xs text-slate-400">
            Signed in as: {session?.user?.role}
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "text-slate-300 hover:bg-slate-700 hover:text-slate-100",
            isCollapsed ? "w-10 p-0" : "w-full justify-start"
          )}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}