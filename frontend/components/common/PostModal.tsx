"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import ImageLightbox from "./ImageLightbox";
import CommentSection from "@/components/blog/CommentSection";

interface Post {
  id: number;
  slug: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar: string;
  published_at: string;
  images?: string[];
  tags: string[];
  location?: string;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
}

interface PostModalProps {
  slug: string;
  onClose: () => void;
}

const PostModal = ({ slug, onClose }: PostModalProps) => {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    fetchPost();
    if (user) {
      checkLikeStatus();
      checkBookmarkStatus();
    }
  }, [slug, user]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${slug}`);
      if (response.ok) {
        const resp = await response.json();
        const data = resp.post || resp; // backend returns { post: { ... } }

        // Normalize fields expected by this component
        const normalized: any = {
          id: data.id,
          slug: data.slug,
          title: data.title,
          content: data.content,
          author_name: data.author?.full_name || data.author_name || "",
          author_avatar: data.author?.avatar_url || data.author_avatar || "",
          published_at: data.published_at,
          images: data.images || [],
          tags: data.tags || [],
          location: data.location?.name || data.location || null,
          like_count: data.engagement?.likes ?? data.likes_count ?? 0,
          comment_count: data.engagement?.comments ?? data.comments_count ?? 0,
          view_count: data.engagement?.views ?? data.views_count ?? 0,
        };

        setPost(normalized);
        setLikeCount(normalized.like_count || 0);
        setCommentCount(normalized.comment_count || 0);
      }
    } catch (err) {
      console.error("Error fetching post:", err);
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
        { headers: { Authorization: `Bearer ${token}` } }
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
        { headers: { Authorization: `Bearer ${token}` } }
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
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/likes/post/${slug}`,
        {
          method: isLiked ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Use server-provided count to avoid mismatch
        setLikeCount(data.likes_count ?? likeCount);
        setIsLiked(!isLiked);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleBookmark = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/bookmarks/post/${slug}`,
        {
          method: isBookmarked ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (post?.images?.length || 1) - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (post?.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col lg:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="flex items-center justify-center h-96 w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : post ? (
            <>
              {/* Left Side - Images (60%) */}
              <div className="lg:w-[60%] bg-black flex items-center justify-center relative min-h-[400px] lg:min-h-[600px]">
                {post.images && post.images.length > 0 ? (
                  <>
                    <img
                      src={post.images[currentImageIndex]}
                      alt={post.title}
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => setShowLightbox(true)}
                    />

                    {/* Navigation Arrows */}
                    {post.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToPreviousImage();
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full transition-all"
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToNextImage();
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full transition-all"
                        >
                          <ChevronRight className="w-6 h-6 text-gray-800" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {post.images.length}
                    </div>

                    {/* Thumbnails */}
                    {post.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90%]">
                        {post.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(idx);
                            }}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              idx === currentImageIndex
                                ? "border-white scale-110"
                                : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-white text-center p-8">
                    <p>No images available</p>
                  </div>
                )}
              </div>

              {/* Right Side - Content (40%) */}
              <div className="lg:w-[40%] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.author_avatar || "/images/default-avatar.png"}
                      alt={post.author_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {post.author_name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
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
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Post Content */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="border-t pt-4">
                    <CommentSection
                      postId={post.id}
                      onNewComment={(newCount) => setCommentCount(newCount)}
                    />
                  </div>
                </div>

                {/* Footer - Action Buttons */}
                <div className="border-t p-4 space-y-3">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{likeCount} likes</span>
                    <span>{commentCount} comments</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-around border-t pt-3">
                    <button
                      onClick={handleLike}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        isLiked
                          ? "text-red-600 bg-red-50"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                      />
                      <span className="font-medium">Like</span>
                    </button>

                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">Comment</span>
                    </button>

                    <button
                      onClick={handleBookmark}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        isBookmarked
                          ? "text-emerald-600 bg-emerald-50"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Bookmark
                        className={`w-5 h-5 ${
                          isBookmarked ? "fill-current" : ""
                        }`}
                      />
                      <span className="font-medium">Save</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center w-full">
              <p className="text-gray-500">Post not found</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Image Lightbox */}
      {showLightbox && post?.images && (
        <ImageLightbox
          images={post.images}
          initialIndex={currentImageIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </AnimatePresence>
  );
};

export default PostModal;
