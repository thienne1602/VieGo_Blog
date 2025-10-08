import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const NewsFeed = () => {
  const [postText, setPostText] = useState("");
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postType, setPostType] = useState("normal");
  const [selectedMood, setSelectedMood] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());

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

  const posts = [
    {
      id: 1,
      author: "VieGo Travel Vietnam",
      avatar: "🌏",
      verified: true,
      time: "2 giờ",
      location: "Vịnh Hà Long, Quảng Ninh",
      content:
        "Khám phá vẻ đẹp huyền diệu của Vịnh Hà Long! 🚢 Một trong những kỳ quan thiên nhiên thế giới không thể bỏ lỡ khi đến Việt Nam. Những hang động kỳ bí, nước biển xanh ngọc bích và cảnh hoàng hôn tuyệt đẹp! ✨",
      image: null,
      imageType: "360",
      likes: 2247,
      comments: 189,
      shares: 356,
      reactions: ["👍", "❤️", "😍", "👏", "😮"],
      mood: "excited",
      postType: "travel",
      tags: ["#HaLongBay", "#UNESCO", "#Vietnam", "#Travel"],
    },
    {
      id: 2,
      author: "Nguyễn Minh Tuấn",
      avatar: "👨‍💼",
      time: "4 giờ",
      location: "Hội An Ancient Town",
      content:
        "Hội An về đêm thật là lãng mạn! 🌙 Những chiếc đèn lồng rực rỡ soi sáng cả con phố cổ. Cảm giác như lạc vào một thế giới cổ tích. Ai cũng nên đến đây ít nhất một lần trong đời! ✨🏮",
      image: null,
      likes: 1892,
      comments: 167,
      shares: 89,
      reactions: ["👍", "❤️", "😍"],
      mood: "love",
      postType: "check-in",
    },
    {
      id: 3,
      author: "Vietnam Food Adventure",
      avatar: "🍜",
      verified: true,
      time: "6 giờ",
      location: "Hà Nội Old Quarter",
      content:
        "PHỞ BÒ HÀ NỘI CHÍNH HIỆU! 🍜 Món ăn quốc hồn quốc túy của người Việt Nam. Hương vị đậm đà từ nước dùng được niêu trong 12 tiếng, thịt bò tươi ngon và bánh phở dai ngon khó cưỡng! 🤤",
      image: null,
      likes: 3156,
      comments: 234,
      shares: 467,
      reactions: ["👍", "❤️", "😍", "🤤"],
      mood: "happy",
      postType: "food",
      tags: ["#Pho", "#HanoiFood", "#VietnameseFood"],
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
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{
              y: -5,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            }}
          >
            {/* Post Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg relative"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-2xl">{post.avatar}</span>
                    {post.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900">{post.author}</h3>
                      {post.mood && (
                        <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs">
                          <span>
                            {
                              moods.find(
                                (m) => m.name.toLowerCase() === post.mood
                              )?.emoji
                            }
                          </span>
                          <span>feeling {post.mood}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                      <span>{post.time}</span>
                      <span>·</span>
                      <div className="flex items-center space-x-1">
                        <span>📍</span>
                        <span>{post.location}</span>
                      </div>
                      {post.postType && (
                        <>
                          <span>·</span>
                          <span className="capitalize bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                            {post.postType}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <motion.button
                  className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </motion.button>
              </div>

              {/* Post Content */}
              <div className="mt-4">
                <p className="text-gray-800 leading-relaxed">{post.content}</p>
                {post.tags && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Post Image Placeholder */}
            <div className="relative mx-6 mb-4">
              <motion.div
                className={`w-full h-80 bg-gradient-to-br ${
                  post.postType === "travel"
                    ? "from-blue-400 to-cyan-500"
                    : post.postType === "food"
                    ? "from-orange-400 to-red-500"
                    : post.postType === "check-in"
                    ? "from-green-400 to-emerald-500"
                    : "from-purple-400 to-pink-500"
                } rounded-2xl flex items-center justify-center shadow-lg overflow-hidden`}
                whileHover={{ scale: 1.02 }}
                layoutId={`post-image-${post.id}`}
              >
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 0.9, 1],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <span className="text-white text-8xl drop-shadow-lg">
                    {post.postType === "travel"
                      ? "🏞️"
                      : post.postType === "food"
                      ? "🍜"
                      : post.postType === "check-in"
                      ? "📍"
                      : "📸"}
                  </span>
                </motion.div>
                {post.imageType === "360" && (
                  <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                    360° Photo
                  </div>
                )}
              </motion.div>
            </div>

            {/* Post Stats */}
            <div className="px-6 py-3">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1">
                    {post.reactions
                      .slice(0, 3)
                      .map((reaction, reactionIndex) => (
                        <motion.div
                          key={reactionIndex}
                          className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-md"
                          whileHover={{ scale: 1.2, zIndex: 10 }}
                        >
                          <span className="text-xs">{reaction}</span>
                        </motion.div>
                      ))}
                  </div>
                  <span className="font-medium">
                    {post.likes.toLocaleString()}
                  </span>
                </div>
                <div className="flex space-x-6">
                  <span className="hover:text-gray-700 cursor-pointer">
                    {post.comments} bình luận
                  </span>
                  <span className="hover:text-gray-700 cursor-pointer">
                    {post.shares} chia sẻ
                  </span>
                </div>
              </div>
            </div>

            {/* Post Actions */}
            <div className="border-t border-gray-200 px-6 py-3">
              <div className="flex justify-between">
                <motion.button
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 flex-1 mx-1 ${
                    likedPosts.has(post.id)
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleLike(post.id)}
                >
                  <motion.span
                    className="text-lg"
                    animate={{
                      scale: likedPosts.has(post.id) ? [1, 1.3, 1] : 1,
                      rotate: likedPosts.has(post.id) ? [0, 15, -15, 0] : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {likedPosts.has(post.id) ? "❤️" : "👍"}
                  </motion.span>
                  <span className="font-medium">
                    {likedPosts.has(post.id) ? "Liked" : "Like"}
                  </span>
                </motion.button>

                <motion.button
                  className="flex items-center space-x-2 px-6 py-3 hover:bg-gray-100 rounded-xl transition-all duration-300 flex-1 mx-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">💬</span>
                  <span className="font-medium text-gray-600">Comment</span>
                </motion.button>

                <motion.button
                  className="flex items-center space-x-2 px-6 py-3 hover:bg-gray-100 rounded-xl transition-all duration-300 flex-1 mx-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">📤</span>
                  <span className="font-medium text-gray-600">Share</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
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
    </div>
  );
};

export default NewsFeed;
