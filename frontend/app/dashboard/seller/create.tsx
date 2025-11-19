"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Image as ImageIcon, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import Toast from "../../../components/common/Toast";

export function CreateTourForm({ onSuccess }: any) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration_days: 1,
    starting_location: "",
    ending_location: "",
    price_per_person: 0,
    category: "adventure",
    difficulty_level: "easy",
    min_participants: 1,
    max_participants: 10,
    itinerary: [] as Array<{ day: number; title: string; description: string }>,
    inclusions: [] as string[],
    exclusions: [] as string[],
    available_dates: [] as string[],
    cancellation_policy: "",
    booking_deadline_days: 3,
    video_url: "",
    tags: [] as string[],
    status: "draft",
    currency: "VND",
    discount_percentage: 0,
    age_requirement: "",
    fitness_requirement: "low",
  });
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newAvailableDate, setNewAvailableDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileStates, setFileStates] = useState<any[]>([]);
  const [toast, setToast] = useState<any | null>(null);

  const steps = [
    { id: 1, label: "Thông Tin Cơ Bản", icon: "📝" },
    { id: 2, label: "Chi Tiết Tour", icon: "🔍" },
    { id: 3, label: "Lịch Trình & Chính Sách", icon: "📅" },
    { id: 4, label: "Bao Gồm/Không Bao Gồm", icon: "✅" },
    { id: 5, label: "Hình Ảnh", icon: "📷" },
    { id: 6, label: "Xem Trước", icon: "👀" },
  ];

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setSaving(true);
    // Normalize image URLs - convert full URLs to relative paths for backend
    const baseURL = api.baseURL.replace('/api', '');
    const normalizeImageUrl = (url: string) => {
      if (!url) return null;
      if (url.startsWith(baseURL)) {
        return url.replace(baseURL, '');
      }
      return url;
    };
    
    const payload = {
      ...form,
      featured_image: images[0] ? normalizeImageUrl(images[0]) : null,
      gallery_images: images.map(normalizeImageUrl).filter(Boolean),
      // Format arrays for backend
      itinerary: form.itinerary.length > 0 ? form.itinerary : undefined,
      inclusions: form.inclusions.length > 0 ? form.inclusions : undefined,
      exclusions: form.exclusions.length > 0 ? form.exclusions : undefined,
      available_dates: form.available_dates.length > 0 ? form.available_dates : undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
      // Remove empty strings
      ending_location: form.ending_location || undefined,
      cancellation_policy: form.cancellation_policy || undefined,
      video_url: form.video_url || undefined,
      age_requirement: form.age_requirement || undefined,
    };
    
    try {
      const res = await api.post("/tours", payload);
      if (res.success) {
        setToast({ message: "Tạo tour thành công!", type: "success" });
        setTimeout(() => {
          if (onSuccess) onSuccess(res.data);
          else router.push("/dashboard/seller");
        }, 1500);
      } else {
        setToast({ message: res.error || "Lỗi khi tạo tour", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Lỗi khi tạo tour", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const uploadFileWithProgress = (file: File, index: number) => {
    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      const url = `${api.baseURL}/upload/image`;
      const formData = new FormData();
      formData.append("file", file);

      xhr.upload.onprogress = (e) => {
        const perc = e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : 0;
        setFileStates((prev) => {
          const copy = [...prev];
          copy[index] = { ...(copy[index] || {}), progress: perc };
          return copy;
        });
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data && data.url) {
              // Format image URL with full base URL
              const baseURL = api.baseURL.replace('/api', ''); // Remove /api to get base server URL
              const fullImageUrl = data.url.startsWith('http') 
                ? data.url 
                : `${baseURL}${data.url}`;
              
              setFileStates((prev) => {
                const copy = [...prev];
                copy[index] = { ...(copy[index] || {}), status: "done", url: fullImageUrl };
                return copy;
              });
              setImages((prev) => [...prev, fullImageUrl]);
            } else {
              setFileStates((prev) => {
                const copy = [...prev];
                copy[index] = { ...(copy[index] || {}), status: "error", error: data.error || "Upload failed" };
                return copy;
              });
            }
          } catch (err) {
            setFileStates((prev) => {
              const copy = [...prev];
              copy[index] = { ...(copy[index] || {}), status: "error", error: "Invalid response" };
              return copy;
            });
          }
        } else {
          setFileStates((prev) => {
            const copy = [...prev];
            copy[index] = { ...(copy[index] || {}), status: "error", error: `HTTP ${xhr.status}` };
            return copy;
          });
        }
        resolve();
      };

      xhr.onerror = () => {
        setFileStates((prev) => {
          const copy = [...prev];
          copy[index] = { ...(copy[index] || {}), status: "error", error: "Network error" };
          return copy;
        });
        resolve();
      };

      const token = api.getToken();
      xhr.open("POST", url);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const startIndex = fileStates.length;
    const initialStates = Array.from(files).map((f) => ({
      name: f.name,
      progress: 0,
      status: "uploading",
    }));
    setFileStates((prev) => [...prev, ...initialStates]);

    for (let i = 0; i < files.length; i++) {
      try {
        await uploadFileWithProgress(files[i], startIndex + i);
      } catch (e) {
        // continue
      }
    }
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setFileStates((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return form.title && form.description;
      case 2:
        return form.starting_location && form.price_per_person > 0;
      case 3:
      case 4:
        return true; // Optional steps
      case 5:
        return images.length > 0;
      default:
        return true;
    }
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setForm({ ...form, inclusions: [...form.inclusions, newInclusion.trim()] });
      setNewInclusion("");
    }
  };

  const removeInclusion = (index: number) => {
    setForm({ ...form, inclusions: form.inclusions.filter((_, i) => i !== index) });
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      setForm({ ...form, exclusions: [...form.exclusions, newExclusion.trim()] });
      setNewExclusion("");
    }
  };

  const removeExclusion = (index: number) => {
    setForm({ ...form, exclusions: form.exclusions.filter((_, i) => i !== index) });
  };

  const addTag = () => {
    if (newTag.trim()) {
      setForm({ ...form, tags: [...form.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setForm({ ...form, tags: form.tags.filter((_, i) => i !== index) });
  };

  const addAvailableDate = () => {
    if (newAvailableDate) {
      setForm({ ...form, available_dates: [...form.available_dates, newAvailableDate] });
      setNewAvailableDate("");
    }
  };

  const removeAvailableDate = (index: number) => {
    setForm({ ...form, available_dates: form.available_dates.filter((_, i) => i !== index) });
  };

  const addItineraryDay = () => {
    const dayNumber = form.itinerary.length + 1;
    setForm({
      ...form,
      itinerary: [...form.itinerary, { day: dayNumber, title: "", description: "" }],
    });
  };

  const updateItineraryDay = (index: number, field: string, value: string) => {
    const updated = [...form.itinerary];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, itinerary: updated });
  };

  const removeItineraryDay = (index: number) => {
    setForm({
      ...form,
      itinerary: form.itinerary.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        day: i + 1,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tạo Tour Mới</h1>
          <p className="text-gray-600">Điền thông tin để tạo tour mới cho khách hàng</p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      currentStep === step.id
                        ? "bg-teal-600 text-white shadow-lg scale-110"
                        : currentStep > step.id
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-6 h-6" /> : <span>{step.icon}</span>}
                  </div>
                  <span className={`mt-2 text-sm font-medium text-center ${
                    currentStep === step.id ? "text-teal-600" : "text-gray-600"
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông Tin Cơ Bản</h2>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Tiêu đề tour *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ví dụ: Tour khám phá Sapa 3 ngày 2 đêm"
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Mô tả tour *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả chi tiết về tour..."
                    rows={6}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Danh mục
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                  >
                    <option value="adventure">🏔️ Phiêu Lưu</option>
                    <option value="cultural">🏛️ Văn Hóa</option>
                    <option value="food">🍜 Ẩm Thực</option>
                    <option value="nature">🌿 Thiên Nhiên</option>
                    <option value="urban">🏙️ Đô Thị</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Step 2: Tour Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Chi Tiết Tour</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Thời lượng (ngày) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.duration_days}
                      onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })}
                      className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Địa điểm xuất phát *
                    </label>
                    <input
                      type="text"
                      value={form.starting_location}
                      onChange={(e) => setForm({ ...form, starting_location: e.target.value })}
                      placeholder="Ví dụ: Hà Nội"
                      className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Giá / người (VND) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.price_per_person}
                      onChange={(e) => setForm({ ...form, price_per_person: Number(e.target.value) })}
                      className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Độ khó
                    </label>
                    <select
                      value={form.difficulty_level}
                      onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })}
                      className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    >
                      <option value="easy">Dễ</option>
                      <option value="moderate">Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Số người tối thiểu
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.min_participants}
                      onChange={(e) => setForm({ ...form, min_participants: Number(e.target.value) })}
                      className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Số người tối đa
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.max_participants}
                      onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })}
                      className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Địa điểm kết thúc
                    </label>
                    <input
                      type="text"
                      value={form.ending_location}
                      onChange={(e) => setForm({ ...form, ending_location: e.target.value })}
                      placeholder="Ví dụ: Hà Nội (để trống nếu giống điểm xuất phát)"
                      className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Giảm giá (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount_percentage}
                      onChange={(e) => setForm({ ...form, discount_percentage: Number(e.target.value) })}
                      className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Yêu cầu độ tuổi
                    </label>
                    <input
                      type="text"
                      value={form.age_requirement}
                      onChange={(e) => setForm({ ...form, age_requirement: e.target.value })}
                      placeholder="Ví dụ: 18+, All ages"
                      className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Itinerary & Policy */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Lịch Trình & Chính Sách</h2>

                {/* Itinerary */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Lịch trình chi tiết theo ngày
                    </label>
                    <button
                      type="button"
                      onClick={addItineraryDay}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-semibold"
                    >
                      + Thêm ngày
                    </button>
                  </div>
                  <div className="space-y-4">
                    {form.itinerary.map((day, idx) => (
                      <div key={idx} className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-teal-600">Ngày {day.day}</span>
                          <button
                            type="button"
                            onClick={() => removeItineraryDay(idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={day.title}
                          onChange={(e) => updateItineraryDay(idx, "title", e.target.value)}
                          placeholder="Tiêu đề ngày (ví dụ: Khám phá Sapa)"
                          className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none"
                        />
                        <textarea
                          value={day.description}
                          onChange={(e) => updateItineraryDay(idx, "description", e.target.value)}
                          placeholder="Mô tả chi tiết hoạt động trong ngày..."
                          rows={3}
                          className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none resize-none"
                        />
                      </div>
                    ))}
                    {form.itinerary.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Chưa có lịch trình. Click "Thêm ngày" để bắt đầu.
                      </p>
                    )}
                  </div>
                </div>

                {/* Available Dates */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Ngày khởi hành khả dụng
                    </label>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="date"
                      value={newAvailableDate}
                      onChange={(e) => setNewAvailableDate(e.target.value)}
                      className="flex-1 border-2 border-gray-200 px-4 py-2 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addAvailableDate}
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold"
                    >
                      Thêm
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.available_dates.map((date, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-800 rounded-lg text-sm"
                      >
                        {new Date(date).toLocaleDateString("vi-VN")}
                        <button
                          type="button"
                          onClick={() => removeAvailableDate(idx)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Chính sách hủy tour
                  </label>
                  <textarea
                    value={form.cancellation_policy}
                    onChange={(e) => setForm({ ...form, cancellation_policy: e.target.value })}
                    placeholder="Ví dụ: Hủy trước 7 ngày: hoàn 100%, trước 3 ngày: hoàn 50%, sau 3 ngày: không hoàn"
                    rows={4}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Booking Deadline */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Số ngày tối thiểu trước khi khởi hành để đặt chỗ
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.booking_deadline_days}
                    onChange={(e) => setForm({ ...form, booking_deadline_days: Number(e.target.value) })}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Link video tour (YouTube/Vimeo - tùy chọn)
                  </label>
                  <input
                    type="url"
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Trạng thái tour
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                  >
                    <option value="draft">📝 Nháp (chưa công khai)</option>
                    <option value="active">✅ Hoạt động (hiển thị công khai)</option>
                    <option value="inactive">⏸️ Tạm dừng</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Chọn "Nháp" để lưu và chỉnh sửa sau, hoặc "Hoạt động" để tour hiển thị công khai ngay.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Inclusions/Exclusions */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Bao Gồm / Không Bao Gồm</h2>

                {/* Inclusions */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Tour bao gồm
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newInclusion}
                      onChange={(e) => setNewInclusion(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInclusion())}
                      placeholder="Ví dụ: Xe đưa đón, Hướng dẫn viên, Bữa sáng"
                      className="flex-1 border-2 border-gray-200 px-4 py-2 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addInclusion}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                    >
                      Thêm
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.inclusions.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2"
                      >
                        <span className="text-gray-800">✓ {item}</span>
                        <button
                          type="button"
                          onClick={() => removeInclusion(idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exclusions */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Tour không bao gồm
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newExclusion}
                      onChange={(e) => setNewExclusion(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExclusion())}
                      placeholder="Ví dụ: Bữa trưa, Bảo hiểm, Chi phí cá nhân"
                      className="flex-1 border-2 border-gray-200 px-4 py-2 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addExclusion}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                    >
                      Thêm
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.exclusions.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-2"
                      >
                        <span className="text-gray-800">✗ {item}</span>
                        <button
                          type="button"
                          onClick={() => removeExclusion(idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Thẻ tag (để dễ tìm kiếm)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      placeholder="Ví dụ: sapa, trekking, mùa xuân"
                      className="flex-1 border-2 border-gray-200 px-4 py-2 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                    >
                      Thêm
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(idx)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Images */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Hình Ảnh Tour</h2>
                
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Tải lên hình ảnh (Ảnh đầu tiên sẽ là ảnh đại diện) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-600 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFiles(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-gray-600 font-medium">
                        Click để chọn hoặc kéo thả hình ảnh vào đây
                      </span>
                      <span className="text-sm text-gray-500 mt-1">
                        PNG, JPG, WEBP (tối đa 10MB)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 bg-teal-600 text-white px-2 py-1 rounded text-xs font-bold z-10">
                            Ảnh đại diện
                          </div>
                        )}
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Progress */}
                {fileStates.some((f) => f.status === "uploading") && (
                  <div className="space-y-2">
                    {fileStates.map((file, idx) => (
                      file.status === "uploading" && (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-sm font-semibold text-teal-600">{file.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 6: Preview */}
            {currentStep === 6 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Xem Trước Tour</h2>
                
                <div className="border-2 border-gray-200 rounded-xl p-6 space-y-4">
                  {images[0] && (
                    <img
                      src={images[0]}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{form.title}</h3>
                    <p className="text-gray-600 mt-2">{form.description}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-gray-500">Thời lượng</div>
                      <div className="font-semibold">{form.duration_days} ngày</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Địa điểm</div>
                      <div className="font-semibold">{form.starting_location}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Giá</div>
                      <div className="font-semibold text-teal-600">
                        {new Intl.NumberFormat("vi-VN").format(form.price_per_person)} VND
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Độ khó</div>
                      <div className="font-semibold capitalize">{form.difficulty_level}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại
            </button>

            <button
              type="submit"
              disabled={!canProceed() || saving || uploading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {saving ? (
                "Đang lưu..."
              ) : currentStep === 6 ? (
                "Tạo Tour"
              ) : (
                <>
                  Tiếp theo
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  );
}

export default function CreateTourPage() {
  return <CreateTourForm />;
}
