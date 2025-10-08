"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import apiClient, { handleApiError } from "@/lib/api";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  author_name: string;
  category_name: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  read_time: number;
  tags: string[];
}

const PostDetailPage = () => {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const result = await apiClient.getPost(slug);

        if (result.success && result.data?.post) {
          setPost(result.data.post);
        } else {
          setError(handleApiError(result.error, "Không thể tải bài viết"));
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Đã xảy ra lỗi khi tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header skeleton */}
            <div className="animate-pulse space-y-4 mb-8">
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>

            {/* Image skeleton */}
            <div className="animate-pulse bg-gray-300 h-64 rounded-lg mb-8"></div>

            {/* Content skeleton */}
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-600"
            >
              Thử lại
            </button>
            <Link
              href="/posts"
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Quay lại Posts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Post not found
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Không tìm thấy bài viết
          </h1>
          <p className="text-gray-600 mb-4">
            Bài viết với slug "{slug}" không tồn tại.
          </p>
          <Link
            href="/posts"
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-600"
          >
            Quay lại Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-4 text-sm">
            <Link href="/" className="text-primary hover:text-primary-600">
              Trang chủ
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/posts" className="text-primary hover:text-primary-600">
              Posts
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 truncate">{post.title}</span>
          </div>
        </div>
      </nav>

      {/* Article Content */}
      <article className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            {/* Category Badge */}
            <div className="mb-4">
              <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
                {post.category_name || "Khác"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center justify-center space-x-6 text-gray-600 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {post.author_name ? post.author_name[0].toUpperCase() : "A"}
                </div>
                <span>Bởi {post.author_name || "Admin"}</span>
              </div>

              <div className="flex items-center space-x-1">
                <span>📅</span>
                <time dateTime={post.published_at}>
                  {formatDate(post.published_at)}
                </time>
              </div>

              <div className="flex items-center space-x-1">
                <span>⏱️</span>
                <span>{post.read_time || 5} phút đọc</span>
              </div>

              <div className="flex items-center space-x-1">
                <span>👀</span>
                <span>{post.view_count} lượt xem</span>
              </div>
            </div>
          </motion.div>

          {/* Featured Image */}
          {post.featured_image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8 rounded-xl overflow-hidden shadow-lg"
            >
              <div
                className="w-full h-64 md:h-96 bg-gradient-to-br from-primary-100 to-accent-100 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${post.featured_image}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-8 shadow-lg mb-8"
          >
            {/* Excerpt */}
            {post.excerpt && (
              <div className="text-xl text-gray-700 font-medium leading-relaxed mb-8 p-4 bg-blue-50 rounded-lg">
                {post.excerpt}
              </div>
            )}

            {/* Main Content */}
            <div
              className="prose prose-lg max-w-none leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </motion.div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Thẻ:</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Engagement Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl p-6 shadow-lg mb-8"
          >
            <div className="flex items-center justify-center space-x-8 text-gray-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {post.like_count}
                </div>
                <div className="text-sm">❤️ Lượt thích</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {post.comment_count}
                </div>
                <div className="text-sm">💬 Bình luận</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {post.view_count}
                </div>
                <div className="text-sm">👀 Lượt xem</div>
              </div>
            </div>
          </motion.div>

          {/* Back to Posts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center"
          >
            <Link
              href="/posts"
              className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <span>←</span>
              <span>Quay lại Posts</span>
            </Link>
          </motion.div>
        </div>
      </article>
    </div>
  );
};

export default PostDetailPage;
