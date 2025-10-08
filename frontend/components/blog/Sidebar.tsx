"use client";

import {
  Home,
  Users,
  Calendar,
  Bookmark,
  MapPin,
  Camera,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export default function Sidebar() {
  const { user } = useAuth();

  const menuItems = [
    {
      icon: Home,
      label: "Trang chủ",
      href: "/",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Users,
      label: "Bạn bè",
      href: "/friends",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Calendar,
      label: "Sự kiện",
      href: "/events",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Bookmark,
      label: "Đã lưu",
      href: "/saved",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      icon: MapPin,
      label: "Bản đồ",
      href: "/maps",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      icon: Camera,
      label: "Tours",
      href: "/tours",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const shortcuts = [
    {
      name: "Du lịch Việt Nam",
      image:
        "https://images.unsplash.com/photo-1555400082-c2f3df78b8ab?w=40&h=40&fit=crop",
      members: 1234,
    },
    {
      name: "Ẩm thực Hà Nội",
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=40&h=40&fit=crop",
      members: 856,
    },
    {
      name: "Backpacker Việt",
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=40&h=40&fit=crop",
      members: 2341,
    },
  ];

  return (
    <div className="space-y-4">
      {/* User Profile Card */}
      {user && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Link
            href="/profile/user"
            className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
              alt={user.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900">{user.full_name}</p>
              <p className="text-sm text-gray-500">Xem hồ sơ của bạn</p>
            </div>
          </Link>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="bg-white rounded-xl shadow-sm">
        <nav className="p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div
                  className={`p-2 rounded-lg ${item.bgColor} group-hover:${item.bgColor}`}
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-gray-900">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Your Shortcuts */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Lối tắt của bạn</h3>
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.name}
              href="#"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <img
                src={shortcut.image}
                alt={shortcut.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {shortcut.name}
                </p>
                <p className="text-xs text-gray-500">
                  {shortcut.members} thành viên
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="space-y-2">
          <Link
            href="/settings"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Cài đặt</span>
          </Link>
          <Link
            href="/help"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">Trợ giúp</span>
          </Link>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            © 2025 VieGo. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </div>
  );
}
