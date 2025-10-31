import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PostCard from "@/components/blog/PostCard";
import PostModal from "@/components/common/PostModal";

const NewsFeed = () => {
  const [postText, setPostText] = useState("");
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postType, setPostType] = useState("normal");
  const [selectedMood, setSelectedMood] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorPosts, setErrorPosts] = useState<string | null>(null);
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);

  // Fetch posts from API
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      setErrorPosts(null);

      console.log("NewsFeed: Fetching posts from API...");

      const token = localStorage.getItem("access_token");
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log("NewsFeed: Using auth token");
      }

      const response = await fetch("http://localhost:5000/api/posts", {
        method: "GET",
        headers,
        credentials: "include",
      });

      console.log("NewsFeed: Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      console.log("NewsFeed: Received posts:", data.posts?.length);

      // Transform API data to match our component format
      const transformedPosts = data.posts.map((post: any) => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.excerpt || post.content.substring(0, 200),
        author_name:
          post.author?.full_name || post.author?.username || "Anonymous",
        author_avatar: post.author?.avatar_url,
        location: post.location_name,
        featured_image: post.featured_image,
        images: post.images || [],
        published_at: post.published_at || post.created_at,
        like_count: post.likes_count || 0,
        comment_count: post.comments_count || 0,
        views_count: post.views_count || 0,
        shares_count: post.shares_count || 0,
        tags: post.tags || [],
        is_liked: post.is_liked || false,
        is_bookmarked: post.is_bookmarked || false,
      }));

      console.log("NewsFeed: Transformed posts:", transformedPosts.length);
      setPosts(transformedPosts);
    } catch (error) {
      console.error("NewsFeed: Error fetching posts:", error);
      setErrorPosts("Không thể tải bài viết. Vui lòng thử lại.");
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    const storyTimer = setInterval(() => {
      setActiveStoryIndex((prev) => (prev + 1) % stories.length);
    }, 3000);
    return () => clearInterval(storyTimer);
  }, []);

  const moods = [
    { emoji: "😊", name: "Happy", color: "from-yellow-400 to-orange-400" },
    { emoji: "🤩", name: "Excited", color: "from-pink-400 to-red-400" },
    { emoji: "😍", name: "Love", color: "from-red-400 to-pink-400" },
    { emoji: "🤔", name: "Thinking", color: "from-blue-400 to-purple-400" },
    { emoji: "😴", name: "Tired", color: "from-gray-400 to-blue-400" },
    { emoji: "🎉", name: "Celebrating", color: "from-purple-400 to-pink-400" },
  ];

  const postTemplates = [
    {
      type: "check-in",
      icon: "📍",
      label: "Check-in",
      placeholder: "Bạn đang ở đâu?",
      bg: "from-green-400 to-emerald-400",
    },
    {
      type: "food",
      icon: "🍜",
      label: "Ẩm thực",
      placeholder: "Chia sẻ món ăn ngon...",
      bg: "from-orange-400 to-red-400",
    },
    {
      type: "travel",
      icon: "✈️",
      label: "Du lịch",
      placeholder: "Kể về chuyến đi của bạn...",
      bg: "from-blue-400 to-cyan-400",
    },
    {
      type: "culture",
      icon: "🎭",
      label: "Văn hóa",
      placeholder: "Khám phá văn hóa Việt Nam...",
      bg: "from-purple-400 to-pink-400",
    },
  ];

  const stories = [
    {
      name: "Create Story",
      avatar: "➕",
      isAdd: true,
      gradient: "from-blue-500 to-purple-500",
    },
    {
      name: "Minh Tuấn",
      avatar: "👨‍💼",
      hasNew: true,
      location: "Vịnh Hà Long",
      background: "from-blue-400 to-cyan-400",
      viewers: "234",
    },
    {
      name: "Thu Hà",
      avatar: "👩‍🎨",
      hasNew: true,
      location: "Hội An Ancient Town",
      background: "from-yellow-400 to-orange-400",
      viewers: "156",
    },
    {
      name: "Quang Anh",
      avatar: "🧑‍💻",
      hasNew: false,
      location: "Sapa Mountains",
      background: "from-green-400 to-emerald-400",
      viewers: "89",
    },
    {
      name: "Linh Chi",
      avatar: "👩‍🏫",
      hasNew: true,
      location: "Mekong Delta",
      background: "from-pink-400 to-rose-400",
      viewers: "312",
    },
    {
      name: "Đức Thành",
      avatar: "👨‍🚀",
      hasNew: false,
      location: "Phú Quốc Island",
      background: "from-purple-400 to-indigo-400",
      viewers: "198",
    },
  ];

  const toggleLike = (postId: number) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Enhanced Stories Section */}
      <motion.div
        className="bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center">
            <span className="mr-2">📸</span>
            Stories Vietnam
          </h3>
          <motion.button
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            whileHover={{ scale: 1.05 }}
          >
            Xem tất cả
          </motion.button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {stories.map((story, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 cursor-pointer group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div
                className={`relative w-24 h-40 rounded-2xl overflow-hidden shadow-lg ${
                  story.isAdd
                    ? "bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300"
                    : `bg-gradient-to-br ${
                        story.background || "from-blue-400 to-purple-600"
                      }`
                }`}
              >
                {story.isAdd ? (
                  <div className="flex flex-col items-center justify-center h-full p-2">
                    <motion.div
                      className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2"
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-white text-xl">➕</span>
                    </motion.div>
                    <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                      Tạo Story
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Story Ring */}
                    <div
                      className={`absolute inset-1 rounded-2xl border-3 ${
                        story.hasNew
                          ? "border-white shadow-lg"
                          : "border-gray-300"
                      }`}
                    />

                    {/* Avatar */}
                    <div className="absolute top-3 left-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          story.hasNew ? "bg-white/90 shadow-lg" : "bg-gray-300"
                        }`}
                      >
                        <span>{story.avatar}</span>
                      </div>
                    </div>

                    {/* Story Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="text-white text-xs font-semibold leading-tight">
                        {story.name}
                      </div>
                      {story.location && (
                        <div className="text-white/80 text-xs leading-tight">
                          📍 {story.location}
                        </div>
                      )}
                      {story.viewers && (
                        <div className="flex items-center text-white/70 text-xs mt-1">
                          <span className="mr-1">👁️</span>
                          {story.viewers}
                        </div>
                      )}
                    </div>

                    {/* Live indicator */}
                    {story.hasNew && (
                      <motion.div
                        className="absolute top-3 right-3 px-2 py-1 bg-red-500 rounded-full"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <span className="text-white text-xs font-bold">
                          LIVE
                        </span>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Enhanced Create Post */}
      <motion.div
        className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-4">
          <motion.div
            className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1 }}
          >
            <span className="text-white font-bold text-lg">U</span>
          </motion.div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Bạn đang nghĩ gì về Việt Nam? ✨"
              className="w-full bg-gradient-to-r from-gray-50 to-blue-50 rounded-full px-6 py-3 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              onFocus={() => setShowCreatePost(true)}
            />
          </div>
        </div>

        {/* Mood Selector */}
        <AnimatePresence>
          {showCreatePost && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <h4 className="text-sm font-semibold text-gray-600 mb-2">
                Cảm xúc của bạn:
              </h4>
              <div className="flex space-x-2 overflow-x-auto">
                {moods.map((mood) => (
                  <motion.button
                    key={mood.name}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedMood === mood.name
                        ? `bg-gradient-to-r ${mood.color} text-white shadow-lg`
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setSelectedMood(
                        selectedMood === mood.name ? "" : mood.name
                      )
                    }
                  >
                    <span className="text-lg">{mood.emoji}</span>
                    <span>{mood.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post Type Templates */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {postTemplates.map((template) => (
            <motion.button
              key={template.type}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                postType === template.type
                  ? `bg-gradient-to-r ${template.bg} text-white shadow-lg`
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPostType(template.type)}
            >
              <span className="text-lg">{template.icon}</span>
              <span className="font-medium text-sm">{template.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Enhanced Posts Feed */}
      <div className="space-y-6">
        {loadingPosts ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-teal-600"></div>
          </div>
        ) : errorPosts ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{errorPosts}</p>
            <button
              onClick={fetchPosts}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
            >
              Thử lại
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Chưa có bài viết nào</p>
            <Link href="/posts/create">
              <button className="px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg hover:from-teal-600 hover:to-blue-600">
                Tạo bài viết đầu tiên
              </button>
            </Link>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <PostCard
                post={post}
                onOpenModal={(slug) => setSelectedPostSlug(slug)}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Load More */}
      <motion.div
        className="text-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.button
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 Khám phá thêm về Việt Nam
        </motion.button>
      </motion.div>

      {/* Post Modal */}
      {selectedPostSlug && (
        <PostModal
          slug={selectedPostSlug}
          onClose={() => setSelectedPostSlug(null)}
        />
      )}
    </div>
  );
};

export default NewsFeed;
