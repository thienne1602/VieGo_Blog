"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function Toast({ message, type = "info", onClose }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${
        type === "success"
          ? "bg-green-600 text-white"
          : type === "error"
          ? "bg-red-600 text-white"
          : "bg-blue-600 text-white"
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-4">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
