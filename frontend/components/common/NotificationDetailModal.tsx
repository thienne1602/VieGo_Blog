"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info, Ban, Shield, Clock, User } from "lucide-react";

interface NotificationDetailModalProps {
  notification: any | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (notificationId: number) => void;
}

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
}: NotificationDetailModalProps) {
  if (!notification || !isOpen) return null;

  // Determine icon and colors based on notification type
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'account_banned':
      case 'post_banned':
      case 'comment_banned':
        return {
          icon: Ban,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          headerBg: 'bg-red-100',
        };
      case 'account_unbanned':
      case 'post_unbanned':
      case 'comment_unbanned':
      case 'post_created':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          headerBg: 'bg-green-100',
        };
      case 'violation_warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600',
          titleColor: 'text-orange-800',
          headerBg: 'bg-orange-100',
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          headerBg: 'bg-blue-100',
        };
    }
  };

  const style = getNotificationStyle(notification.type);
  const Icon = style.icon;

  // Check if notification is from Moderator
  const isFromModerator = notification.actor?.role === 'moderator' || 
                          notification.actor?.role === 'admin' ||
                          notification.type === 'violation_warning' ||
                          ['account_banned', 'post_banned', 'comment_banned', 
                           'account_unbanned', 'post_unbanned', 'comment_unbanned',
                           'warning', 'info'].includes(notification.type);

  // Get banned keywords from metadata
  const bannedKeywords = notification.metadata?.banned_keywords || [];
  const hasBannedKeywords = bannedKeywords.length > 0;

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return "Vừa xong";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
      
      // Format full date for older notifications
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const handleClose = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${style.bgColor} ${style.borderColor} border-2 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
              {/* Header */}
              <div className={`${style.headerBg} px-6 py-4 border-b ${style.borderColor} flex items-start justify-between`}>
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`${style.iconColor} flex-shrink-0 mt-1`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`${style.titleColor} font-bold text-xl mb-2`}>
                      {notification.title || 'Thông báo'}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(notification.created_at)}</span>
                      </div>
                      {isFromModerator && (
                        <div className="flex items-center space-x-1">
                          <Shield className="w-4 h-4" />
                          <span className="font-medium">Từ Moderator</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className={`${style.iconColor} hover:opacity-70 transition-opacity ml-4 flex-shrink-0`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Sender Info (if from Moderator) */}
                {isFromModerator && notification.actor && (
                  <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      {notification.actor.avatar_url ? (
                        <img
                          src={notification.actor.avatar_url}
                          alt={notification.actor.full_name || notification.actor.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {notification.actor.full_name || notification.actor.username || 'Moderator'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {notification.actor.role === 'moderator' ? 'Moderator' : 'Administrator'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Message */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Nội dung thông báo:</h3>
                  <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                </div>

                {/* Banned Keywords (if violation warning) */}
                {hasBannedKeywords && (
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2 flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Từ khóa vi phạm:</span>
                    </h3>
                    <div className="bg-white/50 rounded-lg p-4 border border-orange-200">
                      <div className="flex flex-wrap gap-2">
                        {bannedKeywords.map((kw: any, index: number) => (
                          <div
                            key={index}
                            className="bg-orange-100 border border-orange-300 rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-orange-800">{kw.keyword}</span>
                              {kw.severity && (
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  kw.severity === 'critical' ? 'bg-red-200 text-red-800' :
                                  kw.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                                  kw.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                  'bg-gray-200 text-gray-800'
                                }`}>
                                  {kw.severity === 'critical' ? 'Nghiêm trọng' :
                                   kw.severity === 'high' ? 'Cao' :
                                   kw.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                                </span>
                              )}
                            </div>
                            {kw.description && (
                              <p className="text-xs text-gray-600 mt-1">{kw.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Content Info */}
                {notification.related_type && notification.related_id && (
                  <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Loại nội dung liên quan:</span>{' '}
                      {notification.related_type === 'post' ? 'Bài viết' :
                       notification.related_type === 'comment' ? 'Bình luận' :
                       notification.related_type}
                    </p>
                    {notification.action_url && (
                      <a
                        href={notification.action_url}
                        className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        Xem chi tiết →
                      </a>
                    )}
                  </div>
                )}

                {/* Metadata Info */}
                {notification.metadata && Object.keys(notification.metadata).length > 0 && !hasBannedKeywords && (
                  <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Thông tin bổ sung:</h3>
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {JSON.stringify(notification.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-white/50 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

