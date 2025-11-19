"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Mail, User, Calendar, X } from "lucide-react";

interface AssignmentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourTitle?: string;
  guideName?: string;
  guideEmail?: string;
  bookingDate?: string;
  emailSent?: boolean;
}

export default function AssignmentSuccessModal({
  isOpen,
  onClose,
  tourTitle,
  guideName,
  guideEmail,
  bookingDate,
  emailSent = false,
}: AssignmentSuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Content */}
              <div className="p-8">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="w-24 h-24 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                  ✅ Phân công thành công!
                </h2>
                <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-6">
                  Hướng dẫn viên đã được phân công cho tour này
                </p>

                {/* Assignment Info */}
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6 border-2 border-teal-200 dark:border-teal-800">
                  <div className="space-y-4">
                    {tourTitle && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Tour</p>
                          <p className="font-bold text-lg text-gray-900 dark:text-white">
                            {tourTitle}
                          </p>
                        </div>
                      </div>
                    )}

                    {guideName && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Hướng dẫn viên</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {guideName}
                          </p>
                          {guideEmail && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {guideEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {bookingDate && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ngày khởi hành
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {bookingDate}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Notice */}
                {emailSent ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <Mail className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-lg text-green-900 dark:text-green-100 mb-2">
                          📧 Email đã được gửi
                        </h3>
                        <p className="text-green-800 dark:text-green-200">
                          Email thông báo đã được gửi thành công đến:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-green-800 dark:text-green-200">
                          <li>Khách hàng ({guideEmail ? "đã nhận thông tin hướng dẫn viên" : ""})</li>
                          <li>Hướng dẫn viên (đã nhận thông tin phân công)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <Mail className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-100 mb-2">
                          ⚠️ Lưu ý về email
                        </h3>
                        <p className="text-yellow-800 dark:text-yellow-200">
                          Email thông báo không thể gửi tự động. Vui lòng thông báo thủ công cho khách hàng và hướng dẫn viên.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                    📋 Bước tiếp theo:
                  </h3>
                  <ol className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex gap-3">
                      <span className="font-bold text-teal-600 dark:text-teal-400">1.</span>
                      <span>Hướng dẫn viên sẽ nhận thông báo và xác nhận phân công</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-teal-600 dark:text-teal-400">2.</span>
                      <span>Khách hàng đã nhận email với thông tin hướng dẫn viên</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-teal-600 dark:text-teal-400">3.</span>
                      <span>Tour này sẽ được chuyển vào tab "Đã phân công"</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-teal-600 dark:text-teal-400">4.</span>
                      <span>Hướng dẫn viên có thể bắt đầu quản lý tour từ dashboard</span>
                    </li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

