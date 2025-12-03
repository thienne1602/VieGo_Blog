"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info, Ban } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDetailModal from "./NotificationDetailModal";

interface NotificationPopupProps {
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function NotificationPopup({
  autoClose = true,
  autoCloseDelay = 5000,
}: NotificationPopupProps) {
  const { notifications, markAsRead } = useNotifications();
  const [displayedNotifications, setDisplayedNotifications] = useState<
    Set<number>
  >(new Set());
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalNotification, setModalNotification] = useState<any>(null);

  useEffect(() => {
    // Find the latest unread notification that should be displayed as popup
    const unreadNotifications = notifications.filter(
      (notif) => !notif.is_read && !displayedNotifications.has(notif.id)
    );

    if (unreadNotifications.length > 0) {
      const latest = unreadNotifications[0];

      // Only show popup for specific notification types
      const shouldShowPopup = [
        "account_banned",
        "post_banned",
        "comment_banned",
        "account_unbanned",
        "post_unbanned",
        "comment_unbanned",
        "violation_warning",
        "post_created",
        "info",
        "warning",
      ].includes(latest.type);

      if (shouldShowPopup) {
        setCurrentNotification(latest);
        setDisplayedNotifications(
          (prev) => new Set(Array.from(prev).concat(latest.id))
        );

        if (autoClose) {
          const timer = setTimeout(() => {
            setCurrentNotification(null);
          }, autoCloseDelay);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [notifications, displayedNotifications, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setCurrentNotification(null);
  };

  const handleClick = () => {
    if (currentNotification) {
      setModalNotification(currentNotification);
      setShowDetailModal(true);
      setCurrentNotification(null); // Close popup when opening modal
    }
  };

  if (!currentNotification) return null;

  // Determine icon and colors based on notification type
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "account_banned":
      case "post_banned":
      case "comment_banned":
        return {
          icon: Ban,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
        };
      case "account_unbanned":
      case "post_unbanned":
      case "comment_unbanned":
      case "post_created":
        return {
          icon: CheckCircle,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          titleColor: "text-green-800",
        };
      case "violation_warning":
        return {
          icon: AlertTriangle,
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          iconColor: "text-orange-600",
          titleColor: "text-orange-800",
        };
      default:
        return {
          icon: Info,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconColor: "text-blue-600",
          titleColor: "text-blue-800",
        };
    }
  };

  const style = getNotificationStyle(currentNotification.type);
  const Icon = style.icon;

  return (
    <>
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 right-4 z-50 w-full max-w-md cursor-pointer"
            onClick={handleClick}
          >
            <div
              className={`${style.bgColor} ${style.borderColor} border-2 rounded-xl shadow-xl p-4 backdrop-blur-sm hover:shadow-2xl transition-shadow`}
            >
              <div className="flex items-start space-x-3">
                <div className={`${style.iconColor} flex-shrink-0 mt-1`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4
                      className={`${style.titleColor} font-semibold text-lg mb-1`}
                    >
                      {currentNotification.title || "Thông báo"}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClose();
                      }}
                      className={`${style.iconColor} hover:opacity-70 transition-opacity ml-2 flex-shrink-0`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {currentNotification.message}
                  </p>
                  <div className="mt-2 text-xs text-gray-500 italic">
                    Click để xem chi tiết
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <NotificationDetailModal
        notification={modalNotification}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setModalNotification(null);
        }}
        onMarkAsRead={markAsRead}
      />
    </>
  );
}
