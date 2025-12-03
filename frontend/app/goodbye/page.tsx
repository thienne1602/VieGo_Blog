"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function GoodbyePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect after 3 seconds
    const redirectTimer = setTimeout(() => {
      router.push("/tours");
    }, 3000);

    return () => {
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-accent-50 to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-200/40 dark:bg-primary-900/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-accent-200/40 dark:bg-accent-900/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" } as React.CSSProperties}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-secondary-200/30 dark:bg-secondary-900/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" } as React.CSSProperties}
        ></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center px-6"
      >
        <motion.img
          src="/assets/stickers/đăng xuất.gif"
          alt="Đăng xuất"
          className="w-[400px] h-[400px] mx-auto mb-10 drop-shadow-2xl"
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-6xl font-bold text-gray-900 dark:text-white mb-6"
        >
          Tạm biệt! 👋
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-3xl text-gray-700 dark:text-gray-300 mb-10"
        >
          Cảm ơn bạn đã sử dụng VieGo
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-2xl text-gray-600 dark:text-gray-400"
        >
          Hẹn gặp lại bạn sớm nhé! ✨
        </motion.p>
      </motion.div>
    </div>
  );
}
