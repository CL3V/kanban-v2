import React, { useEffect, useState } from "react";
import Image from "next/image";

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
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50 transition-opacity duration-300 opacity-0 pointer-events-none">
        {/* Content will fade out */}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-white flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/juke-horizontal.svg"
            alt="Juke"
            width={180}
            height={48}
            className="max-w-full h-auto"
            priority
          />
        </div>

        <p className="text-gray-600 mb-2">Project Management Made Simple</p>
        <p className="text-gray-400 text-sm">By Core Team</p>

        {/* Loading Spinner */}
        <div className="mt-8">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
};
