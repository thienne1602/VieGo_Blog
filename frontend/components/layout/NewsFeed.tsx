import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import PostCard from "@/components/blog/PostCard";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { useAuth } from "@/lib/AuthContext";
import { getAccessToken } from "@/lib/storage-utils";
import { getBaseURL, getAPIURL, getUploadURL } from "@/lib/apiConfig";
import {
  X,
  Video,
  Image as ImageIcon,
  Send,
  Upload,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
} from "lucide-react";
import SuccessPopup from "@/components/common/SuccessPopup";

// Lazy load PostModal (heavy component with images and comments)
const PostModal = dynamic(() => import("@/components/common/PostModal"), {
  loading: () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-teal-600 mx-auto mb-4"></div>
        <p className="text-center text-gray-600">Loading post...</p>
      </div>
    </div>
  ),
  ssr: false,
});

const NewsFeed = () => {
  const { user } = useAuth();
  const { t } = useTranslation("home");
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Story states
  const [stories, setStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [userStoriesMap, setUserStoriesMap] = useState<Record<number, any[]>>(
    {}
  ); // Map user_id to all their stories
  const [currentViewingUserStories, setCurrentViewingUserStories] = useState<
    any[]
  >([]); // Stories currently being viewed
  const [currentViewingUser, setCurrentViewingUser] = useState<any>(null); // User whose stories are being viewed

  // Story creation states
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [storyContent, setStoryContent] = useState("");
  const [uploadingStory, setUploadingStory] = useState(false);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  // Post creation states (expanded form)
  const [showPostForm, setShowPostForm] = useState(false);
  const [postFormData, setPostFormData] = useState({
    title: "",
    content: "",
    category: "travel",
    images: [] as string[],
  });
  const [uploadingPostImages, setUploadingPostImages] = useState(false);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  // Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  // Helper function to safely parse JSON
  const safeParseJSON = (value: any, fallback: any = []): any => {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.warn("Failed to parse JSON:", value);
        return fallback;
      }
    }
    return value;
  };

  const normalizePostContent = (post: any): string => {
    const content =
      typeof post?.content === "string" ? post.content.trim() : "";
    if (content) return content;
    const excerpt =
      typeof post?.excerpt === "string" ? post.excerpt.trim() : "";
    return excerpt;
  };

  const getAuthToken = (): string | null => {
    // Current app stores tokens with port-scoped keys; keep a fallback for older sessions.
    return getAccessToken() || localStorage.getItem("access_token");
  };

  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoadingPosts(true);
      }
      setErrorPosts(null);

      const token = getAuthToken();
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `${getAPIURL()}/posts?page=${pageNum}&per_page=10`,
        {
          method: "GET",
          headers,
          credentials: "include",
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();

      // Transform API data to match our component format
      const transformedPosts = data.posts.map((post: any) => ({
        id: post.id,
        slug: post.slug,
        title: post.title || "",
        content: normalizePostContent(post),
        author_name:
          post.author?.full_name || post.author?.username || "Anonymous",
        author_id: post.author_id,
        author_avatar: post.author?.avatar_url,
        location: post.location_name || null,
        featured_image: post.featured_image || null,
        images: safeParseJSON(post.images, []),
        published_at:
          post.published_at || post.created_at || new Date().toISOString(),
        like_count: post.likes_count || 0,
        comment_count: post.comments_count || 0,
        views_count: post.views_count || 0,
        shares_count: post.shares_count || 0,
        tags: safeParseJSON(post.tags, []),
        is_liked: post.is_liked || false,
        is_bookmarked: post.is_bookmarked || false,
        visibility: post.visibility || "public",
      }));

      if (append) {
        // Prevent duplicate items (API pagination or repeated fetch can overlap)
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newUniquePosts = transformedPosts.filter(
            (p: any) => !existingIds.has(p.id)
          );
          return [...prev, ...newUniquePosts];
        });
      } else {
        // Defensive: also de-dupe in case backend returns duplicates
        const seen = new Set<number>();
        const uniquePosts = transformedPosts.filter((p: any) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        setPosts((prev) => {
          const now = Date.now();
          const recentOptimistic = prev.filter(
            (p: any) =>
              p?._optimistic === true &&
              typeof p?._optimisticCreatedAt === "number" &&
              now - p._optimisticCreatedAt < 2 * 60 * 1000 // keep for 2 minutes
          );

          const ids = new Set(uniquePosts.map((p: any) => p.id));
          const optimisticNotInApi = recentOptimistic.filter(
            (p: any) => !ids.has(p.id)
          );

          return [...optimisticNotInApi, ...uniquePosts];
        });
      }

      // Check if there are more posts
      if (data.pagination) {
        setHasMore(pageNum < data.pagination.pages);
      } else {
        setHasMore(transformedPosts.length >= 10);
      }
    } catch (error: any) {
      console.error("NewsFeed: Error fetching posts:", error);

      // Handle timeout errors gracefully
      if (error.name === "AbortError" || error instanceof TypeError) {
        setErrorPosts(
          "Không thể kết nối với máy chủ. Vui lòng đảm bảo backend đang chạy."
        );
      } else {
        setErrorPosts("Không thể tải bài viết. Vui lòng thử lại.");
      }
    } finally {
      setLoadingPosts(false);
      setIsLoadingMore(false);
    }
  };

  // Fetch stories from API
  const fetchStories = async () => {
    try {
      setLoadingStories(true);
      const token = getAuthToken();
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${getAPIURL()}/stories`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Transform API stories to match component format
        const transformedStories = [];

        // Add "Create Story" button first
        transformedStories.push({
          name: "Create Story",
          avatar: "➕",
          isAdd: true,
          gradient: "from-blue-500 to-purple-500",
        });

        // Add stories from API if available
        const newUserStoriesMap: Record<number, any[]> = {};
        if (data.success && data.data && Array.isArray(data.data)) {
          data.data.forEach((userStories: any) => {
            const user = userStories.user;
            const userStoriesList = userStories.stories || [];

            if (userStoriesList.length > 0) {
              // Store all stories for this user
              newUserStoriesMap[user.id] = userStoriesList.map(
                (story: any) => ({
                  storyId: story.id,
                  mediaUrl: `${getBaseURL()}${story.media_url}`,
                  mediaType: story.media_type,
                  content: story.content || "",
                  viewCount: story.view_count || 0,
                })
              );

              // Get the latest story for display in the story circle
              const latestStory = userStoriesList[0];
              transformedStories.push({
                name: user.full_name || user.username || "User",
                avatar: user.avatar_url || "👤",
                hasNew: true,
                location: latestStory.content || "",
                background:
                  latestStory.media_type === "video"
                    ? "from-purple-400 to-pink-400"
                    : "from-blue-400 to-cyan-400",
                viewers: latestStory.view_count || "0",
                storyId: latestStory.id,
                mediaUrl: `${getBaseURL()}${latestStory.media_url}`,
                mediaType: latestStory.media_type,
                userId: user.id, // Add userId to track which user's stories to load
              });
            }
          });
        }

        // Update user stories map
        setUserStoriesMap(newUserStoriesMap);

        setStories(transformedStories);
      } else {
        // Set default "Create Story" button on API error
        setStories([
          {
            name: "Create Story",
            avatar: "➕",
            isAdd: true,
            gradient: "from-blue-500 to-purple-500",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
      // Set default "Create Story" button on error
      setStories([
        {
          name: "Create Story",
          avatar: "➕",
          isAdd: true,
          gradient: "from-blue-500 to-purple-500",
        },
      ]);
    } finally {
      setLoadingStories(false);
    }
  };

  // Load more posts
  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, isLoadingMore]);

  // Initial fetch
  useEffect(() => {
    fetchPosts(1, false);
    fetchStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for posts update flag and refetch
  useEffect(() => {
    const checkPostsUpdate = () => {
      const postsUpdated = localStorage.getItem("posts_updated");
      if (postsUpdated) {
        localStorage.removeItem("posts_updated");
        // Refetch posts to get the new one
        fetchPosts(1, false);
      }
    };

    // Handle custom event for immediate update (same tab)
    const handlePostsUpdatedEvent = (event: CustomEvent) => {
      console.log("[NewsFeed] Received postsUpdated event:", event.detail);
      // Refetch posts immediately when a post is updated
      fetchPosts(1, false);
    };

    // Check immediately
    checkPostsUpdate();

    // Also check periodically (every 1 second) when component is mounted
    // This helps catch the flag even if redirect happens quickly
    const intervalId = setInterval(checkPostsUpdate, 1000);

    // Also listen for storage events (in case of multiple tabs)
    window.addEventListener("storage", checkPostsUpdate);

    // Listen for custom postsUpdated event (immediate, same tab)
    window.addEventListener(
      "postsUpdated",
      handlePostsUpdatedEvent as EventListener
    );

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", checkPostsUpdate);
      window.removeEventListener(
        "postsUpdated",
        handlePostsUpdatedEvent as EventListener
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch posts when page regains focus (e.g., user navigates back from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const postsUpdated = localStorage.getItem("posts_updated");
        if (postsUpdated) {
          localStorage.removeItem("posts_updated");
          fetchPosts(1, false);
        }
      }
    };

    const handleFocus = () => {
      const postsUpdated = localStorage.getItem("posts_updated");
      if (postsUpdated) {
        localStorage.removeItem("posts_updated");
        fetchPosts(1, false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stories.length > 0) {
      const storyTimer = setInterval(() => {
        setActiveStoryIndex((prev) => (prev + 1) % stories.length);
      }, 3000);
      return () => clearInterval(storyTimer);
    }
  }, [stories.length]);

  // Handle story file selection
  const handleStoryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      alert("Chỉ chấp nhận file ảnh hoặc video");
      return;
    }

    // Validate file size (50MB for video, 10MB for image)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File quá lớn. Tối đa ${isVideo ? "50MB" : "10MB"}`);
      return;
    }

    setStoryFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setStoryPreview(reader.result as string);
    };
    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      // For video, create object URL
      setStoryPreview(URL.createObjectURL(file));
    }
  };

  // Upload story
  const handleUploadStory = async () => {
    if (!storyFile) {
      alert("Vui lòng chọn file ảnh hoặc video");
      return;
    }

    try {
      setUploadingStory(true);
      const token = getAuthToken();

      const formData = new FormData();
      formData.append("file", storyFile);
      if (storyContent.trim()) {
        formData.append("content", storyContent);
      }

      const response = await fetch(`${getAPIURL()}/stories`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
        body: formData,
      });

      if (response.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setPopupMessage("Đăng story thành công!");
        setPopupType("success");
        setShowPopup(true);
        setShowStoryModal(false);
        setStoryFile(null);
        setStoryPreview(null);
        setStoryContent("");
        if (storyFileInputRef.current) {
          storyFileInputRef.current.value = "";
        }
        // Refresh stories list immediately
        setTimeout(() => {
          fetchStories();
        }, 500);
      } else {
        setPopupMessage(data.error || "Có lỗi xảy ra khi đăng story");
        setPopupType("error");
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error uploading story:", error);
      setPopupMessage("Có lỗi xảy ra khi đăng story");
      setPopupType("error");
      setShowPopup(true);
    } finally {
      setUploadingStory(false);
    }
  };

  // Handle post image upload
  const handlePostImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingPostImages(true);
      const token = getAuthToken();

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);

        const response = await fetch(`${getAPIURL()}/upload/image`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
          body: formData,
        });

        if (response.status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          return;
        }

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(`${getBaseURL()}${data.url}`);
        } else {
          let errMsg = "Có lỗi xảy ra khi upload ảnh";
          try {
            const errData = await response.json();
            errMsg = errData?.error || errData?.message || errMsg;
          } catch {
            // ignore
          }
          alert(errMsg);
        }
      }

      setPostFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Có lỗi xảy ra khi upload ảnh");
    } finally {
      setUploadingPostImages(false);
    }
  };

  // Create post
  const handleCreatePost = async () => {
    if (!postFormData.title.trim() || !postFormData.content.trim()) {
      alert("Vui lòng nhập tiêu đề và nội dung");
      return;
    }

    try {
      const token = getAuthToken();

      if (!token) {
        alert("Vui lòng đăng nhập");
        return;
      }

      const response = await fetch(`${getAPIURL()}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          title: postFormData.title,
          content: postFormData.content,
          category: postFormData.category,
          images: postFormData.images,
          content_type: "blog",
          status: "published",
        }),
      });

      const data = await response.json();

      if (response.ok && data.post) {
        try {
          // Transform new post to match component format
          const postData = data.post;
          const newPost = {
            id: postData.id,
            slug: postData.slug,
            title: postData.title || postFormData.title || "",
            content:
              normalizePostContent(postData) ||
              (typeof postFormData.content === "string"
                ? postFormData.content
                : ""),
            _optimistic: true,
            _optimisticCreatedAt: Date.now(),
            author_name:
              postData.author?.full_name ||
              postData.author?.username ||
              user?.full_name ||
              "Anonymous",
            author_id: postData.author_id || postData.author?.id || user?.id,
            author_avatar: postData.author?.avatar_url || user?.avatar_url,
            location: postData.location_name || null,
            featured_image:
              postData.featured_image ||
              (postFormData.images && postFormData.images.length > 0
                ? postFormData.images[0]
                : null),
            images: postData.images
              ? safeParseJSON(postData.images, postFormData.images)
              : postFormData.images,
            published_at:
              postData.published_at ||
              postData.created_at ||
              new Date().toISOString(),
            like_count: postData.likes_count || 0,
            comment_count: postData.comments_count || 0,
            views_count: postData.views_count || 0,
            shares_count: postData.shares_count || 0,
            tags: safeParseJSON(postData.tags, []),
            is_liked: postData.is_liked || false,
            is_bookmarked: postData.is_bookmarked || false,
          };

          // Reset page to 1
          setPage(1);
          setHasMore(true);

          // Add new post to the top immediately for instant feedback
          setPosts((prev) => {
            // Check if already exists to avoid duplicates
            const exists = prev.some((p) => p.id === newPost.id);
            if (!exists) {
              return [newPost, ...prev];
            }
            return prev;
          });

          setPopupMessage("Đăng bài thành công!");
          setPopupType("success");
          setShowPopup(true);
          setShowPostForm(false);
          setPostFormData({
            title: "",
            content: "",
            category: "travel",
            images: [],
          });
          setPostText("");
          setShowCreatePost(false);

          // Refresh posts to ensure data is in sync (after a short delay to allow backend to process)
          setTimeout(() => {
            fetchPosts(1, false);
          }, 1000);
        } catch (error) {
          console.error("Error processing post data:", error);
          // If processing fails, just refresh the list
          setPage(1);
          setHasMore(true);
          setPopupMessage("Đăng bài thành công!");
          setPopupType("success");
          setShowPopup(true);
          setShowPostForm(false);
          setPostFormData({
            title: "",
            content: "",
            category: "travel",
            images: [],
          });
          setPostText("");
          setShowCreatePost(false);
          setTimeout(() => {
            fetchPosts(1, false);
          }, 500);
        }
      } else {
        setPopupMessage(data.error || "Có lỗi xảy ra khi đăng bài");
        setPopupType("error");
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setPopupMessage("Có lỗi xảy ra khi đăng bài");
      setPopupType("error");
      setShowPopup(true);
    }
  };

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

  // Use stories from state, default to just "Create Story" button if empty
  const displayStories =
    stories.length > 0
      ? stories
      : [
          {
            name: "Create Story",
            avatar: "➕",
            isAdd: true,
            gradient: "from-blue-500 to-purple-500",
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

  // Get actual stories (excluding "Create Story")
  const actualStories = displayStories.filter((s) => !s.isAdd);

  // Handle story navigation - use currentViewingUserStories
  const handleNextStory = () => {
    if (currentStoryIndex < currentViewingUserStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setStoryProgress(0);
    } else {
      setShowStoryViewer(false);
      setCurrentViewingUserStories([]);
      setCurrentViewingUser(null);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setStoryProgress(0);
    }
  };

  // Track story view when story viewer opens
  useEffect(() => {
    if (
      showStoryViewer &&
      currentViewingUserStories.length > 0 &&
      currentViewingUserStories[currentStoryIndex]?.storyId
    ) {
      const storyId = currentViewingUserStories[currentStoryIndex].storyId;
      const token = getAuthToken();
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Track view
      fetch(`${getAPIURL()}/stories/${storyId}/view`, {
        method: "POST",
        headers,
        credentials: "include",
      }).catch((err) => console.error("Error tracking story view:", err));
    }
  }, [showStoryViewer, currentStoryIndex, currentViewingUserStories]);

  // Story progress auto-advance
  useEffect(() => {
    if (!showStoryViewer || currentViewingUserStories.length === 0) return;

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentStoryIndex < currentViewingUserStories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            return 0;
          } else {
            setShowStoryViewer(false);
            setCurrentViewingUserStories([]);
            setCurrentViewingUser(null);
            return 0;
          }
        }
        return prev + 0.5; // Progress every 50ms (5 seconds total)
      });
    }, 50);

    return () => clearInterval(interval);
  }, [showStoryViewer, currentStoryIndex, currentViewingUserStories.length]);

  // Scroll to top state and handler
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
          {displayStories.map((story, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 cursor-pointer group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                if (story.isAdd) {
                  setShowStoryModal(true);
                } else {
                  // Load all stories for this user
                  const userId = story.userId;
                  if (userId && userStoriesMap[userId]) {
                    // Use the stories from the map
                    const userStories = userStoriesMap[userId];
                    const clickedStoryIndex = userStories.findIndex(
                      (s: any) => s.storyId === story.storyId
                    );

                    // Set current viewing stories to this user's stories
                    setCurrentViewingUserStories(userStories);
                    setCurrentViewingUser(story); // Store user info from the story card
                    setCurrentStoryIndex(
                      clickedStoryIndex >= 0 ? clickedStoryIndex : 0
                    );
                    setShowStoryViewer(true);
                    setStoryProgress(0);
                  } else {
                    // Fallback: filter out "Create Story" and find the index
                    const actualStories = displayStories.filter(
                      (s) => !s.isAdd
                    );
                    const storyIndex = actualStories.findIndex(
                      (s) => s.storyId === story.storyId
                    );
                    if (storyIndex >= 0) {
                      // Convert to story format
                      const fallbackStories = actualStories.map((s: any) => ({
                        storyId: s.storyId,
                        mediaUrl: s.mediaUrl,
                        mediaType: s.mediaType,
                        content: s.location || "",
                        viewCount: s.viewers || 0,
                      }));
                      setCurrentViewingUserStories(fallbackStories);
                      setCurrentViewingUser(story); // Store user info
                      setCurrentStoryIndex(storyIndex);
                      setShowStoryViewer(true);
                      setStoryProgress(0);
                    }
                  }
                }
              }}
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
                      {t("newsfeed.createStory")}
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
            <span className="text-white font-bold text-lg">
              {user?.full_name?.[0]?.toUpperCase() || "U"}
            </span>
          </motion.div>
          <div className="flex-1">
            <input
              type="text"
              placeholder={t("newsfeed.writeSomething")}
              className="w-full bg-gradient-to-r from-gray-50 to-blue-50 rounded-full px-6 py-3 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              onFocus={() => {
                setShowCreatePost(true);
                setShowPostForm(true);
              }}
            />
          </div>
        </div>

        {/* Expanded Post Form */}
        <AnimatePresence>
          {showPostForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 mt-4"
            >
              <input
                type="text"
                placeholder="Tiêu đề bài viết..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={postFormData.title}
                onChange={(e) =>
                  setPostFormData({ ...postFormData, title: e.target.value })
                }
              />
              <textarea
                placeholder="Nội dung bài viết..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={postFormData.content}
                onChange={(e) =>
                  setPostFormData({ ...postFormData, content: e.target.value })
                }
              />
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={postFormData.category}
                onChange={(e) =>
                  setPostFormData({ ...postFormData, category: e.target.value })
                }
              >
                <option value="travel">Du lịch</option>
                <option value="food">Ẩm thực</option>
                <option value="culture">Văn hóa</option>
                <option value="adventure">Phiêu lưu</option>
              </select>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {uploadingPostImages
                      ? t("newsfeed.uploading")
                      : t("newsfeed.addImages")}
                  </span>
                  <input
                    ref={postImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePostImageUpload}
                    className="hidden"
                    disabled={uploadingPostImages}
                  />
                </label>
                {postFormData.images.length > 0 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {postFormData.images.map((img, idx) => (
                      <div key={idx} className="relative flex-shrink-0">
                        <img
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() =>
                            setPostFormData({
                              ...postFormData,
                              images: postFormData.images.filter(
                                (_, i) => i !== idx
                              ),
                            })
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowPostForm(false);
                    setShowCreatePost(false);
                    setPostText("");
                    setPostFormData({
                      title: "",
                      content: "",
                      category: "travel",
                      images: [],
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {t("newsfeed.cancel")}
                </button>
                <button
                  onClick={handleCreatePost}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{t("newsfeed.post")}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mood Selector */}
        <AnimatePresence>
          {showCreatePost && !showPostForm && (
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
        {!showPostForm && (
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
                onClick={() => {
                  setPostType(template.type);
                  setShowPostForm(true);
                }}
              >
                <span className="text-lg">{template.icon}</span>
                <span className="font-medium text-sm">{template.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Story Creation Modal */}
      <AnimatePresence>
        {showStoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowStoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-white/90 via-blue-50/70 to-purple-50/70 dark:from-gray-800/90 dark:via-gray-700/70 dark:to-gray-800/70 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/30 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {t("newsfeed.createPostTitle")}
                </h3>
                <button
                  onClick={() => {
                    setShowStoryModal(false);
                    setStoryFile(null);
                    setStoryPreview(null);
                    setStoryContent("");
                    if (storyFileInputRef.current) {
                      storyFileInputRef.current.value = "";
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!storyPreview ? (
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Video className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">
                          Chọn ảnh hoặc video
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Video tối đa 50MB, Ảnh tối đa 10MB
                      </p>
                    </div>
                    <input
                      ref={storyFileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleStoryFileSelect}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => storyFileInputRef.current?.click()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Chọn file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full h-64 rounded-xl overflow-hidden bg-black">
                    {storyFile?.type.startsWith("video/") ? (
                      <video
                        src={storyPreview}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={storyPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <textarea
                    placeholder={t("newsfeed.storyContent")}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={storyContent}
                    onChange={(e) => setStoryContent(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setStoryFile(null);
                        setStoryPreview(null);
                        if (storyFileInputRef.current) {
                          storyFileInputRef.current.value = "";
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Chọn lại
                    </button>
                    <button
                      onClick={handleUploadStory}
                      disabled={uploadingStory}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {uploadingStory ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Đang đăng...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{t("newsfeed.post")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Posts Feed */}
      <div className="space-y-6">
        {loadingPosts ? (
          <SkeletonLoader type="post" count={3} />
        ) : errorPosts ? (
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white/80 via-red-50/50 to-red-50/50 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 mb-4"
            >
              <p className="text-red-600 mb-4">{errorPosts}</p>
              <motion.button
                onClick={() => fetchPosts(1, false)}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Thử lại
              </motion.button>
            </motion.div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 mb-4 text-lg">Chưa có bài viết nào</p>
            </motion.div>
          </div>
        ) : (
          <>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <PostCard
                  post={post}
                  onOpenModal={(slug) => setSelectedPostSlug(slug)}
                />
              </motion.div>
            ))}
            {isLoadingMore && <SkeletonLoader type="post" count={2} />}
          </>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && !loadingPosts && !isLoadingMore && (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={loadMore}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 Khám phá thêm về Việt Nam
          </motion.button>
        </motion.div>
      )}

      {/* Post Modal */}
      {selectedPostSlug && (
        <PostModal
          slug={selectedPostSlug}
          onClose={() => setSelectedPostSlug(null)}
        />
      )}

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {showStoryViewer &&
          currentViewingUserStories.length > 0 &&
          currentViewingUserStories[currentStoryIndex] && (
            <motion.div
              className="fixed inset-0 z-[100] bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowStoryViewer(false);
                setCurrentViewingUserStories([]);
                setCurrentViewingUser(null);
              }}
            >
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 right-0 p-4 z-10">
                <div className="flex gap-2">
                  {currentViewingUserStories.map((_, index) => (
                    <div
                      key={index}
                      className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{
                          width: index < currentStoryIndex ? "100%" : "0%",
                        }}
                        animate={{
                          width:
                            index === currentStoryIndex
                              ? `${storyProgress}%`
                              : index < currentStoryIndex
                              ? "100%"
                              : "0%",
                        }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Story Content */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Previous Button */}
                {currentStoryIndex > 0 && (
                  <motion.button
                    className="absolute left-4 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevStory();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </motion.button>
                )}

                {/* Next Button */}
                {currentStoryIndex < currentViewingUserStories.length - 1 && (
                  <motion.button
                    className="absolute right-4 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextStory();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </motion.button>
                )}

                {/* Close Button */}
                <motion.button
                  className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStoryViewer(false);
                    setCurrentViewingUserStories([]);
                    setCurrentViewingUser(null);
                  }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>

                {/* Story Media */}
                <div
                  className="relative w-full h-full flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {currentViewingUserStories[currentStoryIndex]?.mediaType ===
                  "video" ? (
                    <video
                      src={
                        currentViewingUserStories[currentStoryIndex].mediaUrl
                      }
                      className="max-w-full max-h-full object-contain"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={
                        currentViewingUserStories[currentStoryIndex].mediaUrl
                      }
                      alt="Story"
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>

                {/* Story Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold">
                      {currentViewingUser?.avatar || "👤"}
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {currentViewingUser?.name || "User"}
                      </div>
                      {currentViewingUserStories[currentStoryIndex]
                        ?.content && (
                        <div className="text-white/80 text-sm">
                          📍{" "}
                          {currentViewingUserStories[currentStoryIndex].content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Scroll to Top Button - Giữa màn hình */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-blue-500/50 transition-all duration-300"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Success/Error Popup */}
      <SuccessPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        message={popupMessage}
        type={popupType}
        duration={3000}
      />
    </div>
  );
};

export default NewsFeed;
