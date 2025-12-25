"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Home,
  Map,
  MessageSquare,
  User,
  FileText,
  Mail,
  Users,
  Settings,
  Globe,
} from "lucide-react";

const pages = [
  { href: "/", label: "home.title", icon: Home, namespace: "home" },
  { href: "/tours", label: "sections.allTours", icon: Map, namespace: "tours" },
  { href: "/tours/1", label: "tourDetail.tabs.overview", icon: Map, namespace: "tourDetail" },
  { href: "/blog", label: "loading", icon: FileText, namespace: "blog" },
  { href: "/messages", label: "tabs.messages", icon: MessageSquare, namespace: "messages" },
  { href: "/contact", label: "title", icon: Mail, namespace: "contact" },
  { href: "/profile", label: "navigation.profile", icon: User, namespace: "profile" },
];

export default function I18nDemoPage() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <Globe className="w-8 h-8 text-primary-500" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                🌐 Internationalization Demo
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Test đa ngôn ngữ trên tất cả các trang của website
            </p>

            {/* Language Switcher */}
            <div className="flex justify-center gap-4 mb-8">
              {[
                { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
                { code: "en", name: "English", flag: "🇺🇸" },
                { code: "zh", name: "中文", flag: "🇨🇳" },
              ].map((lang) => (
                <motion.button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    i18n.language === lang.code
                      ? "bg-primary-500 text-white shadow-lg"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-lg mr-2">{lang.flag}</span>
                  {lang.name}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Pages Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {pages.map((page, index) => {
              const Icon = page.icon;
              return (
                <motion.div
                  key={page.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Link href={page.href}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {page.href === "/" ? "Home" : page.href.split("/")[1]}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {page.namespace}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Test translations for {page.href === "/" ? "homepage" : page.href.split("/")[1]} page
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Current Language Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Current Language: {i18n.language.toUpperCase()}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                All translations are loaded dynamically. Change language and visit any page to see translations in action!
              </p>
            </div>
          </motion.div>

          {/* Quick Translation Test */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Header</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("header.searchPlaceholder", { ns: "common" })}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Navigation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("nav.home", { ns: "common" })}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tours</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("sections.allTours", { ns: "tours" })}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
