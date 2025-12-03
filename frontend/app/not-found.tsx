"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    // Add CSS animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes eye-lid {
        from, 40%, 45%, to {
          transform: translateY(0);
        }
        42.5% {
          transform: translateY(17.5px);
        }
      }
      @keyframes eyes {
        from {
          transform: translateY(112.5px);
        }
        to {
          transform: translateY(15px);
        }
      }
      @keyframes pupil {
        from, 37.5%, 40%, 45%, 87.5%, to {
          stroke-dashoffset: 0;
          transform: translate(0, 0);
        }
        12.5%, 25%, 62.5%, 75% {
          stroke-dashoffset: 0;
          transform: translate(-35px, 0);
        }
        42.5% {
          stroke-dashoffset: 35;
          transform: translate(0, 17.5px);
        }
      }
      @keyframes mouth-left {
        from, 50% {
          stroke-dashoffset: -102;
        }
        to {
          stroke-dashoffset: 0;
        }
      }
      @keyframes mouth-right {
        from, 50% {
          stroke-dashoffset: 102;
        }
        to {
          stroke-dashoffset: 0;
        }
      }
      @keyframes nose {
        from {
          transform: translate(0, 0);
        }
        to {
          transform: translate(0, 22.5px);
        }
      }
      
      .face__eyes, .face__eye-lid, .face__mouth-left, .face__mouth-right, .face__nose, .face__pupil {
        animation: eyes 1s 0.3s cubic-bezier(0.65, 0, 0.35, 1) forwards;
      }
      .face__eye-lid, .face__pupil {
        animation-duration: 4s;
        animation-delay: 1.3s;
        animation-iteration-count: infinite;
      }
      .face__eye-lid {
        animation-name: eye-lid;
      }
      .face__mouth-left, .face__mouth-right {
        animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1);
      }
      .face__mouth-left {
        animation-name: mouth-left;
      }
      .face__mouth-right {
        animation-name: mouth-right;
      }
      .face__nose {
        animation-name: nose;
      }
      .face__pupil {
        animation-name: pupil;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 Face */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <svg
            className="face w-64 h-auto mx-auto text-gray-900 dark:text-white"
            viewBox="0 0 320 380"
            width="320"
            height="380"
            aria-label="A 404 becomes a face, looks to the sides, and blinks. The 4s slide up, the 0 slides down, and then a mouth appears."
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="25"
            >
              <g className="face__eyes" transform="translate(0, 112.5)">
                <g transform="translate(15, 0)">
                  <polyline
                    className="face__eye-lid"
                    points="37,0 0,120 75,120"
                  />
                  <polyline
                    className="face__pupil"
                    points="55,120 55,155"
                    strokeDasharray="35 35"
                  />
                </g>
                <g transform="translate(230, 0)">
                  <polyline
                    className="face__eye-lid"
                    points="37,0 0,120 75,120"
                  />
                  <polyline
                    className="face__pupil"
                    points="55,120 55,155"
                    strokeDasharray="35 35"
                  />
                </g>
              </g>
              <rect
                className="face__nose"
                rx="4"
                ry="4"
                x="132.5"
                y="112.5"
                width="55"
                height="155"
              />
              <g strokeDasharray="102 102" transform="translate(65, 334)">
                <path
                  className="face__mouth-left"
                  d="M 0 30 C 0 30 40 0 95 0"
                  strokeDashoffset="-102"
                />
                <path
                  className="face__mouth-right"
                  d="M 95 0 C 150 0 190 30 190 30"
                  strokeDashoffset="102"
                />
              </g>
            </g>
          </svg>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Trang không tìm thấy
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-2">
            Oops! Trang bạn đang tìm kiếm không tồn tại.
          </p>
          <p className="text-base text-gray-500 dark:text-gray-500">
            Có thể trang đã bị xóa hoặc địa chỉ URL không chính xác.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-500 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors duration-200 shadow-lg"
            >
              <Home className="w-5 h-5" />
              <span>Về trang chủ</span>
            </motion.button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Có thể bạn đang tìm:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/tours"
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              Tours
            </Link>
            <Link
              href="/blog"
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              Liên hệ
            </Link>
            <Link
              href="/profile"
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              Hồ sơ
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

