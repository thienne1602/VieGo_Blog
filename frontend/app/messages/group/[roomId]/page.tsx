"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function GroupChatPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useAuth();

  // Redirect to unified chat page
  useEffect(() => {
    if (roomId) {
      router.replace(`/messages/${roomId}?type=group`);
    }
  }, [roomId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Đang chuyển hướng...</p>
    </div>
  );
}

