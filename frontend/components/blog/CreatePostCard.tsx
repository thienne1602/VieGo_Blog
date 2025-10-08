"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  Video,
  Smile,
  MapPin,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function CreatePostCard() {
  const { user } = useAuth();
  const [postContent, setPostContent] = useState("");

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <img
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
          alt={user?.full_name || "User"}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => {
            /* Open post creation modal */
          }}
        >
          <span className="text-gray-500">
            {user?.full_name
              ? `${user.full_name} ơi, bạn đang nghĩ gì thế?`
              : "Bạn đang nghĩ gì thế?"}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-3"></div>

      {/* Action Buttons */}
      <div className="flex items-center justify-around">
        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <Video className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium">Video</span>
        </button>

        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <ImageIcon className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium">Ảnh</span>
        </button>

        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <Smile className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium">Cảm xúc</span>
        </button>

        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <MapPin className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">Địa điểm</span>
        </button>
      </div>
    </div>
  );
}
