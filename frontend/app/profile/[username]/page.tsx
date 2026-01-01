"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getAPIURL } from "@/lib/api";
import UserProfile from "../user/page";

export default function ProfileByUsername() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [userId, setUserId] = useState<number | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (loading) return;

    const username = params?.username as string;
    if (!username) {
      router.push("/profile");
      return;
    }

    // If viewing own profile, redirect to /profile/user
    if (user && user.username === username) {
      router.push("/profile/user");
      return;
    }

    // Fetch user ID by username
    const fetchUserId = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const API_BASE_URL = getAPIURL();

        const response = await fetch(
          `${API_BASE_URL}/users?username=${encodeURIComponent(
            username
          )}&per_page=1`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const users = data.data || data.users || [];
          if (users.length > 0) {
            const foundUser = users[0];
            setUserId(foundUser.id);
            // Redirect to profile/user with id query param
            router.replace(`/profile/user?id=${foundUser.id}`);
          } else {
            // User not found, redirect to profile
            router.push("/profile");
          }
        } else {
          router.push("/profile");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/profile");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserId();
  }, [params, user, loading, router]);

  if (loading || loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 dark:border-gray-700 border-t-primary-600 dark:border-t-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return null;
}
