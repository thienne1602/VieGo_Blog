"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
  Globe,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: "Về VieGo", href: "/about" },
      { name: "Tuyển dụng", href: "/careers" },
      { name: "Tin tức", href: "/blog" },
      { name: "Đối tác", href: "/partners" },
    ],
    support: [
      { name: "Trung tâm trợ giúp", href: "/help" },
      { name: "Chính sách bảo mật", href: "/privacy" },
      { name: "Điều khoản sử dụng", href: "/terms" },
      { name: "Liên hệ", href: "/contact" },
    ],
    destinations: [
      { name: "Hạ Long", href: "/tours?location=HaLong" },
      { name: "Sapa", href: "/tours?location=Sapa" },
      { name: "Đà Nẵng", href: "/tours?location=DaNang" },
      { name: "Phú Quốc", href: "/tours?location=PhuQuoc" },
    ],
  };

  return (
    <footer className="relative bg-gray-900 text-white pt-20 pb-10 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  VieGo
                </span>
              </div>
            </Link>
            <p className="text-gray-400 leading-relaxed">
              Khám phá vẻ đẹp Việt Nam qua những hành trình độc đáo. Chúng tôi
              kết nối bạn với những trải nghiệm văn hóa và thiên nhiên tuyệt vời
              nhất.
            </p>
            <div className="flex gap-4">
              {[
                {
                  Icon: Facebook,
                  href: "https://www.facebook.com/ngocthien.thachvan/",
                  label: "Facebook",
                },
                {
                  Icon: Globe,
                  href: "https://github.com/thienne1602",
                  label: "GitHub",
                },
              ].map(({ Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary-600 hover:border-primary-500 transition-all"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">Công Ty</h3>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-primary-400 transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">Điểm Đến Hot</h3>
            <ul className="space-y-4">
              {footerLinks.destinations.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-primary-400 transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">
              Đăng Ký Nhận Tin
            </h3>
            <p className="text-gray-400 mb-6">
              Nhận thông tin về các tour mới và ưu đãi đặc biệt.
            </p>
            <form className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-white placeholder-gray-500 transition-all"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all flex items-center justify-center gap-2"
              >
                <span>Đăng Ký</span>
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-t border-white/10 border-b mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Hotline</p>
              <p className="font-bold text-white">0948 283 916</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="font-bold text-white">ngocthien160224@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Địa chỉ</p>
              <p className="font-bold text-white">Hồ Chí Minh, Việt Nam</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {currentYear} VieGo. Tạo bởi thienne with love.</p>
          <div className="flex gap-6">
            {footerLinks.support.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
