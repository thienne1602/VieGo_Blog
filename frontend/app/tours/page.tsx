"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TourShowcase from "../../components/tours/TourShowcase";

const ToursPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary mx-auto mb-4"></div>
            <p className="text-neutral-600">Đang tải tours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-800 mb-4">
            Tours Du Lịch Việt Nam
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Khám phá Việt Nam cùng những tour du lịch chất lượng cao và trải
            nghiệm độc đáo
          </p>
        </motion.div>

        {/* Tour Showcase Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <TourShowcase />
        </motion.div>

        {/* Additional Information */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">
              Tours Chất Lượng
            </h3>
            <p className="text-neutral-600">
              Được thiết kế bởi các chuyên gia du lịch với kinh nghiệm nhiều năm
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">
              Hướng Dẫn Viên
            </h3>
            <p className="text-neutral-600">
              Đội ngũ hướng dẫn viên địa phương nhiệt tình và am hiểu văn hóa
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">
              Trải Nghiệm Độc Đáo
            </h3>
            <p className="text-neutral-600">
              Khám phá những góc nhìn mới về văn hóa và thiên nhiên Việt Nam
            </p>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="mt-16 text-center bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-neutral-800 mb-4">
            Sẵn sàng khởi hành?
          </h2>
          <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Hãy liên hệ với chúng tôi để được tư vấn và đặt tour phù hợp nhất
            cho chuyến đi của bạn.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn-primary text-lg px-8 py-3">
              Liên Hệ Tư Vấn
            </button>
            <button className="px-8 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300">
              Xem Thêm Tours
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ToursPage;
