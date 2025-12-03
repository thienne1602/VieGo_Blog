"""Quick script to check friendship status between users"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from models import db
from models.user import User
from models.friendship import FriendRequest

with app.app_context():
    # Check users 11 and 13
    user11 = User.query.get(11)
    user13 = User.query.get(13)

    if user11:
        print(f"User 11 ({user11.username}):")
        print(f"  Friends: {user11.get_friends()}")
        print(f"  Is friend with 13: {user11.is_friend_with(13)}")
    else:
        print("User 11 not found")

    if user13:
        print(f"\nUser 13 ({user13.username}):")
        print(f"  Friends: {user13.get_friends()}")
        print(f"  Is friend with 11: {user13.is_friend_with(11)}")
    else:
        print("User 13 not found")

    # Check friend requests
    fr = FriendRequest.query.filter(
        ((FriendRequest.requester_id == 11) & (FriendRequest.receiver_id == 13)) |
        ((FriendRequest.requester_id == 13) & (FriendRequest.receiver_id == 11))
    ).all()

    print(f"\nFriend requests between 11 and 13:")
    for r in fr:
        print(f"  ID: {r.id}, From: {r.requester_id}, To: {r.receiver_id}, Status: {r.status}")
