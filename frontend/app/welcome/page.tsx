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

  // Don't redirect in useEffect - let middleware handle it
  // This prevents redirect loops

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-500 via-teal-400 to-emerald-500">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
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
              <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
                <Compass className="w-6 h-6 text-white animate-spin-slow" />
                <span className="text-white font-semibold">
                  Khám phá Việt Nam đích thực
                </span>
              </div>

              <h1 className="text-8xl font-black text-white drop-shadow-2xl leading-tight">
                Vie<span className="text-orange-400">Go</span>
              </h1>

              <p className="text-3xl text-white/90 font-light leading-relaxed">
                Hành trình của bạn,
                <br />
                <span className="font-semibold text-white">
                  Câu chuyện của chúng ta
                </span>
              </p>

              <p className="text-xl text-white/80 max-w-xl">
                Nơi mọi chuyến đi trở thành kỷ niệm, mọi trải nghiệm được chia
                sẻ, và mọi người đam mê du lịch kết nối với nhau.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="group bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">
                  5000+ Địa điểm
                </h3>
                <p className="text-white/70 text-sm">Khám phá khắp Việt Nam</p>
              </div>

              <div className="group bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="bg-gradient-to-br from-orange-400 to-red-500 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Utensils className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">
                  Ẩm thực đường phố
                </h3>
                <p className="text-white/70 text-sm">Khám phá hương vị Việt</p>
              </div>

              <div className="group bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">
                  Cộng đồng 10K+
                </h3>
                <p className="text-white/70 text-sm">
                  Kết nối người yêu du lịch
                </p>
              </div>

              <div className="group bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Mountain className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">
                  Tour độc đáo
                </h3>
                <p className="text-white/70 text-sm">Trải nghiệm khác biệt</p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center justify-around bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 mt-8">
              <div className="text-center">
                <div className="text-4xl font-black text-white">50K+</div>
                <div className="text-white/70 text-sm mt-1">Bài viết</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-black text-white">10K+</div>
                <div className="text-white/70 text-sm mt-1">Thành viên</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-black text-white">1000+</div>
                <div className="text-white/70 text-sm mt-1">Điểm đến</div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="lg:col-span-2 w-full">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/50">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-6 text-center">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-500 mb-2">
                  VieGo
                </h1>
                <p className="text-gray-600 font-medium">
                  Khám phá Việt Nam đích thực
                </p>
              </div>

              {/* Welcome Text */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {isLogin
                    ? "Chào mừng trở lại! 👋"
                    : "Tham gia cùng chúng tôi! 🎉"}
                </h2>
                <p className="text-gray-600">
                  {isLogin
                    ? "Đăng nhập để tiếp tục hành trình của bạn"
                    : "Tạo tài khoản để bắt đầu khám phá"}
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-gradient-to-r from-teal-50 to-orange-50 rounded-xl p-1.5 mb-6">
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
                      ? "bg-white text-teal-600 shadow-lg scale-105"
                      : "text-gray-600 hover:text-gray-800"
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
                      ? "bg-white text-orange-600 shadow-lg scale-105"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Đăng ký
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 animate-shake">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⚠️</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Login Form */}
              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tên đăng nhập hoặc Email
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                      placeholder="example@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
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
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tên đăng nhập
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      placeholder="traveler123"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      placeholder="example@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
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
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                <p className="text-gray-600">
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
                        className="text-orange-600 hover:text-orange-700 font-bold hover:underline transition"
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
                        className="text-teal-600 hover:text-teal-700 font-bold hover:underline transition"
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
