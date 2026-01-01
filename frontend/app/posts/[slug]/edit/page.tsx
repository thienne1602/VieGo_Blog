"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  MapPin,
  Tag,
  FileText,
  Globe,
  Lock,
  Users,
  X,
  Search,
} from "lucide-react";
import apiClient from "@/lib/api";
import { getAPIURL } from "@/lib/apiConfig";
import SuccessPopup from "@/components/common/SuccessPopup";

// Helper to get token with port-specific key
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const port =
    window.location.port ||
    (window.location.protocol === "https:" ? "443" : "80");
  // Try port-specific key first, then fallback to generic key
  return (
    localStorage.getItem(`access_token_${port}`) ||
    localStorage.getItem("access_token")
  );
};

interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  content_type: "blog" | "video" | "photo" | "tour_guide";
  language: string;
  category: string;
  tags: string[];
  featured_image: string;
  images: string[];
  video_url: string;
  location_name: string;
  location_address: string;
  status: "draft" | "published";
  visibility: "public" | "private" | "friends";
  allowed_viewers: number[];
}

interface User {
  id: number;
  username: string;
  full_name: string;
  avatar_url: string;
}

const EditPostPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTag, setCurrentTag] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  // Friends search for visibility
  const [friendsSearch, setFriendsSearch] = useState("");
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    content: "",
    excerpt: "",
    content_type: "blog",
    language: "vi",
    category: "travel",
    tags: [],
    featured_image: "",
    images: [],
    video_url: "",
    location_name: "",
    location_address: "",
    status: "published",
    visibility: "public",
    allowed_viewers: [],
  });

  const categories = [
    { value: "travel", label: "Du lịch" },
    { value: "food", label: "Ẩm thực" },
    { value: "culture", label: "Văn hóa" },
    { value: "adventure", label: "Phiêu lưu" },
    { value: "budget", label: "Du lịch bụi" },
    { value: "luxury", label: "Cao cấp" },
  ];

  useEffect(() => {
    fetchPost();
    fetchFriends();
  }, [slug]);

  const fetchFriends = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${getAPIURL()}/social/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFriendsList(data.friends || []);
      }
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${getAPIURL()}/posts/${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch post");

      const data = await response.json();
      const post = data.post;

      setFormData({
        title: post.title || "",
        content: post.content || "",
        excerpt: post.excerpt || "",
        content_type: post.content_type || "blog",
        language: post.language || "vi",
        category: post.category || "travel",
        tags: post.tags || [],
        featured_image: post.featured_image || "",
        images: post.images || [],
        video_url: post.video_url || "",
        location_name: post.location_name || post.location?.name || "",
        location_address: post.location_address || post.location?.address || "",
        status: post.status || "published",
        visibility: post.visibility || "public",
        allowed_viewers: post.allowed_viewers || [],
      });

      // Load selected friends from allowed_viewers
      if (post.allowed_viewers && post.allowed_viewers.length > 0) {
        const friendsData = friendsList.filter((f) =>
          post.allowed_viewers.includes(f.id)
        );
        setSelectedFriends(friendsData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(currentTag.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, currentTag.trim()],
        }));
      }
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Upload multiple images
  const handleMultipleImagesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập để upload ảnh");
        router.push("/login");
        return;
      }
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        const response = await fetch(`${getAPIURL()}/upload/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: formDataUpload,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        uploadedUrls.push(`${getBaseURL()}${data.url}`);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (err) {
      setError("Lỗi upload ảnh");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (status: "draft" | "published") => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!formData.title.trim() || !formData.content.trim()) {
        setError("Vui lòng nhập tiêu đề và nội dung");
        return;
      }

      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập để chỉnh sửa bài viết");
        router.push("/login");
        return;
      }

      // Prepare data with allowed_viewers
      const submitData = {
        ...formData,
        status,
        allowed_viewers: selectedFriends.map((f) => f.id),
      };

      const response = await fetch(`${getAPIURL()}/posts/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Có lỗi xảy ra");
      }

      const data = await response.json();

      // Clear cache for posts to reflect updated visibility
      apiClient.clearCache();

      // Set flag to notify NewsFeed to refresh posts list
      localStorage.setItem("posts_updated", Date.now().toString());

      // Dispatch custom event for immediate update across components
      window.dispatchEvent(
        new CustomEvent("postsUpdated", {
          detail: {
            postId: data.post.id,
            slug: data.post.slug,
            visibility: formData.visibility,
          },
        })
      );

      setPopupMessage("Cập nhật bài viết thành công!");
      setPopupType("success");
      setShowPopup(true);

      // Delay redirect to show popup
      setTimeout(() => {
        router.push(`/posts/${data.post.slug}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </button>

          <div className="flex space-x-3">
            <button
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Lưu nháp
            </button>
            <button
              onClick={() => handleSubmit("published")}
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Cập nhật
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Chỉnh sửa bài viết
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tiêu đề bài viết..."
            />
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả ngắn
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mô tả ngắn về bài viết..."
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="Viết nội dung bài viết..."
            />
          </div>

          {/* Category & Type */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại nội dung
              </label>
              <select
                name="content_type"
                value={formData.content_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="blog">Blog</option>
                <option value="video">Video</option>
                <option value="photo">Ảnh</option>
                <option value="tour_guide">Tour Guide</option>
              </select>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ai có thể xem bài viết này?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, visibility: "public" }))
                }
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  formData.visibility === "public"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Globe className="w-5 h-5" />
                <span>Công khai</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, visibility: "friends" }))
                }
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  formData.visibility === "friends"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Bạn bè</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, visibility: "private" }))
                }
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  formData.visibility === "private"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Lock className="w-5 h-5" />
                <span>Chỉ mình tôi</span>
              </button>
            </div>

            {/* Friends Selection for 'friends' visibility */}
            {formData.visibility === "friends" && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Chọn bạn bè có thể xem:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFriendsModal(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Thêm bạn bè
                  </button>
                </div>

                {selectedFriends.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border"
                      >
                        <img
                          src={
                            friend.avatar_url ||
                            "https://via.placeholder.com/24"
                          }
                          alt={friend.full_name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm">
                          {friend.full_name || friend.username}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFriends((prev) =>
                              prev.filter((f) => f.id !== friend.id)
                            )
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Chưa chọn bạn bè nào. Nhấn "Thêm bạn bè" để chọn.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Image Gallery - Multiple Images */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Hình ảnh bài viết
            </label>

            {/* Upload Button */}
            <label className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition mb-4">
              <ImageIcon className="w-5 h-5 mr-2" />
              <span>Thêm ảnh</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleImagesUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>

            {uploadingImage && (
              <p className="text-sm text-gray-500 mb-4">Đang upload...</p>
            )}

            {/* Image Grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.images.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                Chưa có ảnh nào. Nhấn "Thêm ảnh" để upload.
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tag và Enter..."
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Địa điểm
            </label>
            <input
              type="text"
              name="location_name"
              value={formData.location_name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
              placeholder="Tên địa điểm..."
            />
            <input
              type="text"
              name="location_address"
              value={formData.location_address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Địa chỉ chi tiết..."
            />
          </div>
        </motion.div>
      </div>

      {/* Friends Selection Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chọn bạn bè
              </h3>
              <button
                onClick={() => setShowFriendsModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={friendsSearch}
                  onChange={(e) => setFriendsSearch(e.target.value)}
                  placeholder="Tìm kiếm bạn bè..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {friendsList
                  .filter(
                    (friend) =>
                      friend.full_name
                        ?.toLowerCase()
                        .includes(friendsSearch.toLowerCase()) ||
                      friend.username
                        ?.toLowerCase()
                        .includes(friendsSearch.toLowerCase())
                  )
                  .map((friend) => {
                    const isSelected = selectedFriends.some(
                      (f) => f.id === friend.id
                    );
                    return (
                      <div
                        key={friend.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFriends((prev) =>
                              prev.filter((f) => f.id !== friend.id)
                            );
                          } else {
                            setSelectedFriends((prev) => [...prev, friend]);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                            : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent"
                        }`}
                      >
                        <img
                          src={
                            friend.avatar_url ||
                            "https://via.placeholder.com/40"
                          }
                          alt={friend.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {friend.full_name || friend.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{friend.username}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {friendsList.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Bạn chưa có bạn bè nào.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowFriendsModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => setShowFriendsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xong ({selectedFriends.length} người)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success/Error Popup */}
      <SuccessPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        message={popupMessage}
        type={popupType}
        duration={2000}
      />
    </div>
  );
};

export default EditPostPage;
