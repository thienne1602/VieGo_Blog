"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Eye,
  Image as ImageIcon,
  MapPin,
  Tag,
  Globe,
  FileText,
  Video,
} from "lucide-react";

interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  content_type: "blog" | "video" | "photo" | "tour_guide";
  language: string;
  category: string;
  tags: string[];
  featured_image: string;
  images: string[]; // Add multiple images array
  video_url: string;
  location_name: string;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  status: "draft" | "published";
  meta_title: string;
  meta_description: string;
}

const CreatePostPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTag, setCurrentTag] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    content: "",
    excerpt: "",
    content_type: "blog",
    language: "vi",
    category: "travel",
    tags: [],
    featured_image: "",
    images: [], // Initialize empty array
    video_url: "",
    location_name: "",
    location_address: "",
    location_lat: null,
    location_lng: null,
    status: "draft",
    meta_title: "",
    meta_description: "",
  });

  const categories = [
    { value: "travel", label: "Du lịch" },
    { value: "food", label: "Ẩm thực" },
    { value: "culture", label: "Văn hóa" },
    { value: "adventure", label: "Phiêu lưu" },
    { value: "budget", label: "Du lịch bụi" },
    { value: "luxury", label: "Cao cấp" },
  ];

  const contentTypes = [
    { value: "blog", label: "Blog", icon: FileText },
    { value: "video", label: "Video", icon: Video },
    { value: "photo", label: "Ảnh", icon: ImageIcon },
    { value: "tour_guide", label: "Tour Guide", icon: MapPin },
  ];

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
      const uploadedUrls: string[] = [];

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", files[i]);

        const token = localStorage.getItem("access_token");
        const response = await fetch("http://localhost:5000/api/upload/image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: formDataUpload,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(`http://localhost:5000${data.url}`);
        }
      }

      // Add to images array
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

  // Remove image from gallery
  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
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

      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ ...formData, status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Có lỗi xảy ra");
      }

      const data = await response.json();
      router.push(`/posts/${data.post.slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSubmit("draft")}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Lưu nháp
              </button>
              <button
                onClick={() => handleSubmit("published")}
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xuất bản
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto mt-6 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Content Type Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Loại nội dung
            </label>
            <div className="grid grid-cols-4 gap-3">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        content_type: type.value as any,
                      }))
                    }
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition ${
                      formData.content_type === type.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Tiêu đề bài viết..."
              className="w-full text-3xl font-bold border-none focus:outline-none placeholder-gray-400"
            />
          </div>

          {/* Image Gallery - Multiple Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
              <p className="text-sm text-gray-500 text-center py-8">
                Chưa có ảnh nào. Nhấn "Thêm ảnh" để upload.
              </p>
            )}
          </div>

          {/* Content Editor (Simple Textarea for now) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Nội dung
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Viết nội dung của bạn ở đây..."
              rows={20}
              className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tóm tắt ngắn
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              placeholder="Tóm tắt ngắn gọn về bài viết..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category & Tags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Danh mục
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tags
              </label>
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Nhập tag và nhấn Enter..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-blue-900"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Địa điểm
            </h3>
            <input
              type="text"
              name="location_name"
              value={formData.location_name}
              onChange={handleInputChange}
              placeholder="Tên địa điểm..."
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              name="location_address"
              value={formData.location_address}
              onChange={handleInputChange}
              placeholder="Địa chỉ chi tiết..."
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatePostPage;
