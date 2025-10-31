"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Bookmark,
  FileText,
  Users,
  PlusCircle,
  Settings,
  MapPin,
  Calendar,
  Award,
  Star,
  TrendingUp,
  Eye,
  MessageCircle,
  Share2,
  Edit,
  Camera,
  Mail,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
}

export default function UserProfileNew() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "posts" | "bookmarks" | "likes" | "following"
  >("posts");
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch data when user is loaded OR when tab changes
  useEffect(() => {
    const fetchTabData = async () => {
      if (!user) return;

      setLoadingData(true);
      const token = localStorage.getItem("access_token");

      try {
        if (activeTab === "posts") {
          console.log("Fetching posts for user:", user.id);
          const response = await fetch(
            `http://localhost:5000/api/posts?author_id=${user.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("Posts response status:", response.status);
          if (response.ok) {
            const data = await response.json();
            console.log("My posts data:", data);
            setMyPosts(data.posts || []);
          } else {
            console.error("Failed to fetch posts:", response.status);
          }
        } else if (activeTab === "bookmarks") {
          console.log("Fetching bookmarks...");
          const response = await fetch(
            "http://localhost:5000/api/social/bookmarks",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("Bookmarks response status:", response.status);
          if (response.ok) {
            const data = await response.json();
            console.log("Bookmarks data:", data);
            setBookmarks(data.bookmarks || []);
          } else {
            console.error("Failed to fetch bookmarks:", response.status);
          }
        } else if (activeTab === "likes") {
          console.log("Fetching liked posts...");
          const response = await fetch(
            "http://localhost:5000/api/social/liked-posts",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("Liked posts response status:", response.status);
          if (response.ok) {
            const data = await response.json();
            console.log("Liked posts data:", data);
            setLikedPosts(data.liked_posts || []);
          } else {
            console.error("Failed to fetch liked posts:", response.status);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchTabData();
    }
  }, [user, activeTab, loading, router]); // Include ALL dependencies

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const currentPosts =
    activeTab === "posts"
      ? myPosts
      : activeTab === "bookmarks"
      ? bookmarks
      : activeTab === "likes"
      ? likedPosts
      : [];

  const totalStats = {
    posts: myPosts.length,
    bookmarks: bookmarks.length,
    likes: likedPosts.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section với Cover & Avatar */}
      <div className="relative">
        {/* Cover Background */}
        <div className="relative h-80 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
            <motion.div
              className="absolute inset-0 opacity-30"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                backgroundImage:
                  "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Edit Cover Button */}
          <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition flex items-center space-x-2">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Đổi ảnh bìa</span>
          </button>
        </div>

        {/* Profile Info Card */}
        <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 p-1">
                  <img
                    src={
                      (user as any).avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.full_name
                      )}&size=200&background=random&bold=true`
                    }
                    alt={user.full_name}
                    className="w-full h-full rounded-3xl object-cover"
                  />
                </div>
                <button className="absolute bottom-2 right-2 bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition opacity-0 group-hover:opacity-100">
                  <Camera className="w-4 h-4" />
                </button>

                {/* Level Badge */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1.5 rounded-full font-bold flex items-center space-x-1 shadow-lg">
                  <Star className="w-4 h-4 fill-current" />
                  <span>Lv {(user as any).level || 1}</span>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {user.full_name}
                </h1>
                <p className="text-gray-600 text-lg mb-4">@{user.username}</p>

                {(user as any).bio && (
                  <p className="text-gray-700 mb-4 max-w-2xl">
                    {(user as any).bio}
                  </p>
                )}

                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600 mb-6">
                  {(user as any).location && (
                    <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1.5 rounded-full">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{(user as any).location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1.5 rounded-full">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>
                      Tham gia{" "}
                      {(user as any).created_at
                        ? new Date((user as any).created_at).toLocaleDateString(
                            "vi-VN"
                          )
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1.5 rounded-full">
                    <Award className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-orange-600">
                      {(user as any).points || 0} điểm
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <Link href="/posts/create">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Tạo bài viết</span>
                    </motion.button>
                  </Link>
                  <button className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">
                    <Edit className="w-5 h-5" />
                    <span>Chỉnh sửa</span>
                  </button>
                  <button className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">
                    <Share2 className="w-5 h-5" />
                    <span className="hidden sm:inline">Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                <div className="text-3xl font-bold text-blue-600">
                  {totalStats.posts}
                </div>
                <div className="text-sm text-gray-600 mt-1">Bài viết</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                <div className="text-3xl font-bold text-purple-600">
                  {totalStats.bookmarks}
                </div>
                <div className="text-sm text-gray-600 mt-1">Đã lưu</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl">
                <div className="text-3xl font-bold text-pink-600">
                  {totalStats.likes}
                </div>
                <div className="text-sm text-gray-600 mt-1">Đã thích</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 mt-8 pb-12">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="flex border-b border-gray-200">
            {[
              {
                id: "posts",
                label: "Bài viết",
                icon: FileText,
                count: myPosts.length,
                color: "blue",
              },
              {
                id: "bookmarks",
                label: "Đã lưu",
                icon: Bookmark,
                count: bookmarks.length,
                color: "purple",
              },
              {
                id: "likes",
                label: "Đã thích",
                icon: Heart,
                count: likedPosts.length,
                color: "pink",
              },
              {
                id: "following",
                label: "Theo dõi",
                icon: Users,
                count: 0,
                color: "green",
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-4 font-medium transition-all relative ${
                    isActive
                      ? `text-${tab.color}-600`
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? `text-${tab.color}-600` : ""
                    }`}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`${
                        isActive
                          ? `bg-${tab.color}-100 text-${tab.color}-700`
                          : "bg-gray-200 text-gray-700"
                      } text-xs px-2.5 py-0.5 rounded-full font-semibold`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {loadingData ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : currentPosts.length === 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-lg p-12 text-center"
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  {activeTab === "posts" && (
                    <FileText className="w-12 h-12 text-gray-400" />
                  )}
                  {activeTab === "bookmarks" && (
                    <Bookmark className="w-12 h-12 text-gray-400" />
                  )}
                  {activeTab === "likes" && (
                    <Heart className="w-12 h-12 text-gray-400" />
                  )}
                  {activeTab === "following" && (
                    <Users className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {activeTab === "posts" && "Chưa có bài viết nào"}
                  {activeTab === "bookmarks" && "Chưa lưu bài viết nào"}
                  {activeTab === "likes" && "Chưa thích bài viết nào"}
                  {activeTab === "following" && "Chức năng đang phát triển"}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {activeTab === "posts" &&
                    "Hãy chia sẻ những trải nghiệm du lịch tuyệt vời của bạn!"}
                  {activeTab === "bookmarks" &&
                    "Lưu lại những bài viết yêu thích để đọc sau"}
                  {activeTab === "likes" &&
                    "Khám phá và thích những bài viết hay ho"}
                  {activeTab === "following" &&
                    "Tính năng theo dõi người dùng sẽ sớm ra mắt"}
                </p>
                {activeTab === "posts" && (
                  <Link href="/posts/create">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Tạo bài viết đầu tiên</span>
                    </motion.button>
                  </Link>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/posts/${post.slug}`}>
                      <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer">
                        {/* Post Image */}
                        {post.featured_image && (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={post.featured_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}

                        {/* Post Content */}
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>

                          {/* Post Stats */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4 text-gray-500">
                              <span className="flex items-center space-x-1 hover:text-red-500 transition">
                                <Heart className="w-4 h-4" />
                                <span>{post.likes_count}</span>
                              </span>
                              <span className="flex items-center space-x-1 hover:text-blue-500 transition">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.comments_count}</span>
                              </span>
                              <span className="flex items-center space-x-1 hover:text-green-500 transition">
                                <Eye className="w-4 h-4" />
                                <span>{post.views_count || 0}</span>
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs">
                              {new Date(post.published_at).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
