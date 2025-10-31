"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, CornerDownRight, Send, User } from "lucide-react";

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
  replies?: Comment[];
}

interface CommentCardProps {
  comment: Comment;
  isReply?: boolean;
  replyTo: number | null;
  replyContent: string;
  onSetReplyTo: (id: number | null) => void;
  onSetReplyContent: (content: string) => void;
  onPostReply: (parentId: number) => void;
  onLoadReplies: (commentId: number) => void;
  onLikeComment: (commentId: number) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  isReply = false,
  replyTo,
  replyContent,
  onSetReplyTo,
  onSetReplyContent,
  onPostReply,
  onLoadReplies,
  onLikeComment,
}) => {
  const [showReplies, setShowReplies] = useState(false);

  const toggleReplies = async () => {
    if (!showReplies && comment.replies_count > 0) {
      await onLoadReplies(comment.id);
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
            alt={comment.author.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
        )}

        {/* Comment Content */}
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900">
                {comment.author.full_name || comment.author.username}
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
              onClick={() => onLikeComment(comment.id)}
              className="flex items-center text-gray-500 hover:text-red-500 transition"
            >
              <Heart className="w-4 h-4 mr-1" />
              <span>{comment.likes_count > 0 && comment.likes_count}</span>
            </button>

            {!isReply && comment.level < 2 && (
              <button
                onClick={() => onSetReplyTo(comment.id)}
                className="flex items-center text-gray-500 hover:text-blue-500 transition"
              >
                <CornerDownRight className="w-4 h-4 mr-1" />
                Trả lời
              </button>
            )}

            {comment.replies_count > 0 && (
              <button
                onClick={toggleReplies}
                className="text-blue-600 hover:text-blue-700 font-medium"
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
                  onChange={(e) => onSetReplyContent(e.target.value)}
                  placeholder="Viết phản hồi..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      onPostReply(comment.id);
                    }
                  }}
                />
                <button
                  onClick={() => onPostReply(comment.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onSetReplyTo(null);
                    onSetReplyContent("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          )}

          {/* Nested Replies */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply: Comment) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  isReply={true}
                  replyTo={replyTo}
                  replyContent={replyContent}
                  onSetReplyTo={onSetReplyTo}
                  onSetReplyContent={onSetReplyContent}
                  onPostReply={onPostReply}
                  onLoadReplies={onLoadReplies}
                  onLikeComment={onLikeComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CommentCard;
