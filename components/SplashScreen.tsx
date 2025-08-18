import React, { useEffect, useState } from "react";
import { Layers } from "lucide-react";

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDuration = 1500,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide splash screen after minimum duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 300); // Wait for fade out animation
    }, minDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [minDuration, onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-blue-600 flex items-center justify-center z-50 transition-opacity duration-300 opacity-0 pointer-events-none">
        {/* Content will fade out */}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-blue-600 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-white rounded-2xl p-4 mx-auto mb-6 shadow-lg">
          <Layers className="w-12 h-12 text-blue-600 mx-auto" />
        </div>

        {/* App Title */}
        <h1 className="text-3xl font-bold text-white mb-2">Kanban Board</h1>
        <p className="text-blue-100">Exlusive for Core Team</p>

        {/* Loading Spinner */}
        <div className="mt-8">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
};
