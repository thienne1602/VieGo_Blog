"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import BackgroundImage from "@/components/common/BackgroundImage";
import { getAPIURL } from "@/lib/api";
import {
  Mail,
  Phone,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Settings,
  CreditCard,
  FileText,
  User,
} from "lucide-react";

const API_BASE_URL = getAPIURL();

export default function ContactPage() {
  const { t } = useTranslation("contact");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    category: "general",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    {
      value: "technical",
      label: t("form.categories.technical"),
      icon: Settings,
    },
    { value: "account", label: t("form.categories.account"), icon: User },
    { value: "content", label: t("form.categories.content"), icon: FileText },
    { value: "payment", label: t("form.categories.payment"), icon: CreditCard },
    { value: "general", label: t("form.categories.general"), icon: HelpCircle },
    { value: "report", label: t("form.categories.report"), icon: AlertCircle },
    {
      value: "suggestion",
      label: t("form.categories.suggestion"),
      icon: MessageSquare,
    },
    { value: "other", label: t("form.categories.other"), icon: HelpCircle },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const headers: any = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/contact/`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("form.error.submit"));
      }

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        category: "general",
      });
    } catch (err: any) {
      setError(err.message || t("form.error.generic"));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <BackgroundImage overlay={true} overlayOpacity={40} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t("form.success.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t("form.success.message")}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t("form.success.button")}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-24 pb-12 px-4">
      <BackgroundImage overlay={true} overlayOpacity={35} blur={true} />
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-white dark:text-white mb-4 drop-shadow-lg"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white dark:text-gray-300 drop-shadow-md"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t("form.title")}
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t("form.category")}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              category: category.value,
                            })
                          }
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.category === category.value
                              ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 mx-auto mb-1 ${
                              formData.category === category.value
                                ? "text-blue-500 dark:text-blue-400"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          />
                          <p
                            className={`text-xs ${
                              formData.category === category.value
                                ? "text-blue-700 dark:text-blue-300 font-medium"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {category.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("form.name")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={t("form.namePlaceholder")}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("form.email")}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={t("form.emailPlaceholder")}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("form.phone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={t("form.phonePlaceholder")}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("form.subject")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={t("form.subjectPlaceholder")}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("form.message")}
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={t("form.messagePlaceholder")}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t("form.sending")}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>{t("form.submit")}</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {t("contactInfo.title")}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("contactInfo.email")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        support@viego.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-green-500 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("contactInfo.hotline")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        1900-xxxx
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {t("responseTime.title")}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("responseTime.general")}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t("responseTime.hours24")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("responseTime.urgent")}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t("responseTime.hours2")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("responseTime.technical")}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t("responseTime.hours12")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-2">
                  {t("tips.title")}
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li>• {t("tips.tip1")}</li>
                  <li>• {t("tips.tip2")}</li>
                  <li>• {t("tips.tip3")}</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
