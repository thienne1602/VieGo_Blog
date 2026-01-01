"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Award,
  Star,
  Clock,
  Flame,
  Crown,
  Target,
  Users,
} from "lucide-react";
import TourShowcase from "../../components/tours/TourShowcase";
import FeaturedTours from "../../components/tours/FeaturedTours";
import PromotionalBanner from "../../components/tours/PromotionalBanner";
import PopularDestinations from "../../components/tours/PopularDestinations";
import Footer from "../../components/layout/Footer";
import { useTheme } from "@/lib/ThemeContext";

export default function ToursPage() {
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { t } = useTranslation("tours");

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 transition-colors">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-teal-600 dark:border-t-teal-400 rounded-full mx-auto mb-4"
            ></motion.div>
            <p className="text-gray-600 dark:text-gray-300">
              {t("loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Blur Effect */}
      <div className="fixed inset-0 z-0">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/images/ha-long-bay-copy.jpg)",
          }}
        />
        {/* Blur Overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20 dark:bg-black/40"></div>
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"></div>
      </div>

      {/* Promotional Banner Section */}
      <div className="container mx-auto px-4 pt-8 relative z-10 mb-12">
        <PromotionalBanner />
      </div>

      {/* Featured Tours Section with Blur Effect */}
      <section className="container mx-auto px-4 mb-16 relative z-10">
        <div className="backdrop-blur-md bg-white/85 dark:bg-gray-900/85 rounded-3xl p-6 md:p-8 border-2 border-white/40 dark:border-gray-700/50 shadow-2xl">
          <FeaturedTours />
        </div>
      </section>

      {/* Popular Destinations with Blur Effect */}
      <section className="container mx-auto px-4 mb-16 relative z-10">
        <div className="backdrop-blur-md bg-white/85 dark:bg-gray-900/85 rounded-3xl p-6 md:p-8 border-2 border-white/40 dark:border-gray-700/50 shadow-2xl">
          <PopularDestinations />
        </div>
      </section>

      {/* All Tours Section with Blur Effect */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-[2.5rem] p-6 md:p-10 border border-white/50 dark:border-gray-700/50 shadow-2xl ring-1 ring-black/5">
          {/* Section Header */}
          <motion.div
            className="mb-12 text-center relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px] -z-10"></div>

            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-teal-500 text-white px-6 py-2 rounded-full shadow-lg shadow-primary-500/30 mb-6 transform hover:scale-105 transition-transform cursor-default">
              <Crown className="w-5 h-5" />
              <span className="font-bold tracking-wide text-sm uppercase">
                {t("sections.allTours")}
              </span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
              {t("sections.exploreAllDestinations").split(" ")[0]}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-500">
                {t("sections.exploreAllDestinations").split(" ").slice(1).join(" ")}
              </span>
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed">
              {t("sections.allToursDescription")}
            </p>
          </motion.div>

          {/* Tour Showcase Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <TourShowcase />
          </motion.div>
        </div>
      </div>

      {/* Final CTA Section */}
      <motion.section
        className="container mx-auto px-4 my-20 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative bg-primary-600/80 dark:bg-primary-900/80 backdrop-blur-lg border-2 border-white/30 dark:border-gray-700/50 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2), transparent 50%)`,
              backgroundSize: "200% 200%",
            }}
          />

          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Sparkles className="w-16 h-16" />
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t("sections.ctaHeading")}
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              {t("sections.ctaDescription")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.a
                href="mailto:contact@viego.com?subject=Tư vấn tour du lịch"
                className="px-8 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all duration-300 shadow-lg flex items-center justify-center"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                {t("sections.contactConsultation")}
              </motion.a>
              <motion.a
                href="mailto:custom@viego.com?subject=Yêu cầu thiết kế tour riêng"
                className="px-8 py-4 bg-white text-primary-600 dark:text-primary-700 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg flex items-center justify-center"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                {t("sections.customTour")}
              </motion.a>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features Grid with Blur Effect */}
      <motion.section
        className="container mx-auto px-4 mb-16 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Target className="w-8 h-8" />,
              title: t("features.qualityTours.title"),
              desc: t("features.qualityTours.description"),
            },
            {
              icon: <Users className="w-8 h-8" />,
              title: t("features.professionalGuides.title"),
              desc: t("features.professionalGuides.description"),
            },
            {
              icon: <Award className="w-8 h-8" />,
              title: t("features.uniqueExperiences.title"),
              desc: t("features.uniqueExperiences.description"),
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 text-center border-2 border-white/30 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <motion.div
                className="text-primary-600 dark:text-primary-400 mb-6 inline-block flex justify-center"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
