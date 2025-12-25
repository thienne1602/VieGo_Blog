"use client";

import { useEffect } from "react";
import "../lib/i18n"; // Initialize i18n
import { useTranslation } from "react-i18next";

function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem("language") || "vi";
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return <>{children}</>;
}

export default I18nProvider;
