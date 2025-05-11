"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFullscreen } from "./fullscreen-context";

interface FullscreenButtonProps {
  containerId: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function FullscreenButton({
  containerId,
  variant = "outline",
  size = "sm",
  className,
  showText = false,
}: FullscreenButtonProps) {
  const [isElementFullscreen, setIsElementFullscreen] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  useEffect(() => {
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
  }, [containerId, isFullscreen]);

  const handleToggleFullscreen = () => {
    toggleFullscreen(containerId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFullscreen}
      className={cn(
        "transition-all", 
        size === "icon" ? "h-8 w-8 p-0" : "",
        className
      )}
      title={isElementFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isElementFullscreen ? (
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