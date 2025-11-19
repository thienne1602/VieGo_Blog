"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useChat } from "@/hooks/useChat";
import {
  Search,
  MessageCircle,
  Settings,
  Users,
  Bell,
  BellOff,
  Image as ImageIcon,
  X,
  Loader2,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function MessagesListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { conversations, fetchConversations } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<
    number | null
  >(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<
    Set<number>
  >(new Set());
  const [groupModalSearch, setGroupModalSearch] = useState("");

  useEffect(() => {
    if (user) {
      fetchConversations();
      // Fetch friends for group creation
      const fetchFriends = async () => {
        try {
          const token = localStorage.getItem("access_token");
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
  }, [user, fetchConversations]);

  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId) {
      setSelectedConversation(parseInt(userId));
    }
  }, [searchParams]);

  const formatTimeAgo = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} ngày`;

    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
    });
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    if (conv.type === "group") {
      const groupName = (conv.group?.name || "").toLowerCase();
      return groupName.includes(query);
    } else {
      const name = (
        conv.other_user?.full_name ||
        conv.other_user?.username ||
        ""
      ).toLowerCase();
      return name.includes(query);
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Vui lòng đăng nhập</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      {/* Sidebar - Conversations List */}
      <div className="w-full md:w-96 lg:w-[400px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Tin nhắn
            </h1>
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Cài đặt"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          {/* Create Group Button */}
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm mb-3"
          >
            <Users className="w-4 h-4" />
            <span>Tạo nhóm chat</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "Không tìm thấy cuộc trò chuyện"
                  : "Chưa có cuộc trò chuyện nào"}
              </p>
            </div>
          ) : (
            <div>
              {filteredConversations.map((conv) => {
                const isGroup = conv.type === "group";
                const isSelected = isGroup
                  ? selectedConversation === conv.group?.room_id
                  : selectedConversation === conv.other_user?.id;

                const displayName = isGroup
                  ? conv.group?.name || "Nhóm chat"
                  : conv.other_user?.full_name || conv.other_user?.username;

                const displayAvatar = isGroup
                  ? conv.group?.avatar_url
                  : conv.other_user?.avatar_url;

                const href = isGroup
                  ? `/messages/${conv.group?.room_id}?type=group`
                  : `/messages/${conv.other_user?.id}`;

                return (
                  <Link
                    key={conv.id}
                    href={href}
                    onClick={() =>
                      setSelectedConversation(
                        isGroup
                          ? conv.group?.room_id
                          : conv.other_user?.id || null
                      )
                    }
                  >
                    <motion.div
                      whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                        isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        {displayAvatar ? (
                          <img
                            src={displayAvatar}
                            alt={displayName}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                              isGroup
                                ? "bg-gradient-to-br from-purple-500 to-purple-600"
                                : "bg-gradient-to-br from-primary-500 to-primary-600"
                            }`}
                          >
                            {isGroup ? (
                              <Users className="w-6 h-6" />
                            ) : (
                              (displayName || "?")[0].toUpperCase()
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {displayName}
                              </h3>
                              {isGroup && (
                                <Users className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            {conv.last_message && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {formatTimeAgo(conv.last_message.created_at)}
                              </span>
                            )}
                          </div>

                          {conv.last_message && (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                {isGroup && conv.last_message.sender ? (
                                  <>
                                    <span className="font-medium">
                                      {conv.last_message.sender.full_name ||
                                        conv.last_message.sender.username}
                                      :
                                    </span>{" "}
                                    {conv.last_message.message}
                                  </>
                                ) : (
                                  conv.last_message.message
                                )}
                              </p>
                              {conv.unread_count > 0 && (
                                <span className="ml-2 bg-primary-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Chat View */}
      <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        {selectedConversation ? (
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              Chọn một cuộc trò chuyện để bắt đầu
            </p>
          </div>
        ) : (
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              Chọn một cuộc trò chuyện để bắt đầu
            </p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowCreateGroupModal(false);
              setGroupModalSearch("");
              setGroupName("");
              setSelectedFriendsForGroup(new Set());
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tạo nhóm chat
                </h2>
                <button
                  onClick={() => {
                    setShowCreateGroupModal(false);
                    setGroupModalSearch("");
                    setGroupName("");
                    setSelectedFriendsForGroup(new Set());
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Group Name Input */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
              </div>

              {/* Search Friends */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bạn bè..."
                    value={groupModalSearch}
                    onChange={(e) => setGroupModalSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Đã chọn: {selectedFriendsForGroup.size} bạn bè
                </div>
              </div>

              {/* Friends List */}
              <div className="flex-1 overflow-y-auto p-4">
                {(() => {
                  const filteredGroupFriends = friends.filter((friend) => {
                    if (!groupModalSearch.trim()) return true;
                    const query = groupModalSearch.toLowerCase();
                    const name = (
                      friend.full_name ||
                      friend.username ||
                      ""
                    ).toLowerCase();
                    return name.includes(query);
                  });

                  if (filteredGroupFriends.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {groupModalSearch.trim()
                            ? "Không tìm thấy bạn bè"
                            : "Chưa có bạn bè nào"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {filteredGroupFriends.map((friend) => {
                        const isSelected = selectedFriendsForGroup.has(
                          friend.id
                        );
                        return (
                          <motion.div
                            key={friend.id}
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                            onClick={() => {
                              const newSelected = new Set(
                                selectedFriendsForGroup
                              );
                              if (isSelected) {
                                newSelected.delete(friend.id);
                              } else {
                                newSelected.add(friend.id);
                              }
                              setSelectedFriendsForGroup(newSelected);
                            }}
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
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={async () => {
                    if (!groupName.trim()) {
                      alert("Vui lòng nhập tên nhóm");
                      return;
                    }
                    if (selectedFriendsForGroup.size < 2) {
                      alert("Vui lòng chọn ít nhất 2 bạn bè để tạo nhóm");
                      return;
                    }

                    try {
                      const token = localStorage.getItem("access_token");
                      const API_BASE_URL =
                        process.env.NEXT_PUBLIC_API_URL ||
                        "http://localhost:5000/api";

                      const response = await fetch(
                        `${API_BASE_URL}/chat/groups`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            name: groupName.trim(),
                            description: "",
                            member_ids: Array.from(selectedFriendsForGroup),
                          }),
                        }
                      );

                      if (response.ok) {
                        const data = await response.json();
                        // Refresh conversations
                        await fetchConversations();
                        // Navigate to group chat
                        router.push(
                          `/messages/${data.group.room_id}?type=group`
                        );
                        setShowCreateGroupModal(false);
                        setGroupModalSearch("");
                        setGroupName("");
                        setSelectedFriendsForGroup(new Set());
                      } else {
                        const error = await response.json();
                        alert(error.error || "Có lỗi xảy ra khi tạo nhóm");
                      }
                    } catch (error) {
                      console.error("Error creating group:", error);
                      alert("Có lỗi xảy ra khi tạo nhóm");
                    }
                  }}
                  disabled={
                    !groupName.trim() || selectedFriendsForGroup.size < 2
                  }
                  className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Tạo nhóm ({selectedFriendsForGroup.size} thành viên)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
