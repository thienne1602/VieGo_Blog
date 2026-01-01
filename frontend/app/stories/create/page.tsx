"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Video,
  X,
  Send,
} from "lucide-react";
import { getAPIURL } from "@/lib/apiConfig";

export default function CreateStoryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const isVideo = selectedFile.type.startsWith("video/");
    const isImage = selectedFile.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setError("Chỉ chấp nhận file ảnh hoặc video");
      return;
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`File quá lớn. Tối đa ${isVideo ? "50MB" : "10MB"}`);
      return;
    }

    setFile(selectedFile);
    setMediaType(isVideo ? "video" : "image");
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Vui lòng chọn ảnh hoặc video");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (content) {
        formData.append("content", content);
      }

      const response = await fetch(`${getAPIURL()}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Đã đăng story thành công!");
        router.push("/blog");
      } else {
        throw new Error(data.error || "Không thể đăng story");
      }
    } catch (err: any) {
      console.error("Error creating story:", err);
      setError(err.message || "Có lỗi xảy ra khi đăng story");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-gray-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </button>

          <h1 className="text-white font-semibold">Tạo tin</h1>

          <button
            onClick={handleSubmit}
            disabled={!file || isUploading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang đăng...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Đăng
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Upload Area */}
        {!preview ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-2xl p-8"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-gray-700/50 transition-all"
            >
              <div className="flex justify-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-pink-500" />
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Video className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">
                Chọn ảnh hoặc video
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Ảnh tối đa 10MB • Video tối đa 50MB
              </p>
              <p className="text-gray-500 text-xs">
                Định dạng: JPG, PNG, GIF, WEBP, MP4, WEBM, MOV
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "image/*";
                    fileInputRef.current.click();
                  }
                }}
                className="flex items-center justify-center gap-2 p-4 bg-pink-500/20 text-pink-400 rounded-xl hover:bg-pink-500/30 transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                Chọn ảnh
              </button>
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "video/*";
                    fileInputRef.current.click();
                  }
                }}
                className="flex items-center justify-center gap-2 p-4 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors"
              >
                <Video className="w-5 h-5" />
                Chọn video
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[70vh]">
              {mediaType === "video" ? (
                <video
                  src={preview}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}

              {/* Clear button */}
              <button
                onClick={clearFile}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Media type badge */}
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 rounded-full flex items-center gap-2">
                {mediaType === "video" ? (
                  <Video className="w-4 h-4 text-blue-400" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                )}
                <span className="text-white text-sm">
                  {mediaType === "video" ? "Video" : "Ảnh"}
                </span>
              </div>
            </div>

            {/* Caption */}
            <div className="bg-gray-800 rounded-xl p-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Thêm chú thích... (không bắt buộc)"
                className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none"
                rows={3}
                maxLength={200}
              />
              <div className="text-right text-gray-500 text-xs">
                {content.length}/200
              </div>
            </div>

            {/* Change file button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Đổi file khác
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
