
"use client";

import { useTheme } from "@/context/ThemeContext";
import AppSidebar from "@/components/shared/AppSidebar";

export default function LayoutWithTheme({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-full bg-red-100" style={{ flexDirection: 'row' }}>
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0 bg-blue-100" style={{ minWidth: 'auto' }}>
        <AppSidebar theme={theme} toggleTheme={toggleTheme} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-green-100">
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="p-6 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}