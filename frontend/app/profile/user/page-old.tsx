"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  MapPin,
  Calendar,
  Globe,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit,
  Plus,
  Users,
  Image as ImageIcon,
  Video,
  Smile,
  Send,
  Star,
  Award,
  Bookmark,
  Settings,
  Link,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("posts");
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState("");

  // Mock user data
  const userData = {
    name: "Trần Minh Blogger",
    username: "blogger_hanoi",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    coverImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop",
    bio: "Travel blogger chuyên về miền Bắc & ẩm thực Hà Nội 🍜 | 📍 Hà Nội | ✈️ 47 tỉnh thành",
    location: "Hà Nội, Việt Nam",
    joinDate: "Tham gia tháng 1, 2024",
    website: "https://travelblog.vn",
    followers: 2847,
    following: 394,
    posts: 156,
    level: "Travel Expert",
    points: 2580,
    badges: ["Travel Expert", "Food Lover", "Photo Master"],
    socialLinks: {
      instagram: "@travelblogger",
      facebook: "TravelVN",
      youtube: "TravelVN Channel",
    },
  };

  // Mock posts data
  const posts = [
    {
      id: 1,
      content:
        "Vừa trở về từ chuyến đi Sapa tuyệt vời! Mùa lúa chín thật sự là thời điểm đẹp nhất trong năm ở nơi đây. Những thửa ruộng bậc thang vàng óng stretching to infinity... 🌾✨",
      images: [
        "https://images.unsplash.com/photo-1587117223806-0c572e0ac1e7?w=500&h=300&fit=crop",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=300&fit=crop",
      ],
      likes: 127,
      comments: 23,
      shares: 8,
      timestamp: "2 giờ trước",
      location: "Sapa, Lào Cai",
    },
    {
      id: 2,
      content:
        "Hôm nay thử món bún chả Obama nổi tiếng ở phố cổ! Taste really authentic and the story behind it is fascinating. Highly recommend for anyone visiting Hanoi! 🍜",
      images: [
        "https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&h=300&fit=crop",
      ],
      likes: 89,
      comments: 15,
      shares: 4,
      timestamp: "1 ngày trước",
      location: "Phố Cổ, Hà Nội",
    },
    {
      id: 3,
      content:
        "Sunset tại Hồ Tây tối qua! Nothing beats watching the sun dip below the horizon with a cup of Vietnamese coffee in hand ☕🌅",
      images: [
        "https://images.unsplash.com/photo-1583417267826-aebc4d1542e1?w=500&h=300&fit=crop",
      ],
      likes: 203,
      comments: 31,
      shares: 12,
      timestamp: "3 ngày trước",
      location: "Hồ Tây, Hà Nội",
    },
  ];

  const tabItems = [
    { id: "posts", label: "Bài viết", count: userData.posts },
    { id: "about", label: "Giới thiệu", count: null },
    { id: "photos", label: "Ảnh", count: 84 },
    { id: "travel", label: "Hành trình", count: 25 },
  ];

  const PostCard = ({ post }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6"
    >
      {/* Post Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={userData.avatar}
              alt={userData.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold text-gray-900">{userData.name}</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{post.timestamp}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{post.location}</span>
                </div>
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        <p className="text-gray-800 leading-relaxed">{post.content}</p>
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div
          className={`${
            post.images.length === 1
              ? "px-6 pb-4"
              : "grid grid-cols-2 gap-1 px-6 pb-4"
          }`}
        >
          {post.images.map((image: string, index: number) => (
            <img
              key={index}
              src={image}
              alt={`Post image ${index + 1}`}
              className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
            />
          ))}
        </div>
      )}

      {/* Post Stats */}
      <div className="px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>{post.likes} lượt thích</span>
            <span>{post.comments} bình luận</span>
          </div>
          <span>{post.shares} chia sẻ</span>
        </div>
      </div>

      {/* Post Actions */}
      <div className="px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-around">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-red-600 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors">
            <Heart className="w-5 h-5" />
            <span className="font-medium">Thích</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Bình luận</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 py-2 px-4 rounded-lg hover:bg-green-50 transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Chia sẻ</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderPosts = () => (
    <div className="space-y-6">
      {/* Create Post */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          <img
            src={userData.avatar}
            alt={userData.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <button
            onClick={() => setShowPostModal(true)}
            className="flex-1 text-left bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-3 text-gray-600 transition-colors"
          >
            Bạn đang nghĩ gì về chuyến đi tiếp theo?
          </button>
        </div>
        <div className="flex items-center justify-around mt-4 pt-4 border-t border-gray-200">
          <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 py-2 px-4 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-red-500" />
            <span>Video</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 py-2 px-4 rounded-lg transition-colors">
            <ImageIcon className="w-5 h-5 text-green-500" />
            <span>Ảnh</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 py-2 px-4 rounded-lg transition-colors">
            <Smile className="w-5 h-5 text-yellow-500" />
            <span>Cảm xúc</span>
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );

  const renderAbout = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Thông Tin Cơ Bản
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span className="text-gray-700">
              Sống tại <strong>{userData.location}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-gray-700">{userData.joinDate}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5 text-gray-400" />
            <a
              href={userData.website}
              className="text-blue-600 hover:underline"
            >
              {userData.website}
            </a>
          </div>
        </div>
      </div>

      {/* Travel Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ✈️ Thống Kê Du Lịch
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">47</div>
            <div className="text-sm text-gray-600">Tỉnh thành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">23</div>
            <div className="text-sm text-gray-600">Quốc gia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">156</div>
            <div className="text-sm text-gray-600">Bài viết</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">2580</div>
            <div className="text-sm text-gray-600">Điểm kinh nghiệm</div>
          </div>
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Thành Tích & Huy Hiệu
        </h3>
        <div className="flex flex-wrap gap-3">
          {userData.badges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 px-4 py-2 rounded-full"
            >
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">{badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🌐 Mạng Xã Hội
        </h3>
        <div className="space-y-3">
          <a
            href="#"
            className="flex items-center space-x-3 text-gray-700 hover:text-pink-600 transition-colors"
          >
            <Instagram className="w-5 h-5" />
            <span>{userData.socialLinks.instagram}</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <Facebook className="w-5 h-5" />
            <span>{userData.socialLinks.facebook}</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-3 text-gray-700 hover:text-red-600 transition-colors"
          >
            <Youtube className="w-5 h-5" />
            <span>{userData.socialLinks.youtube}</span>
          </a>
        </div>
      </div>
    </div>
  );

  const renderPhotos = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📸 Thư Viện Ảnh
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          "https://images.unsplash.com/photo-1587117223806-0c572e0ac1e7?w=300&h=200&fit=crop",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
          "https://images.unsplash.com/photo-1555126634-323283e090fa?w=300&h=200&fit=crop",
          "https://images.unsplash.com/photo-1583417267826-aebc4d1542e1?w=300&h=200&fit=crop",
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop",
          "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=300&h=200&fit=crop",
        ].map((image, index) => (
          <motion.img
            key={index}
            whileHover={{ scale: 1.05 }}
            src={image}
            alt={`Photo ${index + 1}`}
            className="w-full h-40 object-cover rounded-lg cursor-pointer"
          />
        ))}
      </div>
    </div>
  );

  const renderTravel = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🗺️ Hành Trình Du Lịch
      </h3>
      <div className="space-y-4">
        {[
          { place: "Sapa, Lào Cai", date: "Tháng 9, 2024", rating: 5 },
          { place: "Hạ Long, Quảng Ninh", date: "Tháng 8, 2024", rating: 5 },
          { place: "Phú Quốc, Kiên Giang", date: "Tháng 7, 2024", rating: 4 },
          { place: "Đà Nẵng", date: "Tháng 6, 2024", rating: 5 },
        ].map((trip, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <h4 className="font-medium text-gray-900">{trip.place}</h4>
              <p className="text-sm text-gray-600">{trip.date}</p>
            </div>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < trip.rating
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-80 bg-gradient-to-r from-blue-500 to-purple-600">
        <img
          src={userData.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <button className="absolute bottom-4 right-4 bg-white bg-opacity-90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg transition-colors">
          <Camera className="w-4 h-4 inline mr-2" />
          Đổi ảnh bìa
        </button>
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
              <div className="relative">
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
                <button className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 md:mt-0 md:pb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {userData.name}
                </h1>
                <p className="text-gray-600 text-lg">@{userData.username}</p>
                <p className="text-gray-700 mt-2 max-w-md">{userData.bio}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>
                    <strong>{userData.followers.toLocaleString()}</strong> người
                    theo dõi
                  </span>
                  <span>
                    <strong>{userData.following.toLocaleString()}</strong> đang
                    theo dõi
                  </span>
                  <span className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>
                      <strong>{userData.level}</strong>
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                <Plus className="w-4 h-4 inline mr-2" />
                Thêm story
              </button>
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors">
                <Edit className="w-4 h-4 inline mr-2" />
                Chỉnh sửa
              </button>
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label} {tab.count && `(${tab.count})`}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === "posts" && renderPosts()}
        {activeTab === "about" && renderAbout()}
        {activeTab === "photos" && renderPhotos()}
        {activeTab === "travel" && renderTravel()}
      </div>
    </div>
  );
}
