"use client";

import React, { useState, useEffect } from "react";

const TopBarMarquee = () => {
  const [isVisible, setIsVisible] = useState(true);

  const marqueeItems = [
    {
      icon: "fa-solid fa-globe",
      text: "VieGo - Blog Du Lịch & Ẩm Thực Sáng Tạo Việt Nam",
    },
    {
      icon: "fa-solid fa-users",
      text: "10K+ thành viên - Cộng đồng du lịch lớn nhất Việt Nam",
    },
    {
      icon: "fa-solid fa-robot",
      text: "AI gợi ý điểm đến thông minh - Trải nghiệm du lịch cá nhân hóa",
    },
    {
      icon: "fa-solid fa-utensils",
      text: "200+ món ăn đặc trưng - Khám phá ẩm thực Việt qua từng vùng miền",
    },
    {
      icon: "fa-solid fa-map-location-dot",
      text: "500+ bài viết chất lượng - Hướng dẫn du lịch chi tiết & thực tế",
    },
    {
      icon: "fa-solid fa-comments",
      text: "Real-time Chat - Kết nối với cộng đồng 24/7",
    },
    {
      icon: "fa-solid fa-trophy",
      text: "NFT Rewards - Thưởng cho những chia sẻ giá trị",
    },
    {
      icon: "fa-solid fa-heart",
      text: "Du lịch & ẩm thực Việt Nam - Tạo nên những kỷ niệm đáng nhớ",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      // Ẩn marquee khi scroll xuống quá 100px
      setIsVisible(scrollTop < 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
 
  // Sync CSS variable so other components (Header, dropdowns) can position themselves
  useEffect(() => {
    const marqueeHeight = isVisible ? "40px" : "0px";
    document.documentElement.style.setProperty("--marquee-height", marqueeHeight);
    return () => {
      // optional: leave variable as-is; cleanup not required
    };
  }, [isVisible]);

  return (
    <div
      className={`top-bar-container fixed top-0 left-0 right-0 h-10 bg-gradient-to-r from-primary-mint to-primary-mint-dark overflow-hidden z-[9999] border-b border-primary-mint-light/30 flex items-center shadow-sm transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="marquee-wrapper flex w-fit animate-scroll-left">
        {/* First set of items */}
        <div className="flex">
          {marqueeItems.map((item, index) => (
            <React.Fragment key={index}>
              <span className="marquee-item text-white font-poppins font-medium text-sm px-8 flex items-center gap-2.5 whitespace-nowrap">
                <i className={`${item.icon} text-accent-peach`}></i>
                {item.text}
                <span className="separator text-accent-peach/60 ml-6">
                  ✦
                </span>
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Second set of items (duplicate for seamless loop) */}
        <div className="flex">
          {marqueeItems.map((item, index) => (
            <React.Fragment key={`duplicate-${index}`}>
              <span className="marquee-item text-white font-poppins font-medium text-sm px-8 flex items-center gap-2.5 whitespace-nowrap">
                <i className={`${item.icon} text-accent-peach`}></i>
                {item.text}
                <span className="separator text-accent-peach/60 ml-6">
                  ✦
                </span>
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 50s linear infinite;
        }

        .top-bar-container:hover .marquee-wrapper {
          animation-play-state: paused;
          cursor: default;
        }

        @media (max-width: 768px) {
          .marquee-item {
            font-size: 0.75rem;
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }

        @media (max-width: 640px) {
          .marquee-item {
            font-size: 0.7rem;
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TopBarMarquee;
