"use client";

import { useTheme } from "@/context/ThemeContext";
import AppSidebar from "@/components/shared/AppSidebar";

export default function LayoutWithTheme({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Fixed Sidebar (left) */}
      <div className="sticky top-0 h-[100dvh] flex-shrink-0">
        <AppSidebar theme={theme} toggleTheme={toggleTheme} />
      </div>

      {/* Main Content (right) */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}