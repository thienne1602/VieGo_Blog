"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { getBaseURL, getAPIURL } from "@/lib/apiConfig";

interface Story {
  id: number;
  user_id: number;
  content?: string;
  media_url: string;
  media_type: "image" | "video";
  view_count: number;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
}

interface UserStories {
  user: {
    id: number;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  stories: Story[];
}

export default function StoriesSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [storiesData, setStoriesData] = useState<UserStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted to allow autoplay
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const STORY_DURATION = 5000; // 5 seconds for images

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getAPIURL()}/stories`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStoriesData(data.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching stories:", err);
    } finally {
      setLoading(false);
    }
  };

  const openStory = (userIndex: number) => {
    setCurrentUserIndex(userIndex);
    setCurrentStoryIndex(0);
    setProgress(0);
    setShowModal(true);
    setIsPlaying(true);
    setIsPaused(false);

    // Mark story as viewed
    const story = storiesData[userIndex]?.stories[0];
    if (story) {
      viewStory(story.id);
    }
  };

  const viewStory = async (storyId: number) => {
    try {
      await fetch(`${getAPIURL()}/stories/${storyId}/view`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Error marking story as viewed:", err);
    }
  };

  const currentStories = storiesData[currentUserIndex]?.stories || [];
  const currentStory = currentStories[currentStoryIndex];

  useEffect(() => {
    if (!showModal || isPaused || !currentStory) return;

    // Clear existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    if (currentStory.media_type === "video") {
      // For videos, sync with video progress
      const video = videoRef.current;
      if (video) {
        video.muted = isMuted;

        // Try to play with sound, fallback to muted if blocked
        const playVideo = async () => {
          try {
            await video.play();
          } catch (err) {
            // If autoplay is blocked, try muted
            console.log("Autoplay blocked, trying muted playback");
            video.muted = true;
            setIsMuted(true);
            try {
              await video.play();
            } catch (e) {
              console.error("Video playback failed:", e);
            }
          }
        };

        playVideo();

        const handleTimeUpdate = () => {
          if (video.duration) {
            setProgress((video.currentTime / video.duration) * 100);
          }
        };

        const handleEnded = () => {
          nextStory();
        };

        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("ended", handleEnded);

        return () => {
          video.removeEventListener("timeupdate", handleTimeUpdate);
          video.removeEventListener("ended", handleEnded);
        };
      }
    } else {
      // For images, use timed progress
      const startTime = Date.now();
      progressInterval.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = (elapsed / STORY_DURATION) * 100;

        if (newProgress >= 100) {
          nextStory();
        } else {
          setProgress(newProgress);
        }
      }, 50);

      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      };
    }
  }, [
    showModal,
    currentStoryIndex,
    currentUserIndex,
    isPaused,
    isMuted,
    currentStory,
  ]);

  const nextStory = () => {
    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
      const nextStory = currentStories[currentStoryIndex + 1];
      if (nextStory) viewStory(nextStory.id);
    } else if (currentUserIndex < storiesData.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
      const nextUserStory = storiesData[currentUserIndex + 1]?.stories[0];
      if (nextUserStory) viewStory(nextUserStory.id);
    } else {
      closeModal();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex((prev) => prev - 1);
      const prevUserStories = storiesData[currentUserIndex - 1]?.stories || [];
      setCurrentStoryIndex(prevUserStories.length - 1);
      setProgress(0);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setProgress(0);
    setCurrentStoryIndex(0);
    setIsPlaying(true);
    setIsMuted(true); // Reset to muted when closing
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setHasUserInteracted(true);

    if (videoRef.current) {
      videoRef.current.muted = newMuted;
      // If unmuting and video is paused, try to play
      if (!newMuted && videoRef.current.paused) {
        try {
          await videoRef.current.play();
        } catch (err) {
          console.error("Failed to play video:", err);
        }
      }
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleCreateStory = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    router.push("/stories/create");
  };

  const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${getBaseURL()}${url}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 1) return "Vừa xong";
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return "Hơn 1 ngày";
  };

  // Mock stories for display when no real stories exist
  const mockStories = [
    {
      id: 2,
      user: "Minh Trang",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face",
      storyImage:
        "https://images.unsplash.com/photo-1555400082-c2f3df78b8ab?w=120&h=200&fit=crop",
    },
    {
      id: 3,
      user: "Văn Nam",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face",
      storyImage:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=120&h=200&fit=crop",
    },
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Create Story Button */}
          <div
            onClick={handleCreateStory}
            className="relative flex-shrink-0 w-28 h-44 rounded-xl overflow-hidden cursor-pointer group"
          >
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 border-2 border-dashed border-gray-300 dark:border-gray-500 flex flex-col items-center justify-center hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 text-center px-2">
                Tạo tin
              </span>
            </div>
          </div>

          {/* Real Stories from API */}
          {loading
            ? // Loading skeletons
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="relative flex-shrink-0 w-28 h-44 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse"
                />
              ))
            : storiesData.length > 0
            ? storiesData.map((userStory, index) => (
                <div
                  key={userStory.user.id}
                  onClick={() => openStory(index)}
                  className="relative flex-shrink-0 w-28 h-44 rounded-xl overflow-hidden cursor-pointer group"
                >
                  {/* Story thumbnail */}
                  {userStory.stories[0]?.media_type === "video" ? (
                    <video
                      src={getMediaUrl(userStory.stories[0]?.media_url)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={
                        getMediaUrl(userStory.stories[0]?.media_url) ||
                        "https://images.unsplash.com/photo-1555400082-c2f3df78b8ab?w=120&h=200&fit=crop"
                      }
                      alt={userStory.user.full_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

                  {/* User avatar with ring */}
                  <div className="absolute top-3 left-3">
                    <div className="p-0.5 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
                      <img
                        src={
                          userStory.user.avatar_url ||
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                        }
                        alt={userStory.user.full_name}
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      />
                    </div>
                  </div>

                  {/* Video indicator */}
                  {userStory.stories[0]?.media_type === "video" && (
                    <div className="absolute top-3 right-3">
                      <Play className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}

                  {/* Story count badge */}
                  {userStory.stories.length > 1 && (
                    <div className="absolute top-3 right-3 bg-white/90 text-gray-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                      {userStory.stories.length}
                    </div>
                  )}

                  {/* Username */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-white text-xs font-medium truncate block drop-shadow">
                      {userStory.user.full_name || userStory.user.username}
                    </span>
                  </div>
                </div>
              ))
            : // Show mock stories when no real stories
              mockStories.map((story) => (
                <div
                  key={story.id}
                  className="relative flex-shrink-0 w-28 h-44 rounded-xl overflow-hidden cursor-pointer group opacity-60"
                >
                  <img
                    src={story.storyImage}
                    alt={story.user}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 dark:bg-black/50"></div>
                  <div className="absolute top-3 left-3">
                    <img
                      src={story.avatar}
                      alt={story.user}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-white text-xs font-medium truncate block">
                      {story.user}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {showModal && currentStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation buttons */}
            <button
              onClick={prevStory}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
            <button
              onClick={nextStory}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>

            {/* Story Content */}
            <div className="relative w-full max-w-md h-full max-h-[90vh] mx-4">
              {/* Progress bars */}
              <div className="absolute top-4 left-4 right-4 z-40 flex gap-1">
                {currentStories.map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-white transition-all duration-100 ease-linear"
                      style={{
                        width:
                          index < currentStoryIndex
                            ? "100%"
                            : index === currentStoryIndex
                            ? `${progress}%`
                            : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* User info */}
              <div className="absolute top-8 left-4 right-4 z-40 flex items-center gap-3">
                <img
                  src={
                    storiesData[currentUserIndex]?.user.avatar_url ||
                    "https://via.placeholder.com/40"
                  }
                  alt=""
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">
                    {storiesData[currentUserIndex]?.user.full_name ||
                      storiesData[currentUserIndex]?.user.username}
                  </p>
                  <p className="text-white/70 text-xs">
                    {formatTimeAgo(currentStory.created_at)}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {currentStory.media_type === "video" && (
                    <button
                      onClick={toggleMute}
                      className={`p-2 rounded-full transition-colors ${
                        isMuted
                          ? "bg-red-500/80 hover:bg-red-600/80 animate-pulse"
                          : "bg-black/30 hover:bg-black/50"
                      }`}
                      title={
                        isMuted ? "Bấm để bật âm thanh" : "Bấm để tắt âm thanh"
                      }
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={togglePause}
                    className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tap to unmute hint for videos */}
              {currentStory.media_type === "video" &&
                isMuted &&
                !hasUserInteracted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
                    onClick={toggleMute}
                  >
                    <VolumeX className="w-4 h-4" />
                    Nhấn để bật âm thanh
                  </motion.div>
                )}

              {/* Media content */}
              <div className="w-full h-full flex items-center justify-center rounded-xl overflow-hidden bg-black">
                {currentStory.media_type === "video" ? (
                  <video
                    ref={videoRef}
                    src={getMediaUrl(currentStory.media_url)}
                    className="w-full h-full object-contain"
                    playsInline
                    autoPlay
                    muted={isMuted}
                    onError={(e) => console.error("Video error:", e)}
                  />
                ) : (
                  <img
                    src={getMediaUrl(currentStory.media_url)}
                    alt="Story"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Story text content */}
              {currentStory.content && (
                <div className="absolute bottom-20 left-4 right-4 z-40">
                  <p className="text-white text-center text-lg font-medium drop-shadow-lg bg-black/30 rounded-lg p-3">
                    {currentStory.content}
                  </p>
                </div>
              )}

              {/* Click areas for navigation */}
              <div className="absolute inset-0 flex z-30">
                <div
                  className="w-1/3 h-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevStory();
                  }}
                />
                <div
                  className="w-1/3 h-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePause();
                  }}
                />
                <div
                  className="w-1/3 h-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextStory();
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
