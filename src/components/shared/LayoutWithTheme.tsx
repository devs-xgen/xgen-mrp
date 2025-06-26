
"use client";

import { useTheme } from "@/context/ThemeContext";
import AppSidebar from "@/components/shared/AppSidebar";

export default function LayoutWithTheme({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex h-screen ${theme === "light" ? "bg-background text-foreground" : "bg-background text-foreground"}`}>
      <AppSidebar theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-1 overflow-y-auto p-8 bg-muted/30">{children}</main>
    </div>
  );
}