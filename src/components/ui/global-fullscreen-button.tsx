"use client";

import { useState, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlobalFullscreenButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function GlobalFullscreenButton({
  variant = "outline",
  size = "sm",
  className,
  showText = false,
}: GlobalFullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Check if fullscreen preference is stored
    const storedPreference = localStorage.getItem("global-fullscreen");
    if (storedPreference === "true") {
      toggleFullscreen(true);
    }

    // Add event listener for fullscreen change
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // Add keyboard shortcut (F11)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault(); // Prevent default F11 behavior
        toggleFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleFullscreen = (forceState?: boolean) => {
    const newState = forceState !== undefined ? forceState : !isFullscreen;

    if (newState && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      localStorage.setItem("global-fullscreen", "true");
    } else if (!newState && document.fullscreenElement) {
      document.exitFullscreen();
      localStorage.setItem("global-fullscreen", "false");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => toggleFullscreen()}
      className={cn(
        "transition-all", 
        size === "icon" ? "h-8 w-8 p-0" : "",
        className
      )}
      title={isFullscreen ? "Exit fullscreen (F11)" : "Enter fullscreen (F11)"}
    >
      {isFullscreen ? (
        <>
          <Minimize className="h-4 w-4" />
          {showText && <span className="ml-2">Exit Fullscreen</span>}
        </>
      ) : (
        <>
          <Maximize className="h-4 w-4" />
          {showText && <span className="ml-2">Fullscreen</span>}
        </>
      )}
    </Button>
  );
} 