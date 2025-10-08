"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const RegisterPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page since we handle both login and register there
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Đang chuyển hướng...</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
