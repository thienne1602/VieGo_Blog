"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Navigation,
  Camera,
  Loader2,
  Calendar,
  Info,
  X,
  User,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
  Search,
  Phone,
  Mail,
  RefreshCcw,
  Users,
  UserRound,
  Baby,
  Locate,
  Radio,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Toast from "@/components/common/Toast";
import { useAuth } from "@/lib/AuthContext";
import { useTourLocationTracking } from "@/hooks/useTourLocationTracking";
import MemberLocationMap from "@/components/tour/MemberLocationMap";

interface TourProgress {
  id: number;
  checkpoint_order: number;
  checkpoint_name: string;
  checkpoint_description: string;
  status: string;
  arrival_time: string | null;
  departure_time: string | null;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  location_name: string | null;
  scheduled_time: string | null;
}

interface DayTimelineGroup {
  dayNumber: number;
  title: string;
  description: string;
  activities: string[];
  accommodation?: string;
  meals?: string;
  date?: Date | null;
  checkpoints: TourProgress[];
  isFallback?: boolean;
}

interface TourJourneyPageClientProps {
  initialBookingId: string;
}

type ParticipantType = "adult" | "child" | "infant";

interface BookingPassenger {
  id: number;
  full_name: string;
  gender?: string | null;
  date_of_birth?: string | null;
  id_number?: string | null;
  passport_number?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  participant_type?: ParticipantType | string | null;
  special_requirements?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
}

export default function TourJourneyPageClient({
  initialBookingId,
}: TourJourneyPageClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation("tourJourney");
  const bookingId = initialBookingId;

  const [booking, setBooking] = useState<any>(null);
  const [progress, setProgress] = useState<TourProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [toast, setToast] = useState<any | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isGuide, setIsGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [expandedCheckpoints, setExpandedCheckpoints] = useState<number[]>([]);
  const [showAddCheckpointModal, setShowAddCheckpointModal] = useState(false);
  const [selectedDayForNewCheckpoint, setSelectedDayForNewCheckpoint] =
    useState<number | null>(null);
  const [newCheckpointForm, setNewCheckpointForm] = useState({
    name: "",
    description: "",
    location: "",
    note: "",
    scheduledTime: "",
  });
  const [creatingCheckpoint, setCreatingCheckpoint] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [passengers, setPassengers] = useState<BookingPassenger[]>([]);
  const [passengersLoading, setPassengersLoading] = useState(false);
  const [passengerSearch, setPassengerSearch] = useState("");
  const [passengerFilter, setPassengerFilter] = useState<
    "all" | ParticipantType
  >("all");
  const [passengerError, setPassengerError] = useState<string | null>(null);
  const [sendingPassengerCredentials, setSendingPassengerCredentials] =
    useState(false);

  const [journeyNoticeCategory, setJourneyNoticeCategory] = useState<
    "start" | "rest" | "gather" | "other"
  >("start");
  const [journeyNoticeMessage, setJourneyNoticeMessage] = useState("");
  const [journeyNoticeSending, setJourneyNoticeSending] = useState(false);

  // Location tracking state
  const [showLocationTracking, setShowLocationTracking] = useState(false);

  // Location tracking hook
  const locationTracking = useTourLocationTracking({
    bookingId: parseInt(bookingId),
    autoConnect: showLocationTracking,
    enableTracking: showLocationTracking,
  });

  // Convert old itinerary format {day1: {...}, day2: {...}} to new array format
  const convertItineraryFormat = (itinerary: any): any[] => {
    if (!itinerary) return [];

    // Already new format (array)
    if (Array.isArray(itinerary)) {
      return itinerary;
    }

    // Old format (object with day1, day2, etc.)
    if (typeof itinerary === "object") {
      const days: any[] = [];

      // Extract all day keys (day1, day2, day3, etc.)
      Object.keys(itinerary)
        .filter((key) => key.startsWith("day"))
        .sort((a, b) => {
          const numA = parseInt(a.replace("day", ""));
          const numB = parseInt(b.replace("day", ""));
          return numA - numB;
        })
        .forEach((dayKey, index) => {
          const dayData = itinerary[dayKey];
          const dayNumber = index + 1;

          // Convert old format to new format
          const activities: string[] = [];
          if (dayData.morning) activities.push(`Sáng: ${dayData.morning}`);
          if (dayData.afternoon) activities.push(`Chiều: ${dayData.afternoon}`);
          if (dayData.evening) activities.push(`Tối: ${dayData.evening}`);

          days.push({
            day: dayNumber,
            title: dayData.title || `Ngày ${dayNumber}`,
            description: dayData.description || "",
            activities: activities,
            accommodation: dayData.accommodation || "",
            meals: dayData.meals || "",
          });
        });

      return days;
    }

    return [];
  };

  const normalizeText = (value?: string | null) => {
    if (!value) return "";
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const itineraryDays = useMemo(
    () => convertItineraryFormat(booking?.tour?.itinerary),
    [booking?.tour?.itinerary]
  );

  const dayGroups = useMemo<DayTimelineGroup[]>(() => {
    const groups: DayTimelineGroup[] =
      itineraryDays && itineraryDays.length > 0
        ? itineraryDays.map((day: any, index: number) => {
            const baseDate = booking?.date ? new Date(booking.date) : null;
            const dateForDay =
              baseDate !== null
                ? new Date(baseDate.getTime() + index * 24 * 60 * 60 * 1000)
                : null;

            return {
              dayNumber: day.day || index + 1,
              title: day.title || `Ngày ${index + 1}`,
              description: day.description || "",
              activities: day.activities || [],
              accommodation: day.accommodation,
              meals: day.meals,
              date: dateForDay,
              checkpoints: [],
              isFallback: false,
            };
          })
        : [
            {
              dayNumber: 1,
              title: "Hành trình",
              description: "Danh sách điểm dừng sẽ hiển thị tại đây",
              activities: [],
              checkpoints: [],
              date: booking?.date ? new Date(booking.date) : null,
              isFallback: true,
            },
          ];

    const fallbackGroup: DayTimelineGroup = {
      dayNumber: 0,
      title: "Điểm chưa gán ngày",
      description: "Các điểm dừng bổ sung chưa có ngày cụ thể",
      activities: [],
      checkpoints: [],
      isFallback: true,
      date: null,
    };

    const approxGroupSize = Math.max(
      1,
      Math.ceil(progress.length / (groups.length || 1))
    );

    progress.forEach((checkpoint) => {
      let targetIndex = -1;

      if (groups.length > 0) {
        const noteText = normalizeText(checkpoint.notes);
        const nameText = normalizeText(checkpoint.checkpoint_name);

        targetIndex = groups.findIndex((group) => {
          const title = normalizeText(group.title);
          return (
            title && (noteText.includes(title) || nameText.includes(title))
          );
        });

        if (targetIndex === -1) {
          const noteDayMatch = noteText.match(/ngay\s+(\d+)/);
          const nameDayMatch = nameText.match(/ngay\s+(\d+)/);
          const matched =
            noteDayMatch || nameDayMatch
              ? parseInt((noteDayMatch || nameDayMatch)?.[1] || "0", 10)
              : NaN;
          if (!Number.isNaN(matched) && matched > 0) {
            targetIndex = Math.min(matched - 1, groups.length - 1);
          }
        }

        if (targetIndex === -1) {
          targetIndex = Math.min(
            Math.floor((checkpoint.checkpoint_order - 1) / approxGroupSize),
            groups.length - 1
          );
        }
      }

      if (targetIndex >= 0 && groups[targetIndex]) {
        groups[targetIndex].checkpoints.push(checkpoint);
      } else {
        fallbackGroup.checkpoints.push(checkpoint);
      }
    });

    if (fallbackGroup.checkpoints.length > 0) {
      return [...groups, fallbackGroup];
    }

    return groups;
  }, [booking?.date, itineraryDays, progress]);

  // Auto-expand first day by default
  useEffect(() => {
    if (dayGroups.length > 0 && expandedDays.size === 0) {
      setExpandedDays(new Set([dayGroups[0].dayNumber]));
    }
  }, [dayGroups.length, expandedDays.size]);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("[TourJourney] Component mounted, bookingId:", bookingId);
    console.log("[TourJourney] User:", user);
    console.log("[TourJourney] User role:", user?.role);

    // Set isGuide based on user role from AuthContext
    if (user) {
      setIsGuide(user.role === "tour_guide");
      console.log("[TourJourney] isGuide set to:", user.role === "tour_guide");
    }

    if (mounted && bookingId && bookingId !== "page") {
      loadBookingAndProgress();
    } else if (mounted && (!bookingId || bookingId === "page")) {
      setError("Không tìm thấy ID booking");
      setLoading(false);
    }
  }, [bookingId, mounted, user]);

  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const loadPassengers = useCallback(async () => {
    if (!bookingId || bookingId === "page" || !isGuide) {
      return;
    }

    setPassengersLoading(true);
    setPassengerError(null);
    try {
      const res = await api.request(
        `/booking-participants/booking/${bookingId}`,
        {
          method: "GET",
          cache: false,
          params: { _t: Date.now() },
        }
      );

      if (res.success) {
        const participantData =
          res.data?.participants || res.data?.data?.participants || [];
        setPassengers(Array.isArray(participantData) ? participantData : []);
      } else {
        throw new Error(res.error || "Không thể tải danh sách hành khách");
      }
    } catch (err: any) {
      const message =
        err?.message || err?.error || "Không thể tải danh sách hành khách";
      setPassengerError(message);
      setToast({ message, type: "error" });
    }
    setPassengersLoading(false);
  }, [bookingId, isGuide]);

  const sendJourneyNotification = useCallback(async () => {
    if (!isGuide) return;
    if (!bookingId || bookingId === "page") return;

    const message = (journeyNoticeMessage || "").trim();
    if (!message) {
      setToast({
        message: "Vui lòng nhập nội dung thông báo",
        type: "warning",
      });
      return;
    }

    setJourneyNoticeSending(true);
    const result = await api.post(`/notifications/tour-journey/${bookingId}`, {
      category: journeyNoticeCategory,
      message,
    });

    if (result.success) {
      setToast({ message: "Đã gửi thông báo", type: "success" });
      setJourneyNoticeMessage("");
    } else {
      setToast({
        message: result.error || "Không thể gửi thông báo",
        type: "error",
      });
    }

    setJourneyNoticeSending(false);
  }, [bookingId, isGuide, journeyNoticeCategory, journeyNoticeMessage]);

  const exportPassengers = useCallback(async () => {
    if (!bookingId || bookingId === "page") {
      return;
    }

    setToast({
      message: "Đang chuẩn bị file hành khách...",
      type: "info",
    });

    const result = await api.download(
      `/booking-participants/booking/${bookingId}/export?format=excel`
    );

    if (result.success) {
      setToast({
        message: "Đã tải danh sách hành khách",
        type: "success",
      });
    } else {
      setToast({
        message: result.error || "Không thể xuất danh sách",
        type: "error",
      });
    }
  }, [bookingId, setToast]);

  const sendPassengerCredentials = useCallback(async () => {
    if (!bookingId || bookingId === "page") {
      return;
    }

    setSendingPassengerCredentials(true);
    setToast({
      message: "Đang gửi email tài khoản cho hành khách...",
      type: "info",
    });

    const result = await api.post(
      `/booking-participants/booking/${bookingId}/send-credentials`,
      {
        reset_existing: true,
      }
    );

    if (result.success) {
      const sentCount = result.data?.sent ?? 0;
      setToast({
        message: `Đã gửi email cho ${sentCount} hành khách`,
        type: "success",
      });
    } else {
      setToast({
        message: result.error || "Không thể gửi email tài khoản",
        type: "error",
      });
    }

    setSendingPassengerCredentials(false);
  }, [bookingId, setToast]);

  // Initialize Leaflet map when showMap is true
  useEffect(() => {
    if (showMap && progress.length > 0 && typeof window !== "undefined") {
      const initMap = async () => {
        try {
          const L = await import("leaflet");

          const mapElement = document.getElementById("tour-journey-map");
          if (!mapElement) return;

          // Clear existing map if any
          if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
          }

          // Clear existing markers
          markersRef.current.forEach((marker) => marker.remove());
          markersRef.current = [];

          const firstCheckpointWithCoords = progress.find(
            (cp) => cp.latitude && cp.longitude
          );

          const center: [number, number] = mapCenter
            ? [mapCenter.lat, mapCenter.lng]
            : firstCheckpointWithCoords
            ? [
                firstCheckpointWithCoords.latitude!,
                firstCheckpointWithCoords.longitude!,
              ]
            : [10.762622, 106.660172];

          // Initialize map
          const map = L.default.map(mapElement, {
            center,
            zoom: 13,
            zoomControl: true,
          });

          // Add OpenStreetMap tile layer
          L.default
            .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
            })
            .addTo(map);

          mapRef.current = map;

          // Add markers for all checkpoints
          const validCheckpoints = progress.filter(
            (cp) => cp.latitude && cp.longitude
          );

          validCheckpoints.forEach((checkpoint) => {
            const markerColor =
              checkpoint.status === "completed"
                ? "#22c55e" // green
                : checkpoint.status === "in_progress"
                ? "#3b82f6" // blue
                : "#ef4444"; // red

            const marker = L.default
              .marker([checkpoint.latitude!, checkpoint.longitude!], {
                icon: L.default.divIcon({
                  className: "custom-marker",
                  html: `<div style="
                    background-color: ${markerColor};
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                }),
              })
              .addTo(map);

            const popupContent = `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">${
                  checkpoint.checkpoint_name
                }</h3>
                <p style="margin: 4px 0; color: #666; font-size: 14px;">${
                  checkpoint.checkpoint_description || ""
                }</p>
                <p style="margin: 4px 0; font-size: 12px; color: #999;">
                  Trạng thái: ${
                    checkpoint.status === "completed"
                      ? "Hoàn thành"
                      : checkpoint.status === "in_progress"
                      ? "Đang đi"
                      : "Chưa đến"
                  }
                </p>
              </div>
            `;

            marker.bindPopup(popupContent);
            markersRef.current.push(marker);
          });

          // Draw route if there are multiple checkpoints
          if (validCheckpoints.length > 1) {
            const route = validCheckpoints.map((cp) => [
              cp.latitude!,
              cp.longitude!,
            ]) as [number, number][];

            const polyline = L.default
              .polyline(route, {
                color: "#10b981",
                weight: 4,
                opacity: 0.8,
              })
              .addTo(map);

            // Fit bounds to show all markers
            const group = new L.default.FeatureGroup(markersRef.current);
            map.fitBounds(group.getBounds().pad(0.1));
          }
        } catch (error) {
          console.error("Error loading map:", error);
        }
      };

      initMap();

      // Cleanup function
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
      };
    }
  }, [showMap, progress, mapCenter]);

  const loadBookingAndProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("[TourJourney] Loading booking:", bookingId);

      // Load booking details
      const bookingRes = await api.request(`/bookings/${bookingId}`);
      console.log("[TourJourney] Booking response:", bookingRes);

      if (bookingRes.success || bookingRes.data) {
        const bookingData = bookingRes.data?.booking || bookingRes.data;
        setBooking(bookingData);
        console.log("[TourJourney] Booking loaded:", bookingData);
        console.log("[TourJourney] Tour data:", bookingData?.tour);
        console.log(
          "[TourJourney] Itinerary data:",
          bookingData?.tour?.itinerary
        );
        console.log(
          "[TourJourney] Itinerary type:",
          typeof bookingData?.tour?.itinerary
        );
        console.log(
          "[TourJourney] Is array:",
          Array.isArray(bookingData?.tour?.itinerary)
        );
      } else {
        throw new Error(bookingRes.error || "Không thể tải thông tin booking");
      }

      // Load tour progress
      console.log("[TourJourney] Loading progress for booking:", bookingId);
      const progressRes = await api.request(
        `/tour-progress?booking_id=${bookingId}`
      );
      console.log("[TourJourney] Progress response:", progressRes);

      if (progressRes.success || progressRes.data) {
        // Backend returns {checkpoints: [...], total: number}
        const progressData =
          progressRes.data?.checkpoints ||
          progressRes.data?.progress ||
          progressRes.data ||
          [];
        console.log("[TourJourney] Progress data:", progressData);

        // Sort by checkpoint_order
        if (Array.isArray(progressData)) {
          progressData.sort(
            (a: TourProgress, b: TourProgress) =>
              a.checkpoint_order - b.checkpoint_order
          );
          setProgress(progressData);
        } else {
          setProgress([]);
        }
      } else {
        console.log("[TourJourney] No progress data, setting empty array");
        setProgress([]);
      }
    } catch (err: any) {
      console.error("[TourJourney] Error loading data:", err);
      const errorMsg =
        err?.message || err?.error || "Lỗi khi tải thông tin hành trình";
      setError(errorMsg);
      setToast({ message: errorMsg, type: "error" });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!mounted || !isGuide || !bookingId || bookingId === "page") {
      return;
    }
    loadPassengers();
  }, [mounted, isGuide, bookingId, loadPassengers]);

  const initializeFromItinerary = async () => {
    setUpdateLoading(true);
    try {
      const res = await api.request(
        `/tour-progress/booking/${bookingId}/init-from-itinerary`,
        {
          method: "POST",
          body: JSON.stringify({ booking_id: parseInt(bookingId) }),
        }
      );

      if (res.success) {
        setToast({
          message: "Khởi tạo hành trình thành công!",
          type: "success",
        });
        loadBookingAndProgress();
      } else {
        setToast({ message: res.error || "Lỗi khi khởi tạo", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Lỗi khi khởi tạo hành trình", type: "error" });
    }
    setUpdateLoading(false);
  };

  const updateCheckpointStatus = async (
    checkpointId: number,
    newStatus: string
  ) => {
    setUpdateLoading(true);
    try {
      console.log(
        `[Update] Updating checkpoint ${checkpointId} to ${newStatus}`
      );

      let endpoint = "";
      let method = "POST";
      let body: any = {};

      // Use specific endpoints for check-in and complete
      if (newStatus === "in_progress") {
        endpoint = `/tour-progress/${checkpointId}/check-in`;
        body = {
          notes: `Đã check-in lúc ${new Date().toLocaleString("vi-VN")}`,
        };
      } else if (newStatus === "completed") {
        endpoint = `/tour-progress/${checkpointId}/complete`;
        body = {
          notes: `Hoàn thành lúc ${new Date().toLocaleString("vi-VN")}`,
        };
      } else {
        // Use PATCH for other status changes
        endpoint = `/tour-progress/${checkpointId}`;
        method = "PATCH";
        body = { status: newStatus };
        // Auto-set timestamps
        if (newStatus === "in_progress") {
          body.arrival_time = new Date().toISOString();
        } else if (newStatus === "completed") {
          body.departure_time = new Date().toISOString();
        }
      }

      const res = await api.request(endpoint, {
        method: method,
        body: JSON.stringify(body),
      });

      console.log("[Update] Response:", res);

      if (res.success || res.data) {
        setToast({
          message: "Cập nhật trạng thái thành công!",
          type: "success",
        });
        await loadBookingAndProgress();
      } else {
        setToast({
          message: res.error || "Lỗi khi cập nhật trạng thái",
          type: "error",
        });
      }
    } catch (err: any) {
      console.error("[Update] Error:", err);
      setToast({
        message: err.message || "Lỗi khi cập nhật trạng thái",
        type: "error",
      });
    }
    setUpdateLoading(false);
  };

  const uploadImages = async (checkpointId: number, files: FileList) => {
    if (!files || files.length === 0) {
      setToast({ message: "Vui lòng chọn ảnh", type: "warning" });
      return;
    }

    if (files.length > 10) {
      setToast({
        message: "Chỉ được upload tối đa 10 ảnh mỗi lần",
        type: "warning",
      });
      return;
    }

    setUpdateLoading(true);
    const formData = new FormData();

    // Add all files to formData
    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    try {
      console.log(
        `[Upload] Uploading ${files.length} images to checkpoint ${checkpointId}`
      );
      const res = await api.request(
        `/tour-progress/${checkpointId}/upload-images`,
        {
          method: "POST",
          body: formData,
          headers: {
            // Don't set Content-Type, let browser set it with boundary
          },
        }
      );

      console.log("[Upload] Response:", res);

      if (res.success || res.data) {
        setToast({
          message: `Upload thành công ${files.length} ảnh!`,
          type: "success",
        });
        // Reload to show new images
        await loadBookingAndProgress();
      } else {
        setToast({
          message: res.error || "Lỗi khi upload ảnh",
          type: "error",
        });
      }
    } catch (err: any) {
      console.error("[Upload] Error:", err);
      setToast({
        message: err.message || "Lỗi khi upload ảnh",
        type: "error",
      });
    }
    setUpdateLoading(false);
  };

  const downloadAllImages = async () => {
    try {
      setToast({ message: "Đang chuẩn bị tải xuống...", type: "info" });

      // Get token from api client
      const token = api.getToken();
      if (!token) {
        setToast({ message: "Vui lòng đăng nhập lại", type: "error" });
        return;
      }

      // Don't add /api here because NEXT_PUBLIC_API_URL already includes it
      const baseURL =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
      const url = `${baseURL}/tour-progress/booking/${bookingId}/download-images`;

      // Fetch with authorization
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `tour_${bookingId}_images.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        setToast({ message: "Đã tải xuống tất cả ảnh!", type: "success" });
      } else {
        const errorData = await response.json();
        setToast({
          message: errorData.error || "Lỗi khi tải ảnh",
          type: "error",
        });
      }
    } catch (err: any) {
      console.error("[Download] Error:", err);
      setToast({
        message: err.message || "Lỗi khi tải ảnh",
        type: "error",
      });
    }
  };

  const downloadSingleImage = async (imageUrl: string, fileName: string) => {
    try {
      // Get token from api client
      const token = api.getToken();
      if (!token) {
        setToast({ message: "Vui lòng đăng nhập lại", type: "error" });
        return;
      }

      // Image URL is already served by backend at /uploads/...
      // Just make it absolute if it's relative
      const fullUrl = imageUrl.startsWith("http")
        ? imageUrl
        : `http://127.0.0.1:5000${imageUrl}`;

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        setToast({ message: `Đã tải xuống ${fileName}`, type: "success" });
      } else {
        setToast({ message: "Lỗi khi tải ảnh", type: "error" });
      }
    } catch (err: any) {
      console.error("[Download] Error:", err);
      setToast({ message: "Lỗi khi tải ảnh", type: "error" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "in_progress":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      case "pending":
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "in_progress":
        return <Navigation className="w-6 h-6 text-blue-600 animate-pulse" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "in_progress":
        return "Đang đi";
      case "pending":
        return "Chưa đến";
      default:
        return status;
    }
  };

  const renderCheckpointCard = (checkpoint: TourProgress, index: number) => {
    return (
      <motion.div
        key={checkpoint.id}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative pl-20"
      >
        <div className="absolute left-4 top-0 -translate-x-1/2 bg-white dark:bg-gray-800 p-2 rounded-full border-4 border-white dark:border-gray-800 shadow-lg">
          {getStatusIcon(checkpoint.status)}
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl transition-shadow overflow-hidden">
          <div
            className="p-6 cursor-pointer"
            onClick={() => toggleCheckpoint(checkpoint.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 rounded-full text-sm font-bold">
                    Điểm {checkpoint.checkpoint_order}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      checkpoint.status
                    )}`}
                  >
                    {getStatusText(checkpoint.status)}
                  </span>
                  {checkpoint.scheduled_time && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3.5 h-3.5 text-teal-500" />
                      {new Date(checkpoint.scheduled_time).toLocaleTimeString(
                        "vi-VN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {checkpoint.checkpoint_name}
                  </h3>
                  {checkpoint.status === "in_progress" && (
                    <img
                      src="/assets/stickers/vi-tri.gif"
                      alt="Current Location"
                      className="w-8 h-8 object-contain animate-bounce"
                    />
                  )}
                </div>
                {checkpoint.location_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {checkpoint.location_name}
                    </span>
                  </div>
                )}
                {checkpoint.checkpoint_description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {checkpoint.checkpoint_description}
                  </p>
                )}
              </div>
              <div className="text-gray-400">
                {expandedCheckpoints.includes(checkpoint.id) ? (
                  <X className="w-6 h-6 rotate-45" />
                ) : (
                  <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-xs">+</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {expandedCheckpoints.includes(checkpoint.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {checkpoint.arrival_time && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Đến:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Date(checkpoint.arrival_time).toLocaleString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                  )}
                  {checkpoint.departure_time && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-red-600" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Rời:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Date(checkpoint.departure_time).toLocaleString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {(checkpoint.latitude || checkpoint.longitude) && (
                  <div className="mb-4 flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Tọa độ:
                    </span>
                    <span className="font-mono text-gray-900 dark:text-white">
                      {checkpoint.latitude?.toFixed(6)},{" "}
                      {checkpoint.longitude?.toFixed(6)}
                    </span>
                  </div>
                )}

                {checkpoint.notes && (
                  <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                          Ghi chú:
                        </span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {checkpoint.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {checkpoint.images && checkpoint.images.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Hình ảnh tại điểm này ({checkpoint.images.length}/10)
                      </span>
                      {isGuide && checkpoint.images.length < 10 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Có thể thêm {10 - checkpoint.images.length} ảnh nữa
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {checkpoint.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-lg overflow-hidden group"
                        >
                          <img
                            src={img}
                            alt={`Checkpoint ${
                              checkpoint.checkpoint_order
                            } - Image ${idx + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImages(checkpoint.images);
                              setShowImageModal(true);
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadSingleImage(
                                img,
                                `checkpoint_${
                                  checkpoint.checkpoint_order
                                }_image_${idx + 1}.jpg`
                              );
                            }}
                            className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Tải ảnh này"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isGuide && (
                  <div
                    className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {checkpoint.status === "pending" && (
                      <button
                        onClick={() =>
                          updateCheckpointStatus(checkpoint.id, "in_progress")
                        }
                        disabled={updateLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-semibold"
                      >
                        <Navigation className="w-4 h-4" />
                        Bắt đầu
                      </button>
                    )}
                    {checkpoint.status === "in_progress" && (
                      <button
                        onClick={() =>
                          updateCheckpointStatus(checkpoint.id, "completed")
                        }
                        disabled={updateLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-semibold"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Hoàn thành
                      </button>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors text-sm font-semibold">
                      <Camera className="w-4 h-4" />
                      Thêm ảnh
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files &&
                          uploadImages(checkpoint.id, e.target.files)
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  const toggleCheckpoint = (id: number) => {
    setExpandedCheckpoints((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) {
        newSet.delete(dayNumber);
      } else {
        newSet.add(dayNumber);
      }
      return newSet;
    });
  };

  const openAddCheckpointModal = (dayNumber: number | null) => {
    setSelectedDayForNewCheckpoint(dayNumber);
    setNewCheckpointForm({
      name: "",
      description: "",
      location: "",
      note: "",
      scheduledTime: "",
    });
    setShowAddCheckpointModal(true);
  };

  const handleCreateCheckpoint = async () => {
    if (!newCheckpointForm.name.trim()) {
      setToast({
        message: "Vui lòng nhập tên điểm dừng",
        type: "warning",
      });
      return;
    }

    const parsedBookingId = parseInt(bookingId, 10);
    if (Number.isNaN(parsedBookingId)) {
      setToast({
        message: "Không xác định được booking để thêm điểm dừng",
        type: "error",
      });
      return;
    }

    setCreatingCheckpoint(true);

    try {
      const nextOrder =
        progress.length > 0
          ? Math.max(...progress.map((cp) => cp.checkpoint_order)) + 1
          : 1;

      let scheduledTimeIso: string | undefined;
      if (newCheckpointForm.scheduledTime) {
        const targetDay = dayGroups.find(
          (day) => day.dayNumber === selectedDayForNewCheckpoint
        );
        const [hours, minutes] = newCheckpointForm.scheduledTime.split(":");
        const baseDate = targetDay?.date
          ? new Date(targetDay.date)
          : new Date();
        baseDate.setHours(parseInt(hours || "0", 10));
        baseDate.setMinutes(parseInt(minutes || "0", 10));
        baseDate.setSeconds(0, 0);
        scheduledTimeIso = baseDate.toISOString();
      }

      const selectedDay = dayGroups.find(
        (day) => day.dayNumber === selectedDayForNewCheckpoint
      );
      const autoNote = selectedDay ? `Thuộc ${selectedDay.title}` : "";
      const notes = [autoNote, newCheckpointForm.note]
        .filter((item) => item && item.trim().length > 0)
        .join(" • ");

      const payload: Record<string, any> = {
        booking_id: parsedBookingId,
        checkpoint_name: newCheckpointForm.name.trim(),
        checkpoint_order: nextOrder,
      };

      if (newCheckpointForm.description.trim()) {
        payload.checkpoint_description = newCheckpointForm.description.trim();
      }
      if (newCheckpointForm.location.trim()) {
        payload.location_name = newCheckpointForm.location.trim();
      }
      if (notes) {
        payload.notes = notes;
      }
      if (scheduledTimeIso) {
        payload.scheduled_time = scheduledTimeIso;
      }

      const res = await api.request("/tour-progress", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setToast({
          message: "Đã thêm điểm dừng mới!",
          type: "success",
        });
        setShowAddCheckpointModal(false);
        await loadBookingAndProgress();
      } else {
        setToast({
          message: res.error || "Không thể thêm điểm dừng",
          type: "error",
        });
      }
    } catch (err: any) {
      setToast({
        message: err.message || "Không thể thêm điểm dừng",
        type: "error",
      });
    }

    setCreatingCheckpoint(false);
  };

  // Computed values
  const completedCount = progress.filter(
    (p) => p.status === "completed"
  ).length;
  const totalCount = progress.length;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const inProgressCount = progress.filter(
    (p) => p.status === "in_progress"
  ).length;
  const pendingCount = Math.max(
    totalCount - completedCount - inProgressCount,
    0
  );
  const nextCheckpoint =
    progress.find((p) => p.status !== "completed") || progress[0];
  const primaryBackgroundImage =
    booking?.tour?.featured_image || "/images/backround_tour.jpg";
  const passengerStats = useMemo(() => {
    return passengers.reduce(
      (acc, passenger) => {
        const type = (passenger.participant_type as ParticipantType) || "adult";
        if (type === "child") {
          acc.child += 1;
        } else if (type === "infant") {
          acc.infant += 1;
        } else {
          acc.adult += 1;
        }
        acc.total += 1;
        return acc;
      },
      { total: 0, adult: 0, child: 0, infant: 0 }
    );
  }, [passengers]);

  const filteredPassengers = useMemo(() => {
    const normalizedSearch = passengerSearch.trim().toLowerCase();
    return passengers.filter((passenger) => {
      const matchesType =
        passengerFilter === "all" ||
        passenger.participant_type === passengerFilter;
      if (!normalizedSearch) {
        return matchesType;
      }

      const searchableFields = [
        passenger.full_name,
        passenger.phone,
        passenger.email,
        passenger.id_number,
        passenger.passport_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesType && searchableFields.includes(normalizedSearch);
    });
  }, [passengers, passengerSearch, passengerFilter]);

  const passengerTypeLabel = (type?: string | null) => {
    switch (type) {
      case "child":
        return "Trẻ em";
      case "infant":
        return "Em bé";
      default:
        return "Người lớn";
    }
  };

  // Early returns
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Có lỗi xảy ra
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              {t("back")}
            </button>
            <button
              onClick={() => {
                setError(null);
                loadBookingAndProgress();
              }}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
            >
              Thử lại
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Không tìm thấy booking
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Booking này không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
          >
            Quay lại
          </button>
        </motion.div>
      </div>
    );
  }

  // Main return
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-white">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50 dark:opacity-70"
          style={{
            backgroundImage: `url('${primaryBackgroundImage}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-slate-50/40 to-white/50 dark:from-slate-950/95 dark:via-slate-900/85 dark:to-slate-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_45%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_45%)]" />
      </div>

      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-10 space-y-10">
          {/* Header / Hero */}
          <div className="space-y-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("back")}
            </button>

            <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
              <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-white/5 backdrop-blur-2xl shadow-xl dark:shadow-[0_25px_80px_rgba(15,23,42,0.5)]">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${primaryBackgroundImage}')`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/70 to-white/85 dark:from-slate-950/92 dark:via-slate-900/85 dark:to-slate-950/92" />
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-transparent dark:from-teal-900/20 dark:via-transparent dark:to-transparent" />
                <div className="relative z-10 p-8 space-y-8">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-gray-600 dark:text-white/60 font-semibold">
                        {t("journey.title")}
                      </p>
                      <h1 className="text-4xl font-black tracking-tight mt-2 text-gray-900 dark:text-white">
                        {booking?.tour?.title ||
                          booking?.tour?.name ||
                          t("journey.title")}
                      </h1>
                    </div>
                    {booking?.date && (
                      <div className="px-4 py-3 rounded-2xl bg-teal-50 dark:bg-white/10 border border-teal-200 dark:border-white/20 text-right">
                        <p className="text-xs text-gray-600 dark:text-white/60 uppercase tracking-widest">
                          Khởi hành
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {new Date(booking.date).toLocaleDateString("vi-VN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {nextCheckpoint && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-gray-200 dark:border-white/20 bg-white/80 dark:bg-white/10 p-5">
                        <p className="text-xs uppercase tracking-widest text-gray-600 dark:text-white/60 mb-2">
                          Điểm kế tiếp
                        </p>
                        <p className="text-2xl font-semibold leading-tight text-gray-900 dark:text-white">
                          {nextCheckpoint.checkpoint_name}
                        </p>
                        {nextCheckpoint.scheduled_time && (
                          <p className="mt-3 text-sm text-gray-700 dark:text-white/80 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(
                              nextCheckpoint.scheduled_time
                            ).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                      <div className="rounded-2xl border border-gray-200 dark:border-white/20 bg-teal-50 dark:bg-black/30 p-5 flex flex-col justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-400/20 flex items-center justify-center">
                            <Navigation className="w-5 h-5 text-teal-600 dark:text-teal-200" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-widest text-gray-600 dark:text-white/60">
                              Trạng thái
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {getStatusText(nextCheckpoint.status)}
                            </p>
                          </div>
                        </div>
                        {nextCheckpoint.location_name && (
                          <p className="text-sm text-gray-700 dark:text-white/80 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {nextCheckpoint.location_name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl bg-white/90 dark:bg-gray-900/70 text-gray-900 dark:text-white border border-white/40 dark:border-gray-800 shadow-[0_20px_70px_rgba(15,23,42,0.45)] p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">
                      Booking
                    </p>
                    <h2 className="text-2xl font-bold">
                      {booking?.code || `#${booking?.id || bookingId}`}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowBookingDetails((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 dark:text-teal-300"
                  >
                    Chi tiết
                    {showBookingDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                  Trạng thái:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {getStatusText(nextCheckpoint?.status || "pending")}
                  </span>
                </p>

                {isGuide && (
                  <div className="mt-5 pt-5 border-t border-gray-200/80 dark:border-gray-800/80">
                    <p className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400 font-semibold">
                      {t("notifications.sendNotification")}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setJourneyNoticeCategory("start");
                          setJourneyNoticeMessage("Bắt đầu hành trình");
                        }}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                          journeyNoticeCategory === "start"
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white/70 dark:bg-white/5 text-gray-700 dark:text-white/80 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10"
                        }`}
                      >
                        Bắt đầu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setJourneyNoticeCategory("rest");
                          setJourneyNoticeMessage("Nghỉ chân");
                        }}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                          journeyNoticeCategory === "rest"
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white/70 dark:bg-white/5 text-gray-700 dark:text-white/80 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10"
                        }`}
                      >
                        Nghỉ chân
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setJourneyNoticeCategory("gather");
                          setJourneyNoticeMessage("Tập hợp");
                        }}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                          journeyNoticeCategory === "gather"
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white/70 dark:bg-white/5 text-gray-700 dark:text-white/80 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10"
                        }`}
                      >
                        Tập hợp
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setJourneyNoticeCategory("other");
                          if (!journeyNoticeMessage)
                            setJourneyNoticeMessage("");
                        }}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                          journeyNoticeCategory === "other"
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white/70 dark:bg-white/5 text-gray-700 dark:text-white/80 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10"
                        }`}
                      >
                        Khác
                      </button>
                    </div>

                    <textarea
                      value={journeyNoticeMessage}
                      onChange={(e) => setJourneyNoticeMessage(e.target.value)}
                      rows={3}
                      placeholder="Nhập nội dung thông báo cho khách..."
                      className="mt-3 w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    />

                    <button
                      type="button"
                      onClick={sendJourneyNotification}
                      disabled={journeyNoticeSending}
                      className="mt-3 inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {journeyNoticeSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        t("notifications.sendNotificationTitle")
                      )}
                    </button>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {showBookingDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-gray-800/80 space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-teal-500" />
                          <span>
                            Khách hàng:{" "}
                            <strong>
                              {booking?.user?.full_name ||
                                booking?.user?.name ||
                                booking?.customer_name ||
                                "Đang cập nhật"}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-teal-500" />
                          <span>
                            Số ngày:{" "}
                            <strong>
                              {itineraryDays?.length || dayGroups.length} ngày
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-teal-500" />
                          <span>
                            Tour:{" "}
                            <strong>
                              {booking?.tour?.destination ||
                                booking?.tour?.location ||
                                booking?.tour?.title ||
                                "Đang cập nhật"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Stat Highlights */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg dark:shadow-none">
              <p className="text-sm text-gray-600 dark:text-white/70 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-300" />
                Hoàn thành
              </p>
              <p className="text-4xl font-bold mt-2 text-gray-900 dark:text-white">
                {completedCount}
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50 mt-2">
                / {totalCount} điểm
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg dark:shadow-none">
              <p className="text-sm text-gray-600 dark:text-white/70 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                Đang di chuyển
              </p>
              <p className="text-4xl font-bold mt-2 text-gray-900 dark:text-white">
                {inProgressCount}
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50 mt-2">
                {pendingCount > 0
                  ? `${pendingCount} điểm chờ`
                  : "Sẵn sàng hoàn tất"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg dark:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-white/70 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  Tiến độ
                </p>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                  style={{ width: `${Math.max(progressPercentage, 2)}%` }}
                />
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50 mt-3">
                {t("journey.ongoing")}
              </p>
            </div>
          </div>

          {isGuide && (
            <div className="bg-white/90 dark:bg-gray-900/70 backdrop-blur-2xl rounded-3xl shadow-[0_20px_70px_rgba(15,23,42,0.45)] border border-white/40 dark:border-gray-800 p-6 text-gray-900 dark:text-white space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">
                    Hành khách
                  </p>
                  <h2 className="text-2xl font-bold mt-2">
                    Danh sách hành khách
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hiển thị cho hướng dẫn viên được phân công tour này.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={loadPassengers}
                    disabled={passengersLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-60"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Tải lại
                  </button>
                  <button
                    onClick={sendPassengerCredentials}
                    disabled={
                      sendingPassengerCredentials || passengers.length === 0
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-60"
                  >
                    <Mail className="w-4 h-4" />
                    Gửi lại mật khẩu
                  </button>
                  <button
                    onClick={exportPassengers}
                    disabled={passengers.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-semibold shadow-lg hover:from-teal-700 hover:to-blue-700 transition disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" />
                    Xuất Excel
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-500" />
                    Tổng hành khách
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {passengerStats.total}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <UserRound className="w-4 h-4 text-purple-500" />
                    Người lớn
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {passengerStats.adult}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-amber-500" />
                    Trẻ em
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {passengerStats.child}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Baby className="w-4 h-4 text-pink-500" />
                    Em bé
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {passengerStats.infant}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={passengerSearch}
                    onChange={(e) => setPassengerSearch(e.target.value)}
                    placeholder="Tìm theo tên, số điện thoại hoặc giấy tờ..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all", label: "Tất cả" },
                    { key: "adult", label: "Người lớn" },
                    { key: "child", label: "Trẻ em" },
                    { key: "infant", label: "Em bé" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() =>
                        setPassengerFilter(
                          filter.key as "all" | ParticipantType
                        )
                      }
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                        passengerFilter === filter.key
                          ? "bg-teal-600 text-white border-teal-600"
                          : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {passengersLoading && (
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("loadingPassengers")}
                  </div>
                )}

                {passengerError && !passengersLoading && (
                  <div className="flex items-center gap-2 p-4 border border-red-200 text-red-600 rounded-2xl bg-red-50/80 dark:bg-red-900/20 dark:border-red-800">
                    <AlertCircle className="w-4 h-4" />
                    {passengerError}
                  </div>
                )}

                {!passengersLoading &&
                  !passengerError &&
                  filteredPassengers.length === 0 && (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      Không có hành khách phù hợp với bộ lọc.
                    </div>
                  )}

                {!passengersLoading &&
                  !passengerError &&
                  filteredPassengers.length > 0 && (
                    <div className="space-y-4">
                      {filteredPassengers.map((passenger) => {
                        const genderLabel =
                          passenger.gender === "male"
                            ? "Nam"
                            : passenger.gender === "female"
                            ? "Nữ"
                            : passenger.gender
                            ? "Khác"
                            : null;
                        const dateOfBirth = passenger.date_of_birth
                          ? new Date(
                              passenger.date_of_birth
                            ).toLocaleDateString("vi-VN")
                          : null;

                        return (
                          <div
                            key={passenger.id}
                            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 p-5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {passenger.full_name}
                                </p>
                                {(genderLabel || dateOfBirth) && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {genderLabel}
                                    {genderLabel && dateOfBirth && " • "}
                                    {dateOfBirth}
                                  </p>
                                )}
                              </div>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-200">
                                {passengerTypeLabel(passenger.participant_type)}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-gray-700 dark:text-gray-300">
                              <div className="flex items-start gap-2">
                                <Phone className="w-4 h-4 text-teal-500 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-gray-600 dark:text-gray-400">
                                    Liên hệ
                                  </p>
                                  <p>{passenger.phone || "Chưa có"}</p>
                                  <p>{passenger.email || ""}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-teal-500 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-gray-600 dark:text-gray-400">
                                    Giấy tờ
                                  </p>
                                  <p>CMND/CCCD: {passenger.id_number || "-"}</p>
                                  <p>
                                    Hộ chiếu: {passenger.passport_number || "-"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-teal-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-600 dark:text-gray-400">
                                    Lưu ý
                                  </p>
                                  <p>
                                    {passenger.special_requirements ||
                                      "Không có yêu cầu đặc biệt"}
                                  </p>
                                  {passenger.emergency_contact_name && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Khẩn cấp:{" "}
                                      {passenger.emergency_contact_name}
                                      {passenger.emergency_contact_phone &&
                                        ` (${passenger.emergency_contact_phone})`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Progress Summary */}
          {progress.length > 0 && (
            <div className="mb-8 bg-white/80 dark:bg-gray-900/70 backdrop-blur-2xl rounded-3xl shadow-[0_20px_70px_rgba(15,23,42,0.45)] border border-white/40 dark:border-gray-800 p-6 text-gray-900 dark:text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tiến độ hành trình
                </h2>
                {progress.some((p) => p.images && p.images.length > 0) && (
                  <button
                    onClick={downloadAllImages}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    Tải tất cả ảnh (
                    {progress.reduce(
                      (acc, p) => acc + (p.images?.length || 0),
                      0
                    )}
                    )
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                  <div
                    className={`h-full flex items-center justify-center text-white text-sm font-semibold relative overflow-hidden ${
                      progressPercentage === 100
                        ? "bg-gradient-to-r from-green-500 to-emerald-600"
                        : progressPercentage > 0
                        ? "bg-gradient-to-r from-blue-500 to-teal-600"
                        : "bg-gray-400"
                    } rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(progressPercentage, 0)}%` }}
                  >
                    {progressPercentage > 0 && progressPercentage < 100 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    )}
                    {progressPercentage > 10 && (
                      <span className="relative z-10">
                        {Math.round(progressPercentage)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {completedCount} / {totalCount} điểm đã hoàn thành
                  </span>
                  {progress.filter((p) => p.status === "in_progress").length >
                    0 && (
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      Đang di chuyển
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Initialize Button */}
          {progress.length === 0 && isGuide && (
            <div className="mb-8 bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700/50 p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Chưa có điểm dừng nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {isGuide
                  ? "Khởi tạo hành trình từ lịch trình tour hoặc thêm điểm dừng mới"
                  : "Hướng dẫn viên sẽ cập nhật hành trình sớm"}
              </p>
              {isGuide && booking?.tour?.id && (
                <button
                  onClick={initializeFromItinerary}
                  disabled={updateLoading}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {updateLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang khởi tạo...
                    </div>
                  ) : (
                    "Khởi tạo từ lịch trình"
                  )}
                </button>
              )}
            </div>
          )}

          {/* Map Toggle */}
          {progress.length > 0 && (
            <div className="mb-6 flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  setShowMap(!showMap);
                  if (showLocationTracking) setShowLocationTracking(false);
                  if (!showMap && progress.length > 0) {
                    const activeCheckpoint =
                      progress.find((cp) => cp.status === "in_progress") ||
                      progress[0];
                    if (
                      activeCheckpoint.latitude &&
                      activeCheckpoint.longitude
                    ) {
                      setMapCenter({
                        lat: activeCheckpoint.latitude,
                        lng: activeCheckpoint.longitude,
                      });
                    }
                  }
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                  showMap
                    ? "bg-gradient-to-r from-teal-600 to-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <MapIcon className="w-5 h-5" />
                {showMap ? "Ẩn bản đồ" : "Xem bản đồ"}
              </button>

              <button
                onClick={() => {
                  setShowLocationTracking(!showLocationTracking);
                  if (showMap) setShowMap(false);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                  showLocationTracking
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Radio
                  className={`w-5 h-5 ${
                    showLocationTracking ? "animate-pulse" : ""
                  }`}
                />
                {showLocationTracking ? "Tắt định vị" : "Định vị thành viên"}
                {locationTracking.sosAlerts.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                    SOS
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Map */}
          {showMap && (
            <div className="mb-8 bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bản đồ hành trình
              </h3>
              {typeof window !== "undefined" && (
                <div id="tour-journey-map" className="w-full h-96 rounded-lg" />
              )}
            </div>
          )}

          {/* Location Tracking Map */}
          {showLocationTracking && (
            <div className="mb-8">
              <MemberLocationMap
                members={locationTracking.members}
                sosAlerts={locationTracking.sosAlerts}
                geofenceAlerts={locationTracking.geofenceAlerts}
                geofences={locationTracking.geofences}
                myLocation={locationTracking.myLocation}
                isTracking={locationTracking.isTracking}
                isGuide={isGuide}
                currentUserId={user?.id || null}
                onTriggerSOS={(message) => locationTracking.triggerSOS(message)}
                onTriggerQuickSOS={() => locationTracking.triggerQuickSOS()}
                onSendHelpRequest={(message, severity) =>
                  locationTracking.sendHelpRequest(message, severity)
                }
                onClearSOS={(userId) => locationTracking.clearSOS(userId)}
                onPingMember={(userId) => locationTracking.pingMember(userId)}
                onRefresh={() => locationTracking.requestAllLocations()}
                onStartTracking={() => locationTracking.startTracking()}
                onStopTracking={() => locationTracking.stopTracking()}
              />
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-8">
            {dayGroups.map((day, idx) => {
              const isExpanded = expandedDays.has(day.dayNumber);
              const dayCheckpoints = day.checkpoints.sort(
                (a, b) => a.checkpoint_order - b.checkpoint_order
              );

              return (
                <motion.div
                  key={day.dayNumber}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden"
                >
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors"
                    onClick={() => toggleDay(day.dayNumber)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                              day.isFallback
                                ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"
                                : "bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300"
                            }`}
                          >
                            {day.isFallback
                              ? "Bổ sung"
                              : `Ngày ${day.dayNumber}`}
                          </span>
                        </div>
                        {day.date && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {day.date.toLocaleDateString("vi-VN", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {day.title}
                      </h3>
                      {day.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {day.description}
                        </p>
                      )}

                      {isGuide && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddCheckpointModal(day.dayNumber);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl"
                        >
                          <span className="text-lg">+</span>
                          Thêm điểm dừng
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="p-6">
                          {day.activities && day.activities.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Hoạt động trong ngày
                              </h4>
                              <ul className="space-y-2">
                                {day.activities.map((activity, actIdx) => (
                                  <li
                                    key={actIdx}
                                    className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                                  >
                                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                                    <span>{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {dayCheckpoints.length > 0 ? (
                            <div className="space-y-6">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Điểm dừng ({dayCheckpoints.length})
                              </h4>
                              <div className="relative">
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-300 to-blue-300 dark:from-teal-600 dark:to-blue-600" />
                                <div className="space-y-8">
                                  {dayCheckpoints.map(
                                    (checkpoint, checkpointIdx) =>
                                      renderCheckpointCard(
                                        checkpoint,
                                        checkpointIdx
                                      )
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              {isGuide
                                ? "Chưa có điểm dừng nào. Nhấn 'Thêm điểm dừng' để bắt đầu."
                                : "Chưa có điểm dừng nào được thêm vào ngày này."}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Checkpoint Modal */}
      <AnimatePresence>
        {showAddCheckpointModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddCheckpointModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Thêm điểm dừng mới
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {selectedDayForNewCheckpoint
                  ? `Thêm vào ${
                      dayGroups.find(
                        (d) => d.dayNumber === selectedDayForNewCheckpoint
                      )?.title || `Ngày ${selectedDayForNewCheckpoint}`
                    }`
                  : "Thêm điểm dừng bổ sung"}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên điểm dừng *
                  </label>
                  <input
                    type="text"
                    value={newCheckpointForm.name}
                    onChange={(e) =>
                      setNewCheckpointForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Ví dụ: Vịnh Hạ Long"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={newCheckpointForm.description}
                    onChange={(e) =>
                      setNewCheckpointForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Mô tả về điểm dừng này..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vị trí
                  </label>
                  <input
                    type="text"
                    value={newCheckpointForm.location}
                    onChange={(e) =>
                      setNewCheckpointForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Địa chỉ cụ thể"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thời gian dự kiến
                  </label>
                  <input
                    type="time"
                    value={newCheckpointForm.scheduledTime}
                    onChange={(e) =>
                      setNewCheckpointForm((prev) => ({
                        ...prev,
                        scheduledTime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={newCheckpointForm.note}
                    onChange={(e) =>
                      setNewCheckpointForm((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={2}
                    placeholder="Ghi chú thêm..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddCheckpointModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateCheckpoint}
                  disabled={creatingCheckpoint}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 font-semibold"
                >
                  {creatingCheckpoint ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </div>
                  ) : (
                    "Lưu điểm dừng"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="p-4 grid grid-cols-2 gap-4 max-h-[90vh] overflow-auto">
                {selectedImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-auto rounded-lg"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
