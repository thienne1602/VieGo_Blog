"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn } from "lucide-react";
import Link from "next/link";

interface LoginRequestPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginRequestPopup: React.FC<LoginRequestPopupProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-8 flex flex-col items-center text-center">
              {/* GIF Image */}
              <div className="w-48 h-48 mb-6 rounded-full overflow-hidden border-4 border-teal-100 dark:border-teal-900/30 shadow-inner bg-teal-50">
                <img
                  src="/images/xin-chao.gif"
                  alt="Xin chào"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Bạn chưa đăng nhập?
              </h3>

              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Vui lòng đăng nhập để đặt tour và trải nghiệm đầy đủ các tính
                năng tuyệt vời của VieGo!
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  Để sau
                </button>
                <Link
                  href="/welcome?force=true"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors shadow-lg hover:shadow-teal-500/30 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Đăng nhập
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginRequestPopup;
