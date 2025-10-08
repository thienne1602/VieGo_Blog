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
  Globe,
  Award,
  Star,
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
  const [activeTab, setActiveTab] = useState<"posts" | "bookmarks" | "likes" | "following">("posts");
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && activeTab) {
      fetchTabData();
    }
  }, [activeTab, user]);

  const fetchTabData = async () => {
    setLoadingData(true);
    const token = localStorage.getItem("access_token");
    
    try {
      if (activeTab === "posts") {
        // Fetch user's posts
        const response = await fetch(
          `http://localhost:5000/api/posts?author_id=${user?.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setMyPosts(data.posts || []);
        }
      } else if (activeTab === "bookmarks") {
        // Fetch bookmarked posts
        const response = await fetch(
          "http://localhost:5000/api/social/bookmarks",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setBookmarks(data.bookmarks || []);
        }
      } else if (activeTab === "likes") {
        // Fetch liked posts
        const response = await fetch(
          "http://localhost:5000/api/social/liked-posts",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setLikedPosts(data.liked_posts || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-teal-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "posts", label: "Bài viết của tôi", icon: FileText, count: myPosts.length },
    { id: "bookmarks", label: "Đã lưu", icon: Bookmark, count: bookmarks.length },
    { id: "likes", label: "Đã thích", icon: Heart, count: likedPosts.length },
    { id: "following", label: "Đang theo dõi", icon: Users, count: 0 },
  ];

  const currentPosts = 
    activeTab === "posts" ? myPosts :
    activeTab === "bookmarks" ? bookmarks :
    activeTab === "likes" ? likedPosts : [];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500">
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 -mt-20">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&size=150&background=random`}
                alt={user.full_name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <div className="absolute -bottom-2 -right-2 bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                <Star className="w-4 h-4 fill-current" />
                <span>Lv {user.level || 1}</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900">{user.full_name}</h1>
              <p className="text-gray-600">@{user.username}</p>
              {user.bio && (
                <p className="mt-2 text-gray-700">{user.bio}</p>
              )}
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm text-gray-600">
                {user.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Tham gia {new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span>{user.points || 0} điểm</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Link href="/posts/create">
                <motion.button
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg hover:from-teal-600 hover:to-blue-600 shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Tạo bài viết</span>
                </motion.button>
              </Link>
              
              <Link href="/dashboard/settings">
                <motion.button
                  className="p-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{myPosts.length}</div>
              <div className="text-sm text-gray-600">Bài viết</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{bookmarks.length}</div>
              <div className="text-sm text-gray-600">Đã lưu</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{likedPosts.length}</div>
              <div className="text-sm text-gray-600">Đã thích</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-4 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? "text-teal-600 border-b-2 border-teal-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loadingData ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-teal-600"></div>
              </div>
            ) : currentPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {activeTab === "posts" && <FileText className="w-16 h-16 mx-auto" />}
                  {activeTab === "bookmarks" && <Bookmark className="w-16 h-16 mx-auto" />}
                  {activeTab === "likes" && <Heart className="w-16 h-16 mx-auto" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === "posts" && "Chưa có bài viết nào"}
                  {activeTab === "bookmarks" && "Chưa lưu bài viết nào"}
                  {activeTab === "likes" && "Chưa thích bài viết nào"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === "posts" && "Hãy tạo bài viết đầu tiên của bạn!"}
                  {activeTab === "bookmarks" && "Bắt đầu lưu những bài viết yêu thích"}
                  {activeTab === "likes" && "Khám phá và thích những bài viết hay"}
                </p>
                {activeTab === "posts" && (
                  <Link href="/posts/create">
                    <motion.button
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg hover:from-teal-600 hover:to-blue-600 shadow-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Tạo bài viết mới</span>
                    </motion.button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPosts.map((post) => (
                  <Link key={post.id} href={`/posts/${post.slug}`}>
                    <motion.div
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      whileHover={{ y: -5 }}
                    >
                      {post.featured_image && (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{post.likes_count}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FileText className="w-4 h-4" />
                              <span>{post.comments_count}</span>
                            </span>
                          </div>
                          <span>{new Date(post.published_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === "following" && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chức năng đang phát triển
                </h3>
                <p className="text-gray-600">
                  Danh sách người đang theo dõi sẽ sớm được cập nhật!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
