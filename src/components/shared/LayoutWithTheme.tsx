// components/shared/LayoutWithTheme.tsx
"use client";

import { useTheme } from "@/context/ThemeContext";
import AppSidebar from "@/components/shared/AppSidebar";

export default function LayoutWithTheme({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme(); // Now it's inside a client component

  return (
    <div className={`flex h-screen ${theme === "light" ? "bg-white text-black" : "bg-neutral-800 text-slate-100"}`}>
      <AppSidebar theme={theme} toggleTheme={toggleTheme} /> {/* Pass theme props */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
