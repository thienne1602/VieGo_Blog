"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/lib/SocketContext";
import { useAuth } from "@/lib/AuthContext";
import { getAccessToken } from "@/lib/storage-utils";

export interface MemberLocation {
  id: number;
  booking_id: number;
  user_id: number | null;
  participant_id: number | null;
  member_type: "tour_guide" | "participant" | "leader";
  member_name: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    heading: number | null;
    speed: number | null;
  };
  location_source: "gps" | "network" | "manual";
  battery_level: number | null;
  is_active: boolean;
  is_sos: boolean;
  sos_message: string | null;
  location_timestamp: string | null;
  server_timestamp: string | null;
  updated_at: string | null;
  user?: {
    id: number;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface SOSAlert {
  booking_id: number;
  user_id: number;
  member_name: string;
  message: string;
  location: {
    latitude: number | null;
    longitude: number | null;
  };
  timestamp: string;
}

export interface GeofenceAlert {
  booking_id: number;
  alert_type: "geofence_exit" | "geofence_enter";
  severity: "info" | "warning" | "danger" | "critical";
  member: MemberLocation;
  geofence: {
    id: number;
    name: string;
    center: { latitude: number; longitude: number };
    radius: number;
  };
  message: string;
  timestamp: string;
}

export interface Geofence {
  id: number;
  booking_id: number;
  name: string;
  description: string | null;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  fence_type: "checkpoint" | "safety_zone" | "restricted" | "meeting_point";
  is_active: boolean;
  alert_on_exit: boolean;
  alert_on_enter: boolean;
}

interface UseTourLocationTrackingOptions {
  bookingId: number;
  autoConnect?: boolean;
  enableTracking?: boolean;
  trackingInterval?: number; // in milliseconds
}

export function useTourLocationTracking(
  options: UseTourLocationTrackingOptions
) {
  const {
    bookingId,
    autoConnect = true,
    enableTracking = true,
    trackingInterval = 5000,
  } = options;

  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const [members, setMembers] = useState<MemberLocation[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [geofenceAlerts, setGeofenceAlerts] = useState<GeofenceAlert[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingJoined, setTrackingJoined] = useState(false);
  const [myLocation, setMyLocation] = useState<GeolocationCoordinates | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Fetch initial members locations via API
  const fetchMemberLocations = useCallback(async () => {
    if (!bookingId) return;

    setLoading(true);
    try {
      const token = getAccessToken();
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      const response = await fetch(
        `${API_BASE_URL}/tour-location/bookings/${bookingId}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const allMembers = [
          ...(data.tour_guides || []),
          ...(data.participants || []),
        ];
        setMembers(allMembers);

        // Set SOS alerts from response
        if (data.sos_alerts && data.sos_alerts.length > 0) {
          const sosFromResponse = data.sos_alerts.map(
            (alert: MemberLocation) => ({
              booking_id: alert.booking_id,
              user_id: alert.user_id,
              member_name: alert.member_name,
              message: alert.sos_message || "Cần hỗ trợ khẩn cấp!",
              location: alert.location,
              timestamp: alert.updated_at || new Date().toISOString(),
            })
          );
          setSosAlerts(sosFromResponse);
        }
      }
    } catch (error) {
      console.error("[LocationTracking] Error fetching members:", error);
    }
    setLoading(false);
  }, [bookingId]);

  // Fetch geofences
  const fetchGeofences = useCallback(async () => {
    if (!bookingId) return;

    try {
      const token = getAccessToken();
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      const response = await fetch(
        `${API_BASE_URL}/tour-location/bookings/${bookingId}/geofences`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGeofences(data.geofences || []);
      }
    } catch (error) {
      console.error("[LocationTracking] Error fetching geofences:", error);
    }
  }, [bookingId]);

  // Join tracking room
  const joinTracking = useCallback(() => {
    if (!socket || !isConnected || !user || !bookingId) {
      console.log(
        "[LocationTracking] Cannot join: missing socket/user/booking"
      );
      return;
    }

    const memberType =
      user.role === "tour_guide"
        ? "tour_guide"
        : user.role === "seller"
        ? "tour_guide"
        : "participant";

    socket.emit("join_tour_tracking", {
      booking_id: bookingId,
      user_id: user.id,
      member_type: memberType,
    });

    console.log(`[LocationTracking] Joining room for booking ${bookingId}`);
  }, [socket, isConnected, user, bookingId]);

  // Leave tracking room
  const leaveTracking = useCallback(() => {
    if (!socket || !user || !bookingId) return;

    socket.emit("leave_tour_tracking", {
      booking_id: bookingId,
      user_id: user.id,
    });

    setTrackingJoined(false);
    console.log(`[LocationTracking] Left room for booking ${bookingId}`);
  }, [socket, user, bookingId]);

  // Update my location to server
  const updateMyLocation = useCallback(
    (position: GeolocationPosition) => {
      if (!socket || !isConnected || !user || !bookingId) return;

      // Throttle updates
      const now = Date.now();
      if (now - lastUpdateRef.current < trackingInterval) return;
      lastUpdateRef.current = now;

      const memberType =
        user.role === "tour_guide"
          ? "tour_guide"
          : user.role === "seller"
          ? "tour_guide"
          : "participant";

      socket.emit("update_member_location", {
        booking_id: bookingId,
        user_id: user.id,
        member_type: memberType,
        member_name: user.full_name || user.username,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        location_source: "gps",
      });

      setMyLocation(position.coords);
    },
    [socket, isConnected, user, bookingId, trackingInterval]
  );

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị");
      return;
    }

    setLocationError(null);
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        updateMyLocation(position);
      },
      (error) => {
        console.error("[LocationTracking] GPS error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Bạn đã từ chối quyền truy cập vị trí");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Không thể xác định vị trí");
            break;
          case error.TIMEOUT:
            setLocationError("Quá thời gian chờ định vị");
            break;
          default:
            setLocationError("Lỗi không xác định khi lấy vị trí");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    console.log("[LocationTracking] Started GPS tracking");
  }, [updateMyLocation]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    console.log("[LocationTracking] Stopped GPS tracking");
  }, []);

  // Trigger SOS
  const triggerSOS = useCallback(
    (message?: string) => {
      if (!socket || !user || !bookingId) return;

      // Get current position for SOS
      navigator.geolocation.getCurrentPosition(
        (position) => {
          socket.emit("trigger_sos", {
            booking_id: bookingId,
            user_id: user.id,
            message: message || "Cần hỗ trợ khẩn cấp!",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          console.log("[LocationTracking] SOS triggered");
        },
        () => {
          // Even without position, still send SOS
          socket.emit("trigger_sos", {
            booking_id: bookingId,
            user_id: user.id,
            message: message || "Cần hỗ trợ khẩn cấp!",
          });
          console.log("[LocationTracking] SOS triggered (no position)");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    },
    [socket, user, bookingId]
  );

  // Clear SOS (for tour guide)
  const clearSOS = useCallback(
    (targetUserId: number) => {
      if (!socket || !user || !bookingId) return;

      socket.emit("clear_sos", {
        booking_id: bookingId,
        target_user_id: targetUserId,
        cleared_by: user.id,
      });

      // Remove from local state
      setSosAlerts((prev) =>
        prev.filter((alert) => alert.user_id !== targetUserId)
      );
      console.log(`[LocationTracking] Cleared SOS for user ${targetUserId}`);
    },
    [socket, user, bookingId]
  );

  // Request all locations
  const requestAllLocations = useCallback(() => {
    if (!socket || !bookingId) return;

    socket.emit("request_all_locations", {
      booking_id: bookingId,
    });
  }, [socket, bookingId]);

  // Ping a member to update their location
  const pingMember = useCallback(
    (targetUserId: number) => {
      if (!socket || !user || !bookingId) return;

      socket.emit("ping_member", {
        booking_id: bookingId,
        target_user_id: targetUserId,
        requester_id: user.id,
      });
      console.log(`[LocationTracking] Pinged member ${targetUserId}`);
    },
    [socket, user, bookingId]
  );

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Tracking room events
    const handleTrackingJoined = (data: any) => {
      console.log("[LocationTracking] Joined tracking room:", data);
      setTrackingJoined(true);
      fetchMemberLocations();
      fetchGeofences();
    };

    const handleMemberJoined = (data: any) => {
      console.log("[LocationTracking] Member joined:", data);
    };

    const handleMemberLeft = (data: any) => {
      console.log("[LocationTracking] Member left:", data);
      setMembers((prev) => prev.filter((m) => m.user_id !== data.user_id));
    };

    // Location updates
    const handleLocationUpdated = (data: any) => {
      console.log(
        "[LocationTracking] Location updated:",
        data.member?.member_name
      );
      setMembers((prev) => {
        const index = prev.findIndex((m) => m.id === data.member.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data.member;
          return updated;
        }
        return [...prev, data.member];
      });
    };

    const handleAllLocations = (data: any) => {
      console.log("[LocationTracking] Received all locations:", data.count);
      setMembers(data.members || []);
    };

    // SOS events
    const handleSOSAlert = (data: SOSAlert) => {
      console.log("[LocationTracking] SOS Alert:", data);
      setSosAlerts((prev) => {
        // Avoid duplicates
        if (prev.some((a) => a.user_id === data.user_id)) {
          return prev;
        }
        return [...prev, data];
      });
    };

    const handleSOSCleared = (data: any) => {
      console.log("[LocationTracking] SOS Cleared:", data);
      setSosAlerts((prev) =>
        prev.filter((a) => a.user_id !== data.target_user_id)
      );
    };

    // Geofence alerts
    const handleGeofenceAlert = (data: GeofenceAlert) => {
      console.log("[LocationTracking] Geofence Alert:", data);
      setGeofenceAlerts((prev) => [...prev, data]);

      // Auto-remove after 30 seconds
      setTimeout(() => {
        setGeofenceAlerts((prev) =>
          prev.filter((a) => a.timestamp !== data.timestamp)
        );
      }, 30000);
    };

    // Location ping (request to update location)
    const handleLocationPing = (data: any) => {
      console.log("[LocationTracking] Location ping received:", data);
      // Auto-update location when pinged
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => updateMyLocation(position),
          () => console.log("[LocationTracking] Failed to get position on ping")
        );
      }
    };

    // Register event listeners
    socket.on("tour_tracking_joined", handleTrackingJoined);
    socket.on("member_joined_tracking", handleMemberJoined);
    socket.on("member_left_tracking", handleMemberLeft);
    socket.on("member_location_updated", handleLocationUpdated);
    socket.on("all_locations_response", handleAllLocations);
    socket.on("sos_alert", handleSOSAlert);
    socket.on("sos_cleared", handleSOSCleared);
    socket.on("geofence_alert", handleGeofenceAlert);
    socket.on("location_ping", handleLocationPing);

    return () => {
      socket.off("tour_tracking_joined", handleTrackingJoined);
      socket.off("member_joined_tracking", handleMemberJoined);
      socket.off("member_left_tracking", handleMemberLeft);
      socket.off("member_location_updated", handleLocationUpdated);
      socket.off("all_locations_response", handleAllLocations);
      socket.off("sos_alert", handleSOSAlert);
      socket.off("sos_cleared", handleSOSCleared);
      socket.off("geofence_alert", handleGeofenceAlert);
      socket.off("location_ping", handleLocationPing);
    };
  }, [
    socket,
    isConnected,
    updateMyLocation,
    fetchMemberLocations,
    fetchGeofences,
  ]);

  // Auto-connect to tracking room
  useEffect(() => {
    if (
      autoConnect &&
      socket &&
      isConnected &&
      user &&
      bookingId &&
      !trackingJoined
    ) {
      joinTracking();
    }
  }, [
    autoConnect,
    socket,
    isConnected,
    user,
    bookingId,
    trackingJoined,
    joinTracking,
  ]);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (enableTracking && trackingJoined && !isTracking) {
      startTracking();
    }

    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [enableTracking, trackingJoined, isTracking, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveTracking();
      stopTracking();
    };
  }, [leaveTracking, stopTracking]);

  return {
    // State
    members,
    sosAlerts,
    geofenceAlerts,
    geofences,
    isTracking,
    trackingJoined,
    myLocation,
    locationError,
    loading,
    isConnected,

    // Actions
    joinTracking,
    leaveTracking,
    startTracking,
    stopTracking,
    triggerSOS,
    clearSOS,
    requestAllLocations,
    pingMember,
    fetchMemberLocations,
    fetchGeofences,
  };
}
