"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  Eye,
  Calendar,
  MapPin,
  User,
  ArrowLeft,
  Tag as TagIcon,
} from "lucide-react";
import CommentSection from "@/components/blog/CommentSection";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  read_time: number;
  category: string;
  tags: string[];
  location_name?: string;
  location_address?: string;
  author: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
  };
}

const PostDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
      checkLikeStatus();
      checkBookmarkStatus();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/posts/${slug}`);

      if (!response.ok) throw new Error("Failed to fetch post");

      const data = await response.json();
      setPost(data.post);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/likes/check/${slug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.is_liked);
      }
    } catch (err) {
      console.error("Error checking like status:", err);
    }
  };

  const checkBookmarkStatus = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/bookmarks/check/${slug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.is_bookmarked);
      }
    } catch (err) {
      console.error("Error checking bookmark status:", err);
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const endpoint = isLiked ? "DELETE" : "POST";
      const response = await fetch(
        `http://localhost:5000/api/social/likes/post/${slug}`,
        {
          method: endpoint,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setIsLiked(!isLiked);
        if (post) {
          setPost({
            ...post,
            likes_count: post.likes_count + (isLiked ? -1 : 1),
          });
        }
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleBookmark = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/bookmarks/${slug}`,
        {
          method: isBookmarked ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (err) {
      console.error("Error bookmarking post:", err);
    }
  };

  const handleShare = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        await fetch(`http://localhost:5000/api/posts/${slug}/share`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link đã được sao chép!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            {error || "Không tìm thấy bài viết"}
          </p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </button>
        </div>
      </div>

      {/* Hero Image */}
      {post.featured_image && (
        <div className="w-full h-[400px] bg-gray-900">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover opacity-90"
          />
        </div>
      )}

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
        >
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {/* Author */}
              <div className="flex items-center">
                {post.author.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.full_name}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
                    {post.author.full_name?.[0] || "U"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {post.author.full_name}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.published_at)}</span>
                    <span>•</span>
                    <span>{post.read_time} phút đọc</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-4 text-gray-500">
              <div className="flex items-center">
                <Eye className="w-5 h-5 mr-1" />
                <span className="text-sm">{post.views_count}</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-1" />
                <span className="text-sm">{post.likes_count}</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-1" />
                <span className="text-sm">{post.comments_count}</span>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-gray-700 italic">{post.excerpt}</p>
            </div>
          )}

          {/* Location */}
          {post.location_name && (
            <div className="flex items-start mb-6 p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">
                  {post.location_name}
                </p>
                {post.location_address && (
                  <p className="text-sm text-gray-600">
                    {post.location_address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-6">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {post.content}
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLike}
                className={`flex items-center px-4 py-2 rounded-lg transition ${
                  isLiked
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Heart
                  className={`w-5 h-5 mr-2 ${isLiked ? "fill-current" : ""}`}
                />
                <span>{isLiked ? "Đã thích" : "Thích"}</span>
                <span className="ml-2 text-sm">({post.likes_count})</span>
              </button>

              <button
                onClick={handleBookmark}
                className={`flex items-center px-4 py-2 rounded-lg transition ${
                  isBookmarked
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Bookmark
                  className={`w-5 h-5 mr-2 ${
                    isBookmarked ? "fill-current" : ""
                  }`}
                />
                <span>{isBookmarked ? "Đã lưu" : "Lưu"}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Chia sẻ
              </button>
            </div>
          </div>
        </motion.div>

        {/* Comments Section */}
        <CommentSection postId={post.id} />
      </article>
    </div>
  );
};

export default PostDetailPage;
