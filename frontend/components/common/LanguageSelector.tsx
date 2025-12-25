"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";
import { ChevronDown, Globe } from "lucide-react";

const LanguageSelector = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentLang, setCurrentLang] = useState("vi");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t, i18n } = useTranslation("common");

  const languages = [
    { code: "vi", name: t("language.vietnamese"), flag: "🇻🇳" },
    { code: "en", name: t("language.english"), flag: "🇺🇸" },
    { code: "zh", name: t("language.chinese"), flag: "🇨🇳" },
  ];

  useEffect(() => {
    // Get current language from localStorage or default to 'vi'
    const savedLang = localStorage.getItem("language") || "vi";
    setCurrentLang(savedLang);
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleLanguageChange = async (langCode: string) => {
    try {
      // Save to localStorage
      localStorage.setItem("language", langCode);

      // Change language in i18next
      await i18n.changeLanguage(langCode);

      // Update state
      setCurrentLang(langCode);
      setShowDropdown(false);

      // Optional: Reload page to apply language changes throughout the app
      // router.refresh();
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 rounded-full transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDropdown(!showDropdown)}
        title={t("language.selectLanguage")}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLanguage.flag}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            showDropdown ? "rotate-180" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  currentLang === lang.code
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
                whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                {currentLang === lang.code && (
                  <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
