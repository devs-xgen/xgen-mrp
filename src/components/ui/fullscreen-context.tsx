"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface FullscreenContextType {
  isFullscreen: boolean;
  toggleFullscreen: (elementId: string) => void;
  exitFullscreen: () => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

interface FullscreenProviderProps {
  children: ReactNode;
}

export function FullscreenProvider({ children }: FullscreenProviderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentFullscreenId, setCurrentFullscreenId] = useState<string | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenState = !!document.fullscreenElement;
      setIsFullscreen(fullscreenState);
      
      if (!fullscreenState && currentFullscreenId) {
        localStorage.setItem(`fullscreen-${currentFullscreenId}`, "false");
        setCurrentFullscreenId(null);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    // Check for any saved fullscreen preferences on mount
    const checkSavedFullscreenPreferences = () => {
      // This would need to be implemented based on your specific use case
      // For example, checking a specific element ID from localStorage
    };
    
    checkSavedFullscreenPreferences();
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [currentFullscreenId]);

  const toggleFullscreen = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setCurrentFullscreenId(elementId);
      localStorage.setItem(`fullscreen-${elementId}`, "true");
    } else {
      document.exitFullscreen();
      localStorage.setItem(`fullscreen-${elementId}`, "false");
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  return (
    <FullscreenContext.Provider value={{ isFullscreen, toggleFullscreen, exitFullscreen }}>
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen() {
  const context = useContext(FullscreenContext);
  if (context === undefined) {
    throw new Error("useFullscreen must be used within a FullscreenProvider");
  }
  return context;
} 