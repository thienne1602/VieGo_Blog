"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";

type UiTheme = "system" | "light" | "dark";

type SettingsState = {
  privacy: {
    show_email: boolean;
    allow_messages: boolean;
    allow_friend_requests: boolean;
  };
  web: {
    email_notifications: boolean;
    ui_theme: UiTheme;
  };
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  const [language, setLanguage] = useState<string>("vi");
  const [timezone, setTimezone] = useState<string>("Asia/Ho_Chi_Minh");

  const [settings, setSettings] = useState<SettingsState>({
    privacy: {
      show_email: false,
      allow_messages: true,
      allow_friend_requests: true,
    },
    web: {
      email_notifications: true,
      ui_theme: "system",
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const canRender = useMemo(() => !loading && !!user, [loading, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/welcome");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!canRender) return;

    const load = async () => {
      setMessage("");
      setProfileLoading(true);
      try {
        const [profileRes, settingsRes] = await Promise.all([
          api.get("/auth/profile", {}, { bypassCache: true }),
          api.get("/auth/settings", {}, { bypassCache: true }),
        ]);

        if (profileRes.success && profileRes.data?.user) {
          setLanguage(profileRes.data.user.language || "vi");
          setTimezone(profileRes.data.user.timezone || "Asia/Ho_Chi_Minh");
        }

        if (settingsRes.success && settingsRes.data?.settings) {
          setSettings(settingsRes.data.settings);
        }
      } finally {
        setProfileLoading(false);
      }
    };

    load();
  }, [canRender]);

  const saveAll = async () => {
    setSaving(true);
    setMessage("");
    try {
      const profileRes = await api.put("/auth/profile", {
        language,
        timezone,
      });

      if (!profileRes.success) {
        setMessage(profileRes.error || "Cập nhật thông tin web thất bại.");
        return;
      }

      const settingsRes = await api.put("/auth/settings", settings);
      if (!settingsRes.success) {
        setMessage(settingsRes.error || "Cập nhật quyền riêng tư thất bại.");
        return;
      }

      setMessage("Đã lưu cài đặt.");

      // Broadcast user update so header/profile pages can reflect language/timezone changes.
      try {
        const updatedUser = profileRes.data?.user;
        if (updatedUser && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("userUpdated", {
              detail: updatedUser,
            })
          );
        }
      } catch {
        // ignore
      }
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setMessage("");
    try {
      const res = await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (!res.success) {
        setMessage(res.error || "Đổi mật khẩu thất bại.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setMessage("Đổi mật khẩu thành công.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!canRender) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Cài đặt
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Cài đặt web, quyền riêng tư và mật khẩu.
          </p>
        </div>

        <div className="p-6 space-y-8">
          {profileLoading && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Đang tải...
            </div>
          )}

          {message && (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {message}
            </div>
          )}

          {/* Web settings */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Web
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Ngôn ngữ
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Múi giờ
                </label>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Asia/Ho_Chi_Minh"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  Nhận email thông báo
                </span>
                <input
                  type="checkbox"
                  checked={settings.web.email_notifications}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      web: {
                        ...prev.web,
                        email_notifications: e.target.checked,
                      },
                    }))
                  }
                  className="h-5 w-5"
                />
              </label>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Giao diện
                </label>
                <select
                  value={settings.web.ui_theme}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      web: {
                        ...prev.web,
                        ui_theme: e.target.value as UiTheme,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="system">Theo hệ thống</option>
                  <option value="light">Sáng</option>
                  <option value="dark">Tối</option>
                </select>
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Quyền riêng tư
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  Hiển thị email trên hồ sơ
                </span>
                <input
                  type="checkbox"
                  checked={settings.privacy.show_email}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      privacy: {
                        ...prev.privacy,
                        show_email: e.target.checked,
                      },
                    }))
                  }
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  Cho phép người khác nhắn tin
                </span>
                <input
                  type="checkbox"
                  checked={settings.privacy.allow_messages}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      privacy: {
                        ...prev.privacy,
                        allow_messages: e.target.checked,
                      },
                    }))
                  }
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  Cho phép lời mời kết bạn
                </span>
                <input
                  type="checkbox"
                  checked={settings.privacy.allow_friend_requests}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      privacy: {
                        ...prev.privacy,
                        allow_friend_requests: e.target.checked,
                      },
                    }))
                  }
                  className="h-5 w-5"
                />
              </label>
            </div>
          </section>

          {/* Password */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Mật khẩu
            </h2>

            <form onSubmit={changePassword} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {changingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </form>
          </section>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={saveAll}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </button>
            <button
              onClick={() => router.push("/profile/user")}
              className="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-semibold"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
