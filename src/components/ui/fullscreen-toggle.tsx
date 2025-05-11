"use client";

import { useState, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFullscreen } from "./fullscreen-context";

interface FullscreenToggleProps {
  containerId: string;
  className?: string;
}

export function FullscreenToggle({ containerId, className }: FullscreenToggleProps) {
  const [isElementFullscreen, setIsElementFullscreen] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  
  useEffect(() => {
    // Load fullscreen preference from localStorage on component mount
    const storedPreference = localStorage.getItem(`fullscreen-${containerId}`);
    if (storedPreference === "true" && !isFullscreen) {
      toggleFullscreen(containerId);
    }
    
    // Update local state based on global fullscreen state
    setIsElementFullscreen(isFullscreen && document.fullscreenElement?.id === containerId);
    
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsElementFullscreen(
        !!document.fullscreenElement && document.fullscreenElement.id === containerId
      );
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [containerId, isFullscreen, toggleFullscreen]);
  
  const handleToggleFullscreen = () => {
    toggleFullscreen(containerId);
  };
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleToggleFullscreen}
      className={cn("h-8 w-8", className)}
      title={isElementFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isElementFullscreen ? (
        <Minimize className="h-4 w-4" />
      ) : (
        <Maximize className="h-4 w-4" />
      )}
    </Button>
  );
} 