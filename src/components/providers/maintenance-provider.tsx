"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  showAlert: boolean;
  dismissAlert: () => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Check maintenance mode status from server
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/maintenance-status');
        if (response.ok) {
          const data = await response.json();
          setIsMaintenanceMode(data.isMaintenanceMode);
          setShowAlert(data.isMaintenanceMode);
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      }
    };

    checkMaintenanceMode();
    
    // Poll every 30 seconds to check for maintenance mode changes
    const interval = setInterval(checkMaintenanceMode, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = () => {
    setShowAlert(false);
  };

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, showAlert, dismissAlert }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenanceMode() {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenanceMode must be used within a MaintenanceProvider');
  }
  return context;
}
