"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Bot,
  Minimize2,
  Maximize2,
  ArrowRight,
  ExternalLink,
  MapPin,
  Clock,
  Users,
  Star,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

// Google Gemini API Configuration
const GEMINI_API_KEY = "AIzaSyAxaXr2XpyDyC897UsL8g9re1mNHAEuCow";

// Hàm list models có sẵn
const listAvailableModels = async (): Promise<string[]> => {
  try {
    // Thử cả v1beta và v1
    for (const version of ["v1beta", "v1"]) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${version}/models?key=${GEMINI_API_KEY}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.models && Array.isArray(data.models)) {
            const models = data.models
              .filter(
                (m: any) =>
                  m.supportedGenerationMethods?.includes("generateContent") ||
                  m.supportedGenerationMethods?.includes("generateText")
              )
              .map((m: any) => {
                // Extract model name (có thể là "models/gemini-pro" hoặc chỉ "gemini-pro")
                const name = m.name || m.displayName || "";
                return name.replace("models/", "");
              })
              .filter((name: string) => name.length > 0);

            if (models.length > 0) {
              return models;
            }
          }
        } else {
          // ListModels failed, continue to next version
        }
      } catch (error) {
        // Continue to next version
      }
    }
  } catch (error) {
    // Return empty array on error
  }
  return [];
};

const getGeminiURL = (model: string, version: string = "v1beta") =>
  `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  data?: any; // Thêm data để lưu thông tin từ API
  tours?: any[]; // Tours để hiển thị cards
  actionButtons?: Array<{
    label: string;
    action: () => void;
    iconType?: "arrow" | "external"; // Thay vì lưu React element, lưu type
  }>;
}

// Component Robot Animation
const RobotAnimation = ({
  size = "small",
}: {
  size?: "small" | "medium" | "large";
}) => {
  const sizeClasses = {
    small: "w-8 h-6",
    medium: "w-12 h-8",
    large: "w-16 h-12",
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} flex items-center justify-center`}
    >
      {/* Robot Head */}
      <div
        className={`relative ${sizeClasses[size]} bg-gray-800 dark:bg-gray-700 rounded-lg border-2 border-primary-400 flex items-center justify-center animate-pulse`}
      >
        {/* Antenna */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-primary-400 rounded-t-full">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary-400 rounded-full animate-pulse"></div>
        </div>
        {/* Eyes */}
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      </div>
      {/* Robot Body */}
      <div
        className={`absolute top-6 ${
          size === "small"
            ? "w-6 h-4"
            : size === "medium"
            ? "w-10 h-6"
            : "w-14 h-8"
        } bg-gray-800 dark:bg-gray-700 rounded-b-lg border-2 border-primary-400 border-t-0`}
      >
        <div
          className={`${
            size === "small"
              ? "w-2 h-2"
              : size === "medium"
              ? "w-3 h-3"
              : "w-4 h-4"
          } bg-primary-400 rounded-full mx-auto mt-1 animate-pulse`}
        ></div>
      </div>
    </div>
  );
};

// Knowledge base với các câu trả lời về các tính năng
const knowledgeBase: Record<string, string | string[]> = {
  // Chào hỏi
  greeting: [
    "Xin chào! 🤖 Tôi là trợ lý ảo của VieGo. Tôi có thể giúp bạn hướng dẫn về các tính năng trên website và trả lời các câu hỏi về dữ liệu trên web. Bạn cần hỗ trợ gì?",
    "Chào bạn! 🤖 Tôi sẵn sàng giúp bạn khám phá các tính năng của VieGo và tìm kiếm thông tin trên website. Bạn muốn biết gì?",
    "Xin chào! 🤖 Tôi ở đây để hỗ trợ bạn. Hãy hỏi tôi bất cứ điều gì về VieGo nhé!",
  ],
  // Đăng ký/Đăng nhập
  "đăng ký":
    "Để đăng ký tài khoản:\n1. Nhấp vào nút 'Đăng ký' ở góc trên bên phải\n2. Điền thông tin: tên đầy đủ, email, mật khẩu\n3. Xác nhận email để kích hoạt tài khoản\n4. Sau khi đăng ký, bạn có thể đăng nhập và sử dụng tất cả tính năng",
  "đăng nhập":
    "Để đăng nhập:\n1. Nhấp vào nút 'Đăng nhập' ở header\n2. Nhập email và mật khẩu của bạn\n3. Nếu chưa có tài khoản, hãy đăng ký trước\n4. Sau khi đăng nhập, bạn có thể truy cập đầy đủ các tính năng",
  // Tạo bài viết
  "tạo bài viết":
    "Để tạo bài viết mới:\n1. Đăng nhập vào tài khoản\n2. Ở trang chủ, tìm khung 'Tạo bài viết' hoặc 'Viết gì đó...'\n3. Nhấp vào để mở editor\n4. Viết nội dung, thêm hình ảnh, video nếu muốn\n5. Chọn danh mục và tags phù hợp\n6. Nhấp 'Đăng' để chia sẻ bài viết",
  "viết bài":
    "Để viết bài:\n1. Đăng nhập vào tài khoản\n2. Tìm khung tạo bài viết ở trang chủ\n3. Nhấp vào và bắt đầu viết\n4. Bạn có thể thêm hình ảnh, video, định dạng văn bản\n5. Chọn danh mục phù hợp (blog, tour guide, photo gallery...)\n6. Đăng bài để chia sẻ với cộng đồng",
  // Tìm kiếm bạn bè
  "tìm bạn":
    "Để tìm kiếm bạn bè:\n1. Sử dụng thanh tìm kiếm ở header (góc trên giữa)\n2. Nhập tên hoặc username của người bạn muốn tìm\n3. Xem kết quả tìm kiếm\n4. Nhấp 'Kết bạn' để gửi lời mời\n5. Hoặc nhấp 'Xem hồ sơ' để xem thông tin chi tiết",
  "kết bạn":
    "Để kết bạn với người khác:\n1. Tìm kiếm người dùng qua thanh tìm kiếm\n2. Nhấp vào nút 'Kết bạn' bên cạnh tên người đó\n3. Chờ họ chấp nhận lời mời\n4. Khi đã là bạn bè, bạn có thể nhắn tin và xem bài viết của nhau",
  "tìm kiếm":
    "Tìm kiếm trên VieGo:\n- Tìm kiếm bạn bè: dùng thanh tìm kiếm ở header\n- Tìm tour: vào trang Tours và sử dụng bộ lọc\n- Tìm bài viết: duyệt news feed hoặc tìm theo danh mục\n- Tìm kiếm lịch sử được lưu tự động",
  "bạn bè":
    "Quản lý bạn bè:\n- Tìm kiếm và gửi lời mời kết bạn\n- Xem danh sách bạn bè ở trang profile\n- Chấp nhận/từ chối lời mời kết bạn từ thông báo\n- Nhắn tin với bạn bè\n- Xem bài viết của bạn bè",
  // Đặt tour
  "đặt tour":
    "Để đặt tour:\n1. Truy cập trang 'Tours' từ menu\n2. Duyệt các tour có sẵn\n3. Nhấp vào tour bạn muốn đặt\n4. Xem chi tiết tour: lịch trình, giá, điểm tham quan\n5. Nhấp 'Đặt tour' hoặc 'Book now'\n6. Điền thông tin người tham gia\n7. Thanh toán và xác nhận booking\n8. Bạn sẽ nhận email xác nhận",
  tour: "VieGo có nhiều tour du lịch:\n- Xem danh sách tour ở trang 'Tours'\n- Lọc theo danh mục, giá, địa điểm\n- Xem chi tiết từng tour: lịch trình, giá, đánh giá\n- Đặt tour trực tuyến\n- Theo dõi tiến trình tour real-time\n- Xem ảnh check-in tại các điểm tham quan",
  // Chat/Nhắn tin
  "nhắn tin":
    "Để nhắn tin:\n1. Tìm kiếm bạn bè qua thanh tìm kiếm\n2. Nhấp vào biểu tượng tin nhắn bên cạnh tên bạn bè\n3. Hoặc vào 'Tin nhắn' ở header\n4. Chọn cuộc trò chuyện hoặc tạo mới\n5. Gửi tin nhắn, hình ảnh, sticker, file\n6. Chat real-time với Socket.io",
  chat: "Tính năng chat của VieGo:\n- Chat 1-1 với bạn bè\n- Chat nhóm với nhiều người\n- Gửi tin nhắn văn bản, hình ảnh, sticker\n- Gửi file và audio\n- Thông báo real-time khi có tin nhắn mới\n- Xem lịch sử chat",
  // Profile
  profile:
    "Quản lý profile:\n1. Nhấp vào avatar của bạn ở header\n2. Vào trang 'Hồ sơ' hoặc 'Profile'\n3. Chỉnh sửa thông tin: tên, mô tả, avatar, cover image\n4. Xem bài viết của bạn\n5. Xem bạn bè, người theo dõi\n6. Xem tour đã đặt",
  "hồ sơ":
    "Để chỉnh sửa hồ sơ:\n1. Vào trang profile của bạn\n2. Nhấp 'Chỉnh sửa hồ sơ'\n3. Cập nhật: tên, email, mô tả, avatar, ảnh bìa\n4. Lưu thay đổi\n5. Thông tin sẽ được cập nhật ngay",
  // Theo dõi tour
  "theo dõi tour":
    "Theo dõi tour của bạn:\n1. Vào trang 'Hành trình' (Tour Journey) từ menu\n2. Xem danh sách tour đã đặt\n3. Nhấp vào tour để xem chi tiết\n4. Xem tiến trình real-time: điểm check-in, ảnh, ghi chú\n5. Hướng dẫn viên sẽ cập nhật tiến trình trong suốt tour",
  "hành trình":
    "Trang Hành trình (Tour Journey):\n- Xem tất cả tour bạn đã đặt\n- Theo dõi tiến trình tour real-time\n- Xem ảnh check-in tại các điểm tham quan\n- Xem ghi chú và mô tả hoạt động\n- Xem lịch trình chi tiết",
  // Thông báo
  "thông báo":
    "Xem thông báo:\n1. Nhấp vào biểu tượng chuông ở header\n2. Xem tất cả thông báo: lời mời kết bạn, tin nhắn mới, cập nhật tour...\n3. Đánh dấu đã đọc\n4. Nhấp vào thông báo để xem chi tiết",
  // Trang chủ
  "trang chủ":
    "Trang chủ của VieGo:\n- Xem news feed với bài viết từ bạn bè và cộng đồng\n- Tạo bài viết mới\n- Xem stories (tin nổi bật)\n- Sidebar với menu điều hướng\n- Right sidebar với thông tin hữu ích",
  // Liên hệ
  "liên hệ":
    "Liên hệ với VieGo:\n1. Vào trang 'Liên hệ' từ menu\n2. Điền form liên hệ với thông tin của bạn\n3. Gửi tin nhắn\n4. Đội ngũ hỗ trợ sẽ phản hồi sớm nhất",
  // Tính năng khác
  "tính năng":
    "Các tính năng chính của VieGo:\n- Blog & Nội dung: Tạo bài viết, chia sẻ trải nghiệm\n- Tour & Booking: Đặt tour, theo dõi hành trình\n- Social: Kết bạn, follow, chat real-time\n- Profile: Quản lý thông tin cá nhân\n- Notifications: Thông báo real-time\n- Dark mode: Chuyển đổi giao diện sáng/tối",
  menu: "Menu điều hướng:\n- Trang chủ: News feed và bài viết\n- Tours: Xem và đặt tour\n- Hành trình: Theo dõi tour của bạn (cần đăng nhập)\n- Liên hệ: Gửi tin nhắn cho đội ngũ hỗ trợ",
  help: "Tôi có thể giúp bạn về:\n- Đăng ký/Đăng nhập\n- Tạo bài viết\n- Tìm kiếm và kết bạn\n- Đặt tour\n- Nhắn tin/Chat\n- Quản lý profile\n- Theo dõi tour\n- Xem thông báo\n- Tìm kiếm thông tin về tours, bài viết, người dùng trên web\n\nHãy hỏi tôi cụ thể hơn nhé!",
  // Help mặc định
  default:
    "Tôi có thể giúp bạn về:\n- Đăng ký/Đăng nhập\n- Tạo bài viết\n- Tìm kiếm và kết bạn\n- Đặt tour\n- Nhắn tin/Chat\n- Quản lý profile\n- Theo dõi tour\n- Xem thông báo\n- Tìm kiếm thông tin về tours, bài viết, người dùng trên web\n\nHãy hỏi tôi cụ thể hơn nhé!",
};

// Cache cho available models
let availableModelsCache: string[] | null = null;

// Hàm gọi Google Gemini API với retry các model khác nhau
const callGeminiAPI = async (
  question: string,
  context?: string
): Promise<string> => {
  const systemPrompt = `Bạn là trợ lý AI thông minh và chuyên nghiệp của VieGo - một nền tảng blog du lịch và ẩm thực Việt Nam.

=== VAI TRÒ CỦA BẠN ===
- Trợ lý AI chính thức của website VieGo
- Hướng dẫn người dùng về TẤT CẢ các tính năng trên website
- Trả lời câu hỏi về du lịch, ẩm thực Việt Nam dựa trên kiến thức và dữ liệu thực tế
- Hỗ trợ người dùng một cách thân thiện, nhiệt tình, chuyên nghiệp

=== QUY TẮC BẮT BUỘC ===
1. LUÔN sử dụng tiếng Việt để giao tiếp
2. Nếu có dữ liệu từ website được cung cấp, BẮT BUỘC phải sử dụng CHÍNH XÁC dữ liệu đó
3. KHÔNG được bịa đặt số liệu, tên tour, tên bài viết, tên người dùng
4. Nếu câu hỏi về số lượng (ví dụ: "Có bao nhiêu tour?"), phải dùng đúng số từ dữ liệu
5. Nếu câu hỏi về danh sách (ví dụ: "Tour nào phổ biến?"), phải liệt kê đúng các tour từ dữ liệu
6. Nếu không có dữ liệu cụ thể, chỉ trả lời dựa trên kiến thức chung về du lịch/ẩm thực Việt Nam
7. Trả lời ngắn gọn, dễ hiểu, có thể sử dụng emoji phù hợp
8. KHÔNG được nói "có thể", "có lẽ" khi có dữ liệu chính xác - phải nói chắc chắn

${
  context
    ? `\n=== DỮ LIỆU THỰC TẾ TỪ WEBSITE VIEGo (BẮT BUỘC SỬ DỤNG) ===\n${context}\n=== HẾT DỮ LIỆU ===\n\n⚠️ LƯU Ý QUAN TRỌNG:\n- Nếu câu hỏi liên quan đến dữ liệu trên, BẮT BUỘC phải sử dụng CHÍNH XÁC dữ liệu đó\n- KHÔNG được thay đổi số liệu, tên, hoặc thông tin từ dữ liệu\n- Nếu dữ liệu có số cụ thể (ví dụ: "Tổng số tour: 10"), phải dùng đúng số đó\n- Nếu dữ liệu có danh sách (ví dụ: "Tour 1: ABC"), phải liệt kê đúng các item đó`
    : ""
}

Hãy trả lời câu hỏi của người dùng một cách CHÍNH XÁC, TỰ NHIÊN và HỮU ÍCH, đảm bảo sử dụng đúng dữ liệu thực tế nếu có:`;

  const fullPrompt = `${systemPrompt}\n\nCÂU HỎI CỦA NGƯỜI DÙNG: ${question}\n\nHãy trả lời:`;

  // Lấy danh sách models có sẵn (cache để không gọi nhiều lần)
  if (!availableModelsCache) {
    availableModelsCache = await listAvailableModels();
  }

  const availableModels = availableModelsCache ?? [];

  // Danh sách models để thử (ưu tiên models đã thành công trước đó)
  // Ưu tiên gemini-2.5-flash vì đã thành công
  const preferredModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
  ];

  const modelsToTry =
    availableModels.length > 0
      ? [
          // Ưu tiên các model đã thành công
          ...preferredModels.filter((m) => availableModels.includes(m)),
          // Sau đó các model khác
          ...availableModels.filter((m) => !preferredModels.includes(m)),
        ]
      : [
          ...preferredModels,
          "gemini-1.5-pro-001",
          "gemini-1.5-flash-001",
          "gemini-1.5-pro-latest",
          "gemini-1.5-flash-latest",
          "gemini-pro",
          "gemini-1.5-flash",
          "gemini-1.5-pro",
          "gemini-1.0-pro",
          "gemini-1.0-pro-001",
        ];

  // Chỉ thử v1beta vì v1 thường không có các model mới
  const versions = ["v1beta"];

  // Thử các model và version khác nhau
  for (const model of modelsToTry) {
    for (const version of versions) {
      try {
        const url = getGeminiURL(model, version);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: fullPrompt,
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          // Model failed, try next config
          continue;
        }

        const data = await response.json();

        // Kiểm tra response structure
        if (
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text
        ) {
          return data.candidates[0].content.parts[0].text;
        }

        // Invalid response structure, try next config
        continue;
      } catch (error) {
        // Error with model, try next config
        continue;
      }
    }
  }

  // Nếu tất cả model đều fail
  throw new Error(
    "Tất cả các model Gemini đều không khả dụng. Vui lòng kiểm tra API key và enable Gemini API trong Google Cloud Console."
  );
};

// Hàm tạo action buttons dựa trên nội dung câu trả lời
const generateActionButtons = (
  question: string,
  answer: string,
  data?: any
): Array<{
  label: string;
  action: () => void;
  iconType?: "arrow" | "external";
}> => {
  const lowerQuestion = question.toLowerCase();
  const lowerAnswer = answer.toLowerCase();
  const buttons: Array<{
    label: string;
    action: () => void;
    iconType?: "arrow" | "external";
  }> = [];

  // Helper để tạo action
  const createAction = (path: string) => () => {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  // Nút cho tours
  if (
    lowerQuestion.includes("tour") ||
    lowerQuestion.includes("du lịch") ||
    lowerAnswer.includes("tour") ||
    data?.tours
  ) {
    buttons.push({
      label: "Xem Tours",
      action: createAction("/tours"),
      iconType: "arrow",
    });
  }

  // Nút cho bài viết/blog
  if (
    lowerQuestion.includes("bài viết") ||
    lowerQuestion.includes("blog") ||
    lowerQuestion.includes("post") ||
    lowerAnswer.includes("bài viết") ||
    lowerAnswer.includes("blog") ||
    data?.posts
  ) {
    buttons.push({
      label: "Xem Blog",
      action: createAction("/"),
      iconType: "arrow",
    });
  }

  // Nút cho profile
  if (
    lowerQuestion.includes("profile") ||
    lowerQuestion.includes("hồ sơ") ||
    lowerAnswer.includes("profile") ||
    lowerAnswer.includes("hồ sơ")
  ) {
    buttons.push({
      label: "Xem Hồ sơ",
      action: createAction("/profile"),
      iconType: "arrow",
    });
  }

  // Nút cho đặt tour
  if (
    lowerQuestion.includes("đặt tour") ||
    lowerAnswer.includes("đặt tour") ||
    lowerAnswer.includes("booking")
  ) {
    buttons.push({
      label: "Đặt Tour ngay",
      action: createAction("/tours"),
      iconType: "external",
    });
  }

  // Nút cho tạo bài viết
  if (
    lowerQuestion.includes("tạo bài viết") ||
    lowerQuestion.includes("viết bài") ||
    lowerAnswer.includes("tạo bài viết") ||
    lowerAnswer.includes("viết bài")
  ) {
    buttons.push({
      label: "Tạo Bài viết",
      action: createAction("/"),
      iconType: "arrow",
    });
  }

  return buttons;
};

// Component TourCard nhỏ gọn cho chat
const ChatTourCard = ({ tour }: { tour: any }) => {
  const image =
    tour.featured_image ||
    (tour.gallery_images &&
      tour.gallery_images.length > 0 &&
      tour.gallery_images[0]) ||
    "/images/tours/default.svg";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: tour.currency || "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const price = tour.price_per_person || tour.price || 0;
  const discountPrice = tour.discount_percentage
    ? price * (1 - tour.discount_percentage / 100)
    : price;

  return (
    <Link href={`/tours/${tour.id}`} className="block">
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
        whileHover={{ y: -2 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative h-32 w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={tour.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
          )}
          {tour.is_featured && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              <span>Nổi bật</span>
            </div>
          )}
          {tour.rating && (
            <div className="absolute top-2 right-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-bold">{tour.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h4 className="font-bold text-sm mb-1 text-gray-900 dark:text-white line-clamp-1">
            {tour.title}
          </h4>
          {tour.starting_location && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{tour.starting_location}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {tour.duration_days && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{tour.duration_days} ngày</span>
                </div>
              )}
            </div>
            <div className="text-right">
              {tour.discount_percentage && tour.discount_percentage > 0 ? (
                <div>
                  <div className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    {formatPrice(discountPrice)}
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    {formatPrice(price)}
                  </div>
                </div>
              ) : (
                <div className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(price)}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

// Component để render message text với formatting đẹp - đơn giản hóa để tránh lỗi
const MessageTextRenderer = ({ text }: { text: string }) => {
  // Đơn giản hóa: chỉ format HTML và render
  if (!text) return null;

  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\n/g, "<br />");

  return (
    <div
      className="text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
};

// Hàm tìm câu trả lời thông minh với dữ liệu từ API và Gemini
const findAnswer = async (
  question: string,
  conversationHistory: Message[] = []
): Promise<{
  text: string;
  data?: any;
  tours?: any[];
  actionButtons?: Array<{
    label: string;
    action: () => void;
    iconType?: "arrow" | "external";
  }>;
}> => {
  const lowerQuestion = question.toLowerCase().trim();

  // Kiểm tra chào hỏi - vẫn dùng Gemini nhưng với context đặc biệt
  const isGreeting =
    lowerQuestion.includes("chào") ||
    lowerQuestion.includes("hello") ||
    lowerQuestion.includes("hi") ||
    lowerQuestion.includes("xin chào");

  if (isGreeting) {
    // Vẫn gọi Gemini nhưng với prompt đặc biệt cho chào hỏi
    try {
      const greetingContext = `Đây là câu chào hỏi. Hãy chào lại người dùng một cách thân thiện, giới thiệu bạn là trợ lý AI của VieGo, và hỏi xem bạn có thể giúp gì. Sử dụng tiếng Việt và có thể dùng emoji.`;
      const aiAnswer = await callGeminiAPI(question, greetingContext);
      return { text: aiAnswer };
    } catch (error) {
      // Fallback về greeting có sẵn nếu Gemini lỗi
      const greetings = knowledgeBase.greeting as string[];
      return {
        text: greetings[Math.floor(Math.random() * greetings.length)],
      };
    }
  }

  let webData: any = null;
  let contextData = "";

  // Thu thập dữ liệu từ web - LUÔN fetch để có đầy đủ context
  // Fetch tours (luôn fetch để có dữ liệu đầy đủ)
  try {
    const toursResponse = await api.get("/tours", { per_page: 20 });
    if (toursResponse.success && toursResponse.data?.tours) {
      const tours = toursResponse.data.tours;
      if (!webData) webData = {};
      webData.tours = tours;
      const totalTours = toursResponse.data.pagination?.total || tours.length;
      contextData += `=== DỮ LIỆU TOURS TỪ WEBSITE VIEGo ===\n`;
      contextData += `TỔNG SỐ TOUR: ${totalTours} (số chính xác từ database)\n\n`;
      contextData += `DANH SÁCH TOURS (${Math.min(
        20,
        tours.length
      )} tour đầu tiên):\n`;
      tours.slice(0, 20).forEach((tour: any, idx: number) => {
        contextData += `\n[TOUR ${idx + 1}]\n`;
        contextData += `- Tên tour: "${tour.title}" (chính xác)\n`;
        contextData += `- ID: ${tour.id || "N/A"}\n`;
        contextData += `- Giá: ${
          tour.price_per_person
            ? tour.price_per_person.toLocaleString("vi-VN") + " VNĐ"
            : "Chưa có giá"
        }\n`;
        contextData += `- Đánh giá: ${
          tour.rating ? tour.rating + " / 5" : "Chưa có đánh giá"
        }\n`;
        if (tour.starting_location) {
          contextData += `- Điểm xuất phát: ${tour.starting_location}\n`;
        }
        if (tour.destination) {
          contextData += `- Điểm đến: ${tour.destination}\n`;
        }
        if (tour.category) {
          contextData += `- Danh mục: ${tour.category}\n`;
        }
        if (tour.duration_days) {
          contextData += `- Thời gian: ${tour.duration_days} ngày\n`;
        }
        if (tour.description) {
          contextData += `- Mô tả: ${tour.description.substring(0, 150)}${
            tour.description.length > 150 ? "..." : ""
          }\n`;
        }
      });
      contextData += `\n=== HẾT DỮ LIỆU TOURS ===\n\n`;
    }
  } catch (error) {
    console.error("Error fetching tours:", error);
  }

  // Fetch posts
  try {
    const postsResponse = await api.get("/posts", { per_page: 20 });
    if (postsResponse.success && postsResponse.data?.data) {
      const posts = postsResponse.data.data;
      if (!webData) webData = {};
      webData.posts = posts;
      const totalPosts = postsResponse.data.pagination?.total || posts.length;
      contextData += `=== DỮ LIỆU BÀI VIẾT TỪ WEBSITE VIEGo ===\n`;
      contextData += `TỔNG SỐ BÀI VIẾT: ${totalPosts} (số chính xác từ database)\n\n`;
      contextData += `DANH SÁCH BÀI VIẾT (${Math.min(
        20,
        posts.length
      )} bài đầu tiên):\n`;
      posts.slice(0, 20).forEach((post: any, idx: number) => {
        contextData += `\n[BÀI VIẾT ${idx + 1}]\n`;
        contextData += `- Tiêu đề: "${
          post.title || "Không có tiêu đề"
        }" (chính xác)\n`;
        contextData += `- ID: ${post.id || "N/A"}\n`;
        if (post.author) {
          contextData += `- Tác giả: ${
            post.author.full_name || post.author.username
          } (username: @${post.author.username || "N/A"})\n`;
        }
        if (post.category) {
          contextData += `- Danh mục: ${post.category}\n`;
        }
        if (post.created_at) {
          contextData += `- Ngày đăng: ${new Date(
            post.created_at
          ).toLocaleDateString("vi-VN")}\n`;
        }
      });
      contextData += `\n=== HẾT DỮ LIỆU BÀI VIẾT ===\n\n`;
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
  }

  // Fetch users (KHÔNG bao gồm thông tin riêng tư)
  try {
    const usersResponse = await api.get("/users", { per_page: 20 });
    if (usersResponse.success && usersResponse.data?.data) {
      const users = usersResponse.data.data;
      if (!webData) webData = {};
      webData.users = users;
      const totalUsers = usersResponse.data.pagination?.total || users.length;
      contextData += `=== DỮ LIỆU NGƯỜI DÙNG TỪ WEBSITE VIEGo ===\n`;
      contextData += `TỔNG SỐ NGƯỜI DÙNG: ${totalUsers} (số chính xác từ database)\n\n`;
      contextData += `DANH SÁCH NGƯỜI DÙNG (${Math.min(
        20,
        users.length
      )} người đầu tiên - KHÔNG BAO GỒM THÔNG TIN RIÊNG TƯ):\n`;
      users.slice(0, 20).forEach((user: any, idx: number) => {
        contextData += `\n[NGƯỜI DÙNG ${idx + 1}]\n`;
        contextData += `- Tên: ${
          user.full_name || "Chưa có tên"
        } (chính xác)\n`;
        contextData += `- Username: @${user.username || "N/A"}\n`;
        contextData += `- ID: ${user.id || "N/A"}\n`;
        // KHÔNG bao gồm email, phone, password - chỉ thông tin công khai
      });
      contextData += `\n=== HẾT DỮ LIỆU NGƯỜI DÙNG ===\n\n`;
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }

  // Fetch categories
  try {
    const categoriesResponse = await api.get("/tours/categories");
    if (categoriesResponse.success && categoriesResponse.data?.categories) {
      const categories = categoriesResponse.data.categories;
      if (!webData) webData = {};
      webData.categories = categories;
      contextData += `=== DANH MỤC TOURS ===\n`;
      contextData += `Danh sách danh mục: ${categories.join(", ")}\n`;
      contextData += `=== HẾT DANH MỤC ===\n\n`;
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  // Fetch destinations/ranking
  try {
    const destinationsResponse = await api.get("/tours/destinations/ranking");
    if (
      destinationsResponse.success &&
      destinationsResponse.data?.destinations
    ) {
      const destinations = destinationsResponse.data.destinations;
      if (!webData) webData = {};
      webData.destinations = destinations;
      contextData += `=== ĐIỂM ĐẾN PHỔ BIẾN ===\n`;
      destinations.slice(0, 10).forEach((dest: any, idx: number) => {
        contextData += `${idx + 1}. ${
          dest.name || dest.destination || "N/A"
        } - ${dest.tour_count || 0} tour\n`;
      });
      contextData += `=== HẾT ĐIỂM ĐẾN ===\n\n`;
    }
  } catch (error) {
    console.error("Error fetching destinations:", error);
  }

  // Hàm lọc tours dựa trên câu hỏi
  const filterToursByQuestion = (tours: any[], question: string): any[] => {
    if (!tours || tours.length === 0) return [];

    const lowerQ = question.toLowerCase();

    // Tour đắt nhất
    if (
      lowerQ.includes("đắt nhất") ||
      lowerQ.includes("đắt nhấ") ||
      lowerQ.includes("giá cao nhất") ||
      lowerQ.includes("tour đắt") ||
      lowerQ.includes("xem tour đắt")
    ) {
      const sorted = [...tours].sort((a, b) => {
        const priceA =
          (a.price_per_person || 0) * (1 - (a.discount_percentage || 0) / 100);
        const priceB =
          (b.price_per_person || 0) * (1 - (b.discount_percentage || 0) / 100);
        return priceB - priceA;
      });
      const result = sorted.length > 0 ? [sorted[0]] : [];
      return result;
    }

    // Tour rẻ nhất
    if (
      lowerQ.includes("rẻ nhất") ||
      lowerQ.includes("giá thấp nhất") ||
      lowerQ.includes("rẻ nhấ")
    ) {
      const sorted = [...tours].sort((a, b) => {
        const priceA =
          (a.price_per_person || 0) * (1 - (a.discount_percentage || 0) / 100);
        const priceB =
          (b.price_per_person || 0) * (1 - (b.discount_percentage || 0) / 100);
        return priceA - priceB;
      });
      return [sorted[0]].filter(Boolean);
    }

    // Tour phổ biến / nổi bật / tốt nhất
    if (
      lowerQ.includes("phổ biến") ||
      lowerQ.includes("nổi bật") ||
      lowerQ.includes("tốt nhất") ||
      lowerQ.includes("đánh giá cao") ||
      lowerQ.includes("rating cao")
    ) {
      const sorted = [...tours].sort((a, b) => {
        // Ưu tiên rating, sau đó bookings_count
        const scoreA =
          (a.rating || 0) * 10 +
          (a.bookings_count || 0) +
          (a.is_featured ? 100 : 0);
        const scoreB =
          (b.rating || 0) * 10 +
          (b.bookings_count || 0) +
          (b.is_featured ? 100 : 0);
        return scoreB - scoreA;
      });
      return sorted.slice(0, 3); // Top 3
    }

    // Tour theo địa điểm
    const locationKeywords = [
      "hà nội",
      "hanoi",
      "sài gòn",
      "ho chi minh",
      "đà nẵng",
      "da nang",
      "hội an",
      "hoi an",
      "huế",
      "hue",
      "nha trang",
      "phú quốc",
      "phu quoc",
    ];
    for (const keyword of locationKeywords) {
      if (lowerQ.includes(keyword)) {
        const filtered = tours.filter((tour) => {
          const location = (tour.starting_location || "").toLowerCase();
          const destination = (tour.destination || "").toLowerCase();
          const title = (tour.title || "").toLowerCase();
          return (
            location.includes(keyword) ||
            destination.includes(keyword) ||
            title.includes(keyword)
          );
        });
        if (filtered.length > 0) return filtered.slice(0, 3);
      }
    }

    // Tour theo category
    const categoryMap: Record<string, string[]> = {
      "văn hóa": ["cultural"],
      "văn hoá": ["cultural"],
      "văn hoa": ["cultural"],
      "ăn uống": ["food"],
      "ẩm thực": ["food"],
      "am thuc": ["food"],
      "món ăn": ["food"],
      "phiêu lưu": ["adventure"],
      adventure: ["adventure"],
      "thiên nhiên": ["nature"],
      nature: ["nature"],
      "đô thị": ["urban"],
      urban: ["urban"],
      "tâm linh": ["spiritual"],
      spiritual: ["spiritual"],
    };

    for (const [keyword, categories] of Object.entries(categoryMap)) {
      if (lowerQ.includes(keyword)) {
        const filtered = tours.filter((tour) =>
          categories.includes(tour.category?.toLowerCase())
        );
        if (filtered.length > 0) return filtered.slice(0, 3);
      }
    }

    // Nếu câu hỏi có tên tour cụ thể
    const tourTitles = tours.map((t) => t.title?.toLowerCase() || "");
    for (let i = 0; i < tours.length; i++) {
      const title = tourTitles[i];
      if (
        title &&
        lowerQ.includes(title.substring(0, Math.min(10, title.length)))
      ) {
        return [tours[i]];
      }
    }

    // Mặc định: không hiển thị tour cards nếu không match
    return [];
  };

  // Xác định xem có cần hiển thị tour cards không (dựa trên câu hỏi)
  // Luôn hiển thị nếu câu hỏi liên quan đến tour cụ thể (đắt nhất, rẻ nhất, phổ biến, etc.)
  const shouldShowTourCards =
    lowerQuestion.includes("tour") ||
    lowerQuestion.includes("du lịch") ||
    lowerQuestion.includes("tour nào") ||
    lowerQuestion.includes("tour phổ biến") ||
    lowerQuestion.includes("giới thiệu tour") ||
    lowerQuestion.includes("xem tour") ||
    lowerQuestion.includes("đắt nhất") ||
    lowerQuestion.includes("rẻ nhất") ||
    lowerQuestion.includes("tốt nhất") ||
    lowerQuestion.includes("giá cao") ||
    lowerQuestion.includes("giá thấp") ||
    lowerQuestion.includes("nổi bật");

  // Thêm thông tin từ knowledge base vào context (chỉ để tham khảo, không dùng để trả lời trực tiếp)
  const matchedKeys: Array<{ key: string; value: string }> = [];
  for (const [key, value] of Object.entries(knowledgeBase)) {
    if (key !== "greeting" && key !== "default") {
      if (lowerQuestion.includes(key)) {
        matchedKeys.push({
          key,
          value: typeof value === "string" ? value : value[0],
        });
      }
    }
  }

  // Thêm thông tin hướng dẫn vào context để AI tham khảo
  if (matchedKeys.length > 0) {
    matchedKeys.sort((a, b) => b.key.length - a.key.length);
    contextData += `\n\n=== HƯỚNG DẪN VỀ TÍNH NĂNG VIEGo ===\n${matchedKeys[0].value}\n=== HẾT HƯỚNG DẪN ===`;
  }

  // Thêm thông tin chung về VieGo vào context
  contextData += `\n\n=== THÔNG TIN CHUNG VỀ VIEGo ===\n- VieGo là nền tảng blog du lịch và ẩm thực Việt Nam\n- Người dùng có thể tạo bài viết, đặt tour, kết bạn, chat\n- Có hệ thống booking tour, theo dõi hành trình real-time\n- Có tính năng social: follow, friend request, notifications\n=== HẾT THÔNG TIN CHUNG ===`;

  // Chuẩn bị context đầy đủ với hướng dẫn rõ ràng và CHÍNH XÁC
  let fullContext = "";
  if (contextData.trim()) {
    fullContext = `=== DỮ LIỆU THỰC TẾ TỪ WEBSITE VIEGo ===\n${contextData}\n=== HẾT DỮ LIỆU ===\n\n=== QUY TẮC TRẢ LỜI (BẮT BUỘC TUÂN THỦ) ===\n1. Nếu câu hỏi liên quan đến dữ liệu ở trên, BẮT BUỘC phải sử dụng CHÍNH XÁC dữ liệu đó để trả lời\n2. KHÔNG được bịa đặt số liệu, tên tour, tên bài viết, tên người dùng\n3. Nếu có dữ liệu cụ thể (ví dụ: "Có 5 tour"), phải dùng đúng số đó\n4. Nếu câu hỏi về tính năng, sử dụng hướng dẫn ở trên\n5. Nếu không có dữ liệu cụ thể, chỉ trả lời dựa trên kiến thức chung về du lịch/ẩm thực Việt Nam\n6. Luôn sử dụng tiếng Việt\n7. Trả lời ngắn gọn, rõ ràng, dễ hiểu\n=== HẾT QUY TẮC ===`;
  }

  // LUÔN ƯU TIÊN SỬ DỤNG GEMINI AI để trả lời
  try {
    const aiAnswer = await callGeminiAPI(question, fullContext || undefined);
    const actionButtons = generateActionButtons(question, aiAnswer, webData);
    // Lọc tours dựa trên câu hỏi - chỉ hiển thị tours phù hợp
    let toursToShow: any[] | undefined = undefined;
    if (shouldShowTourCards && webData?.tours && webData.tours.length > 0) {
      toursToShow = filterToursByQuestion(webData.tours, question);
      // Nếu không có tour nào match nhưng câu hỏi về tour, vẫn hiển thị top 3
      if (toursToShow.length === 0 && lowerQuestion.includes("tour")) {
        toursToShow = webData.tours.slice(0, 3);
      }
    }
    return { text: aiAnswer, data: webData, actionButtons, tours: toursToShow };
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    // CHỈ fallback về knowledge base nếu Gemini API lỗi
    if (matchedKeys.length > 0) {
      const fallbackText = `${matchedKeys[0].value}\n\n⚠️ Lưu ý: Đang sử dụng câu trả lời mặc định do lỗi kết nối AI.`;
      const actionButtons = generateActionButtons(
        question,
        fallbackText,
        webData
      );
      let toursToShow: any[] | undefined = undefined;
      if (shouldShowTourCards && webData?.tours && webData.tours.length > 0) {
        toursToShow = filterToursByQuestion(webData.tours, question);
        if (toursToShow.length === 0 && lowerQuestion.includes("tour")) {
          toursToShow = webData.tours.slice(0, 3);
        }
      }
      return {
        text: fallbackText,
        data: webData,
        actionButtons,
        tours: toursToShow,
      };
    }

    // Fallback về câu trả lời mặc định
    const defaultText = `${
      knowledgeBase.default as string
    }\n\n⚠️ Lưu ý: Đang sử dụng câu trả lời mặc định do lỗi kết nối AI.\n\n💡 Bạn có thể hỏi tôi:\n- "Có bao nhiêu tour?"\n- "Tour nào phổ biến?"\n- "Có bao nhiêu bài viết?"\n- "Có bao nhiêu người dùng?"\n- Hoặc bất kỳ câu hỏi nào về VieGo!`;
    const actionButtons = generateActionButtons(question, defaultText, webData);
    const toursToShow =
      shouldShowTourCards && webData?.tours
        ? filterToursByQuestion(webData.tours, question)
        : undefined;
    return {
      text: defaultText,
      data: webData,
      actionButtons,
      tours: toursToShow,
    };
  }
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Load messages from localStorage
  const loadMessages = (): Message[] => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("chatbot_messages");
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        }
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    }
    return [
      {
        id: "1",
        text: "Xin chào! 🤖 Tôi là trợ lý ảo của VieGo. Tôi có thể giúp bạn hướng dẫn về các tính năng trên website và trả lời các câu hỏi về dữ liệu trên web. Bạn cần hỗ trợ gì?",
        sender: "bot",
        timestamp: new Date(),
      },
    ];
  };

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages(loadMessages());
  }, []);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && messages.length > 0) {
        localStorage.setItem("chatbot_messages", JSON.stringify(messages));
      }
    } catch (e) {
      console.error("Error saving chat history:", e);
    }
  }, [messages]);

  // Auto scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot thinking and fetch data with AI
    setTimeout(async () => {
      try {
        // Lấy lịch sử hội thoại gần đây (5 tin nhắn cuối) để tạo context
        const recentMessages = messages.slice(-5);
        const result = await findAnswer(userMessage.text, recentMessages);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.text,
          sender: "bot",
          timestamp: new Date(),
          data: result.data,
          tours: result.tours,
          actionButtons: result.actionButtons?.map((btn) => ({
            ...btn,
            action: () => {
              btn.action();
              // Đóng chatbot sau khi chuyển trang
              setTimeout(() => setIsOpen(false), 300);
            },
          })),
        };
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Error getting answer:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau!",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }, 1000); // Delay để tạo cảm giác bot đang suy nghĩ (tăng lên vì AI cần thời gian)
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "Có bao nhiêu tour?",
    "Tour nào phổ biến?",
    "Cách đặt tour?",
    "Cách tạo bài viết?",
  ];

  return (
    <>
      {/* Chatbot Button - Fixed bottom right */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {/* Robot Animation Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Robot Head */}
              <div className="relative w-10 h-7 bg-gray-800 dark:bg-gray-700 rounded-lg border-2 border-primary-400 flex items-center justify-center">
                {/* Antenna */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-primary-400 rounded-t-full">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary-400 rounded-full animate-pulse"></div>
                </div>
                {/* Eyes */}
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              {/* Robot Body */}
              <div className="absolute top-7 w-8 h-6 bg-gray-800 dark:bg-gray-700 rounded-b-lg border-2 border-primary-400 border-t-0">
                <div className="w-3 h-3 bg-primary-400 rounded-full mx-auto mt-1 animate-pulse"></div>
              </div>
            </div>
            {/* Pulse effect */}
            <div className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-20"></div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
              isMinimized ? "w-80 h-16" : "w-96 h-[600px] max-h-[80vh]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                {/* Robot Avatar */}
                <RobotAnimation size="small" />
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    Trợ lý VieGo
                  </h3>
                  <p className="text-white/80 text-xs">Luôn sẵn sàng hỗ trợ</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isMinimized && messages.length > 1 && (
                  <button
                    onClick={() => {
                      if (
                        confirm("Bạn có chắc muốn xóa toàn bộ lịch sử chat?")
                      ) {
                        const welcomeMsg: Message = {
                          id: "1",
                          text: "Xin chào! 🤖 Tôi là trợ lý ảo của VieGo. Tôi có thể giúp bạn hướng dẫn về các tính năng trên website và trả lời các câu hỏi về dữ liệu trên web. Bạn cần hỗ trợ gì?",
                          sender: "bot",
                          timestamp: new Date(),
                        };
                        setMessages([welcomeMsg]);
                        localStorage.removeItem("chatbot_messages");
                      }
                    }}
                    className="p-1.5 text-white/80 hover:bg-white/20 rounded-lg transition-colors"
                    title="Xóa lịch sử chat"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsMinimized(false);
                  }}
                  className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Clear History Button - Only show when minimized */}
            {isMinimized && (
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={() => {
                    const welcomeMsg: Message = {
                      id: "1",
                      text: "Xin chào! 🤖 Tôi là trợ lý ảo của VieGo. Tôi có thể giúp bạn hướng dẫn về các tính năng trên website và trả lời các câu hỏi về dữ liệu trên web. Bạn cần hỗ trợ gì?",
                      sender: "bot",
                      timestamp: new Date(),
                    };
                    setMessages([welcomeMsg]);
                    localStorage.removeItem("chatbot_messages");
                  }}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Xóa lịch sử chat"
                >
                  Xóa lịch sử
                </button>
              </div>
            )}

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.sender === "user"
                            ? "bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 text-white rounded-br-sm"
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        {message.sender === "bot" && (
                          <div className="flex items-center space-x-2 mb-2">
                            <RobotAnimation size="small" />
                            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                              Trợ lý VieGo
                            </span>
                          </div>
                        )}
                        <div className="text-sm leading-relaxed">
                          <MessageTextRenderer text={message.text} />
                        </div>

                        {/* Tour Cards - Hiển thị ngay trong message bubble */}
                        {message.sender === "bot" &&
                          message.tours &&
                          message.tours.length > 0 && (
                            <div className="mt-4">
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                📍 Tours được đề xuất:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                                {message.tours.map((tour) => (
                                  <ChatTourCard key={tour.id} tour={tour} />
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Action Buttons */}
                        {message.sender === "bot" &&
                          message.actionButtons &&
                          message.actionButtons.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-2">
                              {message.actionButtons.map((btn, idx) => (
                                <motion.button
                                  key={idx}
                                  onClick={btn.action}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-500 dark:bg-primary-400 text-white text-xs rounded-lg hover:bg-primary-600 dark:hover:bg-primary-500 transition-colors shadow-sm"
                                >
                                  <span>{btn.label}</span>
                                  {btn.iconType === "arrow" ? (
                                    <ArrowRight className="w-4 h-4" />
                                  ) : btn.iconType === "external" ? (
                                    <ExternalLink className="w-4 h-4" />
                                  ) : null}
                                </motion.button>
                              ))}
                            </div>
                          )}

                        <span className="text-xs opacity-70 mt-2 block">
                          {message.timestamp.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-sm border border-gray-200 dark:border-gray-600 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <RobotAnimation size="small" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
                {messages.length === 1 && (
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Câu hỏi nhanh:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quickQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputValue(q);
                            setTimeout(() => handleSend(), 100);
                          }}
                          className="text-xs px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập câu hỏi của bạn..."
                      disabled={isTyping}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 text-sm disabled:opacity-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isTyping}
                      className="p-2 bg-primary-500 dark:bg-primary-400 text-white rounded-full hover:bg-primary-600 dark:hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Gửi"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  );
}
