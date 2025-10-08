"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "Khám Phá Việt Nam Cùng VieGo",
      subtitle:
        "Hành trình khám phá những điểm đến tuyệt vời và trải nghiệm ẩm thực độc đáo",
      image: "/hero/vietnam-landscape-1.svg",
      cta: "Bắt Đầu Khám Phá",
      stats: ["1000+ Địa Điểm", "500+ Bài Viết", "10K+ Thành Viên"],
    },
    {
      title: "Ẩm Thực Việt Nam Đa Dạng",
      subtitle:
        "Từ phở Hà Nội đến bánh mì Sài Gòn, khám phá hương vị đặc sắc mỗi vùng miền",
      image: "/hero/vietnam-food.svg",
      cta: "Khám Phá Ẩm Thực",
      stats: ["200+ Món Ăn", "100+ Nhà Hàng", "50+ Công Thức"],
    },
    {
      title: "Cộng Đồng Du Lịch Sôi Động",
      subtitle:
        "Kết nối với những người bạn cùng đam mê, chia sẻ trải nghiệm và tạo kỷ niệm",
      image: "/hero/community.svg",
      cta: "Tham Gia Cộng Đồng",
      stats: ["Real-time Chat", "NFT Rewards", "AI Gợi Ý"],
    },
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const currentHero = heroSlides[currentSlide];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with Parallax Effect */}
      <div className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <motion.div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            } transition-opacity duration-1000`}
            style={{
              backgroundImage: `linear-gradient(
                135deg,
                rgba(0, 128, 128, 0.8),
                rgba(255, 127, 80, 0.6)
              ), url('${slide.image}')`,
            }}
            animate={{
              scale: index === currentSlide ? 1.05 : 1,
            }}
            transition={{
              duration: 6,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Main Title */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 font-quicksand"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {currentHero.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {currentHero.subtitle}
          </motion.p>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 md:gap-12 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {currentHero.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                  {stat.split(" ")[0]}
                </div>
                <div className="text-sm md:text-base text-white/90">
                  {stat.split(" ").slice(1).join(" ")}
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.button
              className="btn-primary bg-accent hover:bg-accent-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(255, 127, 80, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              {currentHero.cta}
            </motion.button>

            <motion.button
              className="btn-secondary border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Xem Video Giới Thiệu
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-white rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>

      {/* Slide Navigation */}
      <div className="absolute bottom-8 right-8 z-20">
        <div className="flex space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-accent scale-125"
                  : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() =>
          setCurrentSlide(
            (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
          )
        }
        className="absolute left-8 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={() =>
          setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
        }
        className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </section>
  );
};

export default HeroSection;
