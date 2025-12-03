"use client";

interface BackgroundImageProps {
  imagePath?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  blur?: boolean;
  gradient?: boolean;
  className?: string;
}

export default function BackgroundImage({
  imagePath = "/images/ha-long-bay-copy.jpg",
  overlay = true,
  overlayOpacity = 30,
  blur = false,
  gradient = false,
  className = "",
}: BackgroundImageProps) {
  return (
    <div className={`fixed inset-0 z-0 ${className}`}>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: `url(${imagePath})`,
        }}
      />

      {/* Blur Effect */}
      {blur && <div className="absolute inset-0 backdrop-blur-sm"></div>}

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})`,
          }}
        />
      )}

      {/* Gradient Overlay */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"></div>
      )}
    </div>
  );
}
