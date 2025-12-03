"use client";

import { motion } from "framer-motion";

interface GlobalLoadingProps {
  message?: string;
}

export default function GlobalLoading({
  message = "Đang tải...",
}: GlobalLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-50 via-accent-50 to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.img
          src="/assets/stickers/đang tải.gif"
          alt="Loading"
          className="w-64 h-auto object-contain mx-auto mb-6"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-semibold text-gray-700 dark:text-gray-200"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
