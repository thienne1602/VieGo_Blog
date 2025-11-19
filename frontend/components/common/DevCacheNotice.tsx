"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Development Cache Notice Component
 * Displays a notice when running in development mode that cache is disabled
 */
export default function DevCacheNotice() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV === "development") {
      // Check if user has dismissed the notice
      const isDismissed = localStorage.getItem("dev_cache_notice_dismissed");
      if (!isDismissed) {
        setShow(true);
      } else {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("dev_cache_notice_dismissed", "true");
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-2xl p-4 border border-blue-400">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h4 className="font-bold text-sm">Development Mode</h4>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Cache đã được tắt trong chế độ phát triển. Mọi thay đổi giao diện
              sẽ được cập nhật ngay lập tức mà không cần Ctrl+F5.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
