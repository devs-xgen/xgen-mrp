
"use client";

import { useTheme } from "@/context/ThemeContext";
import AppSidebar from "@/components/shared/AppSidebar";

export default function LayoutWithTheme({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-full" style={{ flexDirection: 'row' }}>
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0" style={{ minWidth: 'auto' }}>
        <AppSidebar theme={theme} toggleTheme={toggleTheme} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}