"use client";

import { useState, useEffect } from "react";
import CreatePostCard from "@/components/blog/CreatePostCard";
import StoriesSection from "@/components/blog/StoriesSection";
import PostCard from "@/components/blog/PostCard";
import Sidebar from "@/components/blog/Sidebar";
import RightSidebar from "@/components/blog/RightSidebar";
import apiClient, { handleApiError } from "@/lib/api";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_name: string;
  category_name: string;
  location?: string;
  featured_image?: string;
  published_at: string;
  tags: string[];
  like_count: number;
  comment_count: number;
  view_count: number;
  read_time: number;
}

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const result = await apiClient.getPosts({
          page: 1,
          limit: 10,
        });

        if (result.success && result.data?.posts) {
          setPosts(result.data.posts);
        } else {
          setError(handleApiError(result.error, "Không thể tải bài viết"));
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Đã xảy ra lỗi khi tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Mock data for demonstration
  const mockPosts =
    posts.length > 0
      ? posts
      : [
          {
            id: 1,
            title: "Khám phá Hà Nội trong 3 ngày",
            slug: "kham-pha-ha-noi-3-ngay",
            content: "Hà Nội với những con phố cổ kính...",
            excerpt: "Hướng dẫn chi tiết khám phá Hà Nội trong 3 ngày",
            author_name: "Minh Anh",
            category_name: "Du lịch",
            published_at: new Date().toISOString(),
            tags: ["hanoi", "dullich", "pho"],
            like_count: 45,
            comment_count: 12,
            view_count: 234,
            read_time: 5,
          },
          {
            id: 2,
            title: "Top 10 món ăn đường phố Sài Gòn",
            slug: "top-10-mon-an-duong-pho-sai-gon",
            content: "Sài Gòn nổi tiếng với văn hóa ẩm thực...",
            excerpt: "Những món ăn đường phố không thể bỏ qua khi đến Sài Gòn",
            author_name: "Lan Hương",
            category_name: "Ẩm thực",
            published_at: new Date(Date.now() - 86400000).toISOString(),
            tags: ["saigon", "amthuc", "duongpho"],
            like_count: 78,
            comment_count: 25,
            view_count: 456,
            read_time: 7,
          },
        ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-2xl">
            {/* Stories Section */}
            <StoriesSection />

            {/* Create Post */}
            <CreatePostCard />

            {/* Posts Feed */}
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-600 mb-2">⚠️ {error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {mockPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {/* Load More */}
              <div className="text-center py-6">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Xem thêm bài viết
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden xl:block w-80 flex-shrink-0">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
