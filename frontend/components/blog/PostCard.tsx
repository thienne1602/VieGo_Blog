"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  MapPin,
  Bookmark,
} from "lucide-react";
import { motion } from "framer-motion";

interface Post {
  id: number;
  slug?: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  location?: string;
  featured_image?: string;
  published_at: string;
  like_count: number;
  comment_count: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  tags: string[];
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked || false);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const postIdentifier = post.slug || post.id.toString();

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/likes/post/${postIdentifier}`,
        {
          method: isLiked ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const postIdentifier = post.slug || post.id.toString();

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/bookmarks/${postIdentifier}`,
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

  const handleCardClick = () => {
    if (post.slug) {
      router.push(`/posts/${post.slug}`);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Vừa xong";
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${Math.floor(diffInHours / 24)} ngày trước`;
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
    >
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={
              post.author_avatar ||
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
            }
            alt={post.author_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{post.author_name}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{formatTimeAgo(post.published_at)}</span>
              {post.location && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{post.location}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Image */}
      {post.featured_image && (
        <div className="relative">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {likeCount > 0 && <span>{likeCount} lượt thích</span>}
            {post.comment_count > 0 && (
              <span>{post.comment_count} bình luận</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-around py-2 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-1 justify-center ${
            isLiked ? "text-red-600" : "text-gray-600"
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">Thích</span>
        </button>

        <button
          className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 flex-1 justify-center"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Bình luận</span>
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-1 justify-center ${
            isBookmarked ? "text-teal-600" : "text-gray-600"
          }`}
        >
          <Bookmark
            className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
          />
          <span className="text-sm font-medium">Lưu</span>
        </button>
      </div>
    </motion.div>
  );
}
