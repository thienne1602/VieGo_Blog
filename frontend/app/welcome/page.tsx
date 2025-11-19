"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  Eye,
  EyeOff,
  MapPin,
  Camera,
  Users,
  Sparkles,
  Compass,
  Mountain,
  Utensils,
  Heart,
  Plane,
  Map,
} from "lucide-react";

export default function WelcomePage() {
  const [isLogin, setIsLogin] = useState(true);
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

  const router = useRouter();
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
          setIsLogin(true);
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
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle floating circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100/30 dark:bg-primary-900/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-100/30 dark:bg-accent-900/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-100/20 dark:bg-primary-900/10 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzllYTNhZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50 dark:opacity-20"></div>
      </div>

      <div
        className={`relative z-10 min-h-screen flex items-center justify-center p-4 transition-opacity duration-1000 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-full max-w-7xl grid lg:grid-cols-5 gap-8 items-center">
          {/* Left Side - Hero Branding */}
          <div className="lg:col-span-3 hidden lg:block space-y-8 p-8">
            {/* Main Logo & Tagline */}
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center space-x-3 bg-white dark:bg-gray-800/50 backdrop-blur-md px-6 py-3 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
                <Compass className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <span className="text-gray-800 dark:text-gray-200 font-semibold">
                  Khám phá Việt Nam đích thực
                </span>
              </div>

              <h1 className="text-8xl font-black text-gray-900 dark:text-white leading-tight">
                Vie<span className="text-primary-600 dark:text-primary-400">Go</span>
              </h1>

              <p className="text-3xl text-gray-800 dark:text-gray-200 font-light leading-relaxed">
                Hành trình của bạn,
                <br />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Câu chuyện của chúng ta
                </span>
              </p>

              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl">
                Nơi mọi chuyến đi trở thành kỷ niệm, mọi trải nghiệm được chia
                sẻ, và mọi người đam mê du lịch kết nối với nhau.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="group bg-white dark:bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  5000+ Địa điểm
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Khám phá khắp Việt Nam</p>
              </div>

              <div className="group bg-white dark:bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-accent-300 dark:hover:border-accent-600 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="bg-accent-100 dark:bg-accent-900/30 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Utensils className="w-7 h-7 text-accent-600 dark:text-accent-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  Ẩm thực đường phố
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Khám phá hương vị Việt</p>
              </div>

              <div className="group bg-white dark:bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  Cộng đồng 10K+
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Kết nối người yêu du lịch
                </p>
              </div>

              <div className="group bg-white dark:bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Mountain className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  Tour độc đáo
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Trải nghiệm khác biệt</p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center justify-around bg-white dark:bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg mt-8">
              <div className="text-center">
                <div className="text-4xl font-black text-primary-600 dark:text-primary-400">50K+</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Bài viết</div>
              </div>
              <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
              <div className="text-center">
                <div className="text-4xl font-black text-primary-600 dark:text-primary-400">10K+</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Thành viên</div>
              </div>
              <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
              <div className="text-center">
                <div className="text-4xl font-black text-primary-600 dark:text-primary-400">1000+</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Điểm đến</div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="lg:col-span-2 w-full">
            <div className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-6 text-center">
                <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-2">
                  Vie<span className="text-primary-600 dark:text-primary-400">Go</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Khám phá Việt Nam đích thực
                </p>
              </div>

              {/* Welcome Text */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {isLogin
                    ? "Chào mừng trở lại!"
                    : "Tham gia cùng chúng tôi!"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {isLogin
                    ? "Đăng nhập để tiếp tục hành trình của bạn"
                    : "Tạo tài khoản để bắt đầu khám phá"}
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1.5 mb-6">
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setError("");
                    setFormData({
                      username: "",
                      email: "",
                      password: "",
                      full_name: "",
                    });
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    isLogin
                      ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-lg scale-105"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setError("");
                    setFormData({
                      username: "",
                      email: "",
                      password: "",
                      full_name: "",
                    });
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    !isLogin
                      ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-lg scale-105"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  Đăng ký
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 animate-shake">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Login Form */}
              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tên đăng nhập hoặc Email
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all"
                      placeholder="example@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      >
                        {showPassword ? (
                          <EyeOff size={22} />
                        ) : (
                          <Eye size={22} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-3"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Đang xử lý...
                      </span>
                    ) : (
                      "Đăng nhập ngay"
                    )}
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tên đăng nhập
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all"
                      placeholder="traveler123"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all"
                      placeholder="example@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all"
                        placeholder="Tối thiểu 6 ký tự"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      >
                        {showPassword ? (
                          <EyeOff size={22} />
                        ) : (
                          <Eye size={22} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-3"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Đang xử lý...
                      </span>
                    ) : (
                      "Tạo tài khoản"
                    )}
                  </button>
                </form>
              )}

              {/* Additional Info */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {isLogin ? (
                    <>
                      Chưa có tài khoản?{" "}
                      <button
                        onClick={() => {
                          setIsLogin(false);
                          setError("");
                          setFormData({
                            username: "",
                            email: "",
                            password: "",
                            full_name: "",
                          });
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold hover:underline transition"
                      >
                        Đăng ký miễn phí
                      </button>
                    </>
                  ) : (
                    <>
                      Đã có tài khoản?{" "}
                      <button
                        onClick={() => {
                          setIsLogin(true);
                          setError("");
                          setFormData({
                            username: "",
                            email: "",
                            password: "",
                            full_name: "",
                          });
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold hover:underline transition"
                      >
                        Đăng nhập ngay
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
