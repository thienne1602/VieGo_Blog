"use client";

import { motion } from "framer-motion";

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: any) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
      >
        <h3 className="text-lg font-semibold mb-2">{title || "Xác nhận"}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-100">
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white"
          >
            Xóa
          </button>
        </div>
      </motion.div>
    </div>
  );
}
