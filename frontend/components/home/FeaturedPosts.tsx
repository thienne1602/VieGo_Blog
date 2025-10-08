"use client";

import { useState, useEffect, memo, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import apiClient, { handleApiError } from "@/lib/api";

interface FeaturedPost {
  id: number;
  title: string;
  excerpt: string;
  featured_image: string;
  category_name: string;
  read_time: number;
  author_name: string;
  username: string;
  avatar_url: string;
  published_at: string;
  created_at?: string;
  slug: string;
  view_count: number;
  like_count: number;
  comment_count: number;
}

const FeaturedPosts = () => {
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        setLoading(true);
        const result = await apiClient.getFeaturedPosts();

        if (result.success && result.data?.posts) {
          setFeaturedPosts(result.data.posts);
        } else {
          setError(
            handleApiError(result.error, "Không thể tải bài viết nổi bật")
          );
        }
      } catch (err) {
        console.error("Error fetching featured posts:", err);
        setError("Đã xảy ra lỗi khi tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPosts();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">⚠️ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Empty state
  if (!featuredPosts || featuredPosts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 mb-4">Chưa có bài viết nổi bật</div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      "Du lịch": "bg-primary text-white",
      "Ẩm thực": "bg-accent text-white",
      "Văn hóa": "bg-purple-500 text-white",
      Tips: "bg-green-500 text-white",
      Review: "bg-blue-500 text-white",
    };
    return colors[category as keyof typeof colors] || "bg-gray-500 text-white";
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {featuredPosts.map((post, index) => (
        <Link key={post.id} href={`/blog/${post.slug}`}>
          <motion.article
            className="blog-card group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
              <div
                className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundImage: `url('${post.featured_image}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(
                    post.category_name || "Khác"
                  )}`}
                >
                  {post.category_name || "Khác"}
                </span>
              </div>

              {/* Reading Time */}
              <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {post.read_time || 5} phút đọc
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="font-bold text-xl mb-3 text-neutral-800 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>

              <p className="text-neutral-600 mb-4 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>

              {/* Author & Date */}
              <div className="flex items-center justify-between text-sm text-neutral-500">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {post.author_name
                      ? post.author_name[0].toUpperCase()
                      : post.username?.[0].toUpperCase() || "A"}
                  </div>
                  <span className="font-medium">
                    {post.author_name || post.username || "Admin"}
                  </span>
                </div>

                <time dateTime={post.published_at || post.created_at}>
                  {formatDate(
                    post.published_at ||
                      post.created_at ||
                      new Date().toISOString()
                  )}
                </time>
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </motion.article>
        </Link>
      ))}
    </div>
  );
};

export default FeaturedPosts;
