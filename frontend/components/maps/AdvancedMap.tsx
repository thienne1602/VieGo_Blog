"use client";

// Declare google as a global variable to avoid TypeScript errors
declare var google: any;

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Loader } from "@googlemaps/js-api-loader";
import {
  Search,
  MapPin,
  Map as MapIcon,
  Satellite,
  Circle,
  Train,
  Navigation,
  Route,
  X,
  Play,
  MapPin as MapPinIcon,
} from "lucide-react";

interface Location {
  id?: number | string;
  name: string;
  coordinates: { lat: number; lng: number };
  type?: string;
  rating?: number;
  [key: string]: any;
}

interface Props {
  onLocationSelect?: (location: Location | null) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

const AdvancedMap = ({
  onLocationSelect,
  initialCenter = { lat: 10.762622, lng: 106.660172 }, // Ho Chi Minh City
  initialZoom = 13,
}: Props) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapContainerReady, setMapContainerReady] = useState(false);
  const [map, setMap] = useState<any | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [searchBox, setSearchBox] = useState<any | null>(null);
  const [placesService, setPlacesService] = useState<any | null>(null);
  const [directionsService, setDirectionsService] = useState<any | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any | null>(
    null
  );
  const [trafficLayer, setTrafficLayer] = useState<any | null>(null);
  const [transitLayer, setTransitLayer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    "api-key" | "domain" | "api-not-activated" | "general" | null
  >(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [showTraffic, setShowTraffic] = useState(false);
  const [showTransit, setShowTransit] = useState(false);

  // Directions state
  const [showDirections, setShowDirections] = useState(false);
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [originLocation, setOriginLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [travelMode, setTravelMode] = useState<string>("DRIVING");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const infoWindowRef = useRef<any | null>(null);

  // Use the new API key (fallback to provided key)
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyA7gWv2sQWonQMvSsWIOB00Sxcxgrf5lx0";

  // Use callback ref to ensure container is ready
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log(
        "[AdvancedMap] Container ref attached:",
        !!node,
        "Element:",
        node
      );
      // Use requestAnimationFrame to ensure DOM is fully ready
      requestAnimationFrame(() => {
        if (node && node.isConnected) {
          setMapContainerReady(true);
          console.log("[AdvancedMap] Container ready and connected to DOM");
        }
      });
    } else {
      setMapContainerReady(false);
    }
  }, []);

  // Also check in useLayoutEffect as backup
  useLayoutEffect(() => {
    const checkContainer = () => {
      if (mapRef.current && mapRef.current.isConnected) {
        setMapContainerReady(true);
        console.log("[AdvancedMap] Container verified in layout effect");
      } else if (!mapContainerReady) {
        // Retry after a frame
        requestAnimationFrame(checkContainer);
      }
    };
    checkContainer();
  }, [mapContainerReady]);

  // Initialize Google Maps with all libraries
  useEffect(() => {
    // Debug logging
    console.log("[AdvancedMap] Effect triggered", {
      mapContainerReady,
      hasRef: !!mapRef.current,
      hasMap: !!map,
      apiKeyExists: !!apiKey,
    });

    if (!apiKey) {
      const errorMsg = "Google Maps API Key chưa được cấu hình";
      console.error("[AdvancedMap]", errorMsg);
      setError(errorMsg);
      setErrorType("api-key");
      setIsLoading(false);
      return;
    }

    if (map) {
      console.log("[AdvancedMap] Map already initialized, skipping...");
      return;
    }

    // Wait for container to be ready before initializing
    if (!mapContainerReady && !mapRef.current) {
      console.log("[AdvancedMap] Waiting for container to be ready...");
      return;
    }

    const initMap = async () => {
      // Wait for DOM to be ready - use multiple frames
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      let retries = 0;
      const maxRetries = 20;

      // Check container availability
      while (retries < maxRetries) {
        const container =
          mapRef.current ||
          (document.getElementById("google-map-container") as HTMLDivElement);

        if (container && container.isConnected) {
          if (!mapRef.current) {
            mapRef.current = container;
            setMapContainerReady(true);
          }
          console.log(
            "[AdvancedMap] Container verified, proceeding with initialization"
          );
          break;
        }

        if (retries < maxRetries - 1) {
          console.log(
            `[AdvancedMap] Container not ready, waiting... (retry ${
              retries + 1
            }/${maxRetries})`,
            {
              hasRef: !!mapRef.current,
              foundById: !!document.getElementById("google-map-container"),
            }
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        retries++;
      }

      // Final check before initialization
      const container =
        mapRef.current ||
        (document.getElementById("google-map-container") as HTMLDivElement);
      if (!container || !container.isConnected) {
        const errorMsg =
          "Không thể tìm thấy container bản đồ sau nhiều lần thử";
        console.error("[AdvancedMap]", errorMsg, {
          mapContainerReady,
          hasRef: !!mapRef.current,
          foundById: !!document.getElementById("google-map-container"),
        });
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      try {
        console.log("[AdvancedMap] Starting map initialization...");
        setIsLoading(true);
        setError(null);
        setErrorType(null);

        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places", "geometry", "routes"],
          language: "vi",
          region: "VN",
        });

        console.log("[AdvancedMap] Loading Google Maps API...");
        await loader.load();
        console.log("[AdvancedMap] Google Maps API loaded successfully");

        // Double check mapRef after API load (in case component unmounted)
        if (!mapRef.current) {
          setError("Container bản đồ đã bị xóa sau khi tải API");
          setIsLoading(false);
          return;
        }

        // Initialize map with advanced options
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapTypeId: mapType,
          fullscreenControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain"],
          },
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          gestureHandling: "greedy",
          keyboardShortcuts: true,
          disableDefaultUI: false,
          // Disable 3D for simplicity
          tilt: 0,
          heading: 0,
        });

        // Initialize services (with deprecated API handling)
        let places: any | null = null;
        try {
          // Check if PlacesService is available (may be deprecated for new customers)
          if (typeof google.maps.places.PlacesService !== "undefined") {
            places = new google.maps.places.PlacesService(mapInstance);
          } else {
            console.warn(
              "[AdvancedMap] PlacesService is not available - may be deprecated for new customers."
            );
          }
        } catch (error) {
          console.warn(
            "[AdvancedMap] Could not initialize PlacesService:",
            error
          );
        }
        const directions = new google.maps.DirectionsService();
        const renderer = new google.maps.DirectionsRenderer({
          map: null, // Will be set when showing route
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#3b82f6",
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
          markerOptions: {
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          },
        });

        // Initialize SearchBox (with deprecated API handling)
        const input = searchInputRef.current;
        if (input) {
          try {
            // Check if SearchBox is available (may be deprecated for new customers)
            if (typeof google.maps.places.SearchBox === "undefined") {
              console.warn(
                "[AdvancedMap] SearchBox is not available - may be deprecated. Using basic search."
              );
              // Fallback: Create a basic search input handler
              input.addEventListener("keypress", async (e: KeyboardEvent) => {
                if (e.key === "Enter" && input.value.trim()) {
                  // Use Geocoding API as fallback
                  const geocoder = new google.maps.Geocoder();
                  geocoder.geocode(
                    { address: input.value },
                    (results: any, status: any) => {
                      if (status === "OK" && results && results[0]) {
                        const place = results[0];
                        const location = place.geometry.location;
                        if (location && mapInstance) {
                          mapInstance.setCenter(location);
                          mapInstance.setZoom(15);
                          const marker = new google.maps.Marker({
                            map: mapInstance,
                            position: location,
                            title: place.formatted_address,
                          });
                          if (onLocationSelect) {
                            onLocationSelect({
                              name: place.formatted_address || input.value,
                              coordinates: {
                                lat: location.lat(),
                                lng: location.lng(),
                              },
                            });
                          }
                        }
                      }
                    }
                  );
                }
              });
            } else {
              const searchBox = new google.maps.places.SearchBox(input);
              setSearchBox(searchBox);

              // Bias the SearchBox results towards current map's viewport
              mapInstance.addListener("bounds_changed", () => {
                searchBox.setBounds(mapInstance.getBounds() as any);
              });

              // Listen for the event fired when the user selects a prediction
              searchBox.addListener("places_changed", () => {
                const places = searchBox.getPlaces();
                if (!places || places.length === 0) return;

                // Clear existing markers
                markers.forEach((marker) => marker.setMap(null));

                // For each place, get the icon, name and location
                const bounds = new google.maps.LatLngBounds();
                const newMarkers: any[] = [];

                places.forEach((place: any) => {
                  if (!place.geometry || !place.geometry.location) {
                    console.log("Returned place contains no geometry");
                    return;
                  }

                  // Create a marker for each place
                  const marker = new google.maps.Marker({
                    map: mapInstance,
                    title: place.name,
                    position: place.geometry.location,
                    icon: {
                      url: place.icon || undefined,
                      size: new google.maps.Size(71, 71),
                      origin: new google.maps.Point(0, 0),
                      anchor: new google.maps.Point(17, 34),
                      scaledSize: new google.maps.Size(25, 25),
                    },
                  });

                  newMarkers.push(marker);

                  // Create info window
                  const infoWindow = new google.maps.InfoWindow();
                  let content = `
                    <div style="padding: 8px; min-width: 200px;">
                      <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px;">${
                        place.name || ""
                      }</h3>
                      ${
                        place.formatted_address
                          ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${place.formatted_address}</p>`
                          : ""
                      }
                      ${
                        place.rating
                          ? `<p style="margin: 0; font-size: 12px;">⭐ ${
                              place.rating
                            } (${place.user_ratings_total || 0} đánh giá)</p>`
                          : ""
                      }
                      ${
                        place.website
                          ? `<a href="${place.website}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 12px;">Xem website →</a>`
                          : ""
                      }
                    </div>
                  `;

                  marker.addListener("click", () => {
                    infoWindow.setContent(content);
                    infoWindow.open(mapInstance, marker);

                    if (onLocationSelect) {
                      onLocationSelect({
                        name: place.name || "",
                        coordinates: {
                          lat: place.geometry!.location!.lat(),
                          lng: place.geometry!.location!.lng(),
                        },
                        ...place,
                      });
                    }
                  });

                  if (place.geometry.viewport) {
                    bounds.union(place.geometry.viewport);
                  } else {
                    bounds.extend(place.geometry.location!);
                  }
                });

                setMarkers(newMarkers);
                mapInstance.fitBounds(bounds);
              });
            }
          } catch (error: any) {
            console.error("[AdvancedMap] Places API Error:", error);
            const errorMessage = error?.message || String(error);
            if (
              errorMessage.includes("REQUEST_DENIED") ||
              errorMessage.includes("Places")
            ) {
              console.warn(
                "[AdvancedMap] Places API (SearchBox) không khả dụng. Sử dụng chế độ fallback."
              );
              // Don't set error, just use fallback
            } else {
              console.warn(
                `[AdvancedMap] Lỗi khởi tạo Places API: ${errorMessage}. Sử dụng chế độ fallback.`
              );
            }
          }
        }

        // Initialize Traffic Layer
        const traffic = new google.maps.TrafficLayer();
        if (showTraffic) {
          traffic.setMap(mapInstance);
        }
        setTrafficLayer(traffic);

        // Initialize Transit Layer
        const transit = new google.maps.TransitLayer();
        if (showTransit) {
          transit.setMap(mapInstance);
        }
        setTransitLayer(transit);

        setMap(mapInstance);
        setPlacesService(places);
        setDirectionsService(directions);
        setDirectionsRenderer(renderer);

        // Check for "For development purposes only" watermark (billing issue)
        // This usually appears when API key doesn't have billing enabled
        setTimeout(() => {
          const mapContainer = mapRef.current;
          if (mapContainer) {
            const canvas = mapContainer.querySelector("canvas");
            if (canvas) {
              // Check if there's an overlay with "development" text
              const overlays = mapContainer.querySelectorAll("div");
              let hasDevelopmentOverlay = false;
              overlays.forEach((overlay) => {
                const text = overlay.textContent || overlay.innerText || "";
                if (
                  text.toLowerCase().includes("development purposes") ||
                  text.toLowerCase().includes("for development")
                ) {
                  hasDevelopmentOverlay = true;
                }
              });

              if (hasDevelopmentOverlay) {
                console.warn(
                  "[AdvancedMap] Detected 'For development purposes only' watermark. This usually means:"
                );
                console.warn("1. API key needs billing account enabled");
                console.warn("2. API restrictions may be incorrect");
                console.warn("3. Check Google Cloud Console billing settings");
                setError(
                  "API Key cần được kết nối với Billing account. " +
                    "Vui lòng vào Google Cloud Console và thêm Billing account để sử dụng Maps API đầy đủ."
                );
                setErrorType("api-key");
              }
            }
          }
        }, 2000); // Check after map loads

        setError(null);
        setErrorType(null);
        setIsLoading(false);
        console.log("[AdvancedMap] Map initialization completed successfully");
      } catch (err: any) {
        console.error("[AdvancedMap] Error loading Google Maps:", err);
        console.error("[AdvancedMap] Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });

        // More detailed error messages
        let errorMessage = `Lỗi tải bản đồ: ${err.message || err}`;
        let errorType:
          | "api-key"
          | "domain"
          | "api-not-activated"
          | "general"
          | null = null;

        const errMsg = err.message || err.toString() || "";
        const errStr = errMsg.toLowerCase();

        if (errStr.includes("invalidkey") || errStr.includes("invalid key")) {
          errorMessage =
            "API Key không hợp lệ hoặc chưa được cấu hình đúng cách";
          errorType = "api-key";
        } else if (
          errStr.includes("referer") ||
          errStr.includes("referrer") ||
          errStr.includes("not allowed")
        ) {
          errorMessage =
            "API Key bị giới hạn domain. Vui lòng thêm localhost vào Application restrictions";
          errorType = "domain";
        } else if (
          errStr.includes("not activated") ||
          errStr.includes("notactivated")
        ) {
          errorMessage =
            "Maps JavaScript API chưa được kích hoạt trong Google Cloud Console";
          errorType = "api-not-activated";
        } else if (
          errStr.includes("can't load") ||
          errStr.includes("sở hữu trang web") ||
          errStr.includes("development purposes")
        ) {
          errorMessage =
            "API Key cần được cấu hình với Billing account hoặc có vấn đề về restrictions";
          errorType = "api-key";
        } else if (
          errStr.includes("billing") ||
          errStr.includes("quota") ||
          errStr.includes("exceeded")
        ) {
          errorMessage = "API Key cần Billing account hoặc đã vượt quota";
          errorType = "api-key";
        }

        setError(errorMessage);
        setErrorType(errorType);
        setIsLoading(false);
      }
    };

    // Start initialization
    initMap();

    return () => {
      // Cleanup if component unmounts
      console.log("[AdvancedMap] Cleaning up...");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, map, mapContainerReady]); // Re-run when container is ready

  // Toggle map features
  useEffect(() => {
    if (!map) return;

    // Toggle Traffic Layer
    if (trafficLayer) {
      if (showTraffic) {
        trafficLayer.setMap(map);
      } else {
        trafficLayer.setMap(null);
      }
    }

    // Toggle Transit Layer
    if (transitLayer) {
      if (showTransit) {
        transitLayer.setMap(map);
      } else {
        transitLayer.setMap(null);
      }
    }
  }, [map, showTraffic, showTransit, trafficLayer, transitLayer]);

  // Handle map type change
  useEffect(() => {
    if (map) {
      map.setMapTypeId(mapType);
    }
  }, [map, mapType]);

  // Initialize Autocomplete for origin and destination
  useEffect(() => {
    if (!map || !originInputRef.current || !destinationInputRef.current) return;

    try {
      // Initialize Autocomplete for origin
      const originAutocomplete = new google.maps.places.Autocomplete(
        originInputRef.current,
        {
          fields: ["formatted_address", "geometry", "name"],
          componentRestrictions: { country: "vn" },
        }
      );

      originAutocomplete.addListener("place_changed", () => {
        const place = originAutocomplete.getPlace();
        if (place.geometry?.location) {
          setOrigin(place.formatted_address || place.name || origin);
          setOriginLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });

      // Initialize Autocomplete for destination
      const destinationAutocomplete = new google.maps.places.Autocomplete(
        destinationInputRef.current,
        {
          fields: ["formatted_address", "geometry", "name"],
          componentRestrictions: { country: "vn" },
        }
      );

      destinationAutocomplete.addListener("place_changed", () => {
        const place = destinationAutocomplete.getPlace();
        if (place.geometry?.location) {
          setDestination(place.formatted_address || place.name || destination);
          setDestinationLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });
    } catch (error) {
      console.warn("[AdvancedMap] Autocomplete không khả dụng:", error);
    }
  }, [map, origin, destination]);

  // Calculate route
  const calculateRoute = () => {
    if (
      !directionsService ||
      !directionsRenderer ||
      !map ||
      !origin ||
      !destination
    ) {
      return;
    }

    const mode = travelMode as any;
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: mode,
      },
      (result: any, status: any) => {
        if (status === "OK" && result) {
          directionsRenderer.setMap(map);
          directionsRenderer.setDirections(result);

          // Extract route info
          const route = result.routes[0];
          const leg = route.legs[0];
          setRouteInfo({
            distance: leg.distance?.text || "",
            duration: leg.duration?.text || "",
          });

          // Fit map to show entire route
          const bounds = new google.maps.LatLngBounds();
          route.legs.forEach((leg: any) => {
            leg.steps.forEach((step: any) => {
              bounds.extend(step.start_location);
              bounds.extend(step.end_location);
            });
          });
          map.fitBounds(bounds);
        } else {
          console.error("Directions request failed:", status);
          alert("Không thể tìm đường đi. Vui lòng kiểm tra lại địa chỉ.");
        }
      }
    );
  };

  // Clear route
  const clearRoute = () => {
    if (directionsRenderer && map) {
      directionsRenderer.setMap(null);
      setRouteInfo(null);
      setOrigin("");
      setDestination("");
      setOriginLocation(null);
      setDestinationLocation(null);
    }
  };

  // Set current location as origin
  const setCurrentLocationAsOrigin = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setOriginLocation(pos);
          setOrigin(`${pos.lat}, ${pos.lng}`);
          map.setCenter(pos);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(pos);
          map.setZoom(15);

          new google.maps.Marker({
            position: pos,
            map: map,
            title: "Vị trí của bạn",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: "100%" }}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 dark:border-t-primary-400 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Đang tải bản đồ...
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
          <div className="text-center p-8 max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <div className="text-red-500 dark:text-red-400 text-6xl mb-4">
              ⚠️
            </div>
            <h3 className="text-red-700 dark:text-red-400 font-bold text-xl mb-3">
              Lỗi tải bản đồ
            </h3>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-4">
              {error}
            </p>
            {errorType &&
              (errorType === "api-key" ||
                errorType === "domain" ||
                errorType === "api-not-activated") && (
                <div className="text-left bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-yellow-800 text-sm font-semibold mb-2">
                    🔧 Cách sửa:
                  </p>
                  {errorType === "api-key" ? (
                    <ol className="text-yellow-700 text-xs space-y-2 list-decimal list-inside mb-3">
                      <li>
                        <strong>QUAN TRỌNG:</strong> Thêm Billing account vào
                        Google Cloud Console
                      </li>
                      <li>Kiểm tra API Key trong Google Cloud Console</li>
                      <li>
                        Enable <strong>Maps JavaScript API</strong> và{" "}
                        <strong>Places API</strong>
                      </li>
                      <li>Kiểm tra API restrictions có đúng APIs không</li>
                      <li>
                        Kiểm tra Application restrictions có cho phép localhost
                        không
                      </li>
                      <li>
                        Nếu thấy "For development purposes only", cần kết nối
                        Billing account
                      </li>
                      <li>
                        Xem file{" "}
                        <code className="bg-yellow-100 px-1 rounded">
                          FIX_API_ERRORS.md
                        </code>{" "}
                        để biết chi tiết
                      </li>
                    </ol>
                  ) : errorType === "domain" ? (
                    <ol className="text-yellow-700 text-xs space-y-2 list-decimal list-inside mb-3">
                      <li>Vào Google Cloud Console → API Key settings</li>
                      <li>
                        Phần "Application restrictions" → Chọn "HTTP referrers"
                      </li>
                      <li>Thêm các domain sau:</li>
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">
                            http://localhost:*/*
                          </code>
                        </li>
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">
                            http://127.0.0.1:*/*
                          </code>
                        </li>
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">
                            http://localhost:3000/*
                          </code>
                        </li>
                      </ul>
                      <li>Click "SAVE" và đợi 1-2 phút</li>
                    </ol>
                  ) : errorType === "api-not-activated" ? (
                    <ol className="text-yellow-700 text-xs space-y-2 list-decimal list-inside mb-3">
                      <li>
                        Vào Google Cloud Console → APIs & Services → Library
                      </li>
                      <li>
                        Enable <strong>Maps JavaScript API</strong>
                      </li>
                      <li>
                        Enable <strong>Places API</strong> (hoặc Places API New)
                      </li>
                      <li>Đợi vài phút để APIs được kích hoạt</li>
                    </ol>
                  ) : null}
                  <a
                    href="https://console.cloud.google.com/apis/credentials?project=vivutour"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                  >
                    🔗 Mở Google Cloud Console
                  </a>
                </div>
              )}
          </div>
        </div>
      )}
      {/* Search Box */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm kiếm địa điểm..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        <button
          onClick={getCurrentLocation}
          className="px-4 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-xl shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center justify-center"
          title="Vị trí của tôi"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {/* Map Container */}
      <div
        id="google-map-container"
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: "400px", height: "100%" }}
      />

      {/* Directions Panel */}
      {showDirections && (
        <div className="absolute top-20 left-4 z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Tìm đường đi
              </h3>
            </div>
            <button
              onClick={() => {
                setShowDirections(false);
                clearRoute();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Origin */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-green-600" />
                Điểm xuất phát
              </label>
              <div className="flex gap-2">
                <input
                  ref={originInputRef}
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Nhập địa chỉ hoặc chọn trên bản đồ"
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-gray-900 dark:text-white"
                />
                <button
                  onClick={setCurrentLocationAsOrigin}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold"
                  title="Sử dụng vị trí hiện tại"
                >
                  📍
                </button>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-red-600" />
                Điểm đến
              </label>
              <input
                ref={destinationInputRef}
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Nhập địa chỉ hoặc chọn trên bản đồ"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-gray-900 dark:text-white"
              />
            </div>

            {/* Travel Mode */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Phương tiện
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mode: "DRIVING", label: "🚗 Xe hơi" },
                  { mode: "WALKING", label: "🚶 Đi bộ" },
                  { mode: "TRANSIT", label: "🚌 Công cộng" },
                  { mode: "BICYCLING", label: "🚴 Xe đạp" },
                ].map(({ mode, label }) => (
                  <button
                    key={mode}
                    onClick={() => setTravelMode(mode)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      travelMode === mode
                        ? "bg-primary-600 dark:bg-primary-500 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Route Info */}
            {routeInfo && (
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Khoảng cách:
                    </span>
                    <span className="font-bold text-primary-700 dark:text-primary-300 ml-2">
                      {routeInfo.distance}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Thời gian:
                    </span>
                    <span className="font-bold text-primary-700 dark:text-primary-300 ml-2">
                      {routeInfo.duration}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={calculateRoute}
                disabled={!origin || !destination}
                className="flex-1 px-4 py-3 bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Tìm đường
              </button>
              {routeInfo && (
                <button
                  onClick={clearRoute}
                  className="px-4 py-3 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Directions Toggle Button */}
      {!showDirections && (
        <button
          onClick={() => setShowDirections(true)}
          className="absolute top-20 left-4 z-10 px-4 py-3 bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-xl shadow-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Navigation className="w-5 h-5" />
          <span>Tìm đường đi</span>
        </button>
      )}

      {/* Controls Panel - Simplified */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
        {/* Map Type - Only Roadmap and Satellite */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 flex gap-2 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setMapType("roadmap")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              mapType === "roadmap"
                ? "bg-primary-600 dark:bg-primary-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Bản đồ"
          >
            <MapIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Bản đồ</span>
          </button>
          <button
            onClick={() => setMapType("satellite")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              mapType === "satellite"
                ? "bg-primary-600 dark:bg-primary-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Vệ tinh"
          >
            <Satellite className="w-4 h-4" />
            <span className="hidden sm:inline">Vệ tinh</span>
          </button>
        </div>

        {/* Traffic & Transit Toggles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 flex gap-2 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              showTraffic
                ? "bg-primary-600 dark:bg-primary-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Giao thông"
          >
            <Circle className="w-4 h-4" />
            <span className="hidden sm:inline">Giao thông</span>
          </button>
          <button
            onClick={() => setShowTransit(!showTransit)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              showTransit
                ? "bg-primary-600 dark:bg-primary-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Giao thông công cộng"
          >
            <Train className="w-4 h-4" />
            <span className="hidden sm:inline">Công cộng</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMap;
