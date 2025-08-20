"use client";

import React from "react";
import { ToastProvider } from "@/contexts/ToastContext";
import { SplashScreen } from "@/components/SplashScreen";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({
  children,
}) => {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
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
