import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

interface FriendActionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  type: "sent" | "cancelled" | "accepted" | "rejected" | "unfriended";
  message?: string;
}

const FriendActionPopup: React.FC<FriendActionPopupProps> = ({
  isOpen,
  onClose,
  type,
  message,
}) => {
  // Auto close after 3 seconds
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const getContent = () => {
    switch (type) {
      case "sent":
        return {
          title: "Đã gửi lời mời!",
          text:
            message ||
            "Đã gửi lời mời kết bạn thành công. Vui lòng đợi phản hồi.",
          sticker: "/stickers/ketban.gif",
        };
      case "accepted":
        return {
          title: "Đã là bạn bè!",
          text: message || "Hai bạn đã trở thành bạn bè.",
          sticker: "/stickers/ketban.gif",
        };
      case "cancelled":
        return {
          title: "Đã hủy lời mời",
          text: message || "Đã hủy lời mời kết bạn thành công.",
          sticker: null,
        };
      case "rejected":
        return {
          title: "Đã từ chối",
          text: message || "Đã từ chối lời mời kết bạn.",
          sticker: null,
        };
      case "unfriended":
        return {
          title: "Đã hủy kết bạn",
          text: message || "Đã hủy kết bạn thành công.",
          sticker: null,
        };
      default:
        return {
          title: "Thông báo",
          text: message,
          sticker: null,
        };
    }
  };

  const content = getContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col items-center text-center">
              {content.sticker && (
                <div className="w-32 h-32 mb-4 relative">
                  <Image
                    src={content.sticker}
                    alt="Sticker"
                    fill
                    className="object-contain"
                    unoptimized // Needed for GIFs sometimes
                  />
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {content.title}
              </h3>

              <p className="text-gray-600 dark:text-gray-300">{content.text}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FriendActionPopup;
