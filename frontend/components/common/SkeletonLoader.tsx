"use client";

import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  type?: "post" | "card" | "avatar" | "text" | "image";
  count?: number;
  className?: string;
}

export const SkeletonLoader = ({
  type = "card",
  count = 1,
  className = "",
}: SkeletonLoaderProps) => {
  const renderSkeleton = () => {
    switch (type) {
      case "post":
        return (
          <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
            </div>
            <div className="h-64 bg-gray-200 rounded-lg animate-pulse mb-4" />
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        );

      case "card":
        return (
          <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
            <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="flex items-center justify-between mt-4">
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        );

      case "avatar":
        return (
          <div className={`w-12 h-12 bg-gray-200 rounded-full animate-pulse ${className}`} />
        );

      case "text":
        return (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
          </div>
        );

      case "image":
        return (
          <div
            className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse bg-[length:200%_100%] animate-[shimmer_2s_infinite] ${className}`}
          />
        );

      default:
        return <div className="h-4 bg-gray-200 rounded animate-pulse" />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </>
  );
};

export default SkeletonLoader;

