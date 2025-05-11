"use client";

import { useState, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GlobalFullscreenToggle() {
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
      variant="outline"
      size="icon"
      onClick={() => toggleFullscreen()}
      className="h-10 w-10 rounded-full shadow-md bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-background/90"
      title={isFullscreen ? "Exit fullscreen (F11)" : "Enter fullscreen (F11)"}
    >
      {isFullscreen ? (
        <Minimize className="h-5 w-5" />
      ) : (
        <Maximize className="h-5 w-5" />
      )}
    </Button>
  );
} 