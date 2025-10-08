"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Heart,
  CornerDownRight,
  MoreVertical,
  Flag,
  Trash2,
  Edit,
  User,
} from "lucide-react";

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
}

interface CommentSectionProps {
  postId: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
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

  const CommentCard: React.FC<{ comment: Comment; isReply?: boolean }> = ({
    comment,
    isReply = false,
  }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState<Comment[]>([]);

    const toggleReplies = async () => {
      if (!showReplies && comment.replies_count > 0) {
        await loadReplies(comment.id);
      }
      setShowReplies(!showReplies);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isReply ? "ml-12" : ""}`}
      >
        <div className="flex space-x-3">
          {/* Avatar */}
          {comment.author.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt={comment.author.full_name}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {comment.author.full_name[0]}
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">
                  {comment.author.full_name}
                </h4>
                <span className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <p className="text-gray-700 text-sm">{comment.content}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className="flex items-center text-gray-500 hover:text-red-500 transition"
              >
                <Heart className="w-4 h-4 mr-1" />
                <span>{comment.likes_count > 0 && comment.likes_count}</span>
              </button>

              {!isReply && comment.level < 2 && (
                <button
                  onClick={() => setReplyTo(comment.id)}
                  className="flex items-center text-gray-500 hover:text-blue-500 transition"
                >
                  <CornerDownRight className="w-4 h-4 mr-1" />
                  Trả lời
                </button>
              )}

              {comment.replies_count > 0 && (
                <button
                  onClick={toggleReplies}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showReplies ? "Ẩn" : "Xem"} {comment.replies_count} phản hồi
                </button>
              )}
            </div>

            {/* Reply Input */}
            {replyTo === comment.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Viết phản hồi..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handlePostReply(comment.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handlePostReply(comment.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setReplyTo(null);
                      setReplyContent("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Hủy
                  </button>
                </div>
              </motion.div>
            )}

            {/* Nested Replies */}
            {showReplies && (comment as any).replies && (
              <div className="mt-3 space-y-3">
                {(comment as any).replies.map((reply: Comment) => (
                  <CommentCard key={reply.id} comment={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
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
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
