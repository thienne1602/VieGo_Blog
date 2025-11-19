/**
 * Avatar component with error handling and fallback
 */
import { useState } from "react";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  fallbackBg?: string;
}

// Helper function to generate avatar URL
const getAvatarUrl = (name: string, size: number = 200, bg?: string) => {
  const encodedName = encodeURIComponent(name || "User");
  const background = bg || "0ea5e9"; // Default blue background
  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=${background}&color=fff&bold=true`;
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 40,
  className = "",
  fallbackBg,
}) => {
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(src || getAvatarUrl(alt, size, fallbackBg));

  const handleError = () => {
    if (!error) {
      // Try fallback with different background
      const fallback = getAvatarUrl(alt, size, fallbackBg || "6366f1");
      setImgSrc(fallback);
      setError(true);
    }
  };

  // If src changes, reset error state
  if (src && imgSrc !== src) {
    setImgSrc(src);
    setError(false);
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={handleError}
      unoptimized={imgSrc.startsWith("http://localhost:5000")}
    />
  );
};

// Simple img-based avatar for cases where Image component isn't suitable
export const SimpleAvatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 40,
  className = "",
  fallbackBg,
}) => {
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(
    src || getAvatarUrl(alt, size, fallbackBg)
  );

  const handleError = () => {
    if (!error && src) {
      // If original src failed, try fallback
      const fallback = getAvatarUrl(alt, size, fallbackBg || "6366f1");
      setImgSrc(fallback);
      setError(true);
    }
  };

  // If src changes, reset error state
  if (src && imgSrc !== src) {
    setImgSrc(src);
    setError(false);
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={handleError}
    />
  );
};

export default Avatar;

