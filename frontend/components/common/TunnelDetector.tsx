"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Component to detect and save tunnel backend URL for Demo Mode
 * When accessing via tunnel, this saves the backend URL to localStorage
 */
export default function TunnelDetector() {
  const searchParams = useSearchParams();
  const [showPrompt, setShowPrompt] = useState(false);
  const [backendInput, setBackendInput] = useState("");

  useEffect(() => {
    // Check if we're in browser
    if (typeof window === "undefined") return;

    const currentHost = window.location.hostname;

    // Only process if accessing via tunnel (LocalTunnel, Ngrok, or Cloudflare Tunnel)
    const isTunnel =
      currentHost.includes("loca.lt") ||
      currentHost.includes("ngrok") ||
      currentHost.includes("trycloudflare.com");

    if (isTunnel) {
      // Get backend URL from query parameter
      const backendUrl = searchParams.get("backend");

      if (backendUrl) {
        // Decode the URL
        const decodedUrl = decodeURIComponent(backendUrl);
        console.log(
          "[TunnelDetector] Detected tunnel mode, backend URL:",
          decodedUrl
        );

        // Save to localStorage
        localStorage.setItem("viego_backend_tunnel_url", decodedUrl);

        // Remove the query parameter from URL for cleaner appearance
        const url = new URL(window.location.href);
        url.searchParams.delete("backend");
        window.history.replaceState({}, "", url.toString());

        // Reload the page to apply new API URL
        console.log("[TunnelDetector] Reloading to apply backend URL...");
        window.location.reload();
      } else {
        // Check if we already have saved URL
        const savedUrl = localStorage.getItem("viego_backend_tunnel_url");
        if (savedUrl) {
          console.log("[TunnelDetector] Using saved backend URL:", savedUrl);
        } else {
          // Show prompt to enter backend URL
          console.warn(
            "[TunnelDetector] No backend URL found. Showing prompt..."
          );
          setShowPrompt(true);
        }
      }
    }
  }, [searchParams]);

  const handleSubmit = () => {
    if (backendInput.trim()) {
      let url = backendInput.trim();
      // Ensure URL has /api suffix
      if (!url.endsWith("/api")) {
        url = url.replace(/\/$/, "") + "/api";
      }
      localStorage.setItem("viego_backend_tunnel_url", url);
      setShowPrompt(false);
      window.location.reload();
    }
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "#1e293b",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        <h2
          style={{
            color: "#fff",
            marginBottom: "15px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          🌐 Cấu hình Backend URL
        </h2>
        <p
          style={{
            color: "#94a3b8",
            marginBottom: "20px",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          Bạn đang truy cập qua tunnel. Vui lòng nhập Backend Tunnel URL (được
          hiển thị trong launcher của người chia sẻ).
        </p>
        <input
          type="text"
          value={backendInput}
          onChange={(e) => setBackendInput(e.target.value)}
          placeholder="https://xxx.trycloudflare.com"
          style={{
            width: "100%",
            padding: "12px 15px",
            borderRadius: "8px",
            border: "1px solid #475569",
            backgroundColor: "#0f172a",
            color: "#fff",
            fontSize: "14px",
            marginBottom: "15px",
            outline: "none",
          }}
          onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#4f46e5",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Kết nối
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "1px solid #475569",
              backgroundColor: "transparent",
              color: "#94a3b8",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Bỏ qua
          </button>
        </div>
        <p
          style={{
            color: "#64748b",
            fontSize: "12px",
            marginTop: "15px",
            textAlign: "center",
          }}
        >
          💡 Tip: Yêu cầu người chia sẻ gửi link đầy đủ từ nút "Copy URL"
        </p>
      </div>
    </div>
  );
}
