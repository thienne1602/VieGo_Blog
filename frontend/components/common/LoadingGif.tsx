/**
 * LoadingGif Component
 * Hiển thị GIF loading động thay thế cho spinner truyền thống
 */

interface LoadingGifProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  message?: string;
  type?: "default" | "alt"; // Thêm type để chọn GIF
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

export default function LoadingGif({
  size = "md",
  className = "",
  message = "Đang tải...",
  type = "default",
}: LoadingGifProps) {
  const gifSrc =
    type === "alt"
      ? "/assets/stickers/đang tải.gif"
      : "/assets/stickers/đang tải 2.gif";

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img
        src={gifSrc}
        alt="Loading"
        className={`${sizeClasses[size]} object-contain mb-2`}
      />
      {message && (
        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
