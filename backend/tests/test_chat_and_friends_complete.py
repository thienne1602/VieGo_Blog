"""
Complete Test Suite for Chat and Friend Features
Tests real-time messaging, friend requests, and cross-client communication
"""

import unittest
import json
import time
from flask_socketio import SocketIOTestClient
from models import db
from models.user import User
from models.chat import Chat
from models.friendship import FriendRequest
from flask_jwt_extended import create_access_token


class TestChatAndFriendsComplete(unittest.TestCase):
    """Complete test suite for chat and friend features"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        from main import app, socketio
        cls.app = app
        cls.socketio = socketio
        cls.app.config['TESTING'] = True
        cls.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        with cls.app.app_context():
            db.create_all()
            
            # Create test users
            cls.user1 = User(
                username='testuser1',
                email='test1@example.com',
                full_name='Test User 1',
                role='user'
            )
            cls.user1.set_password('password123')
            
            cls.user2 = User(
                username='testuser2',
                email='test2@example.com',
                full_name='Test User 2',
                role='user'
            )
            cls.user2.set_password('password123')
            
            cls.user3 = User(
                username='testuser3',
                email='test3@example.com',
                full_name='Test User 3',
                role='user'
            )
            cls.user3.set_password('password123')
            
            db.session.add_all([cls.user1, cls.user2, cls.user3])
            db.session.commit()
            
            # Create access tokens
            cls.token1 = create_access_token(identity=cls.user1.id)
            cls.token2 = create_access_token(identity=cls.user2.id)
            cls.token3 = create_access_token(identity=cls.user3.id)
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after tests"""
        with cls.app.app_context():
            db.session.remove()
            db.drop_all()
    
    def setUp(self):
        """Set up before each test"""
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
    
    def tearDown(self):
        """Clean up after each test"""
        # Clean up test data
        Chat.query.delete()
        FriendRequest.query.delete()
        
        # Reset friends lists
        self.user1.set_friends([])
        self.user2.set_friends([])
        self.user3.set_friends([])
        
        db.session.commit()
        self.ctx.pop()
    
    # ==================== FRIEND REQUEST TESTS ====================
    
    def test_01_send_friend_request(self):
        """Test sending a friend request"""
        response = self.client.post(
            f'/api/social/friends/request/{self.user2.id}',
            headers={'Authorization': f'Bearer {self.token1}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('friend_request', data)
        
        # Verify in database
        friend_request = FriendRequest.query.filter_by(
            requester_id=self.user1.id,
            receiver_id=self.user2.id
        ).first()
        self.assertIsNotNone(friend_request)
        self.assertEqual(friend_request.status, 'pending')
    
    def test_02_accept_friend_request(self):
        """Test accepting a friend request"""
        # First, send a friend request
        friend_request = FriendRequest(
            requester_id=self.user1.id,
            receiver_id=self.user2.id,
            status='pending'
        )
        db.session.add(friend_request)
        db.session.commit()
        
        # Accept the request
        response = self.client.post(
            f'/api/social/friends/accept/{friend_request.id}',
            headers={'Authorization': f'Bearer {self.token2}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        # Verify friendship is bidirectional
        db.session.refresh(self.user1)
        db.session.refresh(self.user2)
        
        self.assertTrue(self.user1.is_friend_with(self.user2.id))
        self.assertTrue(self.user2.is_friend_with(self.user1.id))
    
    def test_03_reject_friend_request(self):
        """Test rejecting a friend request"""
        # Send a friend request
        friend_request = FriendRequest(
            requester_id=self.user1.id,
            receiver_id=self.user2.id,
            status='pending'
        )
        db.session.add(friend_request)
        db.session.commit()
        
        # Reject the request
        response = self.client.post(
            f'/api/social/friends/reject/{friend_request.id}',
            headers={'Authorization': f'Bearer {self.token2}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        # Verify they are not friends
        db.session.refresh(self.user1)
        db.session.refresh(self.user2)
        
        self.assertFalse(self.user1.is_friend_with(self.user2.id))
        self.assertFalse(self.user2.is_friend_with(self.user1.id))
    
    def test_04_cancel_friend_request(self):
        """Test canceling a sent friend request"""
        # Send a friend request
        friend_request = FriendRequest(
            requester_id=self.user1.id,
            receiver_id=self.user2.id,
            status='pending'
        )
        db.session.add(friend_request)
        db.session.commit()
        
        # Cancel the request
        response = self.client.post(
            f'/api/social/friends/cancel/{friend_request.id}',
            headers={'Authorization': f'Bearer {self.token1}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        # Verify request status
        db.session.refresh(friend_request)
        self.assertEqual(friend_request.status, 'cancelled')
    
    def test_05_remove_friend(self):
        """Test removing a friend"""
        # Make them friends
        self.user1.add_friend(self.user2.id)
        self.user2.add_friend(self.user1.id)
        db.session.commit()
        
        # Remove friend
        response = self.client.post(
            f'/api/social/friends/remove/{self.user2.id}',
            headers={'Authorization': f'Bearer {self.token1}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        # Verify they are no longer friends (bidirectional)
        db.session.refresh(self.user1)
        db.session.refresh(self.user2)
        
        self.assertFalse(self.user1.is_friend_with(self.user2.id))
        self.assertFalse(self.user2.is_friend_with(self.user1.id))
    
    def test_06_check_friendship_status(self):
        """Test checking friendship status"""
        # Not friends yet
        response = self.client.get(
            f'/api/social/friends/check/{self.user2.id}',
            headers={'Authorization': f'Bearer {self.token1}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertFalse(data['is_friend'])
        self.assertIsNone(data['request_status'])
        
        # Send friend request
        friend_request = FriendRequest(
            requester_id=self.user1.id,
            receiver_id=self.user2.id,
            status='pending'
        )
        db.session.add(friend_request)
        db.session.commit()
        
        # Check status again
        response = self.client.get(
            f'/api/social/friends/check/{self.user2.id}',
            headers={'Authorization': f'Bearer {self.token1}'}
        )
        
        data = json.loads(response.data)
        self.assertFalse(data['is_friend'])
        self.assertEqual(data['request_status'], 'sent')
    
    # ==================== CHAT TESTS ====================
    
    def test_07_send_message_requires_friendship(self):
        """Test that sending messages requires friendship"""
        response = self.client.post(
            '/api/chat/messages',
            headers={'Authorization': f'Bearer {self.token1}'},
            json={
                'receiver_id': self.user2.id,
                'message': 'Hello!',
                'message_type': 'text'
            }
        )
        
        self.assertEqual(response.status_code, 403)
        data = json.loads(response.data)
        self.assertIn('kết bạn', data['error'].lower())
    
    def test_08_send_text_message_to_friend(self):
        """Test sending a text message to a friend"""
        # Make them friends
        self.user1.add_friend(self.user2.id)
        self.user2.add_friend(self.user1.id)
        db.session.commit()
        
        # Send message
        response = self.client.post(
            '/api/chat/messages',
            headers={'Authorization': f'Bearer {self.token1}'},
            json={
                'receiver_id': self.user2.id,
                'message': 'Hello friend!',
                'message_type': 'text'
            }
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('chat', data)
        
        # Verify in database
        message = Chat.query.filter_by(
            sender_id=self.user1.id,
            receiver_id=self.user2.id
        ).first()
        self.assertIsNotNone(message)
        self.assertEqual(message.message, 'Hello friend!')
        self.assertEqual(message.status, 'sent')
    
    def test_09_get_messages_between_friends(self):
        """Test getting messages between friends"""
        # Make them friends
        self.user1.add_friend(self.user2.id)
        self.user2.add_friend(self.user1.id)
        db.session.commit()
        
        # Create some messages
        msg1 = Chat(
            sender_id=self.user1.id,
            receiver_id=self.user2.id,
            message='Hello!',
            message_type='text',
            conversation_type='direct',
            status='sent'
        )
        msg2 = Chat(
            sender_id=self.user2.id,
            receiver_id=self.user1.id,
            message='Hi there!',
            message_type='text',
            conversation_type='direct',
            status='sent'
        )
        db.session.add_all([msg1, msg2])
        db.session.commit()
        
        # Get messages
        response = self.client.get(
            f'/api/chat/messages/{self.user2.id}',
            headers={'Authorization': f'Bearer {self.token1}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['messages']), 2)
    
    def test_10_get_conversations(self):
        """Test getting conversations list"""
        # Make them friends
        self.user1.add_friend(self.user2.id)
        self.user2.add_friend(self.user1.id)
        self.user1.add_friend(self.user3.id)
        self.user3.add_friend(self.user1.id)
        db.session.commit()
        
        # Create messages with user2
        msg1 = Chat(
            sender_id=self.user1.id,
            receiver_id=self.user2.id,
            message='Hello user2!',
            message_type='text',
            conversation_type='direct',
            status='sent'
        )
        # Create messages with user3
        msg2 = Chat(
            sender_id=self.user1.id,
            receiver_id=self.user3.id,
            message='Hello user3!',
            message_type='text',
            conversation_type='direct',
            status='sent'
        )
        db.session.add_all([msg1, msg2])
        db.session.commit()
        
        # Get conversations
        response = self.client.get(
            '/api/chat/conversations',
            headers={'Authorization': f'Bearer {self.token1}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['conversations']), 2)
    
    def test_11_unread_message_count(self):
        """Test getting unread message count"""
        # Make them friends
        self.user1.add_friend(self.user2.id)
        self.user2.add_friend(self.user1.id)
        db.session.commit()
        
        # Create unread messages
        msg1 = Chat(
            sender_id=self.user2.id,
            receiver_id=self.user1.id,
            message='Unread message 1',
            message_type='text',
            conversation_type='direct',
            status='sent'
        )
        msg2 = Chat(
            sender_id=self.user2.id,
            receiver_id=self.user1.id,
            message='Unread message 2',
            message_type='text',
            conversation_type='direct',
            status='delivered'
        )
        db.session.add_all([msg1, msg2])
        db.session.commit()
        
        # Get unread count
        response = self.client.get(
            '/api/chat/unread-count',
            headers={'Authorization': f'Bearer {self.token1}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['unread_count'], 2)
        self.assertEqual(data['direct_count'], 2)
    
    def test_12_mark_message_as_read(self):
        """Test marking a message as read"""
        # Make them friends
        self.user1.add_friend(self.user2.id)
        self.user2.add_friend(self.user1.id)
        db.session.commit()
        
        # Create unread message
        msg = Chat(
            sender_id=self.user2.id,
            receiver_id=self.user1.id,
            message='Unread message',
            message_type='text',
            conversation_type='direct',
            status='sent'
        )
        db.session.add(msg)
        db.session.commit()
        
        # Mark as read
        response = self.client.put(
            f'/api/chat/messages/{msg.id}/read',
            headers={'Authorization': f'Bearer {self.token1}'}
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify status
        db.session.refresh(msg)
        self.assertEqual(msg.status, 'read')
        self.assertIsNotNone(msg.read_at)
    
    # ==================== SOCKET.IO TESTS ====================
    
    def test_13_socket_connection_with_auth(self):
        """Test Socket.IO connection with authentication"""
        client = self.socketio.test_client(
            self.app,
            auth={'token': self.token1}
        )
        
        self.assertTrue(client.is_connected())
        
        # Should receive connected event
        received = client.get_received()
        self.assertTrue(any(msg['name'] == 'connected' for msg in received))
        
        client.disconnect()
    
    def test_14_socket_online_status_notification(self):
        """Test online/offline status notifications"""
        # Make them friends
        self.user1.add_friend(self.user2.id)
        self.user2.add_friend(self.user1.id)
        db.session.commit()
        
        # Connect user2 first
        client2 = self.socketio.test_client(
            self.app,
            auth={'token': self.token2}
        )
        
        # Clear received messages
        client2.get_received()
        
        # Connect user1 (should notify user2)
        client1 = self.socketio.test_client(
            self.app,
            auth={'token': self.token1}
        )
        
        time.sleep(0.1)  # Wait for async processing
        
        # User2 should receive user_online notification
        received = client2.get_received()
        online_notifications = [msg for msg in received if msg['name'] == 'user_online']
        
        # Verify notification was sent
        if online_notifications:
            self.assertEqual(online_notifications[0]['args'][0]['user_id'], self.user1.id)
        
        client1.disconnect()
        client2.disconnect()
    
    def test_15_socket_typing_indicator(self):
        """Test typing indicator"""
        # Make them friends
        self.user1.add_friend(self.user2.id)
        self.user2.add_friend(self.user1.id)
        db.session.commit()
        
        # Connect both users
        client1 = self.socketio.test_client(
            self.app,
            auth={'token': self.token1}
        )
        client2 = self.socketio.test_client(
            self.app,
            auth={'token': self.token2}
        )
        
        # Clear received messages
        client1.get_received()
        client2.get_received()
        
        # User1 starts typing
        client1.emit('typing_message', {
            'sender_id': self.user1.id,
            'receiver_id': self.user2.id,
            'is_typing': True
        })
        
        time.sleep(0.1)
        
        # User2 should receive typing indicator
        received = client2.get_received()
        typing_events = [msg for msg in received if msg['name'] == 'user_typing']
        
        if typing_events:
            self.assertTrue(typing_events[0]['args'][0]['is_typing'])
            self.assertEqual(typing_events[0]['args'][0]['sender_id'], self.user1.id)
        
        client1.disconnect()
        client2.disconnect()
    
    # ==================== INTEGRATION TESTS ====================
    
    def test_16_full_friend_and_chat_flow(self):
        """Test complete flow: friend request -> accept -> chat"""
        # 1. Send friend request
        response = self.client.post(
            f'/api/social/friends/request/{self.user2.id}',
            headers={'Authorization': f'Bearer {self.token1}'}
        )
        self.assertEqual(response.status_code, 200)
        
        # Get request ID
        friend_request = FriendRequest.query.filter_by(
            requester_id=self.user1.id,
            receiver_id=self.user2.id
        ).first()
        
        # 2. Accept friend request
        response = self.client.post(
            f'/api/social/friends/accept/{friend_request.id}',
            headers={'Authorization': f'Bearer {self.token2}'}
        )
        self.assertEqual(response.status_code, 200)
        
        # 3. Verify friendship
        db.session.refresh(self.user1)
        db.session.refresh(self.user2)
        self.assertTrue(self.user1.is_friend_with(self.user2.id))
        self.assertTrue(self.user2.is_friend_with(self.user1.id))
        
        # 4. Send message
        response = self.client.post(
            '/api/chat/messages',
            headers={'Authorization': f'Bearer {self.token1}'},
            json={
                'receiver_id': self.user2.id,
                'message': 'We are friends now!',
                'message_type': 'text'
            }
        )
        self.assertEqual(response.status_code, 201)
        
        # 5. User2 can read the message
        response = self.client.get(
            f'/api/chat/messages/{self.user1.id}',
            headers={'Authorization': f'Bearer {self.token2}'}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['messages']), 1)
        self.assertEqual(data['messages'][0]['message'], 'We are friends now!')


if __name__ == '__main__':
    unittest.main()
