"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string | ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900">{title || "Xác nhận"}</h3>
          <div className="mb-6">
            {typeof message === 'string' ? (
              <p className="text-sm text-gray-600">{message}</p>
            ) : (
              message
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-semibold"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
