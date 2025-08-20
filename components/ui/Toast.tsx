import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastComponentProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const ToastComponent: React.FC<ToastComponentProps> = ({
  toast,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        );
      case "error":
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
        );
      case "warning":
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
        );
      case "info":
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
        );
    }
  };

  const getStyles = () => {
    const baseStyles = "bg-white border shadow-xl backdrop-blur-sm";
    switch (toast.type) {
      case "success":
        return `${baseStyles} border-green-200 shadow-green-100`;
      case "error":
        return `${baseStyles} border-red-200 shadow-red-100`;
      case "warning":
        return `${baseStyles} border-amber-200 shadow-amber-100`;
      case "info":
        return `${baseStyles} border-blue-200 shadow-blue-100`;
      default:
        return `${baseStyles} border-blue-200 shadow-blue-100`;
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div
      className={`
        relative max-w-sm w-full rounded-xl overflow-hidden transition-all duration-500 ease-out transform
        ${getStyles()}
        ${
          isVisible && !isLeaving
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        }
      `}
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
      }}
    >
      {toast.duration !== 0 && (
        <div className="absolute top-0 left-0 h-1 w-full bg-gray-100">
          <div
            className={`h-full ${getProgressBarColor()} transition-all ease-linear`}
            style={{
              width: isVisible && !isLeaving ? "0%" : "100%",
              transitionDuration: `${toast.duration || 5000}ms`,
            }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start space-x-3">
          {getIcon()}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {toast.title}
              </h4>

              <button
                onClick={handleClose}
                className="ml-2 flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {toast.message && (
              <p className="text-xs text-gray-600 leading-relaxed">
                {toast.message}
              </p>
            )}

            {toast.action && (
              <div className="mt-3">
                <button
                  onClick={toast.action.onClick}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor:
                      toast.type === "success"
                        ? "#f0f9ff"
                        : toast.type === "error"
                        ? "#fef2f2"
                        : toast.type === "warning"
                        ? "#fffbeb"
                        : "#f0f9ff",
                    color:
                      toast.type === "success"
                        ? "#0369a1"
                        : toast.type === "error"
                        ? "#dc2626"
                        : toast.type === "warning"
                        ? "#d97706"
                        : "#0369a1",
                  }}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background:
            toast.type === "success"
              ? "linear-gradient(135deg, #10b981, #059669)"
              : toast.type === "error"
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : toast.type === "warning"
              ? "linear-gradient(135deg, #f59e0b, #d97706)"
              : "linear-gradient(135deg, #3b82f6, #2563eb)",
        }}
      />
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
}) => {
  return (
    <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};
