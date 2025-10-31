"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, User } from "lucide-react";
import CommentCard from "./CommentCard";

interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  created_at: string;
  likes_count: number;
  replies_count: number;
  level: number;
  parent_id?: number;
  replies?: Comment[]; // Add replies array
}

interface CommentSectionProps {
  postId: number;
  onNewComment?: (commentCount: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  onNewComment,
}) => {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/comments/post/${postId}`
      );

      if (!response.ok) throw new Error("Failed to fetch comments");

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (!newComment.trim()) return;

    try {
      const response = await fetch("http://localhost:5000/api/comments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          content: newComment.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to post comment");

      const data = await response.json();
      setComments([data.comment, ...comments]);
      setNewComment("");
      // notify parent
      if (onNewComment) onNewComment(comments.length + 1);
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Không thể đăng bình luận. Vui lòng thử lại.");
    }
  };

  const handlePostReply = async (parentId: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (!replyContent.trim()) return;

    try {
      const response = await fetch("http://localhost:5000/api/comments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          parent_id: parentId,
          content: replyContent.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to post reply");

      const data = await response.json();

      // Load replies for parent comment
      loadReplies(parentId);

      setReplyTo(null);
      setReplyContent("");
      if (onNewComment) onNewComment(comments.length + 1);
    } catch (err) {
      console.error("Error posting reply:", err);
      alert("Không thể đăng phản hồi. Vui lòng thử lại.");
    }
  };

  const loadReplies = async (commentId: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/comments/${commentId}/replies`
      );

      if (!response.ok) throw new Error("Failed to load replies");

      const data = await response.json();

      // Update comments with replies
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: data.replies }
            : comment
        )
      );

      setExpandedComments((prev) => new Set(prev).add(commentId));
    } catch (err) {
      console.error("Error loading replies:", err);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/comments/${commentId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to like comment");

      const data = await response.json();

      // Update comment likes count
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, likes_count: data.likes_count }
            : comment
        )
      );
    } catch (err) {
      console.error("Error liking comment:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <MessageCircle className="w-6 h-6 mr-2" />
        Bình luận ({comments.length})
      </h2>

      {/* New Comment Input */}
      <div className="mb-8">
        <div className="flex space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim()}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                Đăng bình luận
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Đang tải bình luận...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              replyTo={replyTo}
              replyContent={replyContent}
              onSetReplyTo={setReplyTo}
              onSetReplyContent={setReplyContent}
              onPostReply={handlePostReply}
              onLoadReplies={loadReplies}
              onLikeComment={handleLikeComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
