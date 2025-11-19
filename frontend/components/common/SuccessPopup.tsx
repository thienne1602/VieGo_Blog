"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, AlertCircle, Info, XCircle } from "lucide-react";

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

export default function SuccessPopup({
  isOpen,
  onClose,
  message,
  type = "success",
  duration = 3000,
}: SuccessPopupProps) {
  // Auto close after duration
  if (isOpen && duration > 0) {
    setTimeout(() => {
      onClose();
    }, duration);
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6" />;
      case "error":
        return <XCircle className="w-6 h-6" />;
      case "warning":
        return <AlertCircle className="w-6 h-6" />;
      case "info":
        return <Info className="w-6 h-6" />;
      default:
        return <CheckCircle className="w-6 h-6" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-500",
          border: "border-green-600",
          icon: "text-white",
        };
      case "error":
        return {
          bg: "bg-red-500",
          border: "border-red-600",
          icon: "text-white",
        };
      case "warning":
        return {
          bg: "bg-yellow-500",
          border: "border-yellow-600",
          icon: "text-white",
        };
      case "info":
        return {
          bg: "bg-blue-500",
          border: "border-blue-600",
          icon: "text-white",
        };
      default:
        return {
          bg: "bg-green-500",
          border: "border-green-600",
          icon: "text-white",
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={`${colors.bg} ${colors.border} border-2 rounded-xl shadow-2xl px-6 py-4 min-w-[300px] max-w-[500px] pointer-events-auto`}
          >
            <div className="flex items-center space-x-4">
              <div className={colors.icon}>{getIcon()}</div>
              <div className="flex-1">
                <p className="text-white font-semibold text-lg">{message}</p>
              </div>
              <button
                onClick={onClose}
                className={`${colors.icon} hover:opacity-80 transition-opacity`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

