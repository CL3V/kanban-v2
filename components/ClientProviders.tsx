"use client";

import React, { useState, useEffect } from "react";
import { ToastProvider } from "@/contexts/ToastContext";
import { SplashScreen } from "@/components/SplashScreen";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({
  children,
}) => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if this is the first visit or if we should show splash
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  };

  return (
    <ToastProvider>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {children}
    </ToastProvider>
  );
};
