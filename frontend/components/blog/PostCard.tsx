"use client";

import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  MapPin,
  Bookmark,
  Edit,
  Trash2,
  Globe,
  Lock,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import Image from "next/image";

// Helper to get token with port-specific key
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const port =
    window.location.port ||
    (window.location.protocol === "https:" ? "443" : "80");
  return (
    localStorage.getItem(`access_token_${port}`) ||
    localStorage.getItem("access_token")
  );
};

interface Post {
  id: number;
  slug?: string;
  title: string;
  content: string;
  author_name?: string;
  author_id?: number;
  author_avatar?: string;
  author?: {
    id: number;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  location?:
    | string
    | { name?: string; address?: string; lat?: number; lng?: number }
    | null;
  featured_image?: string | null;
  images?: string[]; // Add images array
  published_at: string;
  like_count: number;
  comment_count: number;
  views_count?: number;
  shares_count?: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  tags: string[];
  visibility?: "public" | "private" | "friends";
}

interface PostCardProps {
  post: Post;
  onOpenModal?: (slug: string) => void;
}

function PostCard({ post, onOpenModal }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked || false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showMenu, setShowMenu] = useState(false);

  // Debug visibility - remove after fix
  console.log(
    `[PostCard] ID: ${post.id}, Title: "${post.title?.substring(
      0,
      20
    )}", Visibility: "${post.visibility}"`
  );

  const postAuthorId = post.author?.id || post.author_id;
  const isAuthor = user && postAuthorId && user.id === postAuthorId;
  const galleryImages = Array.isArray(post.images) ? post.images : [];
  const isSingleGalleryImage = galleryImages.length === 1;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showMenu]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    const token = getToken();
    if (!token) {
      router.push("/welcome");
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

    const token = getToken();
    if (!token) {
      router.push("/welcome");
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
      if (onOpenModal) {
        onOpenModal(post.slug);
      } else {
        router.push(`/posts/${post.slug}`);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (post.slug) {
      router.push(`/posts/${post.slug}/edit`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);

    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/posts/${post.slug}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        alert("Đã xóa bài viết thành công!");
        window.location.reload(); // Reload to update the feed
      } else {
        alert("Không thể xóa bài viết");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Có lỗi xảy ra khi xóa bài viết");
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

  // Get author info with fallback
  const authorName = post.author?.full_name || post.author_name || "Người dùng";
  const authorAvatar = post.author?.avatar_url || post.author_avatar;
  const authorId = post.author?.id || post.author_id;

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleCardClick}
    >
      {/* Post Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700"
          >
            <Image
              src={
                authorAvatar ||
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
              }
              alt={authorName}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              loading="lazy"
              quality={75}
            />
          </motion.div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
              {authorName}
            </h3>
            <div className="flex items-center space-x-2 text-base text-gray-500 dark:text-gray-400">
              <span>{formatTimeAgo(post.published_at)}</span>
              {/* Visibility indicator - always show */}
              <span>•</span>
              <div
                className="flex items-center space-x-1"
                title={
                  post.visibility === "private"
                    ? "Riêng tư"
                    : post.visibility === "friends"
                    ? "Bạn bè"
                    : "Công khai"
                }
              >
                {post.visibility === "private" ? (
                  <Lock className="w-4 h-4 text-red-500" />
                ) : post.visibility === "friends" ? (
                  <Users className="w-4 h-4 text-blue-500" />
                ) : (
                  <Globe className="w-4 h-4 text-green-500" />
                )}
              </div>
              {post.location && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {typeof post.location === "string"
                        ? post.location
                        : post.location?.name ||
                          post.location?.address ||
                          "Vị trí"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {isAuthor && (
          <div className="relative">
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute right-0 top-full mt-2 w-48 bg-gradient-to-br from-white/90 via-blue-50/70 to-purple-50/70 dark:from-gray-800/90 dark:via-gray-700/70 dark:to-gray-800/70 backdrop-blur-sm rounded-lg shadow-xl border border-white/30 dark:border-gray-700/30 py-2 z-10"
              >
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa bài viết</span>
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-lg leading-relaxed">
          {post.content}
        </p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 cursor-pointer text-base transition-colors duration-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Image */}
      {post.featured_image && (
        <motion.div
          className="relative overflow-hidden w-full"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="relative w-full aspect-video">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover"
              loading="lazy"
              quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized={
                typeof post.featured_image === "string" &&
                (post.featured_image.startsWith("http://localhost:") ||
                  post.featured_image.startsWith("http://127.0.0.1") ||
                  post.featured_image.startsWith("http://[::1]") ||
                  post.featured_image.startsWith("https://localhost:") ||
                  post.featured_image.startsWith("https://127.0.0.1") ||
                  post.featured_image.startsWith("https://[::1]"))
              }
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </div>
        </motion.div>
      )}

      {/* Image Gallery */}
      {galleryImages.length > 0 && (
        <div className="px-6 pb-4">
          <div
            className={
              isSingleGalleryImage
                ? "grid grid-cols-1 gap-2"
                : "grid grid-cols-2 gap-2"
            }
          >
            {galleryImages.slice(0, 4).map((imageUrl, index) => {
              // Use a reliable fallback image
              const fallbackImage =
                "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop";
              // Convert relative path to full URL
              let safeImageUrl = imageUrl;
              if (imageUrl && !imageUrl.startsWith("http")) {
                const baseUrl =
                  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
                  "http://localhost:5000";
                safeImageUrl = `${baseUrl}${imageUrl}`;
              } else if (!imageUrl) {
                safeImageUrl = fallbackImage;
              }

              return (
                <motion.div
                  key={index}
                  className={
                    isSingleGalleryImage
                      ? "relative overflow-hidden rounded-2xl aspect-video"
                      : "relative overflow-hidden rounded-2xl aspect-square"
                  }
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Image
                    src={safeImageUrl}
                    alt={`Gallery ${index + 1}`}
                    fill
                    className="object-cover cursor-pointer hover:opacity-90 transition-all duration-300"
                    loading="lazy"
                    quality={80}
                    sizes={
                      isSingleGalleryImage
                        ? "(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
                        : "(max-width: 768px) 50vw, 25vw"
                    }
                    unoptimized={safeImageUrl.startsWith(
                      "http://localhost:5000"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Could add lightbox/modal here
                    }}
                  />
                  {/* Show +X overlay on 4th image if there are more */}
                  {index === 3 && galleryImages.length > 4 && (
                    <motion.div
                      className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center cursor-pointer z-10"
                      whileHover={{ backgroundColor: "rgba(0,0,0,0.8)" }}
                    >
                      <span className="text-white text-4xl font-bold drop-shadow-lg">
                        +{galleryImages.length - 4}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Stats - Always show counts */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-base text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Heart className="w-5 h-5" />
              <span>{likeCount || 0}</span>
            </span>
            <span className="flex items-center space-x-1">
              <MessageCircle className="w-5 h-5" />
              <span>{post.comment_count || 0}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Bookmark className="w-5 h-5" />
              <span>{post.views_count || 0} lượt xem</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Simplified & Elegant */}
      <div className="flex items-center justify-around py-3 border-t border-gray-200 dark:border-gray-700">
        <motion.button
          onClick={handleLike}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex-1 justify-center ${
            isLiked
              ? "text-red-600 dark:text-red-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
          <span
            className="text-base font-medium hidden sm:inline"
            suppressHydrationWarning
          >
            Thích
          </span>
        </motion.button>

        <motion.button
          className="flex items-center space-x-2 px-5 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 text-gray-600 dark:text-gray-400 flex-1 justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          <MessageCircle className="w-6 h-6" />
          <span
            className="text-base font-medium hidden sm:inline"
            suppressHydrationWarning
          >
            Bình luận
          </span>
        </motion.button>

        <motion.button
          onClick={handleBookmark}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex-1 justify-center ${
            isBookmarked
              ? "text-primary-600 dark:text-primary-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          <Bookmark
            className={`w-6 h-6 ${isBookmarked ? "fill-current" : ""}`}
          />
          <span
            className="text-base font-medium hidden sm:inline"
            suppressHydrationWarning
          >
            Lưu
          </span>
        </motion.button>

        <motion.button
          onClick={async (e) => {
            e.stopPropagation();
            const token = getToken();
            if (!token) {
              router.push("/welcome");
              return;
            }
            const postIdentifier = post.id.toString();
            try {
              await fetch(
                `http://localhost:5000/api/posts/${postIdentifier}/share`,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (navigator.share) {
                await navigator.share({
                  title: post.title,
                  text: post.content.substring(0, 100),
                  url:
                    window.location.origin + `/posts/${post.slug || post.id}`,
                });
              } else {
                navigator.clipboard.writeText(
                  window.location.origin + `/posts/${post.slug || post.id}`
                );
                alert("Link đã được sao chép!");
              }
            } catch (err) {
              console.error("Error sharing:", err);
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 text-gray-600 dark:text-gray-400 flex-1 justify-center"
        >
          <Share2 className="w-6 h-6" />
          <span
            className="text-base font-medium hidden sm:inline"
            suppressHydrationWarning
          >
            Chia sẻ
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// Custom comparison function for memo - ensure re-render when visibility changes
const arePropsEqual = (prevProps: PostCardProps, nextProps: PostCardProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.visibility === nextProps.post.visibility &&
    prevProps.post.is_liked === nextProps.post.is_liked &&
    prevProps.post.is_bookmarked === nextProps.post.is_bookmarked &&
    prevProps.post.like_count === nextProps.post.like_count &&
    prevProps.post.comment_count === nextProps.post.comment_count
  );
};

export default memo(PostCard, arePropsEqual);
