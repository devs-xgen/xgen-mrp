"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

type ThemeToggleProps = {
  compact?: boolean; // icon-only mode
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
};

export function ThemeToggle({ compact = false, className, variant = "outline" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant={variant}
      size={compact ? "icon" : "sm"}
      onClick={toggleTheme}
      className={compact ? className : ["flex items-center gap-2", className].filter(Boolean).join(" ")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      {!compact && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </Button>
  );
}