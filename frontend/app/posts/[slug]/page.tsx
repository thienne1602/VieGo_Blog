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
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import CommentSection from "@/components/blog/CommentSection";
import ImageLightbox from "@/components/common/ImageLightbox";
import { useAuth } from "@/lib/AuthContext";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  images?: string[];
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
  const { user } = useAuth();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching post with slug:", slug);

      const response = await fetch(`http://localhost:5000/api/posts/${slug}`);
      console.log("Post response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch post");
      }

      const data = await response.json();
      console.log("Post data:", data);
      setPost(data.post);
    } catch (err: any) {
      console.error("Error fetching post:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !slug) return;

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
    if (!token || !slug) return;

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

  useEffect(() => {
    if (slug) {
      fetchPost();
      checkLikeStatus();
      checkBookmarkStatus();
    }
  }, [slug]);

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

  const handleEdit = () => {
    router.push(`/posts/${slug}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:5000/api/posts/${slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Không thể xóa bài viết");
      }

      alert("Xóa bài viết thành công!");
      router.push("/profile/user?tab=posts");
    } catch (err: any) {
      console.error("Error deleting post:", err);
      alert(err.message || "Có lỗi xảy ra khi xóa bài viết");
    }
  };

  const isAuthor = user && post && user.id === post.author.id;

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Quay lại</span>
            </button>

            {/* Quick Stats in Header */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{post.views_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{post.likes_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with Featured Image */}
      {post.featured_image && (
        <div className="relative w-full h-[500px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          {/* Title Overlay on Image */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-8">
            <div className="max-w-5xl mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold text-white mb-4 drop-shadow-lg"
              >
                {post.title}
              </motion.h1>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Main Article Card */}
          <article className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
            {/* If no featured image, show title here */}
            {!post.featured_image && (
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <h1 className="text-5xl font-bold text-gray-900 flex-1">
                    {post.title}
                  </h1>

                  {/* Edit/Delete Menu for Author */}
                  {isAuthor && (
                    <div className="relative ml-4">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                        title="Thêm tùy chọn"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>

                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
                        >
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              handleEdit();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-gray-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa bài viết
                          </button>
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              handleDelete();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa bài viết
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Author Info Section */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Author Avatar */}
                  {post.author.avatar_url ? (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.full_name}
                      className="w-14 h-14 rounded-full ring-2 ring-blue-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl ring-2 ring-blue-100">
                      {post.author.full_name?.[0] || "U"}
                    </div>
                  )}

                  <div>
                    <Link
                      href={`/profile/${post.author.id}`}
                      className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition"
                    >
                      {post.author.full_name}
                    </Link>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                      <span>•</span>
                      <span>{post.read_time} phút đọc</span>
                    </div>
                  </div>
                </div>

                {/* Edit Menu for Featured Image Posts */}
                {post.featured_image && isAuthor && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                      title="Thêm tùy chọn"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
                      >
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            handleEdit();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-gray-700"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Chỉnh sửa bài viết
                        </button>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            handleDelete();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa bài viết
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Excerpt Highlight */}
            {post.excerpt && (
              <div className="mx-8 mt-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                <p className="text-gray-700 text-lg italic leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
            )}

            {/* Location Info */}
            {post.location_name && (
              <div className="mx-8 mb-6 p-5 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200">
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {post.location_name}
                    </p>
                    {post.location_address && (
                      <p className="text-sm text-gray-600 mt-1">
                        {post.location_address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="px-8 py-6">
              <div className="prose prose-lg prose-gray max-w-none">
                <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
                  {post.content}
                </div>
              </div>
            </div>

            {/* Image Gallery - All Images */}
            {post.images && post.images.length > 0 && (
              <div className="px-8 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Hình ảnh ({post.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {post.images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer"
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Ảnh ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg hover:opacity-90 transition"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition rounded-lg" />
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {index + 1}/{post.images?.length || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Section */}
            {post.tags && post.tags.length > 0 && (
              <div className="px-8 pb-6">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 hover:from-blue-200 hover:to-purple-200 transition cursor-pointer"
                    >
                      <TagIcon className="w-3.5 h-3.5 mr-1.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons - Redesigned */}
            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      isLiked
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-200 hover:shadow-xl"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                    />
                    <span>{isLiked ? "Đã thích" : "Thích"}</span>
                    <span className="ml-1 text-sm font-bold">
                      ({post.likes_count})
                    </span>
                  </button>

                  <button
                    onClick={handleBookmark}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      isBookmarked
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200 hover:shadow-xl"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    <Bookmark
                      className={`w-5 h-5 ${
                        isBookmarked ? "fill-current" : ""
                      }`}
                    />
                    <span>{isBookmarked ? "Đã lưu" : "Lưu"}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Comments Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <CommentSection postId={post.id} />
          </div>
        </motion.div>
      </div>

      {/* Bottom Spacing */}
      <div className="h-16"></div>

      {/* Image Lightbox */}
      {lightboxOpen && post.images && (
        <ImageLightbox
          images={post.images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export default PostDetailPage;
