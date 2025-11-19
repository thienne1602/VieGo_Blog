"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Toast({ message, type = "info", onClose }: any) {
  if (!message) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-lg shadow-xl flex items-start gap-3 max-w-md ${
          type === "success"
            ? "bg-green-600 text-white"
            : type === "error"
            ? "bg-red-600 text-white"
            : type === "warning"
            ? "bg-yellow-500 text-white"
            : "bg-blue-600 text-white"
        }`}
        style={{ wordBreak: "break-word" }}
      >
        <span className="flex-1 whitespace-pre-wrap">{message}</span>
        <button 
          onClick={onClose} 
          className="ml-2 flex-shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
