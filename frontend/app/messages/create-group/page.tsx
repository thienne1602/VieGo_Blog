"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { getStorageKey } from "@/lib/api";
import { ArrowLeft, Users, X, Search, Check } from "lucide-react";
import Link from "next/link";

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<number>>(
    new Set()
  );
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      const fetchFriends = async () => {
        try {
          const token = localStorage.getItem(getStorageKey("access_token"));
          if (!token) {
            console.warn("[Messages] No token available for fetching friends");
            return;
          }

          const API_BASE_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
          const response = await fetch(`${API_BASE_URL}/social/friends`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setFriends(data.friends || []);
          } else if (response.status === 401) {
            console.warn("[Messages] Unauthorized - token may be invalid");
          }
        } catch (error) {
          console.error("Error fetching friends:", error);
        }
      };
      fetchFriends();
    }
  }, [user]);

  const filteredFriends = friends.filter((friend) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (friend.full_name || friend.username || "").toLowerCase();
    return name.includes(query);
  });

  const toggleFriend = (friendId: number) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Vui lòng nhập tên nhóm");
      return;
    }
    if (selectedFriends.size < 2) {
      alert("Vui lòng chọn ít nhất 2 bạn bè để tạo nhóm");
      return;
    }
    // TODO: Implement create group API
    alert("Tính năng tạo nhóm sẽ được triển khai sau");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Vui lòng đăng nhập</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/messages">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tạo nhóm chat
          </h1>
        </div>

        {/* Group Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6"
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tên nhóm
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nhập tên nhóm..."
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          />
        </motion.div>

        {/* Search Friends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6"
        >
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          {/* Selected Count */}
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Đã chọn: {selectedFriends.size} bạn bè
          </div>

          {/* Friends List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery.trim()
                    ? "Không tìm thấy bạn bè"
                    : "Chưa có bạn bè nào"}
                </p>
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isSelected = selectedFriends.has(friend.id);
                return (
                  <motion.div
                    key={friend.id}
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                    onClick={() => toggleFriend(friend.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                      isSelected
                        ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700"
                        : ""
                    }`}
                  >
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.full_name || friend.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                        {(friend.full_name ||
                          friend.username ||
                          "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {friend.full_name || friend.username}
                      </h3>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary-500" />
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Create Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedFriends.size < 2}
            className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Tạo nhóm ({selectedFriends.size} thành viên)
          </button>
        </motion.div>
      </div>
    </div>
  );
}
