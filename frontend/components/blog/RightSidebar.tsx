"use client";

import { Users, Calendar, TrendingUp, Clock } from "lucide-react";

export default function RightSidebar() {
  const trendingTopics = [
    {
      topic: "#DuLichVietNam",
      posts: "1,234 bài viết",
    },
    {
      topic: "#AmThucHaNoi",
      posts: "856 bài viết",
    },
    {
      topic: "#BackpackerViet",
      posts: "642 bài viết",
    },
    {
      topic: "#PhoHaNoi",
      posts: "489 bài viết",
    },
  ];

  const suggestedFriends = [
    {
      name: "Nguyễn Việt Anh",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
      mutualFriends: 5,
      location: "Hà Nội",
    },
    {
      name: "Trần Minh Thư",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
      mutualFriends: 12,
      location: "TP.HCM",
    },
    {
      name: "Lê Hoàng Nam",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      mutualFriends: 8,
      location: "Đà Nẵng",
    },
  ];

  const upcomingEvents = [
    {
      title: "Festival Áo Dài Hội An",
      date: "15 Tháng 10",
      time: "19:00",
      attending: 234,
    },
    {
      title: "Chợ đêm Phố Cổ Hà Nội",
      date: "20 Tháng 10",
      time: "18:00",
      attending: 156,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Trending Topics */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">Xu hướng</h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.map((trend, index) => (
            <div
              key={index}
              className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <p className="font-medium text-blue-600 hover:text-blue-700">
                {trend.topic}
              </p>
              <p className="text-sm text-gray-500">{trend.posts}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Friends */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-gray-900">Gợi ý kết bạn</h3>
        </div>
        <div className="space-y-3">
          {suggestedFriends.map((friend, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {friend.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {friend.mutualFriends} bạn chung • {friend.location}
                  </p>
                </div>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors">
                Kết bạn
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900">Sự kiện sắp tới</h3>
        </div>
        <div className="space-y-3">
          {upcomingEvents.map((event, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <h4 className="font-medium text-gray-900 text-sm mb-1">
                {event.title}
              </h4>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                <Clock className="w-3 h-3" />
                <span>
                  {event.date} • {event.time}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {event.attending} người quan tâm
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Thống kê nhanh</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-lg font-bold text-blue-600">1,234</p>
            <p className="text-xs text-gray-600">Bài viết</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-lg font-bold text-green-600">5,678</p>
            <p className="text-xs text-gray-600">Lượt thích</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-lg font-bold text-purple-600">234</p>
            <p className="text-xs text-gray-600">Bạn bè</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-lg font-bold text-orange-600">89</p>
            <p className="text-xs text-gray-600">Địa điểm</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="text-xs text-gray-500 space-y-1">
          <p>Về chúng tôi • Trợ giúp • Điều khoản</p>
          <p>Quyền riêng tư • Cookie • Quảng cáo</p>
          <p className="pt-2 border-t border-gray-100">VieGo © 2025</p>
        </div>
      </div>
    </div>
  );
}
