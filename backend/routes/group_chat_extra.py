from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db
from models.chat import Chat
from models.group_chat import GroupChat, GroupMember
from models.notification import Notification
from models.user import User


def register_extra_group_routes(chat_bp):
    """
    Register additional group chat routes on existing Blueprint.
    This is split out to keep the main chat.py file smaller.
    """

    @chat_bp.route("/groups/<room_id>", methods=["DELETE"])
    @jwt_required()
    def disband_group(room_id):
        """Disband a group chat (admin/creator only)."""
        try:
            current_user_id = get_jwt_identity()

            group = GroupChat.query.filter_by(room_id=room_id).first()
            if not group:
                return jsonify({"error": "Không tìm thấy nhóm"}), 404

            # Only creator/admin can disband group
            creator_id = group.created_by
            admin_member = GroupMember.query.filter_by(
                group_id=group.id, user_id=current_user_id, role="admin"
            ).first()

            if current_user_id != creator_id and not admin_member:
                return (
                    jsonify(
                        {
                            "error": "Chỉ quản trị viên hoặc người tạo nhóm mới có thể giải tán nhóm"
                        }
                    ),
                    403,
                )

            # Collect member IDs before delete (for notifications)
            members = GroupMember.query.filter_by(group_id=group.id).all()
            member_ids = [m.user_id for m in members]

            # Delete group messages
            messages = Chat.query.filter(
                Chat.room_id == room_id, Chat.conversation_type == "group"
            ).all()
            deleted_messages = len(messages)
            for msg in messages:
                db.session.delete(msg)

            # Delete group members (relationship cascade will also handle this, but explicit for clarity)
            for m in members:
                db.session.delete(m)

            # Delete group itself
            db.session.delete(group)

            # Delete related notifications
            notifications = Notification.query.filter(
                Notification.type == "message",
                Notification.related_type == "group_chat",
                Notification.related_id == group.id,
            ).all()
            deleted_notifications = len(notifications)
            for n in notifications:
                db.session.delete(n)

            db.session.commit()

            current_app.logger.info(
                f"[GroupChat] Group {room_id} disbanded by user {current_user_id}: "
                f"{deleted_messages} messages, {deleted_notifications} notifications removed"
            )

            return (
                jsonify(
                    {
                        "message": "Giải tán nhóm thành công",
                        "deleted_messages": deleted_messages,
                        "deleted_notifications": deleted_notifications,
                        "member_ids": member_ids,
                    }
                ),
                200,
            )
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(
                f"Error disbanding group {room_id}: {str(e)}", exc_info=True
            )
            return jsonify({"error": f"Lỗi khi giải tán nhóm: {str(e)}"}), 500

    @chat_bp.route("/groups/<room_id>/members/<int:user_id>", methods=["DELETE"])
    @jwt_required()
    def remove_group_member(room_id, user_id):
        """
        Remove a member from a group.
        - Admin can remove any member (except possibly themselves).
        - A member can remove themselves (leave group).
        """
        try:
            current_user_id = get_jwt_identity()

            group = GroupChat.query.filter_by(room_id=room_id).first()
            if not group:
                return jsonify({"error": "Không tìm thấy nhóm"}), 404

            # Check membership for current user
            current_member = GroupMember.query.filter_by(
                group_id=group.id, user_id=current_user_id
            ).first()
            if not current_member:
                return jsonify({"error": "Bạn không phải thành viên của nhóm này"}), 403

            # Member to remove
            member = GroupMember.query.filter_by(
                group_id=group.id, user_id=user_id
            ).first()
            if not member:
                return jsonify({"error": "Thành viên không tồn tại trong nhóm"}), 404

            # Permission rules:
            # - If removing someone else: current user must be admin
            # - Anyone can remove themselves
            if user_id != current_user_id and current_member.role != "admin":
                return (
                    jsonify(
                        {
                            "error": "Chỉ quản trị viên mới có thể xóa thành viên khác khỏi nhóm"
                        }
                    ),
                    403,
                )

            # Prevent removing the last admin if there are other members left
            if member.role == "admin":
                other_admins = GroupMember.query.filter(
                    GroupMember.group_id == group.id,
                    GroupMember.user_id != user_id,
                    GroupMember.role == "admin",
                ).all()
                other_members = GroupMember.query.filter(
                    GroupMember.group_id == group.id,
                    GroupMember.user_id != user_id,
                ).all()
                if other_members and not other_admins:
                    return (
                        jsonify(
                            {
                                "error": "Không thể xóa quản trị viên cuối cùng khi nhóm vẫn còn thành viên"
                            }
                        ),
                        400,
                    )

            # Get user objects for message/notification
            actor = User.query.get(current_user_id)
            target_user = User.query.get(user_id)

            # Create system message
            if actor and target_user:
                from datetime import datetime

                system_text = (
                    f"{actor.full_name or actor.username} đã rời nhóm"
                    if current_user_id == user_id
                    else f"{actor.full_name or actor.username} đã xóa "
                    f"{target_user.full_name or target_user.username} khỏi nhóm"
                )
                sys_msg = Chat(
                    message=system_text,
                    message_type="system",
                    sender_id=current_user_id,
                    room_id=room_id,
                    conversation_type="group",
                    status="sent",
                )
                db.session.add(sys_msg)

                # Update group updated_at
                group.updated_at = datetime.utcnow()

            # Remove member
            db.session.delete(member)
            db.session.commit()

            current_app.logger.info(
                f"[GroupChat] User {user_id} removed from group {room_id} by {current_user_id}"
            )

            return (
                jsonify(
                    {
                        "message": "Đã xóa thành viên khỏi nhóm"  # or "Đã rời nhóm" if self
                    }
                ),
                200,
            )
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(
                f"Error removing member {user_id} from group {room_id}: {str(e)}",
                exc_info=True,
            )
            return jsonify({"error": f"Lỗi xóa thành viên: {str(e)}"}), 500


