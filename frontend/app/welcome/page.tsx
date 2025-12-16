"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import api from "@/lib/api";

export default function WelcomePage() {
  const [isActive, setIsActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    isAuthenticated,
    login: authLogin,
    loading: authLoading,
  } = useAuth();

  // Animation mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Support /welcome?forgot=1 navigation (e.g. from /login)
  useEffect(() => {
    const shouldOpen = searchParams?.get("forgot") === "1";
    if (shouldOpen) {
      setShowForgotPassword(true);
    }
  }, [searchParams]);

  // Check if user is already authenticated and force param is not set
  // If authenticated without force param, they should be redirected by middleware/AuthGuard
  // But if force=true, allow them to stay (for logout/login flow)
  useEffect(() => {
    const forceParam = new URLSearchParams(window.location.search).get("force");
    if (isAuthenticated && forceParam !== "true" && !authLoading) {
      // User is authenticated and no force param, redirect to home
      router.replace("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await authLogin(formData.username, formData.password);
      if (success) {
        // Wait a bit for cookies to be set, then force redirect
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không đúng");
        setLoading(false);
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setForgotMessage("");
    setError("");

    const identifier = forgotIdentifier.trim();
    if (!identifier) {
      setForgotMessage("Vui lòng nhập email hoặc tên đăng nhập.");
      return;
    }

    setForgotLoading(true);
    try {
      const result = await api.post("/auth/forgot-password", {
        identifier,
      });

      if (!result.success) {
        setForgotMessage(
          result.error || "Không thể gửi mật khẩu mới. Vui lòng thử lại."
        );
        return;
      }

      const msg =
        result.data?.message ||
        "Nếu tài khoản tồn tại, mật khẩu mới đã được gửi về email của bạn.";
      setForgotMessage(msg);
    } catch (err: any) {
      setForgotMessage(
        err?.message || "Không thể gửi mật khẩu mới. Vui lòng thử lại."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.full_name
    ) {
      setError("Vui lòng điền đầy đủ thông tin");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto login after successful registration
        const loginSuccess = await authLogin(
          formData.username,
          formData.password
        );
        if (loginSuccess) {
          // Wait a bit for cookies to be set, then force redirect
          setTimeout(() => {
            window.location.href = "/";
          }, 100);
        } else {
          setIsActive(false); // Switch to login form
          setError("Đăng ký thành công! Vui lòng đăng nhập.");
          setLoading(false);
        }
      } else {
        setError(data.error || "Đăng ký thất bại. Vui lòng thử lại.");
        setLoading(false);
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-50 via-accent-50 to-secondary-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 flex items-center justify-center p-5">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/ha-long-bay-copy.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/30 dark:bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-200/40 dark:bg-primary-900/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-accent-200/40 dark:bg-accent-900/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-secondary-200/30 dark:bg-secondary-900/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Main Container with Toggle Effect */}
      <div
        className={`relative w-full max-w-7xl h-[650px] bg-white dark:bg-gray-800 rounded-[30px] shadow-2xl overflow-hidden transition-opacity duration-1000 ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Login Form Box */}
        <div
          className={`absolute top-0 ${
            isActive ? "right-1/2" : "right-0"
          } w-1/2 h-full bg-white dark:bg-gray-800 flex items-center justify-center px-10 z-10 transition-all duration-[1.8s] ease-in-out`}
        >
          <form onSubmit={handleLogin} className="w-full max-w-md space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Đăng nhập
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Chào mừng trở lại với VieGo
              </p>
            </div>

            {error && !isActive && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-5 pr-12 py-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg border-none outline-none text-gray-900 dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="Tên đăng nhập"
                required
              />
              <User
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                size={20}
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-5 pr-12 py-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg border-none outline-none text-gray-900 dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="Mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Forgot password */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword((v) => !v);
                  setForgotMessage("");
                }}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>

            {showForgotPassword && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Nhập <strong>email</strong> hoặc{" "}
                  <strong>tên đăng nhập</strong>. Nếu đúng, hệ thống sẽ tạo mật
                  khẩu mới và gửi về email.
                </p>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="w-full px-5 pr-12 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-gray-900 dark:text-white text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 transition-all"
                      placeholder="Email hoặc tên đăng nhập"
                    />
                    <Mail
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                      size={18}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={() => handleForgotPassword()}
                    className="w-full h-11 bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotLoading ? "Đang gửi..." : "Gửi mật khẩu mới"}
                  </button>

                  {forgotMessage && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {forgotMessage}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary-500 hover:bg-primary-600 rounded-lg shadow-md text-white text-base font-semibold cursor-pointer transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <img
                    src="/assets/stickers/dang-tai-2.gif"
                    alt="Loading"
                    className="w-6 h-6"
                  />
                  Đang xử lý...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                title="Đăng nhập với Facebook"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              <button
                type="button"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white hover:bg-gray-100 transition-all shadow-md hover:shadow-lg border border-gray-300"
                title="Đăng nhập với Google"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </button>

              <button
                type="button"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 transition-all shadow-md hover:shadow-lg"
                title="Đăng nhập với Zalo"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm.699 14.97l-3.115-3.322-6.084 3.322 6.699-7.111 3.189 3.322 6.01-3.322-6.699 7.111z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Register Form Box */}
        <div
          className={`absolute top-0 ${
            isActive ? "left-0" : "left-1/2"
          } w-1/2 h-full bg-white dark:bg-gray-800 flex items-center justify-center px-10 z-10 transition-all duration-[1.8s] ease-in-out ${
            isActive ? "visible" : "invisible"
          }`}
        >
          <form onSubmit={handleRegister} className="w-full max-w-md space-y-5">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Đăng ký
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Tạo tài khoản mới
              </p>
            </div>

            {error && isActive && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-5 pr-12 py-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg border-none outline-none text-gray-900 dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-accent-500 transition-all"
                placeholder="Họ và tên"
                required
              />
              <User
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                size={20}
              />
            </div>

            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-5 pr-12 py-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg border-none outline-none text-gray-900 dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-accent-500 transition-all"
                placeholder="Tên đăng nhập"
                required
              />
              <User
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                size={20}
              />
            </div>

            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-5 pr-12 py-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg border-none outline-none text-gray-900 dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-accent-500 transition-all"
                placeholder="Email"
                required
              />
              <Mail
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                size={20}
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-5 pr-12 py-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg border-none outline-none text-gray-900 dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-accent-500 transition-all"
                placeholder="Mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-accent-500 hover:bg-accent-600 rounded-lg shadow-md text-white text-base font-semibold cursor-pointer transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <img
                    src="/assets/stickers/dang-tai-2.gif"
                    alt="Loading"
                    className="w-6 h-6"
                  />
                  Đang xử lý...
                </span>
              ) : (
                "Đăng ký"
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Hoặc đăng ký với
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                title="Đăng ký với Facebook"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              <button
                type="button"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white hover:bg-gray-100 transition-all shadow-md hover:shadow-lg border border-gray-300"
                title="Đăng ký với Google"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </button>

              <button
                type="button"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 transition-all shadow-md hover:shadow-lg"
                title="Đăng ký với Zalo"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm.699 14.97l-3.115-3.322-6.084 3.322 6.699-7.111 3.189 3.322 6.01-3.322-6.699 7.111z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Toggle Box with Rounded Animation */}
        <div className="absolute w-full h-full pointer-events-none">
          <div
            className={`absolute ${
              isActive ? "left-1/2" : "-left-[250%]"
            } w-[300%] h-full bg-gradient-to-br from-primary-500 to-accent-500 dark:from-primary-600 dark:to-accent-600 rounded-[150px] z-20 transition-all duration-[1.8s] ease-in-out`}
            style={{
              transformOrigin: "center",
            }}
          ></div>

          {/* Left Toggle Panel (Show when inactive - Login view) */}
          <div
            className={`absolute left-0 w-1/2 h-full flex flex-col items-center justify-center text-white z-30 transition-all duration-[1.2s] ease-in-out ${
              isActive
                ? "-left-1/2 delay-[0.6s] opacity-0 invisible pointer-events-none"
                : "delay-[1.2s] opacity-100 visible pointer-events-auto"
            }`}
          >
            <div className="text-center space-y-6 px-8">
              <img
                src="/assets/stickers/dang-nhap.gif"
                alt="Đăng nhập"
                className="w-80 h-80 mx-auto drop-shadow-2xl object-contain"
              />
              <p className="text-lg font-medium leading-relaxed px-4">
                Việt Nam đang chờ bạn khám phá với muôn vàn điều kỳ diệu
              </p>
              <h1 className="text-4xl font-bold mt-4">
                Xin chào, Chào mừng bạn đến với VieGo
              </h1>
              <p className="text-lg opacity-90">Chưa có tài khoản?</p>
              <button
                onClick={() => {
                  setIsActive(true);
                  setError("");
                  setFormData({
                    username: "",
                    email: "",
                    password: "",
                    full_name: "",
                  });
                }}
                className="w-40 h-12 bg-transparent border-2 border-white rounded-lg text-white font-semibold cursor-pointer hover:bg-white hover:text-primary-600 transition-all shadow-none"
              >
                Đăng ký
              </button>
            </div>
          </div>

          {/* Right Toggle Panel (Show when active - Register view) */}
          <div
            className={`absolute right-0 w-1/2 h-full flex flex-col items-center justify-center text-white z-30 transition-all duration-[1.2s] ease-in-out ${
              isActive
                ? "delay-[1.2s] opacity-100 visible pointer-events-auto"
                : "-right-1/2 delay-[0.6s] opacity-0 invisible pointer-events-none"
            }`}
          >
            <div className="text-center space-y-6 px-8">
              <img
                src="/assets/stickers/dang-ki.gif"
                alt="Đăng ký"
                className="w-80 h-80 mx-auto drop-shadow-2xl object-contain"
              />
              <p className="text-lg font-medium leading-relaxed px-4">
                Cùng nhau viết nên những câu chuyện du lịch đáng nhớ
              </p>
              <h1 className="text-4xl font-bold mt-4">
                Chào mừng bạn đến với gia đình VieGo
              </h1>
              <p className="text-lg opacity-90">Đã có tài khoản?</p>
              <button
                onClick={() => {
                  setIsActive(false);
                  setError("");
                  setFormData({
                    username: "",
                    email: "",
                    password: "",
                    full_name: "",
                  });
                }}
                className="w-40 h-12 bg-transparent border-2 border-white rounded-lg text-white font-semibold cursor-pointer hover:bg-white hover:text-accent-600 transition-all shadow-none"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
