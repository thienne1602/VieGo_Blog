"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MapPin,
  Navigation,
  AlertTriangle,
  Phone,
  X,
  RefreshCcw,
  Locate,
  Shield,
  Bell,
  User,
  Radio,
  Battery,
  Clock,
  ChevronDown,
  ChevronUp,
  Route,
  Timer,
  Compass,
} from "lucide-react";
import type {
  MemberLocation,
  SOSAlert,
  GeofenceAlert,
  Geofence,
} from "@/hooks/useTourLocationTracking";
import { QUICK_HELP_MESSAGES } from "@/hooks/useTourLocationTracking";

interface MemberLocationMapProps {
  members: MemberLocation[];
  sosAlerts: SOSAlert[];
  geofenceAlerts: GeofenceAlert[];
  geofences: Geofence[];
  myLocation: GeolocationCoordinates | null;
  isTracking: boolean;
  isGuide: boolean;
  currentUserId: number | null;
  onTriggerSOS: (message?: string) => void;
  onTriggerQuickSOS: () => void;
  onSendHelpRequest: (
    message: string,
    severity?: "high" | "medium" | "low"
  ) => void;
  onClearSOS: (userId: number) => void;
  onPingMember: (userId: number) => void;
  onRefresh: () => void;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Estimate walking time (average 5 km/h)
function estimateWalkingTime(distanceInMeters: number): string {
  const walkingSpeedMps = 5000 / 3600; // 5 km/h in m/s
  const timeInSeconds = distanceInMeters / walkingSpeedMps;

  if (timeInSeconds < 60) {
    return "< 1 phút";
  } else if (timeInSeconds < 3600) {
    const minutes = Math.round(timeInSeconds / 60);
    return `${minutes} phút`;
  } else {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.round((timeInSeconds % 3600) / 60);
    return `${hours}h ${minutes}p`;
  }
}

// Format distance
function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)}km`;
}

export default function MemberLocationMap({
  members,
  sosAlerts,
  geofenceAlerts,
  geofences,
  myLocation,
  isTracking,
  isGuide,
  currentUserId,
  onTriggerSOS,
  onTriggerQuickSOS,
  onSendHelpRequest,
  onClearSOS,
  onPingMember,
  onRefresh,
  onStartTracking,
  onStopTracking,
}: MemberLocationMapProps) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const geofenceCirclesRef = useRef<Map<number, any>>(new Map());
  const routeLayerRef = useRef<any>(null);
  const [showMemberList, setShowMemberList] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberLocation | null>(
    null
  );
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showQuickHelpModal, setShowQuickHelpModal] = useState(false);
  const [sosMessage, setSOSMessage] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showRouteToMember, setShowRouteToMember] =
    useState<MemberLocation | null>(null);

  // Audio refs for notification sounds
  const sosAudioRef = useRef<HTMLAudioElement | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== "undefined") {
      sosAudioRef.current = new Audio("/sounds/sos.mp3");
      notificationAudioRef.current = new Audio("/sounds/notification.mp3");
      sosAudioRef.current.preload = "auto";
      notificationAudioRef.current.preload = "auto";
    }
  }, []);

  // Play sound on SOS alert
  useEffect(() => {
    if (sosAlerts.length > 0) {
      const latestAlert = sosAlerts[sosAlerts.length - 1];
      if (
        latestAlert.alert_type === "sos" ||
        latestAlert.severity === "critical"
      ) {
        sosAudioRef.current?.play().catch(() => {});
      } else {
        notificationAudioRef.current?.play().catch(() => {});
      }
    }
  }, [sosAlerts.length]);

  // Play sound on geofence alert
  useEffect(() => {
    if (geofenceAlerts.length > 0) {
      notificationAudioRef.current?.play().catch(() => {});
    }
  }, [geofenceAlerts.length]);

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = async () => {
      try {
        const L = await import("leaflet");

        const mapElement = document.getElementById("member-location-map");
        if (!mapElement || mapRef.current) return;

        // Default center (Vietnam)
        const defaultCenter: [number, number] = [10.762622, 106.660172];

        // Find center from members or my location
        let center = defaultCenter;
        if (myLocation) {
          center = [myLocation.latitude, myLocation.longitude];
        } else if (members.length > 0) {
          const firstMember = members.find((m) => m.location?.latitude);
          if (firstMember) {
            center = [
              firstMember.location.latitude,
              firstMember.location.longitude,
            ];
          }
        }

        const map = L.default.map(mapElement, {
          center,
          zoom: 15,
          zoomControl: true,
        });

        L.default
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
          })
          .addTo(map);

        mapRef.current = map;
        setMapLoaded(true);

        // Add CSS for custom markers
        const style = document.createElement("style");
        style.textContent = `
          .member-marker {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-weight: bold;
            color: white;
            font-size: 12px;
          }
          .member-marker.tour-guide {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            width: 36px;
            height: 36px;
          }
          .member-marker.participant {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            width: 28px;
            height: 28px;
          }
          .member-marker.leader {
            background: linear-gradient(135deg, #10b981, #059669);
            width: 32px;
            height: 32px;
          }
          .member-marker.sos {
            background: linear-gradient(135deg, #ef4444, #dc2626) !important;
            animation: sos-pulse 1s infinite;
          }
          .member-marker.me {
            border-color: #10b981;
            border-width: 4px;
          }
          @keyframes sos-pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            50% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          }
          .geofence-popup {
            text-align: center;
          }
        `;
        document.head.appendChild(style);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      geofenceCirclesRef.current.clear();
    };
  }, []);

  // Update markers when members change
  useEffect(() => {
    console.log("[MemberLocationMap] updateMarkers effect triggered", {
      mapLoaded,
      mapRefExists: !!mapRef.current,
      membersCount: members.length,
      members: members.map((m) => ({
        id: m.id,
        name: m.member_name,
        lat: m.location?.latitude,
        lng: m.location?.longitude,
      })),
    });

    if (!mapRef.current || !mapLoaded) {
      console.log("[MemberLocationMap] Map not ready yet");
      return;
    }

    const updateMarkers = async () => {
      const L = await import("leaflet");

      console.log(
        "[MemberLocationMap] Updating markers for",
        members.length,
        "members"
      );

      // Remove old markers that are no longer in members
      markersRef.current.forEach((marker, id) => {
        if (!members.find((m) => m.id === id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });

      // Add or update markers
      members.forEach((member) => {
        console.log(
          "[MemberLocationMap] Processing member:",
          member.member_name,
          member.location
        );

        if (!member.location?.latitude || !member.location?.longitude) {
          console.log(
            "[MemberLocationMap] Skipping member - no location:",
            member.member_name
          );
          return;
        }

        const isMe = member.user_id === currentUserId;
        const hasSOS =
          member.is_sos || sosAlerts.some((a) => a.user_id === member.user_id);

        const markerClass = `member-marker ${member.member_type} ${
          hasSOS ? "sos" : ""
        } ${isMe ? "me" : ""}`;
        const initial = member.member_name?.charAt(0)?.toUpperCase() || "?";
        const icon =
          member.member_type === "tour_guide" ? "👨‍✈️" : isMe ? "📍" : initial;

        const divIcon = L.default.divIcon({
          className: "custom-div-icon",
          html: `<div class="${markerClass}">${icon}</div>`,
          iconSize: member.member_type === "tour_guide" ? [36, 36] : [28, 28],
          iconAnchor: member.member_type === "tour_guide" ? [18, 18] : [14, 14],
        });

        if (markersRef.current.has(member.id)) {
          // Update existing marker position
          const marker = markersRef.current.get(member.id);
          marker.setLatLng([
            member.location.latitude,
            member.location.longitude,
          ]);
          marker.setIcon(divIcon);
        } else {
          // Create new marker
          const marker = L.default
            .marker([member.location.latitude, member.location.longitude], {
              icon: divIcon,
            })
            .addTo(mapRef.current);

          // Popup content
          const popupContent = `
            <div style="min-width: 180px; padding: 8px;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
                ${member.member_name} ${isMe ? "(Bạn)" : ""}
              </div>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                ${
                  member.member_type === "tour_guide"
                    ? "🎖️ Hướng dẫn viên"
                    : member.member_type === "leader"
                    ? "⭐ Trưởng đoàn"
                    : "👤 Thành viên"
                }
              </div>
              ${
                member.battery_level !== null
                  ? `
                <div style="font-size: 11px; color: ${
                  member.battery_level < 20 ? "#ef4444" : "#666"
                };">
                  🔋 ${member.battery_level}%
                </div>
              `
                  : ""
              }
              ${
                member.location_timestamp
                  ? `
                <div style="font-size: 11px; color: #999;">
                  ⏱️ ${new Date(member.location_timestamp).toLocaleTimeString(
                    "vi-VN"
                  )}
                </div>
              `
                  : ""
              }
              ${
                hasSOS
                  ? `
                <div style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; margin-top: 8px; font-weight: bold;">
                  🆘 ĐANG CẦN HỖ TRỢ
                </div>
              `
                  : ""
              }
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on("click", () => setSelectedMember(member));

          markersRef.current.set(member.id, marker);
        }
      });

      // Fit bounds if we have multiple members
      if (members.length > 1) {
        const validMembers = members.filter((m) => m.location?.latitude);
        if (validMembers.length > 1) {
          const bounds = L.default.latLngBounds(
            validMembers.map((m) => [m.location.latitude, m.location.longitude])
          );
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    };

    updateMarkers();
  }, [members, sosAlerts, currentUserId, mapLoaded]);

  // Update geofences circles
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const updateGeofences = async () => {
      const L = await import("leaflet");

      // Remove old circles
      geofenceCirclesRef.current.forEach((circle, id) => {
        if (!geofences.find((g) => g.id === id)) {
          circle.remove();
          geofenceCirclesRef.current.delete(id);
        }
      });

      // Add or update circles
      geofences.forEach((fence) => {
        if (!fence.center?.latitude || !fence.center?.longitude) return;

        const color =
          fence.fence_type === "safety_zone"
            ? "#22c55e"
            : fence.fence_type === "meeting_point"
            ? "#3b82f6"
            : fence.fence_type === "restricted"
            ? "#ef4444"
            : "#f59e0b";

        if (geofenceCirclesRef.current.has(fence.id)) {
          const circle = geofenceCirclesRef.current.get(fence.id);
          circle.setLatLng([fence.center.latitude, fence.center.longitude]);
          circle.setRadius(fence.radius);
        } else {
          const circle = L.default
            .circle([fence.center.latitude, fence.center.longitude], {
              color,
              fillColor: color,
              fillOpacity: 0.1,
              radius: fence.radius,
              weight: 2,
              dashArray: fence.fence_type === "restricted" ? "5, 5" : undefined,
            })
            .addTo(mapRef.current);

          circle.bindPopup(`
            <div class="geofence-popup">
              <strong>${fence.name}</strong>
              <br/>
              <span style="font-size: 12px; color: #666;">
                ${
                  fence.fence_type === "safety_zone"
                    ? "🛡️ Vùng an toàn"
                    : fence.fence_type === "meeting_point"
                    ? "📍 Điểm tập trung"
                    : fence.fence_type === "restricted"
                    ? "⚠️ Vùng hạn chế"
                    : "📌 Checkpoint"
                }
              </span>
              <br/>
              <span style="font-size: 11px; color: #999;">Bán kính: ${
                fence.radius
              }m</span>
            </div>
          `);

          geofenceCirclesRef.current.set(fence.id, circle);
        }
      });
    };

    updateGeofences();
  }, [geofences, mapLoaded]);

  // Center map on my location
  const centerOnMe = useCallback(() => {
    if (!mapRef.current || !myLocation) return;
    mapRef.current.setView([myLocation.latitude, myLocation.longitude], 17);
  }, [myLocation]);

  // Center map on a member
  const centerOnMember = useCallback((member: MemberLocation) => {
    if (!mapRef.current || !member.location?.latitude) return;
    mapRef.current.setView(
      [member.location.latitude, member.location.longitude],
      17
    );
    setSelectedMember(member);
  }, []);

  // Show route to a member
  const showRouteTo = useCallback(
    async (member: MemberLocation) => {
      if (!mapRef.current || !myLocation || !member.location?.latitude) return;

      const L = await import("leaflet");

      // Remove existing route
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
      }

      // Draw a simple line from my location to member
      const route = L.default
        .polyline(
          [
            [myLocation.latitude, myLocation.longitude],
            [member.location.latitude, member.location.longitude],
          ],
          {
            color: member.is_sos ? "#ef4444" : "#3b82f6",
            weight: 4,
            opacity: 0.8,
            dashArray: "10, 10",
          }
        )
        .addTo(mapRef.current);

      routeLayerRef.current = route;
      setShowRouteToMember(member);

      // Fit bounds to show both points
      const bounds = L.default.latLngBounds([
        [myLocation.latitude, myLocation.longitude],
        [member.location.latitude, member.location.longitude],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    },
    [myLocation]
  );

  // Clear route display
  const clearRoute = useCallback(() => {
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    setShowRouteToMember(null);
  }, []);

  // Handle SOS submit
  const handleSOSSubmit = () => {
    onTriggerSOS(sosMessage || undefined);
    setShowSOSModal(false);
    setSOSMessage("");
  };

  // Get member type label
  const getMemberTypeLabel = (type: string) => {
    switch (type) {
      case "tour_guide":
        return "Hướng dẫn viên";
      case "leader":
        return "Trưởng đoàn";
      default:
        return "Thành viên";
    }
  };

  // Get time ago
  const getTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return "N/A";
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    return `${hours} giờ trước`;
  };

  // Debug logging
  useEffect(() => {
    console.log("[MemberLocationMap] Props received:", {
      membersCount: members.length,
      members: members,
      sosAlertsCount: sosAlerts.length,
      geofencesCount: geofences.length,
      myLocation: myLocation,
      isTracking: isTracking,
      mapLoaded: mapLoaded,
    });
  }, [members, sosAlerts, geofences, myLocation, isTracking, mapLoaded]);

  return (
    <div className="relative bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Radio className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Định vị thành viên
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {members.length} thành viên đang được theo dõi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới"
          >
            <RefreshCcw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          {isTracking ? (
            <button
              onClick={onStopTracking}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              Dừng định vị
            </button>
          ) : (
            <button
              onClick={onStartTracking}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              Bắt đầu định vị
            </button>
          )}
        </div>
      </div>

      {/* Map Container - Fixed height */}
      <div className="relative" style={{ height: "500px" }}>
        <div id="member-location-map" className="absolute inset-0 z-0" />

        {/* Loading/No data overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-5">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-gray-400">
                Đang tải bản đồ...
              </p>
            </div>
          </div>
        )}

        {mapLoaded && members.length === 0 && (
          <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center z-5 backdrop-blur-sm">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-sm">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Chưa có vị trí nào
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Bắt đầu chia sẻ vị trí để xem bản đồ theo dõi thành viên
              </p>
              {!isTracking && (
                <button
                  onClick={onStartTracking}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition flex items-center gap-2 mx-auto"
                >
                  <Radio className="w-4 h-4" />
                  Bắt đầu chia sẻ vị trí
                </button>
              )}
            </div>
          </div>
        )}

        {/* SOS Alerts Banner */}
        <AnimatePresence>
          {sosAlerts.length > 0 && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className={`absolute top-0 left-0 right-0 z-20 p-3 ${
                sosAlerts.some(
                  (a) => a.alert_type === "sos" || a.severity === "critical"
                )
                  ? "bg-red-600"
                  : "bg-amber-500"
              } text-white`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                  <span className="font-bold">
                    {sosAlerts.some(
                      (a) => a.alert_type === "sos" || a.severity === "critical"
                    )
                      ? `🆘 ${
                          sosAlerts.filter(
                            (a) =>
                              a.alert_type === "sos" ||
                              a.severity === "critical"
                          ).length
                        } tín hiệu SOS!`
                      : `🔔 ${sosAlerts.length} yêu cầu hỗ trợ`}
                  </span>
                </div>
                {isGuide && sosAlerts.length > 0 && (
                  <button
                    onClick={() =>
                      centerOnMember(
                        members.find(
                          (m) => m.user_id === sosAlerts[0].user_id
                        ) || members[0]
                      )
                    }
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      sosAlerts.some(
                        (a) =>
                          a.alert_type === "sos" || a.severity === "critical"
                      )
                        ? "bg-white text-red-600 hover:bg-red-50"
                        : "bg-white text-amber-600 hover:bg-amber-50"
                    }`}
                  >
                    Xem vị trí
                  </button>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {sosAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between text-sm rounded px-2 py-1 ${
                      alert.alert_type === "sos" ||
                      alert.severity === "critical"
                        ? "bg-red-700/50"
                        : "bg-amber-600/50"
                    }`}
                  >
                    <span>
                      {alert.alert_type === "sos" ||
                      alert.severity === "critical"
                        ? "🆘"
                        : "🔔"}{" "}
                      <strong>{alert.member_name}</strong>: {alert.message}
                    </span>
                    {isGuide && (
                      <button
                        onClick={() => onClearSOS(alert.user_id)}
                        className="text-white/80 hover:text-white underline text-xs"
                      >
                        Xử lý xong
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Geofence Alerts */}
        <AnimatePresence>
          {geofenceAlerts.length > 0 && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className={`absolute ${
                sosAlerts.length > 0 ? "top-24" : "top-0"
              } left-0 right-0 z-10 bg-yellow-500 text-white p-2`}
            >
              {geofenceAlerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Bell className="w-4 h-4" />
                  <span>{alert.message}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Làm mới"
          >
            <RefreshCcw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Center on me */}
          {myLocation && (
            <button
              onClick={centerOnMe}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Về vị trí của tôi"
            >
              <Locate className="w-5 h-5 text-blue-600" />
            </button>
          )}

          {/* Toggle tracking */}
          <button
            onClick={isTracking ? onStopTracking : onStartTracking}
            className={`p-2 rounded-lg shadow-lg ${
              isTracking
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            title={isTracking ? "Dừng theo dõi" : "Bắt đầu theo dõi"}
          >
            <Radio
              className={`w-5 h-5 ${
                isTracking
                  ? "animate-pulse"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            />
          </button>

          {/* Toggle member list */}
          <button
            onClick={() => setShowMemberList(!showMemberList)}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Danh sách thành viên"
          >
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* SOS Button - for participants */}
        {!isGuide && (
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
            {/* Quick SOS Button */}
            <button
              onClick={onTriggerQuickSOS}
              className="flex items-center gap-2 px-5 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg font-bold text-lg"
              style={{ animation: "pulse 2s infinite" }}
            >
              <AlertTriangle className="w-7 h-7" />
              🆘 SOS
            </button>

            {/* Help Request Button */}
            <button
              onClick={() => setShowQuickHelpModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg font-medium text-sm"
            >
              <Bell className="w-4 h-4" />
              Cần hỗ trợ
            </button>

            {/* Custom SOS Message */}
            <button
              onClick={() => setShowSOSModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg font-medium text-sm"
            >
              <Phone className="w-4 h-4" />
              Nhắn HDV
            </button>
          </div>
        )}

        {/* Member List Panel */}
        <AnimatePresence>
          {showMemberList && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute top-4 left-4 bottom-20 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 overflow-hidden flex flex-col"
            >
              <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Thành viên ({members.length})
                  </h3>
                  <button onClick={() => setShowMemberList(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {/* Tour Guide first */}
                {members
                  .filter((m) => m.member_type === "tour_guide")
                  .map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      isMe={member.user_id === currentUserId}
                      hasSOS={
                        member.is_sos ||
                        sosAlerts.some((a) => a.user_id === member.user_id)
                      }
                      isGuide={isGuide}
                      myLocation={myLocation}
                      onCenter={() => centerOnMember(member)}
                      onPing={() =>
                        member.user_id && onPingMember(member.user_id)
                      }
                      onShowRoute={() => showRouteTo(member)}
                      getTimeAgo={getTimeAgo}
                      getMemberTypeLabel={getMemberTypeLabel}
                    />
                  ))}

                {/* Then other members */}
                {members
                  .filter((m) => m.member_type !== "tour_guide")
                  .map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      isMe={member.user_id === currentUserId}
                      hasSOS={
                        member.is_sos ||
                        sosAlerts.some((a) => a.user_id === member.user_id)
                      }
                      isGuide={isGuide}
                      myLocation={myLocation}
                      onCenter={() => centerOnMember(member)}
                      onPing={() =>
                        member.user_id && onPingMember(member.user_id)
                      }
                      onShowRoute={() => showRouteTo(member)}
                      getTimeAgo={getTimeAgo}
                      getMemberTypeLabel={getMemberTypeLabel}
                    />
                  ))}

                {members.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có thành viên nào</p>
                    <p className="text-sm">đang chia sẻ vị trí</p>
                  </div>
                )}
              </div>

              {/* Tracking status */}
              <div className="p-2 border-t dark:border-gray-700 text-xs text-center">
                {isTracking ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Đang chia sẻ vị trí
                  </span>
                ) : (
                  <span className="text-gray-500">Chưa chia sẻ vị trí</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SOS Modal */}
        <AnimatePresence>
          {showSOSModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowSOSModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Gửi tín hiệu SOS
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    Hướng dẫn viên sẽ nhận được thông báo ngay lập tức
                  </p>
                </div>

                <textarea
                  value={sosMessage}
                  onChange={(e) => setSOSMessage(e.target.value)}
                  placeholder="Mô tả tình huống của bạn (tùy chọn)..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowSOSModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSOSSubmit}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                  >
                    🆘 Gửi SOS
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Help Modal */}
        <AnimatePresence>
          {showQuickHelpModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowQuickHelpModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-10 h-10 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Cần hỗ trợ
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    Chọn tình huống để thông báo nhanh cho hướng dẫn viên
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {QUICK_HELP_MESSAGES.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSendHelpRequest(item.message, "medium");
                        setShowQuickHelpModal(false);
                      }}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowQuickHelpModal(false)}
                  className="w-full mt-4 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Đóng
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Route Info Popup */}
        <AnimatePresence>
          {showRouteToMember && myLocation && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-4 right-4 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 max-w-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Lộ trình đến {showRouteToMember.member_name}
                </h4>
                <button
                  onClick={clearRoute}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {showRouteToMember.location?.latitude && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Compass className="w-4 h-4 text-blue-500" />
                    <span>
                      Khoảng cách:{" "}
                      <strong>
                        {formatDistance(
                          calculateDistance(
                            myLocation.latitude,
                            myLocation.longitude,
                            showRouteToMember.location.latitude,
                            showRouteToMember.location.longitude
                          )
                        )}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Timer className="w-4 h-4 text-amber-500" />
                    <span>
                      Thời gian đi bộ:{" "}
                      <strong>
                        {estimateWalkingTime(
                          calculateDistance(
                            myLocation.latitude,
                            myLocation.longitude,
                            showRouteToMember.location.latitude,
                            showRouteToMember.location.longitude
                          )
                        )}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Navigation className="w-4 h-4 text-emerald-500" />
                    <span>
                      Hướng:{" "}
                      <strong>
                        {getDirectionTo(
                          myLocation.latitude,
                          myLocation.longitude,
                          showRouteToMember.location.latitude,
                          showRouteToMember.location.longitude
                        )}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (
                    showRouteToMember.location?.latitude &&
                    showRouteToMember.location?.longitude
                  ) {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&origin=${myLocation.latitude},${myLocation.longitude}&destination=${showRouteToMember.location.latitude},${showRouteToMember.location.longitude}&travelmode=walking`,
                      "_blank"
                    );
                  }
                }}
                className="mt-3 w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Mở Google Maps
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* End Map Container */}
    </div>
  );
}

// Get cardinal direction
function getDirectionTo(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const angle = (Math.atan2(dLon, dLat) * 180) / Math.PI;

  if (angle >= -22.5 && angle < 22.5) return "Bắc";
  if (angle >= 22.5 && angle < 67.5) return "Đông Bắc";
  if (angle >= 67.5 && angle < 112.5) return "Đông";
  if (angle >= 112.5 && angle < 157.5) return "Đông Nam";
  if (angle >= 157.5 || angle < -157.5) return "Nam";
  if (angle >= -157.5 && angle < -112.5) return "Tây Nam";
  if (angle >= -112.5 && angle < -67.5) return "Tây";
  if (angle >= -67.5 && angle < -22.5) return "Tây Bắc";

  return "Không xác định";
}

// Member Card Component
function MemberCard({
  member,
  isMe,
  hasSOS,
  isGuide,
  myLocation,
  onCenter,
  onPing,
  onShowRoute,
  getTimeAgo,
  getMemberTypeLabel,
}: {
  member: MemberLocation;
  isMe: boolean;
  hasSOS: boolean;
  isGuide: boolean;
  myLocation: GeolocationCoordinates | null;
  onCenter: () => void;
  onPing: () => void;
  onShowRoute: () => void;
  getTimeAgo: (timestamp: string | null) => string;
  getMemberTypeLabel: (type: string) => string;
}) {
  // Calculate distance and time to member
  const distance =
    myLocation && member.location?.latitude
      ? calculateDistance(
          myLocation.latitude,
          myLocation.longitude,
          member.location.latitude,
          member.location.longitude
        )
      : null;

  const walkingTime = distance ? estimateWalkingTime(distance) : null;

  return (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-all ${
        hasSOS
          ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-500 animate-pulse"
          : isMe
          ? "bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700"
          : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
      onClick={onCenter}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
            member.member_type === "tour_guide"
              ? "bg-gradient-to-br from-amber-500 to-orange-600"
              : member.member_type === "leader"
              ? "bg-gradient-to-br from-emerald-500 to-green-600"
              : "bg-gradient-to-br from-blue-500 to-indigo-600"
          }`}
        >
          {member.member_type === "tour_guide"
            ? "👨‍✈️"
            : member.member_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">
            {member.member_name} {isMe && "(Bạn)"}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {getMemberTypeLabel(member.member_type)}
          </div>
        </div>
        {hasSOS && (
          <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse">
            SOS
          </span>
        )}
      </div>

      {/* Distance and Time Info */}
      {!isMe && distance !== null && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
            <Compass className="w-3 h-3" />
            {formatDistance(distance)}
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Timer className="w-3 h-3" />~{walkingTime}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowRoute();
            }}
            className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            title="Xem lộ trình"
          >
            <Route className="w-3 h-3" />
            Lộ trình
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {getTimeAgo(member.location_timestamp)}
        </span>
        {member.battery_level !== null && (
          <span
            className={`flex items-center gap-1 ${
              member.battery_level < 20 ? "text-red-500" : ""
            }`}
          >
            <Battery className="w-3 h-3" />
            {member.battery_level}%
          </span>
        )}
      </div>

      {isGuide && !isMe && member.user_id && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPing();
          }}
          className="mt-2 w-full py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
        >
          📍 Yêu cầu cập nhật vị trí
        </button>
      )}
    </div>
  );
}
