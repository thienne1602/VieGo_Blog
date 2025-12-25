"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Star,
  MapPin,
  Clock,
  Users,
  Calendar,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Camera,
  Share2,
  ArrowLeft,
  Heart,
  Shield,
  Award,
  UserCircle,
  Building,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Utensils,
  BedDouble,
  AlertTriangle,
  FileText,
  ShieldCheck,
  LifeBuoy,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import LoginRequestPopup from "@/components/common/LoginRequestPopup";

interface TourDetailPageClientProps {
  initialId: string;
}

export default function TourDetailPageClient({
  initialId,
}: TourDetailPageClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation("tourDetail");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, content: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const dayMapsRef = useRef<Map<number, any>>(new Map());
  const dayMarkersRef = useRef<Map<number, any[]>>(new Map());

  const id = initialId;

  const handleBackToTours = () => {
    // Force a full navigation to refresh the tours page
    router.push("/tours");
    // Dispatch event after navigation completes to ensure TourShowcase reloads
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tours-refresh", { detail: { from: "tour-detail" } })
        );
      }
    }, 200);
  };

  useEffect(() => {
    // Check local storage for favorite status
    if (!id) return;
    if (typeof window !== "undefined") {
      const favorites = JSON.parse(
        localStorage.getItem("favorite_tours") || "[]"
      );
      setIsFavorite(favorites.includes(id));
    }
  }, [id]);

  const toggleFavorite = () => {
    if (!id || typeof window === "undefined") return;
    const favorites = JSON.parse(
      localStorage.getItem("favorite_tours") || "[]"
    );
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter((favId: string) => favId !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    localStorage.setItem("favorite_tours", JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert(t("share.copied"));
    } catch (err) {
      console.error("Failed to copy:", err);
      alert(t("share.failed"));
    }
  };

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.getTour(id);
        if (res.success && mounted) {
          setTour(res.data?.data || res.data);

          // Load reviews
          setLoadingReviews(true);
          const reviewsRes = await api.getTourReviews(id);
          if (reviewsRes.success && mounted) {
            setReviews(reviewsRes.data || []);
          }
          setLoadingReviews(false);
        } else if (mounted) {
          setTour(null);
        }
      } catch (error) {
        console.error("Error loading tour:", error);
        if (mounted) setTour(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!tour || typeof window === "undefined" || activeTab !== "map") return;

    const initMap = async () => {
      try {
        const L = await import("leaflet");

        const mapElement = document.getElementById("tour-detail-map");
        if (!mapElement) return;

        // Clear existing map if any
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // Get checkpoints from itinerary
        const checkpoints = extractCheckpoints(tour.itinerary);

        // Default center (Ho Chi Minh City)
        let center: [number, number] = [10.762622, 106.660172];

        // Use first checkpoint if available
        if (checkpoints.length > 0) {
          center = [checkpoints[0].lat, checkpoints[0].lng];
        }

        // Initialize map
        const map = L.default.map(mapElement, {
          center,
          zoom: checkpoints.length > 1 ? 10 : 13,
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

        // Add markers for all checkpoints with better styling
        checkpoints.forEach((checkpoint, index) => {
          const marker = L.default
            .marker([checkpoint.lat, checkpoint.lng], {
              icon: L.default.divIcon({
                className: "custom-marker",
                html: `<div style="
                background-color: #10b981;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 4px solid white;
                box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                font-size: 14px;
                cursor: pointer;
                transition: transform 0.2s;
              ">${index + 1}</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
              }),
            })
            .addTo(map);

          marker.bindPopup(`
            <div style="padding: 12px; min-width: 240px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 18px; color: #1f2937;">${
                checkpoint.name
              }</h3>
              ${
                checkpoint.description
                  ? `<p style="margin: 4px 0; font-size: 13px; color: #666;">${checkpoint.description}</p>`
                  : ""
              }
              <p style="margin: 4px 0; font-size: 13px; color: #666;">${t("map.checkpoint")} ${
                index + 1
              }${
            checkpoint.dayNumber ? ` - ${t("map.day")} ${checkpoint.dayNumber}` : ""
          } trong hành trình</p>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 11px; color: #999;">${t("map.tourLocation")}</p>
              </div>
            </div>
          `);
          markersRef.current.push(marker);
        });

        // Draw route if there are multiple checkpoints with better styling
        if (checkpoints.length > 1) {
          const route = checkpoints.map((cp) => [cp.lat, cp.lng]) as [
            number,
            number
          ][];

          const polyline = L.default
            .polyline(route, {
              color: "#10b981",
              weight: 6,
              opacity: 0.9,
              smoothFactor: 1,
              lineJoin: "round",
              lineCap: "round",
            })
            .addTo(map);

          // Add direction arrows along the route (every 3rd point for cleaner look)
          for (
            let i = 0;
            i < route.length - 1;
            i += Math.max(1, Math.floor(route.length / 5))
          ) {
            const midLat = (route[i][0] + route[i + 1][0]) / 2;
            const midLng = (route[i][1] + route[i + 1][1]) / 2;

            // Calculate bearing (angle) between two points
            const lat1 = (route[i][0] * Math.PI) / 180;
            const lat2 = (route[i + 1][0] * Math.PI) / 180;
            const dLng = ((route[i + 1][1] - route[i][1]) * Math.PI) / 180;
            const y = Math.sin(dLng) * Math.cos(lat2);
            const x =
              Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
            const bearing = (Math.atan2(y, x) * 180) / Math.PI;

            L.default
              .marker([midLat, midLng], {
                icon: L.default.divIcon({
                  className: "route-arrow",
                  html: `<div style="
                  color: #10b981;
                  font-size: 24px;
                  transform: rotate(${bearing}deg);
                  text-shadow: 0 0 3px rgba(255,255,255,0.8);
                ">➤</div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                }),
              })
              .addTo(map);
          }

          // Fit bounds to show all markers with padding
          const group = new L.default.FeatureGroup(markersRef.current);
          map.fitBounds(group.getBounds().pad(0.15));
        } else if (checkpoints.length === 1) {
          // Center on single checkpoint
          map.setView([checkpoints[0].lat, checkpoints[0].lng], 13);
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
  }, [tour, activeTab]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.content.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await api.createTourReview(id, newReview);
      if (res.success) {
        setReviews([res.data, ...reviews]);
        setNewReview({ rating: 5, content: "" });
        alert(t("reviews.submitSuccess"));
      } else {
        alert(res.error || t("reviews.submitError"));
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(t("reviews.submitError"));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      setShowLoginPopup(true);
      return;
    }
    router.push(`/tours/${tour?.id}/booking`);
  };

  const safeTour = tour ?? {};

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: safeTour.currency || "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const originalPrice = safeTour.price_per_person || safeTour.price || 0;
  const discountPrice = safeTour.discount_percentage
    ? originalPrice * (1 - safeTour.discount_percentage / 100)
    : originalPrice;

  const allImages = [
    safeTour.featured_image,
    ...(safeTour.gallery_images || []),
  ].filter(Boolean);

  const normalizeListField = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
        .filter(Boolean);
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) =>
              typeof item === "string" ? item : JSON.stringify(item)
            )
            .filter(Boolean);
        }
      } catch (error) {
        // Treat as delimited text below
      }
      return value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const formatDisplayDate = (input: string) => {
    if (!input) return "";
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      return input;
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const toggleDay = (dayNumber: number) => {
    console.log("🔄 Toggle day:", dayNumber);
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) {
        newSet.delete(dayNumber);
        console.log("  ➖ Day", dayNumber, "collapsed");
      } else {
        newSet.add(dayNumber);
        console.log("  ➕ Day", dayNumber, "expanded");
      }
      console.log("  📋 New expandedDays:", Array.from(newSet));
      return newSet;
    });
  };

  // Extract checkpoints by day
  const extractCheckpointsByDay = (
    itinerary: any,
    dayNumber: number
  ): Array<{
    name: string;
    lat: number;
    lng: number;
    description?: string;
  }> => {
    const checkpoints: Array<{
      name: string;
      lat: number;
      lng: number;
      description?: string;
    }> = [];

    if (!itinerary || typeof itinerary !== "object") return checkpoints;

    // Check if itinerary has days with checkpoints (new format)
    if (Array.isArray(itinerary)) {
      const day = itinerary.find(
        (d: any) => d.day_number === dayNumber || d.dayNumber === dayNumber
      );
      if (day && day.checkpoints && Array.isArray(day.checkpoints)) {
        day.checkpoints.forEach((cp: any) => {
          if (cp.latitude && cp.longitude) {
            checkpoints.push({
              name: cp.checkpoint_name || cp.name || t("map.checkpoint"),
              lat: parseFloat(cp.latitude),
              lng: parseFloat(cp.longitude),
              description: cp.description || cp.checkpoint_description,
            });
          }
        });
      }
    } else {
      // Old format - try to extract from object structure
      const dayKey = `day${dayNumber}`;
      const day = itinerary[dayKey];
      if (
        day &&
        typeof day === "object" &&
        day.checkpoints &&
        Array.isArray(day.checkpoints)
      ) {
        day.checkpoints.forEach((cp: any) => {
          if (cp.latitude && cp.longitude) {
            checkpoints.push({
              name: cp.checkpoint_name || cp.name || t("map.checkpoint"),
              lat: parseFloat(cp.latitude),
              lng: parseFloat(cp.longitude),
              description: cp.description || cp.checkpoint_description,
            });
          }
        });
      }
    }

    return checkpoints;
  };

  const formatItinerary = (itinerary: any) => {
    type NormalizedActivity = {
      time?: string;
      title?: string;
      description?: string;
      location?: string;
      notes?: string;
      items?: any[];
    };

    const renderEmptyState = (message = "Lịch trình sẽ được cập nhật sớm.") => (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );

    const formatSlotLabel = (slot?: string | number) => {
      if (slot === undefined || slot === null) return "";
      const value = slot.toString();
      const normalized = value.toLowerCase();
      const slotMap: Record<string, string> = {
        morning: "Buổi sáng",
        afternoon: "Buổi chiều",
        evening: "Buổi tối",
        night: "Ban đêm",
      };
      return slotMap[normalized] || value.replace(/_/g, " ");
    };

    const normalizeActivitySource = (source: any): any[] => {
      if (!source) return [];
      if (Array.isArray(source)) return source;
      if (typeof source === "string") {
        return source
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
      if (typeof source === "object") {
        return Object.entries(source).map(([slot, detail]) => {
          if (typeof detail === "string") {
            return { slot, description: detail };
          }

          if (detail && typeof detail === "object") {
            return { slot, ...(detail as Record<string, any>) };
          }

          return { slot, description: String(detail) };
        });
      }
      return [];
    };

    const normalizeActivity = (activity: any): NormalizedActivity | null => {
      if (!activity) return null;

      if (typeof activity === "string") {
        const match = activity.match(/^(\d{1,2}:\d{2})\s*[–\-]\s*(.+)$/);
        if (match) {
          return {
            time: match[1],
            title: match[2].trim(),
          };
        }
        return { title: activity };
      }

      const nestedItems = Array.isArray(activity.items)
        ? activity.items
        : Array.isArray(activity.subActivities)
        ? activity.subActivities
        : Array.isArray(activity.points)
        ? activity.points
        : undefined;

      return {
        time:
          activity.time ||
          activity.hour ||
          activity.slot_time ||
          activity.start ||
          activity.slot,
        title:
          activity.title ||
          activity.name ||
          activity.heading ||
          activity.activity ||
          formatSlotLabel(activity.slot),
        description:
          activity.description ||
          activity.details ||
          activity.detail ||
          activity.summary ||
          (typeof activity.text === "string" ? activity.text : undefined),
        location: activity.location || activity.place,
        notes: activity.notes,
        items: nestedItems,
      };
    };

    const renderNestedItems = (items: any[], keyPrefix: string) => (
      <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
        {items.map((item, idx) => (
          <li key={`${keyPrefix}-${idx}`} className="flex gap-2">
            <span className="text-emerald-500">•</span>
            <span>
              {typeof item === "string"
                ? item
                : item?.title || item?.description || JSON.stringify(item)}
            </span>
          </li>
        ))}
      </ul>
    );

    const renderActivitiesTimeline = (source: any, dayNumber: number) => {
      const normalizedActivities = normalizeActivitySource(source)
        .map((item) => normalizeActivity(item))
        .filter((item): item is NormalizedActivity => Boolean(item));

      if (!normalizedActivities.length) {
        return renderEmptyState("Chưa có hoạt động chi tiết cho ngày này.");
      }

      return (
        <div className="relative pl-6 md:pl-8">
          <div
            className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-200 via-emerald-400 to-emerald-600"
            aria-hidden
          ></div>
          <div className="space-y-6">
            {normalizedActivities.map((activity, idx) => (
              <div
                key={`day-${dayNumber}-activity-${idx}`}
                className="relative pl-6"
              >
                <span className="absolute left-0 top-2 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 bg-emerald-500 shadow" />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                  {activity.time && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                      {activity.time}
                    </span>
                  )}
                  <div className="flex-1 space-y-2">
                    {activity.title && (
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                    )}
                    {activity.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {activity.description}
                      </p>
                    )}
                    {activity.location && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5" />
                        {activity.location}
                      </span>
                    )}
                    {activity.items &&
                      activity.items.length > 0 &&
                      renderNestedItems(
                        activity.items,
                        `day-${dayNumber}-activity-${idx}-item`
                      )}
                    {activity.notes && (
                      <p className="text-xs italic text-gray-400 dark:text-gray-500">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderMealsInfo = (meals: any) => {
      if (!meals) {
        return (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có thông tin bữa ăn.
          </p>
        );
      }

      if (typeof meals === "string") {
        return (
          <p className="text-sm text-gray-600 dark:text-gray-300">{meals}</p>
        );
      }

      if (Array.isArray(meals)) {
        return (
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {meals.map((meal, idx) => (
              <li key={`meal-${idx}`} className="flex gap-2">
                <span className="text-emerald-500">•</span>
                <span>{meal}</span>
              </li>
            ))}
          </ul>
        );
      }

      if (typeof meals === "object") {
        const entries = Object.entries(meals).filter(([, value]) =>
          Boolean(value)
        );
        if (!entries.length) {
          return (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chưa có thông tin bữa ăn.
            </p>
          );
        }

        const mealLabels: Record<string, string> = {
          breakfast: "Bữa sáng",
          lunch: "Bữa trưa",
          dinner: "Bữa tối",
        };

        return (
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {entries.map(([mealType, detail]) => (
              <li
                key={mealType}
                className="flex items-center justify-between gap-2"
              >
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {mealLabels[mealType.toLowerCase()] || mealType}
                </span>
                <span className="text-right">{String(detail)}</span>
              </li>
            ))}
          </ul>
        );
      }

      return null;
    };

    const renderAccommodationInfo = (accommodation: any) => {
      if (!accommodation) {
        return (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Thông tin đang được cập nhật.
          </p>
        );
      }

      if (typeof accommodation === "string") {
        return (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {accommodation}
          </p>
        );
      }

      if (Array.isArray(accommodation)) {
        return renderNestedItems(accommodation, "accommodation");
      }

      const name =
        accommodation.name ||
        accommodation.title ||
        accommodation.hotel ||
        accommodation.place;
      const description =
        accommodation.description ||
        accommodation.details ||
        accommodation.overview;
      const extras = [
        accommodation.address,
        accommodation.roomType || accommodation.room_type,
        accommodation.contact,
      ].filter(Boolean);

      return (
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          {name && (
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {name}
            </p>
          )}
          {description && <p>{description}</p>}
          {extras.length > 0 && (
            <ul className="list-disc pl-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {extras.map((extra, idx) => (
                <li key={`accommodation-extra-${idx}`}>{extra}</li>
              ))}
            </ul>
          )}
        </div>
      );
    };

    const renderStringItinerary = (content: string) => (
      <div className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/70 p-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-teal-600" />
          <div>
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
              Lịch trình dạng văn bản
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Chi tiết chuyến đi
            </p>
          </div>
        </div>
        <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">
          {content}
        </p>
      </div>
    );

    const renderModernDay = (day: any, index: number, rawItinerary: any[]) => {
      const dayNumber = day?.day_number || day?.dayNumber || index + 1;
      const dayTitle =
        day?.title ||
        day?.name ||
        day?.heading ||
        `${t("itinerary.dayTitle")} ${dayNumber.toString().padStart(2, "0")}`;
      const description =
        day?.description || day?.summary || day?.details || day?.overview;
      const activitiesSource =
        day?.activities ||
        day?.schedule ||
        day?.plan ||
        day?.segments ||
        day?.timeline ||
        day?.details;
      const accommodationInfo =
        day?.accommodation || day?.hotel || day?.stay || day?.lodging;
      const mealsInfo =
        day?.meals || day?.mealPlan || day?.dining || day?.foods;
      const dayCheckpoints = extractCheckpointsByDay(rawItinerary, dayNumber);
      const isExpanded = expandedDays.has(dayNumber);

      return (
        <motion.div
          key={`enhanced-day-${dayNumber}-${index}`}
          className="mb-8 bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div
            className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors"
            onClick={() => toggleDay(dayNumber)}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white font-semibold">
                  {dayNumber.toString().padStart(2, "0")}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
                    <CalendarDays className="w-4 h-4" />
                    <span>{t("itinerary.dayTitle")} {dayNumber}</span>
                  </div>
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white">
                    {dayTitle}
                  </h4>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-200 dark:border-gray-700"
              >
                <div className="p-6 space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      <ListChecks className="w-4 h-4 text-teal-600" />
                      Tổng quan
                    </div>
                    {description ? (
                      <p className="text-gray-700 dark:text-gray-300">
                        {description}
                      </p>
                    ) : (
                      renderEmptyState("Chưa có mô tả cho ngày này.")
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ListChecks className="w-5 h-5 text-emerald-600" />
                      <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Hoạt động trong ngày
                      </h5>
                    </div>
                    {renderActivitiesTimeline(activitiesSource, dayNumber)}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center gap-3">
                        <BedDouble className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Nơi lưu trú
                          </p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {accommodationInfo ? "Đã bao gồm" : "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        {renderAccommodationInfo(accommodationInfo)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center gap-3">
                        <Utensils className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Bữa ăn
                          </p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {mealsInfo ? "Theo lịch trình" : "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">{renderMealsInfo(mealsInfo)}</div>
                    </div>
                  </div>

                  {dayCheckpoints.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                        <MapIcon className="w-5 h-5" />
                        {t("itinerary.routeMap")} {dayNumber}
                      </h5>
                      <div
                        id={`day-${dayNumber}-map`}
                        className="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
                        style={{ zIndex: 1 }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    };

    if (!itinerary) {
      return renderEmptyState();
    }

    if (typeof itinerary === "string") {
      return renderStringItinerary(itinerary);
    }

    if (Array.isArray(itinerary)) {
      return itinerary.map((day, index) =>
        renderModernDay(day, index, itinerary)
      );
    }

    if (typeof itinerary !== "object") {
      return renderEmptyState();
    }

    return Object.entries(itinerary).map(
      ([key, value]: [string, any], index: number) => {
        const dayNumber = index + 1;
        const isExpanded = expandedDays.has(dayNumber);
        const dayCheckpoints = extractCheckpointsByDay(itinerary, dayNumber);

        if (typeof window !== "undefined" && index === 0) {
          console.log("🔍 FormatItinerary Debug:", {
            dayNumber,
            isExpanded,
            expandedDays: Array.from(expandedDays),
            dayCheckpoints: dayCheckpoints.length,
          });
        }

        return (
          <motion.div
            key={key}
            className="mb-8 bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors"
              onClick={() => toggleDay(dayNumber)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                    {dayNumber}
                  </div>
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white capitalize">
                    {key.replace("day", `${t("itinerary.dayTitle")} `)}
                  </h4>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="p-6 space-y-6">
                    {typeof value === "object" ? (
                      <div className="space-y-3">
                        {value.morning && (
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">🌅</div>
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                Buổi sáng
                              </div>
                              <div className="text-gray-700 dark:text-gray-300">
                                {value.morning}
                              </div>
                            </div>
                          </div>
                        )}
                        {value.afternoon && (
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">☀️</div>
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                Buổi chiều
                              </div>
                              <div className="text-gray-700 dark:text-gray-300">
                                {value.afternoon}
                              </div>
                            </div>
                          </div>
                        )}
                        {value.evening && (
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">🌙</div>
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                Buổi tối
                              </div>
                              <div className="text-gray-700 dark:text-gray-300">
                                {value.evening}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-700 dark:text-gray-300">
                        {String(value)}
                      </div>
                    )}

                    {dayCheckpoints.length > 0 && (
                      <div className="mt-6">
                        <h5 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                          <MapIcon className="w-5 h-5" />
                          {t("itinerary.routeMap")} {dayNumber}
                        </h5>
                        <div
                          id={`day-${dayNumber}-map`}
                          className="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
                          style={{ zIndex: 1 }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      }
    );
  };

  const tabs = [
    { id: "overview", label: t("tabs.overview") },
    { id: "itinerary", label: t("tabs.itinerary") },
    { id: "map", label: "Bản Đồ" },
    { id: "includes", label: t("highlights.included") },
    { id: "policies", label: t("policies.title") },
    { id: "reviews", label: t("tabs.reviews") },
  ];

  useEffect(() => {
    if (!tour || typeof window === "undefined") {
      return;
    }

    let isMounted = true;

    const initDayMaps = async () => {
      try {
        const L = await import("leaflet");

        expandedDays.forEach((dayNumber) => {
          const dayCheckpoints = extractCheckpointsByDay(
            tour.itinerary,
            dayNumber
          );
          if (dayCheckpoints.length === 0) return;

          const mapElement = document.getElementById(`day-${dayNumber}-map`);
          if (!mapElement) return;

          // Clear existing map if any
          const existingMap = dayMapsRef.current.get(dayNumber);
          if (existingMap) {
            existingMap.remove();
            dayMapsRef.current.delete(dayNumber);
          }

          // Clear existing markers
          const existingMarkers = dayMarkersRef.current.get(dayNumber) || [];
          existingMarkers.forEach((marker: any) => marker.remove());
          dayMarkersRef.current.set(dayNumber, []);

          // Initialize map
          const center: [number, number] =
            dayCheckpoints.length > 0
              ? [dayCheckpoints[0].lat, dayCheckpoints[0].lng]
              : [10.762622, 106.660172];

          const map = L.default.map(mapElement, {
            center,
            zoom: dayCheckpoints.length > 1 ? 11 : 13,
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

          dayMapsRef.current.set(dayNumber, map);

          const markers: any[] = [];

          // Add markers for all checkpoints
          dayCheckpoints.forEach((checkpoint, index) => {
            const marker = L.default
              .marker([checkpoint.lat, checkpoint.lng], {
                icon: L.default.divIcon({
                  className: "custom-marker",
                  html: `<div style="
                  background-color: #10b981;
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  color: white;
                  font-size: 14px;
                ">${index + 1}</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                }),
              })
              .addTo(map);

            marker.bindPopup(`
              <div style="padding: 10px; min-width: 220px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px; color: #1f2937;">${
                  checkpoint.name
                }</h3>
                ${
                  checkpoint.description
                    ? `<p style="margin: 4px 0; font-size: 13px; color: #666;">${checkpoint.description}</p>`
                    : ""
                }
                <p style="margin: 4px 0; font-size: 12px; color: #999;">${t("map.checkpoint")} ${
                  index + 1
                } - ${t("map.day")} ${dayNumber}</p>
              </div>
            `);
            markers.push(marker);
          });

          dayMarkersRef.current.set(dayNumber, markers);

          // Draw route if there are multiple checkpoints
          if (dayCheckpoints.length > 1) {
            const route = dayCheckpoints.map((cp) => [cp.lat, cp.lng]) as [
              number,
              number
            ][];

            L.default
              .polyline(route, {
                color: "#10b981",
                weight: 5,
                opacity: 0.9,
                smoothFactor: 1,
              })
              .addTo(map);

            // Fit bounds to show all markers
            const group = new L.default.FeatureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.15));
          } else if (dayCheckpoints.length === 1) {
            map.setView([dayCheckpoints[0].lat, dayCheckpoints[0].lng], 13);
          }
        });

        // Cleanup maps for collapsed days
        dayMapsRef.current.forEach((map, dayNum) => {
          if (!expandedDays.has(dayNum)) {
            map.remove();
            dayMapsRef.current.delete(dayNum);
            const markers = dayMarkersRef.current.get(dayNum) || [];
            markers.forEach((marker: any) => marker.remove());
            dayMarkersRef.current.delete(dayNum);
          }
        });
      } catch (error) {
        if (isMounted) {
          console.error("Error loading day maps:", error);
        }
      }
    };

    const timer = setTimeout(() => {
      if (isMounted) {
        initDayMaps();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      dayMapsRef.current.forEach((map) => map.remove());
      dayMapsRef.current.clear();
      dayMarkersRef.current.forEach((markers) => {
        markers.forEach((marker: any) => marker.remove());
      });
      dayMarkersRef.current.clear();
    };
  }, [expandedDays, tour]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Đang tải tour...</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Tour không tìm thấy
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Tour bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <button
            onClick={() => router.push("/tours")}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
          >
            Quay lại danh sách tours
          </button>
        </div>
      </div>
    );
  }

  // Extract checkpoints with coordinates from itinerary
  const providedEquipment = normalizeListField(tour.equipment_provided);
  const requiredEquipment = normalizeListField(tour.equipment_required);
  const availableDatePreview = normalizeListField(tour.available_dates).slice(
    0,
    4
  );
  const cancellationPolicyText =
    typeof tour.cancellation_policy === "string" &&
    tour.cancellation_policy.trim().length > 0
      ? tour.cancellation_policy
      : "Chính sách hủy đang được cập nhật. Vui lòng liên hệ VieGo để được hỗ trợ nhanh.";
  const bookingDeadlineLabel = tour.booking_deadline_days
    ? `Trước ${tour.booking_deadline_days} ngày`
    : "Chưa xác định";
  const bookingDeadlineDescription = tour.booking_deadline_days
    ? `Vui lòng đặt tour tối thiểu ${tour.booking_deadline_days} ngày trước ngày khởi hành để VieGo sắp xếp dịch vụ và đảm bảo chỗ cho bạn.`
    : "Nhà điều hành chưa cung cấp thời hạn đặt chỗ cụ thể. Hãy liên hệ để được tư vấn ngay.";
  const insuranceFromInclusions = Array.isArray(tour.inclusions)
    ? tour.inclusions.find((item: string) =>
        typeof item === "string" ? /bảo hiểm|insurance/i.test(item) : false
      )
    : undefined;
  const insuranceDetails =
    (typeof tour.insurance_details === "string" &&
    tour.insurance_details.trim().length > 0
      ? tour.insurance_details
      : null) ||
    (typeof tour.insurance_policy === "string" &&
    tour.insurance_policy.trim().length > 0
      ? tour.insurance_policy
      : null) ||
    insuranceFromInclusions ||
    "Tour chưa ghi nhận thông tin bảo hiểm cụ thể. VieGo sẽ hỗ trợ bạn bổ sung gói bảo hiểm phù hợp khi xác nhận đặt chỗ.";
  const fitnessLabel = tour.fitness_requirement
    ? t(`fitnessLevels.${tour.fitness_requirement}`) || tour.fitness_requirement
    : undefined;

  const otherInfoEntries = [
    {
      label: "Độ tuổi tham gia",
      value: tour.age_requirement || "Phù hợp cho mọi độ tuổi",
    },
    {
      label: "Thể lực khuyến nghị",
      value:
        fitnessLabel ||
        (tour.difficulty_level
          ? `Độ khó ${tour.difficulty_level}`
          : "Chưa có thông tin"),
    },
    {
      label: "Số người tối thiểu",
      value: tour.min_participants
        ? `${tour.min_participants} khách`
        : "Không giới hạn",
    },
    {
      label: "Số người tối đa",
      value: tour.max_participants
        ? `${tour.max_participants} khách`
        : "Theo thỏa thuận",
    },
  ];

  const extractCheckpoints = (
    itinerary: any
  ): Array<{
    name: string;
    lat: number;
    lng: number;
    description?: string;
    dayNumber?: number;
  }> => {
    const checkpoints: Array<{
      name: string;
      lat: number;
      lng: number;
      description?: string;
      dayNumber?: number;
    }> = [];

    if (!itinerary || typeof itinerary !== "object") return checkpoints;

    // Check if itinerary has days with checkpoints (new format)
    if (Array.isArray(itinerary)) {
      itinerary.forEach((day: any, dayIndex: number) => {
        const dayNumber = day.day_number || day.dayNumber || dayIndex + 1;
        if (day.checkpoints && Array.isArray(day.checkpoints)) {
          day.checkpoints.forEach((cp: any) => {
            if (cp.latitude && cp.longitude) {
              checkpoints.push({
                name: cp.checkpoint_name || cp.name || t("map.checkpoint"),
                lat: parseFloat(cp.latitude),
                lng: parseFloat(cp.longitude),
                description: cp.description || cp.checkpoint_description,
                dayNumber: dayNumber,
              });
            }
          });
        }
      });
    } else {
      // Old format - try to extract from object structure
      Object.entries(itinerary).forEach(
        ([key, day]: [string, any], dayIndex: number) => {
          const dayNumber = dayIndex + 1;
          if (day && typeof day === "object") {
            if (day.checkpoints && Array.isArray(day.checkpoints)) {
              day.checkpoints.forEach((cp: any) => {
                if (cp.latitude && cp.longitude) {
                  checkpoints.push({
                    name: cp.checkpoint_name || cp.name || t("map.checkpoint"),
                    lat: parseFloat(cp.latitude),
                    lng: parseFloat(cp.longitude),
                    description: cp.description || cp.checkpoint_description,
                    dayNumber: dayNumber,
                  });
                }
              });
            }
          }
        }
      );
    }

    return checkpoints;
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-20">
      {/* Background with Tour Image */}
      <div className="fixed inset-0 z-0">
        {tour?.featured_image && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80 dark:opacity-70 transition-opacity duration-500"
            style={{ backgroundImage: `url('${tour.featured_image}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-white/40 to-blue-50/50 dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/95 transition-colors duration-500"></div>
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 -right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Floating Back Button with Glass Effect */}
      <button
        onClick={handleBackToTours}
        className="fixed top-24 left-4 md:left-8 z-40 flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/50 dark:border-gray-700/50 rounded-full px-4 py-2.5 shadow-lg hover:bg-white/90 dark:hover:bg-gray-900/90 hover:shadow-xl transition-all text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400"
        aria-label="Quay lại trang tours"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium text-sm hidden sm:inline">{t("backToTours")}</span>
      </button>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery with Glass Effect */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/50 dark:border-gray-700/50">
              {allImages.length > 0 ? (
                <div className="relative">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={selectedImage || allImages[0]}
                      alt={String(tour.title)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  {/* Image Thumbnails */}
                  {allImages.length > 1 && (
                    <div className="p-4 grid grid-cols-4 gap-2">
                      {allImages.slice(0, 4).map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(img)}
                          className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                            (selectedImage || allImages[0]) === img
                              ? "border-teal-600 shadow-lg"
                              : "border-transparent hover:border-teal-300"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${String(tour.title)} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                      {allImages.length > 4 && (
                        <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                          <span className="text-gray-500 text-sm font-medium">
                            +{allImages.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={toggleFavorite}
                      className={`p-3 rounded-full backdrop-blur-sm transition-all ${
                        isFavorite
                          ? "bg-red-500 text-white"
                          : "bg-white/90 text-gray-700 hover:bg-white"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isFavorite ? "fill-current" : ""
                        }`}
                      />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-3 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                  <Camera className="w-20 h-20 text-white opacity-50" />
                </div>
              )}
            </div>
            {/* Tour Header */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/50 dark:border-gray-700/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                    {String(tour.title)}
                  </h1>

                  {/* Rating and Views */}
                  <div className="flex items-center gap-6 mb-4">
                    {tour.rating && (
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-lg text-gray-900 dark:text-white">
                          {tour.rating.toFixed(1)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          ({tour.reviews_count || 0} đánh giá)
                        </span>
                      </div>
                    )}
                    <div className="text-gray-500 dark:text-gray-400">
                      👁️ {String(tour.views_count || 0)} lượt xem
                    </div>
                  </div>

                  {/* Category and Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tour.category && (
                      <span className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">
                        {String(tour.category)}
                      </span>
                    )}
                    {tour.tags &&
                      tour.tags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-lg">
                {tour.description}
              </div>

              {/* Tour Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 rounded-xl p-4 text-center border border-teal-200 dark:border-teal-700">
                  <Clock className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                  <div className="font-bold text-gray-900 dark:text-white">
                    {String(tour.duration_days || tour.duration || "-")} ngày
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Thời lượng
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-700">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <div className="font-bold text-gray-900 dark:text-white">
                    {String(tour.min_participants || 1)}-
                    {String(tour.max_participants || 10)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Số người
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-700">
                  <MapPin className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <div className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">
                    {tour.starting_location || "-"}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Điểm xuất phát
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-4 text-center border border-orange-200 dark:border-orange-700">
                  <Award className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <div className="font-bold text-gray-900 dark:text-white capitalize">
                    {tour.difficulty_level || tour.difficulty || "-"}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Độ khó
                  </div>
                </div>
              </div>
            </div>
            {/* Tab Navigation */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/50 dark:border-gray-700/50">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400"
                          : "text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                        Mô Tả Tour
                      </h3>
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {String(tour.description)}
                      </div>
                    </div>
                  </div>
                )}
                {/* Itinerary Tab */}
                {activeTab === "itinerary" && (
                  <div key={`itinerary-${tour.id}-${expandedDays.size}`}>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                      Lịch Trình Chi Tiết
                    </h3>
                    {tour.itinerary && typeof tour.itinerary === "object" ? (
                      formatItinerary(tour.itinerary)
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <p>Đang cập nhật lịch trình...</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Map Tab */}
                {activeTab === "map" && (
                  <div>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                      <MapIcon className="w-6 h-6" />
                      Bản Đồ Hành Trình
                    </h3>
                    {typeof window !== "undefined" && (
                      <div
                        id="tour-detail-map"
                        className="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700"
                        style={{ zIndex: 1 }}
                      />
                    )}
                    {extractCheckpoints(tour.itinerary).length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <MapIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <p>Chưa có thông tin địa điểm trên bản đồ</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Includes Tab */}
                {activeTab === "includes" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="w-6 h-6" />
                        Bao gồm
                      </h3>
                      <ul className="space-y-3">
                        {(tour.inclusions || []).length > 0 ? (
                          tour.inclusions.map((inc: string, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {inc}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500 dark:text-gray-400">
                            Đang cập nhật...
                          </li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-700 dark:text-red-400">
                        <XCircle className="w-6 h-6" />
                        Không bao gồm
                      </h3>
                      <ul className="space-y-3">
                        {(tour.exclusions || []).length > 0 ? (
                          tour.exclusions.map((ex: string, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {ex}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500 dark:text-gray-400">
                            Đang cập nhật...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Policies Tab */}
                {activeTab === "policies" && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-3">
                        <FileText className="w-6 h-6 text-teal-600" />
                        Chính Sách & Điều Kiện
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 p-5">
                          <div className="flex items-start gap-3">
                            <CalendarDays className="w-5 h-5 text-indigo-500 mt-1" />
                            <div>
                              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                Thời hạn đặt chỗ
                              </p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {bookingDeadlineLabel}
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                            {bookingDeadlineDescription}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 p-5">
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-rose-500 mt-1" />
                            <div>
                              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                Chính sách hủy / hoàn tiền
                              </p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                Cập nhật bởi VieGo
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                            {cancellationPolicyText}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Bảo hiểm & An toàn
                        </h4>
                      </div>
                      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-900/20 p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <LifeBuoy className="w-5 h-5 text-emerald-600 mt-1" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                              Thông tin bảo hiểm
                            </p>
                            <p className="text-gray-800 dark:text-gray-100">
                              {insuranceDetails}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/80 dark:bg-gray-900/40 border border-white/60 dark:border-gray-700 p-4">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Gợi ý chuẩn bị an toàn
                          </p>
                          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <li className="flex gap-2">
                              <span className="text-emerald-500">•</span>
                              <span>
                                {providedEquipment.length > 0
                                  ? `VieGo cung cấp sẵn: ${providedEquipment
                                      .slice(0, 4)
                                      .join(", ")}${
                                      providedEquipment.length > 4 ? "..." : ""
                                    }`
                                  : "Trang bị an toàn cơ bản sẽ được hướng dẫn khi khởi hành."}
                              </span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-emerald-500">•</span>
                              <span>
                                {requiredEquipment.length > 0
                                  ? `Nên chuẩn bị thêm: ${requiredEquipment
                                      .slice(0, 4)
                                      .join(", ")}${
                                      requiredEquipment.length > 4 ? "..." : ""
                                    }`
                                  : "Bạn chỉ cần mang theo giấy tờ tùy thân và các vật dụng cá nhân cần thiết."}
                              </span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-emerald-500">•</span>
                              <span>
                                {fitnessLabel
                                  ? `Mức độ thể lực khuyến nghị: ${fitnessLabel}.`
                                  : "Tour phù hợp với nhiều thể trạng; hướng dẫn viên sẽ điều chỉnh nhịp độ theo đoàn."}
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Info className="w-6 h-6 text-sky-600" />
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Thông tin khác
                        </h4>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {otherInfoEntries.map((entry, idx) => (
                          <div
                            key={`other-info-${idx}`}
                            className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white/80 dark:bg-gray-800/60"
                          >
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              {entry.label}
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {entry.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-4">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
                          {t("booking.featuredDeparture")}
                        </p>
                        {availableDatePreview.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {availableDatePreview.map((date, idx) => (
                              <span
                                key={`date-chip-${idx}`}
                                className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm font-medium dark:bg-sky-900/30 dark:text-sky-200"
                              >
                                {formatDisplayDate(date)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Lịch khởi hành sẽ được cập nhật khi có slot mới.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                  <div>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                      {t("reviews.sectionTitle")} ({reviews.length || tour.reviews_count || 0})
                    </h3>

                    {/* Review Form */}
                    <div className="mb-8 bg-white/50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                      <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                        Viết đánh giá của bạn
                      </h4>
                      <form onSubmit={handleSubmitReview}>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("reviews.rating")}
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                onClick={() =>
                                  setNewReview({ ...newReview, rating: star })
                                }
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-8 h-8 ${
                                    star <= newReview.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nội dung đánh giá
                          </label>
                          <textarea
                            value={newReview.content}
                            onChange={(e) =>
                              setNewReview({
                                ...newReview,
                                content: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            rows={4}
                            placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
                            required
                          ></textarea>
                        </div>
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {submittingReview ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              {t("reviews.submitting")}
                            </>
                          ) : (
                            t("reviews.submit")
                          )}
                        </button>
                      </form>
                    </div>

                    {loadingReviews ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-teal-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải đánh giá...</p>
                      </div>
                    ) : reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                {review.user?.avatar_url ? (
                                  <img
                                    src={review.user.avatar_url}
                                    alt={review.user.full_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <UserCircle className="w-full h-full text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-gray-900 dark:text-white">
                                    {review.user?.full_name ||
                                      t("reviews.anonymousUser")}
                                  </h4>
                                  <span className="text-sm text-gray-500">
                                    {new Date(
                                      review.created_at
                                    ).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mb-3">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-gray-700 dark:text-gray-300">
                                  {review.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p>
                          Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá
                          tour này!
                        </p>
                      </div>
                    )}

                    {/* Submit Review Form */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                        {t("reviews.submitYourReview")}
                      </h4>
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t("reviews.writeReview")}
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-6 h-6 cursor-pointer transition-all ${
                                    i < newReview.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                  onClick={() =>
                                    setNewReview({
                                      ...newReview,
                                      rating: i + 1,
                                    })
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nội dung đánh giá
                          </label>
                          <textarea
                            value={newReview.content}
                            onChange={(e) =>
                              setNewReview({
                                ...newReview,
                                content: e.target.value,
                              })
                            }
                            className="w-full p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none h-24"
                            placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
                            required
                          />
                        </div>
                        <motion.button
                          type="submit"
                          className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold text-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={submittingReview}
                        >
                          {submittingReview ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                              Đang gửi đánh giá...
                            </>
                          ) : (
                            t("reviews.submitButton")
                          )}
                        </motion.button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Info */}
            {tour.seller && (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-teal-600" />
                  Thông tin nhà tổ chức
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                    {tour.seller.avatar_url ? (
                      <img
                        src={tour.seller.avatar_url}
                        alt={tour.seller.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-full h-full text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/profile/${tour.seller.username}`}
                      className="font-bold text-lg text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      {tour.seller.company_name || tour.seller.full_name}
                    </Link>
                    <Link
                      href={`/profile/${tour.seller.username}`}
                      className="block text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      @{tour.seller.username}
                    </Link>
                    {tour.seller.company_phone && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        📞 {tour.seller.company_phone}
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  href={`/profile/${tour.seller.username}`}
                  className="block w-full py-2 text-center border border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors font-medium"
                >
                  Xem hồ sơ
                </Link>
              </div>
            )}
          </div>

          {/* Booking Sidebar - Tour Info & Book Button */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border-2 border-teal-100/50 dark:border-teal-900/50">
              {/* Price Display */}
              <div className="mb-6 pb-6 border-b-2 border-gray-200">
                <div className="text-sm text-gray-600 mb-2">{t("details.price")}</div>
                {tour.discount_percentage && tour.discount_percentage > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-3xl font-bold text-red-600">
                        {formatPrice(discountPrice)}
                      </div>
                      <div className="text-lg text-gray-400 line-through">
                        {formatPrice(originalPrice)}
                      </div>
                    </div>
                    <div className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                      -{tour.discount_percentage}% OFF
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-teal-600">
                    {formatPrice(originalPrice)}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">/ người</div>
              </div>

              {/* Tour Quick Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>
                    {t("details.duration")} {tour.duration_days || tour.duration || "-"} {t("details.days")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>Khởi hành: {tour.starting_location || "-"}</span>
                </div>
                {tour.max_participants && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>Tối đa: {tour.max_participants} người</span>
                  </div>
                )}
                {tour.min_participants && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>Tối thiểu: {tour.min_participants} người</span>
                  </div>
                )}
              </div>

              {/* Book Now Button */}
              <motion.button
                onClick={handleBooking}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl mb-6"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ĐẶT NGAY
              </motion.button>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <span>Đảm bảo hoàn tiền 100% nếu hủy trước 24h</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Award className="w-5 h-5 text-teal-600" />
                  <span>Được đánh giá cao bởi khách hàng</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <span>Xác nhận ngay lập tức</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LoginRequestPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
      />
    </div>
  );
}
