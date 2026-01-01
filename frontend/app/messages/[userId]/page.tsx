"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useSocket } from "@/lib/SocketContext";
import { useChat } from "@/hooks/useChat";
import { useTheme } from "@/lib/ThemeContext";
import { getStorageKey } from "@/lib/api";
import { getAPIURL, getBaseURL } from "@/lib/apiConfig";
import {
  ArrowLeft,
  Send,
  Loader2,
  Image as ImageIcon,
  Mic,
  MapPin,
  X,
  Play,
  Pause,
  Paperclip,
  MessageCircle,
  Check,
  CheckCheck,
  Settings,
  Bell,
  BellOff,
  Palette,
  User,
  UserMinus,
  Search,
  Moon,
  Sun,
  Shield,
  Globe,
  Users,
  Plus,
  Pin,
  Trash2,
  MoreVertical,
  UserPlus,
  LogOut,
  UserX,
} from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  id: number;
  message: string;
  message_type: string;
  sender_id: number;
  receiver_id?: number;
  room_id?: string;
  file_url?: string;
  file_type?: string;
  sender?: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  created_at: string;
  status: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = params.userId as string;
  const chatType = searchParams.get("type") || "user"; // 'user' or 'group'
  const isGroupChat = chatType === "group";
  const otherUserId = isGroupChat ? null : parseInt(chatId);
  const roomId = isGroupChat ? chatId : null;
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { conversations, fetchConversations } = useChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [groupNameEdit, setGroupNameEdit] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [friendshipChecked, setFriendshipChecked] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [chatBackground, setChatBackground] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [generalNotifications, setGeneralNotifications] = useState(true);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(
    null
  );
  const [friends, setFriends] = useState<any[]>([]);
  const [pinnedConversations, setPinnedConversations] = useState<Set<number>>(
    new Set()
  );
  const [deletedConversations, setDeletedConversations] = useState<Set<number>>(
    new Set()
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState<
    number | null
  >(null);
  const [createModalSearch, setCreateModalSearch] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<
    Set<number>
  >(new Set());
  const [groupModalSearch, setGroupModalSearch] = useState("");
  // Add Member modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [selectedFriendsToAdd, setSelectedFriendsToAdd] = useState<Set<number>>(
    new Set()
  );
  // Disband group modal state
  const [showDisbandModal, setShowDisbandModal] = useState(false);
  const [isSettingsHovered, setIsSettingsHovered] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat settings from localStorage
  useEffect(() => {
    if (user) {
      if (!isGroupChat && otherUserId) {
        // Load 1-1 chat settings
        const settingsKey = `chat_settings_${user.id}_${otherUserId}`;
        const saved = localStorage.getItem(settingsKey);
        if (saved) {
          try {
            const settings = JSON.parse(saved);
            setChatBackground(settings.background || null);
            setNickname(settings.nickname || "");
            setNotificationsMuted(settings.notificationsMuted || false);
          } catch (e) {
            console.error("Error loading chat settings:", e);
          }
        }
      } else if (isGroupChat && roomId) {
        // Load group chat settings
        const settingsKey = `chat_settings_group_${user.id}_${roomId}`;
        const saved = localStorage.getItem(settingsKey);
        if (saved) {
          try {
            const settings = JSON.parse(saved);
            setChatBackground(settings.background || null);
            setNotificationsMuted(settings.notificationsMuted || false);
            setNickname(""); // Reset nickname for group
          } catch (e) {
            console.error("Error loading group chat settings:", e);
          }
        } else {
          // Reset settings when switching to group
          setChatBackground(null);
          setNotificationsMuted(false);
          setNickname("");
        }
      }
    }
  }, [user, otherUserId, isGroupChat, roomId]);

  // Save chat settings to localStorage
  // Handle background image upload
  const handleBackgroundUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh hợp lệ!");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Ảnh quá lớn! Kích thước tối đa là 10MB.");
      return;
    }

    try {
      setUploadingBackground(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem(getStorageKey("access_token"));
      const API_BASE_URL = getAPIURL();

      const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload thất bại");
      }

      const data = await response.json();

      // Get base URL without /api
      const baseURL = getBaseURL();

      // Set background to uploaded image URL
      const imageUrl = `${baseURL}${data.url}`;
      setChatBackground(imageUrl);

      // Auto save settings
      if (user) {
        if (!isGroupChat && otherUserId) {
          const settingsKey = `chat_settings_${user.id}_${otherUserId}`;
          const settings = {
            background: imageUrl,
            nickname: nickname,
            notificationsMuted: notificationsMuted,
          };
          localStorage.setItem(settingsKey, JSON.stringify(settings));
        } else if (isGroupChat && roomId) {
          const settingsKey = `chat_settings_group_${user.id}_${roomId}`;
          const settings = {
            background: imageUrl,
            notificationsMuted: notificationsMuted,
          };
          localStorage.setItem(settingsKey, JSON.stringify(settings));
        }
      }
    } catch (error: any) {
      console.error("Error uploading background:", error);
      alert(error.message || "Lỗi khi upload ảnh. Vui lòng thử lại!");
      setBackgroundPreview(null);
    } finally {
      setUploadingBackground(false);
      // Reset input
      if (backgroundInputRef.current) {
        backgroundInputRef.current.value = "";
      }
    }
  };

  const saveChatSettings = () => {
    if (user) {
      if (!isGroupChat && otherUserId) {
        const settingsKey = `chat_settings_${user.id}_${otherUserId}`;
        const settings = {
          background: chatBackground,
          nickname: nickname,
          notificationsMuted: notificationsMuted,
        };
        localStorage.setItem(settingsKey, JSON.stringify(settings));
      } else if (isGroupChat && roomId) {
        const settingsKey = `chat_settings_group_${user.id}_${roomId}`;
        const settings = {
          background: chatBackground,
          notificationsMuted: notificationsMuted,
        };
        localStorage.setItem(settingsKey, JSON.stringify(settings));
      }
      // Show success feedback (optional - could add toast notification)
    }
  };

  // Load pinned and deleted conversations from localStorage
  useEffect(() => {
    if (user) {
      const pinnedKey = `pinned_conversations_${user.id}`;
      const deletedKey = `deleted_conversations_${user.id}`;
      const savedPinned = localStorage.getItem(pinnedKey);
      const savedDeleted = localStorage.getItem(deletedKey);
      if (savedPinned) {
        try {
          setPinnedConversations(new Set(JSON.parse(savedPinned)));
        } catch (e) {
          console.error("Error loading pinned conversations:", e);
        }
      }
      if (savedDeleted) {
        try {
          setDeletedConversations(new Set(JSON.parse(savedDeleted)));
        } catch (e) {
          console.error("Error loading deleted conversations:", e);
        }
      }
    }
  }, [user]);

  // Fetch friends list
  useEffect(() => {
    if (user) {
      const fetchFriends = async () => {
        try {
          const token = localStorage.getItem(getStorageKey("access_token"));
          if (!token) {
            console.warn("[Messages] No token available for fetching friends");
            return;
          }

          const API_BASE_URL = getAPIURL();
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

  // Fetch conversations list
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Fetch messages and other user info (for 1-1 chat) or group info (for group chat)
  useEffect(() => {
    if (!user) return;
    if (!isGroupChat && !otherUserId) return;
    if (isGroupChat && !roomId) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem(getStorageKey("access_token"));
        const API_BASE_URL = getAPIURL();

        if (isGroupChat && roomId) {
          // Fetch group info
          const groupResponse = await fetch(
            `${API_BASE_URL}/chat/groups/${roomId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            setGroup(groupData.group);
            setGroupNameEdit(groupData.group?.name || "");
            setMembers(groupData.group.members || []);
            setIsFriend(true); // Group chat doesn't need friendship check
            setFriendshipChecked(true);
          } else {
            const error = await groupResponse.json();
            alert(error.error || "Không tìm thấy nhóm");
            router.push("/messages");
            return;
          }

          // Fetch group messages
          const messagesResponse = await fetch(
            `${API_BASE_URL}/chat/groups/${roomId}/messages`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            setMessages(messagesData.messages || []);
          }
        } else if (!isGroupChat && otherUserId) {
          // Fetch other user info
          const userResponse = await fetch(
            `${API_BASE_URL}/users/${otherUserId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setOtherUser(userData.data || userData);
          }

          // Check friendship status
          let friendshipData = null;
          if (token) {
            const friendshipResponse = await fetch(
              `${API_BASE_URL}/social/friends/check/${otherUserId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (friendshipResponse.ok) {
              friendshipData = await friendshipResponse.json();
              setIsFriend(friendshipData.is_friend || false);
            } else if (friendshipResponse.status === 401) {
              console.warn("[Messages] Unauthorized - token may be invalid");
            }
          } else {
            console.warn("[Messages] No token for friendship check");
          }
          setFriendshipChecked(true);

          // Fetch messages only if friends
          if (friendshipData && friendshipData.is_friend) {
            const messagesResponse = await fetch(
              `${API_BASE_URL}/chat/messages/${otherUserId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              setMessages(messagesData.messages || []);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, otherUserId, isGroupChat, roomId, router]);

  // Debug: Log messages state changes
  useEffect(() => {
    console.log(
      `[Chat Page] 🔄 Messages state updated: ${messages.length} messages`,
      messages.map((m) => m.id)
    );
  }, [messages]);

  // Debug: Log component mount/unmount
  useEffect(() => {
    console.log(
      `[Chat Page] 🟢 Component mounted for chat with user/room: ${chatId}`
    );
    return () => {
      console.log(
        `[Chat Page] 🔴 Component unmounting for chat with user/room: ${chatId}`
      );
    };
  }, [chatId]);

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected || !user?.id) return;

    console.log(
      `[Chat Page] Setting up socket listeners for user ${user.id}, otherUser=${otherUserId}, isGroup=${isGroupChat}, room=${roomId}`
    );

    const handleNewMessage = (data: ChatMessage) => {
      console.log("[Chat Page] New message received via Socket.IO:", data);

      if (!user) {
        console.log("[Chat Page] Ignoring new_message - no user logged in");
        return;
      }

      // Process message if it belongs to the current conversation
      // For 1-1 chat: message is part of conversation if sender/receiver matches otherUserId
      if (!isGroupChat && otherUserId) {
        // Ensure all IDs are numbers for comparison
        const otherUserIdNum =
          typeof otherUserId === "number" && !isNaN(otherUserId)
            ? otherUserId
            : typeof otherUserId === "string"
            ? parseInt(otherUserId, 10)
            : null;

        // Convert sender_id and receiver_id to numbers (backend may send as strings)
        const senderId =
          typeof data.sender_id === "string"
            ? parseInt(data.sender_id, 10)
            : data.sender_id;
        const receiverId =
          typeof data.receiver_id === "string"
            ? parseInt(data.receiver_id, 10)
            : data.receiver_id;

        console.log(
          `[Chat Page] Checking conversation: user.id=${user.id}, otherUserId=${otherUserIdNum}, sender=${senderId}, receiver=${receiverId}`
        );

        if (!otherUserIdNum || isNaN(otherUserIdNum)) {
          console.log("[Chat Page] Invalid otherUserId:", otherUserId);
          return;
        }

        const isInThisConversation =
          (senderId === user.id && receiverId === otherUserIdNum) ||
          (senderId === otherUserIdNum && receiverId === user.id);

        console.log(`[Chat Page] isInThisConversation=${isInThisConversation}`);

        if (!isInThisConversation) {
          console.log(
            "[Chat Page] Ignoring new_message - not part of this conversation"
          );
          return;
        }

        console.log(
          "[Chat Page] Message IS part of this conversation, adding to list"
        );
        setMessages((prev) => {
          console.log(
            `[Chat Page] Current messages before add: ${prev.length} messages`
          );
          const exists = prev.some((msg) => msg.id === data.id);
          if (exists) {
            console.log(
              "[Chat Page] Message already exists, skipping duplicate"
            );
            return prev;
          }
          console.log("[Chat Page] Adding new message to list");
          console.log(
            `[Chat Page] New message ID: ${data.id}, created_at: ${data.created_at}`
          );
          // Create completely new array to force re-render
          const updated = [...prev, { ...data }];

          // Sort by ID instead of timestamp for reliability
          // Higher ID = newer message
          updated.sort((a, b) => a.id - b.id);

          console.log(
            `[Chat Page] New messages array: ${updated.length} messages`,
            updated.map((m) => m.id)
          );
          return updated;
        });

        // Update conversations list to reflect new message
        fetchConversations();
        setTimeout(() => {
          console.log(
            `[Chat Page] 📜 Scrolling to bottom after new message. Ref exists: ${!!messagesEndRef.current}`
          );
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else if (isGroupChat && roomId) {
        // Group chat: check room_id
        if (data.room_id !== roomId) {
          console.log("[Chat Page] Ignoring new_message - different room");
          return;
        }

        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === data.id);
          if (exists) {
            console.log(
              "[Chat Page] Message already exists, skipping duplicate"
            );
            return prev;
          }
          console.log("[Chat Page] Adding new message to list");
          const updated = [...prev, data];
          updated.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeA - timeB;
          });
          return updated;
        });

        // Update conversations list to reflect new message
        fetchConversations();
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    const handleNewGroupMessage = (data: ChatMessage) => {
      console.log(
        "[Chat Page] New group message received via Socket.IO:",
        data
      );
      if (isGroupChat && roomId && data.room_id === roomId) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === data.id);
          if (exists) return prev;
          const updated = [...prev, data];
          updated.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeA - timeB;
          });
          return updated;
        });
        // Update conversations list to reflect new message
        fetchConversations();
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    const handleMessageSent = (data: ChatMessage) => {
      console.log("[Chat Page] Message sent confirmation via Socket.IO:", data);
      // IMPORTANT: Only process messages where current user is the SENDER
      // This event is for confirmation of messages sent BY current user
      if (!user || data.sender_id !== user.id) {
        console.log(
          "[Chat Page] Ignoring message_sent - current user is not sender"
        );
        return;
      }

      if (isGroupChat && roomId && data.room_id === roomId) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === data.id);
          if (exists) {
            // Update existing message
            return prev.map((msg) => (msg.id === data.id ? data : msg));
          }
          // Add new message
          const updated = [...prev, data];
          updated.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeA - timeB;
          });
          return updated;
        });
        setSending(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else if (
        !isGroupChat &&
        otherUserId &&
        data.receiver_id === otherUserId
      ) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === data.id);
          if (exists) {
            // Update existing message
            return prev.map((msg) => (msg.id === data.id ? data : msg));
          }
          // Add new message
          const updated = [...prev, data];
          updated.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeA - timeB;
          });
          return updated;
        });
        setSending(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("new_group_message", handleNewGroupMessage);
    socket.on("message_sent", handleMessageSent);

    console.log(`[Chat Page] Socket listeners registered for user ${user.id}`);

    return () => {
      console.log(
        `[Chat Page] Cleaning up socket listeners for user ${user.id}`
      );
      socket.off("new_message", handleNewMessage);
      socket.off("new_group_message", handleNewGroupMessage);
      socket.off("message_sent", handleMessageSent);
    };
  }, [socket, isConnected, user?.id, otherUserId, isGroupChat, roomId]);

  // Listen for typing indicator
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleTyping = (data: { sender_id: number; is_typing: boolean }) => {
      if (data.sender_id === otherUserId) {
        setIsTyping(data.is_typing);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (data.is_typing) {
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      }
    };

    socket.on("user_typing", handleTyping);

    return () => {
      socket.off("user_typing", handleTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, isConnected, user, otherUserId]);

  // Send typing indicator
  const handleTyping = () => {
    if (!socket || !isConnected || !user) return;

    socket.emit("typing_message", {
      sender_id: user.id,
      receiver_id: otherUserId,
      is_typing: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_message", {
        sender_id: user.id,
        receiver_id: otherUserId,
        is_typing: false,
      });
    }, 1000);
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Ảnh quá lớn! Kích thước tối đa là 10MB.");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowAttachMenu(false);
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      recordingTimerRef.current = timer;
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setShowAttachMenu(false);
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  // Get location
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Get address from coordinates (using reverse geocoding)
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXV4NTFqemgycXA4N2piZmwzdnYifQ.g9ZUoQKM8w7n7vGXoG8nBQ`
          );
          const data = await response.json();
          const address =
            data.features[0]?.place_name || `${latitude}, ${longitude}`;

          await sendMessage(null, "location", null, null, {
            lat: latitude,
            lng: longitude,
            address,
          });
        } catch (error) {
          // Fallback if reverse geocoding fails
          await sendMessage(null, "location", null, null, {
            lat: latitude,
            lng: longitude,
            address: `${latitude}, ${longitude}`,
          });
        }

        setShowAttachMenu(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập vị trí.");
      }
    );
  };

  // Unfriend handler
  const handleUnfriend = async () => {
    if (!otherUserId || !otherUser) return;

    const confirmUnfriend = window.confirm(
      `Bạn có chắc chắn muốn hủy kết bạn với ${
        otherUser.full_name || otherUser.username
      }? Sau khi hủy kết bạn, bạn sẽ không thể nhắn tin với người này nữa.`
    );

    if (!confirmUnfriend) return;

    try {
      const token = localStorage.getItem(getStorageKey("access_token"));
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        return;
      }

      const API_BASE_URL = getAPIURL();
      const response = await fetch(
        `${API_BASE_URL}/social/friends/remove/${otherUserId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert("Đã hủy kết bạn thành công");
        setIsFriend(false);
        // Optionally redirect to messages list or profile
        router.push("/messages");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Không thể hủy kết bạn");
      }
    } catch (error) {
      console.error("Error unfriending:", error);
      alert("Có lỗi xảy ra khi hủy kết bạn");
    }
  };

  // Send message function
  const sendMessage = async (
    messageText: string | null,
    messageType: string = "text",
    imageFile: File | null = null,
    audioFile: Blob | null = null,
    locationData: { lat: number; lng: number; address: string } | null = null
  ) => {
    if (!user || sending) return;

    if (!isGroupChat && !isFriend) {
      alert("Bạn cần kết bạn với người này trước khi có thể nhắn tin!");
      return;
    }

    if (isGroupChat && !roomId) {
      alert("Không tìm thấy nhóm chat!");
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem(getStorageKey("access_token"));
      const API_BASE_URL = getAPIURL();

      let response: Response;

      if (isGroupChat && roomId) {
        // Group chat messages
        if (messageType === "image" && imageFile) {
          const formData = new FormData();
          formData.append("message", messageText || "");
          formData.append("message_type", "image");
          formData.append("file", imageFile);

          response = await fetch(
            `${API_BASE_URL}/chat/groups/${roomId}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );
        } else if (messageType === "audio" && audioFile) {
          const formData = new FormData();
          formData.append("message", messageText || "");
          formData.append("message_type", "audio");

          const audioFileName =
            audioFile instanceof File
              ? audioFile.name
              : `audio_${Date.now()}.webm`;
          const audioFileObj =
            audioFile instanceof File
              ? audioFile
              : new File([audioFile], audioFileName, { type: "audio/webm" });

          formData.append("file", audioFileObj, audioFileName);

          response = await fetch(
            `${API_BASE_URL}/chat/groups/${roomId}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );
        } else if (messageType === "location" && locationData) {
          response = await fetch(
            `${API_BASE_URL}/chat/groups/${roomId}/messages`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                message: "",
                message_type: "location",
                location: locationData,
              }),
            }
          );
        } else {
          response = await fetch(
            `${API_BASE_URL}/chat/groups/${roomId}/messages`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                message: messageText || "",
                message_type: "text",
              }),
            }
          );
        }
      } else if (!isGroupChat && otherUserId) {
        // 1-1 chat messages
        if (messageType === "image" && imageFile) {
          const formData = new FormData();
          formData.append("receiver_id", otherUserId.toString());
          formData.append("message", messageText || "");
          formData.append("message_type", "image");
          formData.append("file", imageFile);

          response = await fetch(`${API_BASE_URL}/chat/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
        } else if (messageType === "audio" && audioFile) {
          const formData = new FormData();
          formData.append("receiver_id", otherUserId.toString());
          formData.append("message", messageText || "");
          formData.append("message_type", "audio");

          const audioFileName =
            audioFile instanceof File
              ? audioFile.name
              : `audio_${Date.now()}.webm`;
          const audioFileObj =
            audioFile instanceof File
              ? audioFile
              : new File([audioFile], audioFileName, { type: "audio/webm" });

          formData.append("file", audioFileObj, audioFileName);

          response = await fetch(`${API_BASE_URL}/chat/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
        } else if (messageType === "location" && locationData) {
          response = await fetch(`${API_BASE_URL}/chat/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              receiver_id: otherUserId,
              message: "",
              message_type: "location",
              location: locationData,
            }),
          });
        } else {
          response = await fetch(`${API_BASE_URL}/chat/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              receiver_id: otherUserId,
              message: messageText || "",
              message_type: "text",
            }),
          });
        }
      } else {
        throw new Error("Invalid chat configuration");
      }

      if (response.ok) {
        const data = await response.json();
        // Add message to list, but check if it's already there (from Socket.IO)
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === data.chat.id);
          if (exists) {
            // Update existing message if it's already there (from Socket.IO)
            return prev.map((msg) =>
              msg.id === data.chat.id
                ? { ...data.chat, sender: data.chat.sender }
                : msg
            );
          }
          // Add new message and sort
          const updated = [...prev, { ...data.chat, sender: data.chat.sender }];
          updated.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeA - timeB;
          });
          return updated;
        });

        // Clear inputs
        setNewMessage("");
        setSelectedImage(null);
        setImagePreview(null);
        setAudioBlob(null);
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
          setAudioUrl(null);
        }
        setRecordingTime(0);

        // Scroll to bottom after sending
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        // Get error details from response
        let errorMessage = "Không thể gửi tin nhắn. Vui lòng thử lại.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("❌ Error response:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError);
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      alert("Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedImage) {
      await sendMessage(newMessage.trim(), "image", selectedImage);
    } else if (audioBlob) {
      await sendMessage(newMessage.trim(), "audio", null, audioBlob);
    } else if (newMessage.trim()) {
      await sendMessage(newMessage.trim());
    }
  };

  // Play/Pause audio
  const toggleAudio = (messageId: number, audioUrl: string) => {
    if (playingAudioId === messageId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
      setPlayingAudioId(messageId);
      audio.onended = () => setPlayingAudioId(null);
      audio.onerror = () => {
        setPlayingAudioId(null);
        alert("Không thể phát audio.");
      };
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";

    try {
      // Parse the date string (assuming ISO format from backend, likely UTC)
      // If backend returns UTC, JavaScript Date will parse it correctly
      // But we need to ensure we're comparing in the same timezone
      let date: Date;

      // Check if dateString ends with 'Z' (UTC) or has timezone offset
      if (
        dateString.endsWith("Z") ||
        dateString.includes("+") ||
        dateString.includes("-", 10)
      ) {
        // Has timezone info, parse directly
        date = new Date(dateString);
      } else {
        // No timezone info, assume UTC and append 'Z'
        date = new Date(dateString + (dateString.includes("T") ? "Z" : ""));
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return "";
      }

      const now = new Date();

      // Calculate difference in seconds (both in local timezone)
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      // For recent messages (within last hour)
      if (diffInSeconds < 60) return "Vừa xong";
      if (diffInSeconds < 3600)
        return `${Math.floor(diffInSeconds / 60)} phút trước`;
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)} giờ trước`;

      // For older messages, show date and time in local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateLocal = new Date(date);
      dateLocal.setHours(0, 0, 0, 0);

      const isToday = dateLocal.getTime() === today.getTime();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = dateLocal.getTime() === yesterday.getTime();

      if (isToday) {
        return date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } else if (isYesterday) {
        return `Hôm qua ${date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })}`;
      } else {
        return date.toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
    } catch (error) {
      console.error("Error formatting time:", error, dateString);
      return "";
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (dateString: string | null | undefined) => {
    if (!dateString) return "";

    try {
      let date: Date;

      // Check if dateString ends with 'Z' (UTC) or has timezone offset
      if (
        dateString.endsWith("Z") ||
        dateString.includes("+") ||
        dateString.includes("-", 10)
      ) {
        date = new Date(dateString);
      } else {
        // No timezone info, assume UTC and append 'Z'
        date = new Date(dateString + (dateString.includes("T") ? "Z" : ""));
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return "";
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "Vừa xong";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)} giờ`;
      if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)} ngày`;

      return date.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "short",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } catch (error) {
      console.error("Error formatting time ago:", error, dateString);
      return "";
    }
  };

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter((conv: any) => {
      const isGroup = conv.group !== undefined && conv.group !== null;
      // Filter out deleted conversations
      if (isGroup) {
        if (deletedConversations.has(conv.group?.room_id)) {
          return false;
        }
      } else {
        if (deletedConversations.has(conv.other_user?.id)) {
          return false;
        }
      }
      // Filter by search query
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      if (isGroup) {
        const name = (conv.group?.name || "").toLowerCase();
        return name.includes(query);
      } else {
        const name = (
          conv.other_user?.full_name ||
          conv.other_user?.username ||
          ""
        ).toLowerCase();
        return name.includes(query);
      }
    })
    .sort((a: any, b: any) => {
      const aIsGroup = a.group !== undefined && a.group !== null;
      const bIsGroup = b.group !== undefined && b.group !== null;
      // Pinned conversations first
      const aPinned = aIsGroup
        ? pinnedConversations.has(a.group?.room_id)
        : pinnedConversations.has(a.other_user?.id);
      const bPinned = bIsGroup
        ? pinnedConversations.has(b.group?.room_id)
        : pinnedConversations.has(b.other_user?.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      // Then by updated_at
      const aTime = a.updated_at || a.last_message?.created_at || "";
      const bTime = b.updated_at || b.last_message?.created_at || "";
      return bTime.localeCompare(aTime);
    });

  // Filter friends for search
  const filteredFriends = friends.filter((friend) => {
    if (!searchQuery.trim()) return false; // Only show friends when searching
    const query = searchQuery.toLowerCase();
    const name = (friend.full_name || friend.username || "").toLowerCase();
    return name.includes(query);
  });

  // Pin/unpin conversation
  const togglePinConversation = (userId: number) => {
    if (!user) return;
    const newPinned = new Set(pinnedConversations);
    if (newPinned.has(userId)) {
      newPinned.delete(userId);
    } else {
      newPinned.add(userId);
    }
    setPinnedConversations(newPinned);
    const pinnedKey = `pinned_conversations_${user.id}`;
    localStorage.setItem(pinnedKey, JSON.stringify(Array.from(newPinned)));
  };

  // Delete conversation
  const deleteConversation = async (userId: number) => {
    if (!user) return;

    try {
      // Use the same storage key helper as other auth parts
      const token = localStorage.getItem(getStorageKey("access_token"));
      if (!token) return;

      const API_BASE_URL = getAPIURL();
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Also update local storage for UI consistency
        const newDeleted = new Set(deletedConversations);
        newDeleted.add(userId);
        setDeletedConversations(newDeleted);
        const deletedKey = `deleted_conversations_${user.id}`;
        localStorage.setItem(
          deletedKey,
          JSON.stringify(Array.from(newDeleted))
        );

        // Refresh conversations list
        if (fetchConversations) {
          fetchConversations();
        }

        // If we're currently viewing this conversation, redirect to messages list
        if (otherUserId === userId) {
          router.push("/messages");
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Không thể xóa cuộc trò chuyện");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Lỗi khi xóa cuộc trò chuyện");
    }

    setShowConversationMenu(null);
  };

  // Restore conversation
  const restoreConversation = (userId: number) => {
    if (!user) return;
    const newDeleted = new Set(deletedConversations);
    newDeleted.delete(userId);
    setDeletedConversations(newDeleted);
    const deletedKey = `deleted_conversations_${user.id}`;
    localStorage.setItem(deletedKey, JSON.stringify(Array.from(newDeleted)));
  };

  const parseLocation = (message: string) => {
    try {
      return JSON.parse(message);
    } catch {
      return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <p className="text-gray-500 dark:text-gray-400">
          Vui lòng đăng nhập để xem tin nhắn
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const backgroundStyle = chatBackground
    ? chatBackground.startsWith("http") ||
      chatBackground.startsWith("/") ||
      chatBackground.startsWith("data:")
      ? {
          backgroundImage: `url(${chatBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { background: chatBackground }
    : {};

  const isImageBackground =
    chatBackground &&
    (chatBackground.startsWith("http") ||
      chatBackground.startsWith("/") ||
      chatBackground.startsWith("data:"));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex relative">
      {/* Sidebar - Conversations List */}
      <div className="w-full md:w-96 lg:w-[400px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Tin nhắn
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Tạo cuộc trò chuyện mới"
              >
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <Link href="/messages">
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Danh sách tin nhắn"
                >
                  <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện hoặc bạn bè..."
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
          {/* Friends Search Results */}
          {filteredFriends.length > 0 && (
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Bạn bè
              </div>
              {filteredFriends.map((friend) => (
                <Link key={friend.id} href={`/messages/${friend.id}`}>
                  <motion.div
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                    className="p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors"
                    onClick={() => setSearchQuery("")}
                  >
                    <div className="flex items-start space-x-3">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.full_name || friend.username}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {(friend.full_name ||
                            friend.username ||
                            "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {friend.full_name || friend.username}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Bắt đầu trò chuyện
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}

          {/* Conversations */}
          {filteredConversations.length === 0 &&
          filteredFriends.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "Không tìm thấy cuộc trò chuyện hoặc bạn bè"
                  : "Chưa có cuộc trò chuyện nào"}
              </p>
            </div>
          ) : (
            <div>
              {filteredConversations.length > 0 && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Cuộc trò chuyện
                </div>
              )}
              {filteredConversations.map((conv: any) => {
                const isGroup = conv.group !== undefined && conv.group !== null;
                const isSelected = isGroup
                  ? roomId === conv.group?.room_id
                  : otherUserId === conv.other_user?.id;
                const isPinned = isGroup
                  ? pinnedConversations.has(conv.group?.room_id)
                  : pinnedConversations.has(conv.other_user?.id);
                const href = isGroup
                  ? `/messages/${conv.group?.room_id}?type=group`
                  : `/messages/${conv.other_user?.id}`;
                const displayName = isGroup
                  ? conv.group?.name || "Nhóm chat"
                  : conv.other_user?.full_name || conv.other_user?.username;
                const displayAvatar = isGroup
                  ? conv.group?.avatar_url
                  : conv.other_user?.avatar_url;
                return (
                  <div
                    key={conv.id}
                    className={`relative group ${
                      isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""
                    }`}
                  >
                    <Link href={href}>
                      <motion.div
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        className="p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          {/* Pin Icon */}
                          {isPinned && (
                            <Pin className="w-4 h-4 text-primary-500 absolute top-2 right-10" />
                          )}

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
                              <div className="flex items-center gap-2">
                                {conv.last_message && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                    {formatTimeAgo(
                                      conv.last_message.created_at
                                    )}
                                  </span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const menuId = isGroup
                                      ? conv.group?.room_id
                                      : conv.other_user?.id;
                                    setShowConversationMenu(
                                      showConversationMenu === menuId
                                        ? null
                                        : menuId || null
                                    );
                                  }}
                                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                </button>
                              </div>
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
                                      {conv.last_message.message ||
                                        (conv.last_message.message_type ===
                                        "image"
                                          ? "[Ảnh]"
                                          : conv.last_message.message_type ===
                                            "audio"
                                          ? "[Ghi âm]"
                                          : conv.last_message.message_type ===
                                            "location"
                                          ? "[Vị trí]"
                                          : "")}
                                    </>
                                  ) : (
                                    conv.last_message.message ||
                                    (conv.last_message.message_type === "image"
                                      ? "[Ảnh]"
                                      : conv.last_message.message_type ===
                                        "audio"
                                      ? "[Ghi âm]"
                                      : conv.last_message.message_type ===
                                        "location"
                                      ? "[Vị trí]"
                                      : "")
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

                    {/* Menu Dropdown */}
                    <AnimatePresence>
                      {showConversationMenu ===
                        (isGroup
                          ? conv.group?.room_id
                          : conv.other_user?.id) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-4 top-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[160px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              if (isGroup) {
                                const newPinned = new Set(pinnedConversations);
                                if (newPinned.has(conv.group?.room_id)) {
                                  newPinned.delete(conv.group?.room_id);
                                } else {
                                  newPinned.add(conv.group?.room_id);
                                }
                                setPinnedConversations(newPinned);
                                if (user) {
                                  const pinnedKey = `pinned_conversations_${user.id}`;
                                  localStorage.setItem(
                                    pinnedKey,
                                    JSON.stringify(Array.from(newPinned))
                                  );
                                }
                              } else {
                                togglePinConversation(conv.other_user?.id || 0);
                              }
                              setShowConversationMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Pin
                              className={`w-4 h-4 ${
                                isPinned ? "text-primary-500" : ""
                              }`}
                            />
                            {isPinned ? "Bỏ ghim" : "Ghim cuộc trò chuyện"}
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Bạn có chắc muốn xóa cuộc trò chuyện này?"
                                )
                              ) {
                                if (isGroup) {
                                  if (user) {
                                    const newDeleted = new Set(
                                      deletedConversations
                                    );
                                    newDeleted.add(conv.group?.room_id);
                                    setDeletedConversations(newDeleted);
                                    const deletedKey = `deleted_conversations_${user.id}`;
                                    localStorage.setItem(
                                      deletedKey,
                                      JSON.stringify(Array.from(newDeleted))
                                    );
                                  }
                                } else {
                                  deleteConversation(conv.other_user?.id || 0);
                                }
                                setShowConversationMenu(null);
                              }
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa cuộc trò chuyện
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* General Settings Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => setShowGeneralSettings(!showGeneralSettings)}
            className="w-full flex items-center justify-between p-4 group"
          >
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              <Settings className="w-4 h-4" />
              Cài đặt chung
            </h3>
            <motion.svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: showGeneralSettings ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </motion.svg>
          </button>

          <AnimatePresence>
            {showGeneralSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 px-4 pb-4">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {theme === "light" ? (
                        <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Chế độ {theme === "light" ? "sáng" : "tối"}
                      </span>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs rounded-lg transition-colors"
                    >
                      Chuyển
                    </button>
                  </div>

                  {/* General Notifications */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {generalNotifications ? (
                        <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <BellOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Thông báo chung
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setGeneralNotifications(!generalNotifications)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        generalNotifications
                          ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {generalNotifications ? "Bật" : "Tắt"}
                    </button>
                  </div>

                  {/* Privacy Settings */}
                  <Link
                    href="/privacy"
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        Quyền riêng tư
                      </span>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>

                  {/* Language Settings */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Ngôn ngữ
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Tiếng Việt
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative" style={backgroundStyle}>
        {isImageBackground && (
          <div className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-sm"></div>
        )}
        <div className="relative z-10 flex flex-col h-screen">
          {/* Header */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-20">
            <div className="h-16 px-4 flex items-center space-x-4 shadow-sm">
              <Link href="/messages">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              </Link>
              {isGroupChat && group ? (
                <>
                  {group.avatar_url ? (
                    <img
                      src={group.avatar_url}
                      alt={group.name}
                      className="w-10 h-10 rounded-full ring-2 ring-primary-200 dark:ring-primary-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white ring-2 ring-primary-200 dark:ring-primary-800">
                      <Users className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {group.name}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {members.length} thành viên
                    </p>
                  </div>
                  {/* Group action buttons moved to right sidebar; modals rendered at root-level to avoid header overlap */}
                </>
              ) : otherUser ? (
                <>
                  {otherUser.avatar_url ? (
                    <img
                      src={otherUser.avatar_url}
                      alt={otherUser.full_name || otherUser.username}
                      className="w-10 h-10 rounded-full ring-2 ring-primary-200 dark:ring-primary-800 cursor-pointer"
                      onClick={() =>
                        router.push(`/profile/user?id=${otherUserId}`)
                      }
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold ring-2 ring-primary-200 dark:ring-primary-800 cursor-pointer"
                      onClick={() =>
                        router.push(`/profile/user?id=${otherUserId}`)
                      }
                    >
                      {(otherUser.full_name ||
                        otherUser.username ||
                        "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {nickname || otherUser.full_name || otherUser.username}
                    </h2>
                    {isTyping && (
                      <p className="text-xs text-primary-600 dark:text-primary-400 animate-pulse">
                        Đang soạn...
                      </p>
                    )}
                  </div>
                  {/* Unfriend Button */}
                  {isFriend && (
                    <button
                      onClick={handleUnfriend}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                      title="Hủy kết bạn"
                    >
                      <UserMinus className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Đang tải...
                  </h2>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full scrollbar-hide">
            {friendshipChecked && !isFriend ? (
              <div className="text-center py-12">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 max-w-md mx-auto shadow-lg">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                    Bạn chưa kết bạn với người này
                  </p>
                  <p className="text-yellow-600 dark:text-yellow-300 text-sm mb-4">
                    Bạn cần kết bạn với{" "}
                    {otherUser?.full_name || otherUser?.username || "người này"}{" "}
                    trước khi có thể nhắn tin.
                  </p>
                  <Link
                    href={`/profile/user?id=${otherUserId}`}
                    className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Xem hồ sơ và kết bạn
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.length === 0 && friendshipChecked ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="mb-4">
                      <MessageCircle className="w-16 h-16 mx-auto opacity-50" />
                    </div>
                    <p className="text-lg font-medium">Chưa có tin nhắn nào</p>
                    <p className="text-sm mt-2">Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === user.id;
                    const isSystem = msg.message_type === "system";
                    const location =
                      msg.message_type === "location"
                        ? parseLocation(msg.message)
                        : null;

                    if (isSystem) {
                      return (
                        <div
                          key={msg.id}
                          className="text-center text-sm text-gray-500 dark:text-gray-400 py-2"
                        >
                          {msg.message}
                        </div>
                      );
                    }

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        } gap-2`}
                      >
                        {!isOwn &&
                          (isGroupChat ? (
                            msg.sender?.avatar_url ? (
                              <img
                                src={msg.sender.avatar_url}
                                alt={
                                  msg.sender.full_name || msg.sender.username
                                }
                                className="w-8 h-8 rounded-full flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {(msg.sender?.full_name ||
                                  msg.sender?.username ||
                                  "?")[0].toUpperCase()}
                              </div>
                            )
                          ) : (
                            msg.sender?.avatar_url && (
                              <img
                                src={msg.sender.avatar_url}
                                alt={
                                  msg.sender.full_name || msg.sender.username
                                }
                                className="w-8 h-8 rounded-full flex-shrink-0"
                              />
                            )
                          ))}
                        <div
                          className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 shadow-lg ${
                            isOwn
                              ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-sm"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {isGroupChat && !isOwn && msg.sender && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">
                              {msg.sender.full_name || msg.sender.username}
                            </span>
                          )}
                          {msg.message_type === "image" && msg.file_url && (
                            <div className="mb-2">
                              <img
                                src={`${
                                  process.env.NEXT_PUBLIC_API_URL?.replace(
                                    "/api",
                                    ""
                                  ) || getBaseURL()
                                }${msg.file_url}`}
                                alt="Ảnh"
                                className="rounded-lg max-w-full h-auto cursor-pointer"
                                onClick={() => {
                                  window.open(
                                    `${
                                      process.env.NEXT_PUBLIC_API_URL?.replace(
                                        "/api",
                                        ""
                                      ) || getBaseURL()
                                    }${msg.file_url}`,
                                    "_blank"
                                  );
                                }}
                              />
                              {msg.message && msg.message !== "[Ảnh]" && (
                                <p className="text-sm mt-2">{msg.message}</p>
                              )}
                            </div>
                          )}

                          {msg.message_type === "audio" && msg.file_url && (
                            <div className="flex items-center gap-3 mb-2">
                              <button
                                onClick={() =>
                                  toggleAudio(
                                    msg.id,
                                    `${
                                      process.env.NEXT_PUBLIC_API_URL?.replace(
                                        "/api",
                                        ""
                                      ) || getBaseURL()
                                    }${msg.file_url}`
                                  )
                                }
                                className={`p-2 rounded-full ${
                                  isOwn
                                    ? "bg-white/20 hover:bg-white/30"
                                    : "bg-primary-100 dark:bg-primary-900 hover:bg-primary-200 dark:hover:bg-primary-800"
                                } transition-colors`}
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary-500 w-1/3"></div>
                                </div>
                                <p className="text-xs mt-1 opacity-70">
                                  Ghi âm
                                </p>
                              </div>
                            </div>
                          )}

                          {msg.message_type === "location" && location && (
                            <div className="mb-2">
                              <a
                                href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                              >
                                <MapPin className="w-4 h-4" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium">Vị trí</p>
                                  <p className="text-xs opacity-80 truncate">
                                    {location.address}
                                  </p>
                                </div>
                              </a>
                            </div>
                          )}

                          {msg.message_type === "text" && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-1 mt-2">
                            <p
                              className={`text-xs ${
                                isOwn
                                  ? "text-white/70"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {formatTime(msg.created_at)}
                            </p>
                            {isOwn && msg.status && (
                              <div className="flex items-center">
                                {msg.status === "read" ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-300 dark:text-blue-400" />
                                ) : msg.status === "delivered" ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-white/70 dark:text-gray-400" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-white/70 dark:text-gray-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-30">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">
                Đang ghi âm... {formatRecordingTime(recordingTime)}
              </span>
              <button
                onClick={stopRecording}
                className="bg-white text-red-500 px-4 py-1 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Dừng
              </button>
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 z-30">
              <div className="relative">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-lg w-full"
                />
              </div>
            </div>
          )}

          {/* Audio preview */}
          {audioUrl && audioBlob && !isRecording && (
            <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 z-30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <Mic className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ghi âm</p>
                    <p className="text-xs text-gray-500">
                      {formatRecordingTime(recordingTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (!audioBlob) return;
                      try {
                        await sendMessage("", "audio", null, audioBlob);
                        // Clear audio after successful send
                        setAudioBlob(null);
                        if (audioUrl) {
                          URL.revokeObjectURL(audioUrl);
                          setAudioUrl(null);
                        }
                        setRecordingTime(0);
                      } catch (error) {
                        console.error("Error sending audio:", error);
                      }
                    }}
                    disabled={sending || !audioBlob}
                    className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Gửi ghi âm"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setAudioBlob(null);
                      setAudioUrl(null);
                      URL.revokeObjectURL(audioUrl);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Group Modals (rendered at root-level so header won't cover them) */}
          <AnimatePresence>
            {showDisbandModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60"
                onClick={() => setShowDisbandModal(false)}
              >
                <div
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md relative mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setShowDisbandModal(false)}
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                  <h3 className="text-xl font-bold mb-4 text-red-700 dark:text-red-400 flex items-center gap-2">
                    <Trash2 className="w-6 h-6 text-red-600" /> Giải tán nhóm
                  </h3>
                  <p className="mb-6 text-gray-700 dark:text-gray-300">
                    Bạn có chắc chắn muốn giải tán nhóm này? Tất cả thành viên
                    sẽ bị xóa khỏi nhóm và lịch sử tin nhắn sẽ bị xóa.
                  </p>
                  <button
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                    onClick={async () => {
                      // Call API to disband group
                      const token = localStorage.getItem(
                        getStorageKey("access_token")
                      );
                      const API_BASE_URL = getAPIURL();
                      try {
                        const response = await fetch(
                          `${API_BASE_URL}/chat/groups/${roomId}`,
                          {
                            method: "DELETE",
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          }
                        );
                        if (response.ok) {
                          setShowDisbandModal(false);
                          // refresh list hội thoại để ẩn nhóm ngay lập tức
                          if (fetchConversations) {
                            fetchConversations();
                          }
                          router.push("/messages");
                        } else {
                          const error = await response.json();
                          alert(error.error || "Lỗi khi giải tán nhóm");
                        }
                      } catch (err) {
                        alert("Lỗi khi giải tán nhóm");
                      }
                    }}
                  >
                    Xác nhận giải tán nhóm
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showAddMemberModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60"
                onClick={() => setShowAddMemberModal(false)}
              >
                <div
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg relative mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setShowAddMemberModal(false)}
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-green-600" /> Thêm thành
                    viên vào nhóm
                  </h3>
                  <input
                    type="text"
                    placeholder="Tìm kiếm bạn bè..."
                    value={addMemberSearch}
                    onChange={(e) => setAddMemberSearch(e.target.value)}
                    className="w-full mb-4 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {friends
                      .filter((friend) => {
                        // Only show friends not already in group
                        if (members.some((m) => m.user_id === friend.id))
                          return false;
                        if (!addMemberSearch.trim()) return true;
                        const query = addMemberSearch.toLowerCase();
                        const name = (
                          friend.full_name ||
                          friend.username ||
                          ""
                        ).toLowerCase();
                        return name.includes(query);
                      })
                      .map((friend) => (
                        <div
                          key={friend.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedFriendsToAdd.has(friend.id)
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                          onClick={() => {
                            setSelectedFriendsToAdd((prev) => {
                              const newSet = new Set(prev);
                              if (newSet.has(friend.id)) {
                                newSet.delete(friend.id);
                              } else {
                                newSet.add(friend.id);
                              }
                              return newSet;
                            });
                          }}
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
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {friend.full_name || friend.username}
                            </span>
                          </div>
                          {selectedFriendsToAdd.has(friend.id) && (
                            <Check className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      ))}
                    {friends.filter(
                      (friend) => !members.some((m) => m.user_id === friend.id)
                    ).length === 0 && (
                      <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                        Không còn bạn bè nào để thêm
                      </div>
                    )}
                  </div>
                  <button
                    className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    disabled={selectedFriendsToAdd.size === 0}
                    onClick={async () => {
                      // Call API to add members
                      const token = localStorage.getItem(
                        getStorageKey("access_token")
                      );
                      const API_BASE_URL = getAPIURL();
                      try {
                        const response = await fetch(
                          `${API_BASE_URL}/chat/groups/${roomId}/members`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              member_ids: Array.from(selectedFriendsToAdd),
                            }),
                          }
                        );
                        if (response.ok) {
                          setShowAddMemberModal(false);
                          setSelectedFriendsToAdd(new Set());
                          setAddMemberSearch("");
                          // Refresh group info
                          const groupRes = await fetch(
                            `${API_BASE_URL}/chat/groups/${roomId}`,
                            {
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          if (groupRes.ok) {
                            const groupData = await groupRes.json();
                            setGroup(groupData.group);
                            setGroupNameEdit(groupData.group?.name || "");
                            setMembers(groupData.group.members || []);
                          }
                        } else {
                          const error = await response.json();
                          alert(error.error || "Lỗi khi thêm thành viên");
                        }
                      } catch (err) {
                        alert("Lỗi khi thêm thành viên vào nhóm");
                      }
                    }}
                  >
                    Thêm thành viên ({selectedFriendsToAdd.size})
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Group Members Modal */}
          <AnimatePresence>
            {showMembersModal && group && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60"
                onClick={() => setShowMembersModal(false)}
              >
                <div
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg relative mx-4 max-h-[80vh] overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-500" />
                        Thành viên nhóm
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {group.name}
                      </p>
                    </div>
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setShowMembersModal(false)}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    {members.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Nhóm chưa có thành viên.
                      </div>
                    ) : (
                      members.map((member) => {
                        const mUser = member.user || {};
                        const isCurrentUser = mUser.id === user?.id;
                        const isAdmin = member.role === "admin";
                        const canKick =
                          (user &&
                            group &&
                            // current user is admin and target is not admin
                            group.created_by === user.id) ||
                          members.some(
                            (m) => m.user_id === user.id && m.role === "admin"
                          );

                        const showKickButton =
                          // admin kicking others
                          (!isCurrentUser && canKick) ||
                          // user can leave group (kick self)
                          isCurrentUser;

                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {mUser.avatar_url ? (
                                <img
                                  src={mUser.avatar_url}
                                  alt={mUser.full_name || mUser.username}
                                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs">
                                  {(mUser.full_name || mUser.username || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {mUser.full_name || mUser.username}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                      Bạn
                                    </span>
                                  )}
                                  {isAdmin && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                      Quản trị viên
                                    </span>
                                  )}
                                </div>
                                {member.joined_at && (
                                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Tham gia:{" "}
                                    {new Date(
                                      member.joined_at
                                    ).toLocaleDateString("vi-VN")}
                                  </div>
                                )}
                              </div>
                            </div>

                            {showKickButton && (
                              <button
                                onClick={async () => {
                                  const isLeave = isCurrentUser;
                                  const confirmed = confirm(
                                    isLeave
                                      ? "Bạn có chắc muốn rời khỏi nhóm này?"
                                      : `Bạn có chắc muốn xóa ${
                                          mUser.full_name ||
                                          mUser.username ||
                                          "thành viên"
                                        } khỏi nhóm?`
                                  );
                                  if (!confirmed) return;

                                  try {
                                    const token = localStorage.getItem(
                                      getStorageKey("access_token")
                                    );
                                    if (!token) return;
                                    const API_BASE_URL = getAPIURL();
                                    const response = await fetch(
                                      `${API_BASE_URL}/chat/groups/${roomId}/members/${mUser.id}`,
                                      {
                                        method: "DELETE",
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      }
                                    );
                                    if (response.ok) {
                                      // Cập nhật lại danh sách members trên UI
                                      setMembers((prev) =>
                                        prev.filter(
                                          (m) => m.user_id !== mUser.id
                                        )
                                      );

                                      if (isLeave) {
                                        setShowMembersModal(false);
                                        router.push("/messages");
                                      }
                                    } else {
                                      const error = await response.json();
                                      alert(
                                        error.error ||
                                          "Lỗi khi xóa thành viên khỏi nhóm"
                                      );
                                    }
                                  } catch (err) {
                                    alert("Lỗi khi xóa thành viên khỏi nhóm");
                                  }
                                }}
                                className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                                  isCurrentUser
                                    ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`}
                              >
                                {isCurrentUser ? (
                                  <>
                                    <LogOut className="w-3 h-3" />
                                    <span>Rời nhóm</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3 h-3" />
                                    <span>Xóa</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message Input */}
          {friendshipChecked && isFriend && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 sticky bottom-0 z-20">
              <form
                onSubmit={handleSendMessage}
                className="max-w-4xl mx-auto px-4 py-4"
              >
                <div className="flex items-end gap-2">
                  {/* Attach button */}
                  <div className="relative">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                    >
                      <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </motion.button>

                    {/* Attach menu */}
                    <AnimatePresence>
                      {showAttachMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[200px]"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              fileInputRef.current?.click();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                          >
                            <ImageIcon className="w-5 h-5 text-primary-500" />
                            <span>Ảnh</span>
                          </button>
                          <button
                            type="button"
                            onClick={
                              isRecording ? stopRecording : startRecording
                            }
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                          >
                            <Mic className="w-5 h-5 text-red-500" />
                            <span>
                              {isRecording ? "Dừng ghi âm" : "Ghi âm"}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={getLocation}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                          >
                            <MapPin className="w-5 h-5 text-green-500" />
                            <span>Vị trí</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {/* Text input */}
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    rows={1}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-900 dark:text-gray-100 resize-none max-h-32 overflow-y-auto"
                    disabled={sending}
                  />

                  {/* Send button */}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={
                      (!newMessage.trim() && !selectedImage && !audioBlob) ||
                      sending ||
                      isRecording
                    }
                    className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Chat Settings (1-1 Chat) */}
      {otherUserId && (
        <div
          className={`relative transition-all duration-300 ease-in-out flex flex-col h-screen flex-shrink-0 ${
            isSettingsHovered
              ? "w-full md:w-80 lg:w-[320px]"
              : "w-0 md:w-16 lg:w-20"
          } bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden group`}
          onMouseEnter={() => setIsSettingsHovered(true)}
          onMouseLeave={() => setIsSettingsHovered(false)}
        >
          <div
            className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
              !isSettingsHovered ? "p-2" : ""
            }`}
          >
            <h3
              className={`text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-opacity duration-300 ${
                isSettingsHovered ? "opacity-100" : "opacity-0 hidden md:flex"
              }`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span
                className={`whitespace-nowrap ${
                  isSettingsHovered ? "block" : "hidden"
                }`}
              >
                Cài đặt đoạn chat
              </span>
            </h3>
            {!isSettingsHovered && (
              <div className="flex items-center justify-center md:block">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto" />
              </div>
            )}
          </div>

          <div
            className={`flex-1 overflow-y-auto p-4 scrollbar-hide transition-opacity duration-300 ${
              isSettingsHovered
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="space-y-4">
              {/* Nickname */}
              <div>
                <label className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <User className="w-3 h-3" />
                  Biệt danh
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={
                    otherUser?.full_name ||
                    otherUser?.username ||
                    "Nhập biệt danh"
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-gray-900 dark:text-white"
                />
              </div>

              {/* Conversation Header: avatar + name */}
              {otherUser && (
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-200 dark:border-gray-700">
                  {otherUser.avatar_url ? (
                    <img
                      src={otherUser.avatar_url}
                      alt={otherUser.full_name || otherUser.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm">
                      {(otherUser.full_name || otherUser.username || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {otherUser.full_name || otherUser.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Đoạn chat riêng
                    </div>
                  </div>
                </div>
              )}

              {/* Group name edit */}
              {group && (
                <div>
                  <label className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <User className="w-3 h-3" />
                    Tên nhóm
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={groupNameEdit}
                      onChange={(e) => setGroupNameEdit(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs text-gray-900 dark:text-white"
                      placeholder="Nhập tên nhóm"
                    />
                    <button
                      onClick={async () => {
                        const newName = groupNameEdit.trim();
                        if (!newName) {
                          alert("Tên nhóm không được để trống");
                          return;
                        }
                        try {
                          const token = localStorage.getItem(
                            getStorageKey("access_token")
                          );
                          if (!token) return;
                          const API_BASE_URL = getAPIURL();
                          const response = await fetch(
                            `${API_BASE_URL}/chat/groups/${roomId}`,
                            {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({ name: newName }),
                            }
                          );
                          if (response.ok) {
                            const data = await response.json();
                            setGroup(data.group);
                            setGroupNameEdit(data.group?.name || "");
                            // Refresh conversations list so name updates everywhere
                            if (fetchConversations) {
                              fetchConversations();
                            }
                          } else {
                            const error = await response.json();
                            alert(error.error || "Lỗi khi cập nhật tên nhóm");
                          }
                        } catch (err) {
                          alert("Lỗi khi cập nhật tên nhóm");
                        }
                      }}
                      className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              )}

              {/* Background */}
              <div>
                <label className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Palette className="w-3 h-3" />
                  Background
                </label>

                {/* Upload Image Button */}
                <div className="mb-3">
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                    id="background-upload"
                  />
                  <label
                    htmlFor="background-upload"
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer text-xs text-gray-700 dark:text-gray-300"
                  >
                    {uploadingBackground ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang upload...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        <span>Upload ảnh background</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Preview uploaded image */}
                {(backgroundPreview ||
                  (chatBackground && chatBackground.startsWith("http"))) && (
                  <div className="mb-3 relative">
                    <div className="relative h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img
                        src={backgroundPreview || chatBackground || ""}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                      />
                      {chatBackground && (
                        <button
                          onClick={() => {
                            setChatBackground(null);
                            setBackgroundPreview(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          title="Xóa ảnh"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Preset Gradients */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    null,
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  ].map((bg, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setChatBackground(bg);
                        setBackgroundPreview(null);
                      }}
                      className={`h-12 rounded-lg border-2 transition-all ${
                        chatBackground === bg
                          ? "border-primary-500 ring-2 ring-primary-200"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                      style={
                        bg ? { background: bg } : { background: "transparent" }
                      }
                      title={idx === 0 ? "Mặc định" : `Background ${idx}`}
                    >
                      {idx === 0 && (
                        <X className="w-3 h-3 mx-auto text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>

                {/* URL Input */}
                <input
                  type="text"
                  value={chatBackground || ""}
                  onChange={(e) => {
                    setChatBackground(e.target.value || null);
                    setBackgroundPreview(null);
                  }}
                  placeholder="Hoặc nhập URL ảnh"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs text-gray-900 dark:text-white"
                />
              </div>

              {/* Notifications */}
              <div>
                <label className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  {notificationsMuted ? (
                    <BellOff className="w-3 h-3" />
                  ) : (
                    <Bell className="w-3 h-3" />
                  )}
                  Thông báo
                </label>
                <button
                  onClick={() => setNotificationsMuted(!notificationsMuted)}
                  className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs ${
                    notificationsMuted
                      ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  }`}
                >
                  <span>{notificationsMuted ? "Đã tắt" : "Đang bật"}</span>
                  {notificationsMuted ? (
                    <BellOff className="w-3 h-3" />
                  ) : (
                    <Bell className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Group Management Buttons (Add Member / View Members / Disband) - placed under Notifications */}
              {group && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 shadow-sm font-medium text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Thêm thành viên</span>
                  </button>
                  <button
                    onClick={() => setShowMembersModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm font-medium text-xs"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Xem thành viên</span>
                  </button>
                  <button
                    onClick={() => setShowDisbandModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 shadow-sm font-medium text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Giải tán nhóm</span>
                  </button>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={saveChatSettings}
                className="w-full px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-xs font-medium"
              >
                Lưu cài đặt
              </button>

              {/* Delete Conversation (1-1 chat) */}
              {otherUserId && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện này? Hành động này không thể hoàn tác."
                      )
                    ) {
                      deleteConversation(
                        typeof otherUserId === "string"
                          ? parseInt(otherUserId, 10)
                          : (otherUserId as number)
                      );
                    }
                  }}
                  className="w-full mt-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors text-xs font-medium"
                >
                  Xóa trò chuyện
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Right Sidebar - Group Chat Settings */}
      {isGroupChat && roomId && (
        <div
          className={`relative transition-all duration-300 ease-in-out flex flex-col h-screen flex-shrink-0 ${
            isSettingsHovered
              ? "w-full md:w-80 lg:w-[320px]"
              : "w-0 md:w-16 lg:w-20"
          } bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden group`}
          onMouseEnter={() => setIsSettingsHovered(true)}
          onMouseLeave={() => setIsSettingsHovered(false)}
        >
          <div
            className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
              !isSettingsHovered ? "p-2" : ""
            }`}
          >
            <h3
              className={`text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-opacity duration-300 ${
                isSettingsHovered ? "opacity-100" : "opacity-0 hidden md:flex"
              }`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span
                className={`whitespace-nowrap ${
                  isSettingsHovered ? "block" : "hidden"
                }`}
              >
                Cài đặt nhóm chat
              </span>
            </h3>
            {!isSettingsHovered && (
              <div className="flex items-center justify-center md:block">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto" />
              </div>
            )}
          </div>

          <div
            className={`flex-1 overflow-y-auto p-4 scrollbar-hide transition-opacity duration-300 ${
              isSettingsHovered
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="space-y-4">
              {/* Conversation Header: group avatar + name */}
              {group && (
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-200 dark:border-gray-700">
                  {group.avatar_url ? (
                    <img
                      src={group.avatar_url}
                      alt={group.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm">
                      {(group.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {group.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Nhóm chat
                    </div>
                  </div>
                </div>
              )}

              {/* Group name edit */}
              {group && (
                <div>
                  <label className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <User className="w-3 h-3" />
                    Tên nhóm
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={groupNameEdit}
                      onChange={(e) => setGroupNameEdit(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs text-gray-900 dark:text-white"
                      placeholder="Nhập tên nhóm"
                    />
                    <button
                      onClick={async () => {
                        const newName = groupNameEdit.trim();
                        if (!newName) {
                          alert("Tên nhóm không được để trống");
                          return;
                        }
                        try {
                          const token = localStorage.getItem(
                            getStorageKey("access_token")
                          );
                          if (!token) return;
                          const API_BASE_URL = getAPIURL();
                          const response = await fetch(
                            `${API_BASE_URL}/chat/groups/${roomId}`,
                            {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({ name: newName }),
                            }
                          );
                          if (response.ok) {
                            const data = await response.json();
                            setGroup(data.group);
                            setGroupNameEdit(data.group?.name || "");
                            if (fetchConversations) {
                              fetchConversations();
                            }
                          } else {
                            const error = await response.json();
                            alert(error.error || "Lỗi khi cập nhật tên nhóm");
                          }
                        } catch (err) {
                          alert("Lỗi khi cập nhật tên nhóm");
                        }
                      }}
                      className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              )}

              {/* Background */}
              <div>
                <label className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Palette className="w-3 h-3" />
                  Background
                </label>

                {/* Upload Image Button */}
                <div className="mb-3">
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                    id="background-upload-group"
                  />
                  <label
                    htmlFor="background-upload-group"
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer text-xs text-gray-700 dark:text-gray-300"
                  >
                    {uploadingBackground ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang upload...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        <span>Upload ảnh background</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Preview uploaded image */}
                {(backgroundPreview ||
                  (chatBackground && chatBackground.startsWith("http"))) && (
                  <div className="mb-3 relative">
                    <div className="relative h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img
                        src={backgroundPreview || chatBackground || ""}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                      />
                      {chatBackground && (
                        <button
                          onClick={() => {
                            setChatBackground(null);
                            setBackgroundPreview(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          title="Xóa ảnh"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Preset Gradients */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    null,
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  ].map((bg, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setChatBackground(bg);
                        setBackgroundPreview(null);
                      }}
                      className={`h-12 rounded-lg border-2 transition-all ${
                        chatBackground === bg
                          ? "border-primary-500 ring-2 ring-primary-200"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                      style={
                        bg ? { background: bg } : { background: "transparent" }
                      }
                      title={idx === 0 ? "Mặc định" : `Background ${idx}`}
                    >
                      {idx === 0 && (
                        <X className="w-3 h-3 mx-auto text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>

                {/* URL Input */}
                <input
                  type="text"
                  value={chatBackground || ""}
                  onChange={(e) => {
                    setChatBackground(e.target.value || null);
                    setBackgroundPreview(null);
                  }}
                  placeholder="Hoặc nhập URL ảnh"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs text-gray-900 dark:text-white"
                />
              </div>

              {/* Notifications */}
              <div>
                <label className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  {notificationsMuted ? (
                    <BellOff className="w-3 h-3" />
                  ) : (
                    <Bell className="w-3 h-3" />
                  )}
                  Thông báo
                </label>
                <button
                  onClick={() => setNotificationsMuted(!notificationsMuted)}
                  className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs ${
                    notificationsMuted
                      ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  }`}
                >
                  <span>{notificationsMuted ? "Đã tắt" : "Đang bật"}</span>
                  {notificationsMuted ? (
                    <BellOff className="w-3 h-3" />
                  ) : (
                    <Bell className="w-3 h-3" />
                  )}
                </button>
              </div>
              {/* Group Management Buttons (Add Member / View Members / Disband) - placed under Notifications */}
              {group && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 shadow-sm font-medium text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Thêm thành viên</span>
                  </button>
                  <button
                    onClick={() => setShowMembersModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm font-medium text-xs"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Xem thành viên</span>
                  </button>
                  <button
                    onClick={() => setShowDisbandModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 shadow-sm font-medium text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Giải tán nhóm</span>
                  </button>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={saveChatSettings}
                className="w-full px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-xs font-medium"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Conversation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowCreateModal(false);
              setCreateModalSearch("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tạo cuộc trò chuyện mới
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Search Friends */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bạn bè..."
                    value={createModalSearch}
                    onChange={(e) => setCreateModalSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>

              {/* Friends List */}
              <div className="flex-1 overflow-y-auto p-4">
                {(() => {
                  const filteredModalFriends = friends.filter((friend) => {
                    if (!createModalSearch.trim()) return true;
                    const query = createModalSearch.toLowerCase();
                    const name = (
                      friend.full_name ||
                      friend.username ||
                      ""
                    ).toLowerCase();
                    return name.includes(query);
                  });

                  if (filteredModalFriends.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {createModalSearch.trim()
                            ? "Không tìm thấy bạn bè"
                            : "Chưa có bạn bè nào"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {filteredModalFriends.map((friend) => {
                        // Check if conversation already exists
                        const hasConversation = conversations.some(
                          (conv) => conv.other_user?.id === friend.id
                        );
                        return (
                          <Link
                            key={friend.id}
                            href={`/messages/${friend.id}`}
                            onClick={() => setShowCreateModal(false)}
                          >
                            <motion.div
                              whileHover={{
                                backgroundColor: "rgba(0,0,0,0.02)",
                              }}
                              className="p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3"
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
                                {hasConversation && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Đã có cuộc trò chuyện
                                  </p>
                                )}
                              </div>
                              <MessageCircle className="w-5 h-5 text-primary-500" />
                            </motion.div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      const token = localStorage.getItem(
                        getStorageKey("access_token")
                      );
                      const API_BASE_URL = getAPIURL();

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
                        router.push(`/messages/group/${data.group.room_id}`);
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

      {/* Click outside to close menu */}
      {showConversationMenu !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowConversationMenu(null)}
        />
      )}
    </div>
  );
}
