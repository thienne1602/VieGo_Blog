"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import apiClient, { handleApiError } from "@/lib/api";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_name: string;
  category_name: string;
  location?: string;
  featured_image?: string;
  published_at: string;
  tags: string[];
  like_count: number;
  comment_count: number;
  view_count: number;
  read_time: number;
}

const PostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const result = await apiClient.getPosts({
          page: pagination.page,
          category: selectedCategory === "all" ? undefined : selectedCategory,
        });

        if (result.success && result.data?.posts) {
          setPosts(result.data.posts);
          if (result.data.pagination) {
            setPagination(result.data.pagination);
          }
        } else {
          setError(handleApiError(result.error, "Không thể tải bài viết"));
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Đã xảy ra lỗi khi tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedCategory, pagination.page]);

  const categories = [
    { value: "all", label: "Tất cả", count: posts.length },
    {
      value: "Du lịch",
      label: "Du lịch",
      count: posts.filter((p) => p.category_name === "Du lịch").length,
    },
    {
      value: "Ẩm thực",
      label: "Ẩm thực",
      count: posts.filter((p) => p.category_name === "Ẩm thực").length,
    },
    {
      value: "culture",
      label: "Văn hóa",
      count: posts.filter((p) => p.category_name === "Văn hóa").length,
    },
    {
      value: "tips",
      label: "Tips",
      count: posts.filter((p) => p.category_name === "Tips").length,
    },
  ];

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "all" || post.category_name === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.content || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags || []).some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary mx-auto mb-4"></div>
            <p className="text-neutral-600">Đang tải bài viết...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-800 mb-4">
            Blog Du Lịch & Ẩm Thực
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Khám phá những câu chuyện thú vị về du lịch và ẩm thực Việt Nam
          </p>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          className="mb-8 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
                🔍
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full border-2 transition-all duration-300 ${
                  selectedCategory === category.value
                    ? "bg-primary border-primary text-white"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-primary hover:text-primary"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category.label} ({category.count})
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 mb-4">⚠️ {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Không tìm thấy bài viết
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== "all"
                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                : "Chưa có bài viết nào được đăng"}
            </p>
          </motion.div>
        )}

        {/* Posts Grid */}
        {!error && filteredPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-primary-100 to-accent-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                  <div className="absolute top-3 left-3 z-20">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                      {post.category_name || "Khác"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2 text-neutral-800 line-clamp-2 hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-neutral-600 mb-4 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <div className="flex items-center space-x-4">
                      <span>👤 {post.author_name || "Admin"}</span>
                      <span>📍 {post.location || "Việt Nam"}</span>
                    </div>
                    <span>
                      {formatDate(
                        post.published_at || new Date().toISOString()
                      )}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex space-x-4 text-sm text-neutral-500">
                      <span className="flex items-center space-x-1">
                        <span>❤️</span>
                        <span>{post.like_count || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>💬</span>
                        <span>{post.comment_count || 0}</span>
                      </span>
                    </div>

                    <Link
                      href={`/posts/${post.slug}`}
                      className="text-primary hover:text-accent font-medium text-sm"
                    >
                      Đọc thêm →
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredPosts.length > 0 && (
          <div className="text-center mt-12">
            <motion.button
              className="btn-primary text-lg px-8 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Xem Thêm Bài Viết
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostsPage;
