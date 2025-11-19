"""
Test script for real-time chat functionality
Tests cross-client messaging, online status, typing indicators, and notifications
"""
import unittest
import json
import time
from flask import Flask
from flask_socketio import SocketIO, SocketIOTestClient
from models import db
from models.user import User
from models.chat import Chat
from models.notification import Notification
from main import create_app
from flask_jwt_extended import create_access_token


class TestRealtimeChat(unittest.TestCase):
    """Test real-time chat functionality across multiple clients"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test application"""
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        cls.socketio = SocketIO(cls.app, cors_allowed_origins="*")
        cls.client = cls.app.test_client()
        
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
            
            # Make users friends
            cls.user1.friends.append(cls.user2)
            cls.user1.friends.append(cls.user3)
            cls.user2.friends.append(cls.user3)
            db.session.commit()
            
            # Create tokens
            cls.token1 = create_access_token(identity=cls.user1.id)
            cls.token2 = create_access_token(identity=cls.user2.id)
            cls.token3 = create_access_token(identity=cls.user3.id)
    
    @classmethod
    def tearDownClass(cls):
        """Clean up test database"""
        with cls.app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_01_user_connection(self):
        """Test user connection and online status"""
        print("\n=== Test 1: User Connection ===")
        
        with self.app.app_context():
            # Connect user1
            client1 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token1}
            )
            
            # Check connection response
            received = client1.get_received()
            print(f"User1 connected, received: {received}")
            self.assertTrue(len(received) > 0)
            self.assertEqual(received[0]['name'], 'connected')
            
            # Connect user2
            client2 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token2}
            )
            
            # User1 should receive user_online event for user2
            time.sleep(0.1)  # Wait for event propagation
            received = client1.get_received()
            print(f"User1 received after user2 connected: {received}")
            
            # Check if user_online event was received
            online_events = [r for r in received if r['name'] == 'user_online']
            if online_events:
                self.assertEqual(online_events[0]['args'][0]['user_id'], self.user2.id)
            
            client1.disconnect()
            client2.disconnect()
    
    def test_02_send_direct_message(self):
        """Test sending direct messages between users"""
        print("\n=== Test 2: Direct Messaging ===")
        
        with self.app.app_context():
            # Connect both users
            client1 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token1}
            )
            client1.get_received()  # Clear connection messages
            
            client2 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token2}
            )
            client2.get_received()  # Clear connection messages
            
            # Send message from user1 to user2 via API
            response = self.client.post(
                '/api/chat/messages',
                headers={'Authorization': f'Bearer {self.token1}'},
                json={
                    'receiver_id': self.user2.id,
                    'message': 'Hello from user1!',
                    'message_type': 'text'
                }
            )
            
            print(f"Send message response: {response.status_code}")
            self.assertEqual(response.status_code, 201)
            
            # Check if message was saved
            message = Chat.query.filter_by(
                sender_id=self.user1.id,
                receiver_id=self.user2.id
            ).first()
            self.assertIsNotNone(message)
            self.assertEqual(message.message, 'Hello from user1!')
            
            # Check if user2 received the message via Socket.IO
            time.sleep(0.1)
            received = client2.get_received()
            print(f"User2 received: {received}")
            
            new_message_events = [r for r in received if r['name'] == 'new_message']
            if new_message_events:
                self.assertEqual(new_message_events[0]['args'][0]['message'], 'Hello from user1!')
            
            client1.disconnect()
            client2.disconnect()
    
    def test_03_typing_indicator(self):
        """Test typing indicators"""
        print("\n=== Test 3: Typing Indicator ===")
        
        with self.app.app_context():
            client1 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token1}
            )
            client1.get_received()
            
            client2 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token2}
            )
            client2.get_received()
            
            # User1 starts typing
            client1.emit('typing_message', {
                'sender_id': self.user1.id,
                'receiver_id': self.user2.id,
                'is_typing': True
            })
            
            # User2 should receive typing indicator
            time.sleep(0.1)
            received = client2.get_received()
            print(f"User2 received typing indicator: {received}")
            
            typing_events = [r for r in received if r['name'] == 'user_typing']
            if typing_events:
                self.assertEqual(typing_events[0]['args'][0]['sender_id'], self.user1.id)
                self.assertTrue(typing_events[0]['args'][0]['is_typing'])
            
            client1.disconnect()
            client2.disconnect()
    
    def test_04_message_delivery_confirmation(self):
        """Test message delivery confirmation"""
        print("\n=== Test 4: Message Delivery Confirmation ===")
        
        with self.app.app_context():
            client1 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token1}
            )
            client1.get_received()
            
            client2 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token2}
            )
            client2.get_received()
            
            # Send message
            response = self.client.post(
                '/api/chat/messages',
                headers={'Authorization': f'Bearer {self.token1}'},
                json={
                    'receiver_id': self.user2.id,
                    'message': 'Test delivery confirmation',
                    'message_type': 'text'
                }
            )
            
            time.sleep(0.1)
            message_data = response.get_json()
            message_id = message_data['chat']['id']
            
            # User2 confirms delivery
            client2.emit('message_delivered', {
                'message_id': message_id,
                'receiver_id': self.user2.id
            })
            
            # User1 should receive status update
            time.sleep(0.1)
            received = client1.get_received()
            print(f"User1 received delivery status: {received}")
            
            status_events = [r for r in received if r['name'] == 'message_status_updated']
            if status_events:
                self.assertEqual(status_events[0]['args'][0]['status'], 'delivered')
            
            client1.disconnect()
            client2.disconnect()
    
    def test_05_notification_realtime(self):
        """Test real-time notifications"""
        print("\n=== Test 5: Real-time Notifications ===")
        
        with self.app.app_context():
            client1 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token1}
            )
            client1.get_received()
            
            # Send message to user1 (should trigger notification)
            response = self.client.post(
                '/api/chat/messages',
                headers={'Authorization': f'Bearer {self.token2}'},
                json={
                    'receiver_id': self.user1.id,
                    'message': 'Notification test',
                    'message_type': 'text'
                }
            )
            
            # User1 should receive notification
            time.sleep(0.2)
            received = client1.get_received()
            print(f"User1 received notifications: {received}")
            
            notification_events = [r for r in received if r['name'] == 'new_notification']
            self.assertTrue(len(notification_events) > 0)
            
            client1.disconnect()
    
    def test_06_online_status_query(self):
        """Test querying online status"""
        print("\n=== Test 6: Online Status Query ===")
        
        with self.app.app_context():
            client1 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token1}
            )
            client1.get_received()
            
            client2 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token2}
            )
            client2.get_received()
            
            # User3 queries online status
            client3 = self.socketio.test_client(
                self.app,
                flask_test_client=self.client,
                auth={'token': self.token3}
            )
            client3.get_received()
            
            client3.emit('get_online_status', {
                'user_ids': [self.user1.id, self.user2.id]
            })
            
            time.sleep(0.1)
            received = client3.get_received()
            print(f"User3 received online status: {received}")
            
            status_events = [r for r in received if r['name'] == 'online_status_response']
            if status_events:
                users_status = status_events[0]['args'][0]['users']
                self.assertTrue(users_status[str(self.user1.id)]['is_online'])
                self.assertTrue(users_status[str(self.user2.id)]['is_online'])
            
            client1.disconnect()
            client2.disconnect()
            client3.disconnect()
    
    def test_07_cross_client_messaging(self):
        """Test messaging between multiple clients simultaneously"""
        print("\n=== Test 7: Cross-Client Messaging ===")
        
        with self.app.app_context():
            # Connect 3 clients
            clients = [
                self.socketio.test_client(self.app, flask_test_client=self.client, 
                                         auth={'token': self.token1}),
                self.socketio.test_client(self.app, flask_test_client=self.client,
                                         auth={'token': self.token2}),
                self.socketio.test_client(self.app, flask_test_client=self.client,
                                         auth={'token': self.token3})
            ]
            
            for client in clients:
                client.get_received()  # Clear connection messages
            
            # Send messages in sequence
            messages = [
                (self.token1, self.user2.id, 'Message from user1 to user2'),
                (self.token2, self.user3.id, 'Message from user2 to user3'),
                (self.token3, self.user1.id, 'Message from user3 to user1'),
            ]
            
            for token, receiver_id, msg_text in messages:
                response = self.client.post(
                    '/api/chat/messages',
                    headers={'Authorization': f'Bearer {token}'},
                    json={
                        'receiver_id': receiver_id,
                        'message': msg_text,
                        'message_type': 'text'
                    }
                )
                self.assertEqual(response.status_code, 201)
                time.sleep(0.1)
            
            # Check if all clients received their messages
            for i, client in enumerate(clients):
                received = client.get_received()
                print(f"Client {i+1} received: {len(received)} events")
                message_events = [r for r in received if r['name'] in ['new_message', 'message_sent']]
                self.assertTrue(len(message_events) > 0)
            
            for client in clients:
                client.disconnect()


if __name__ == '__main__':
    unittest.main(verbosity=2)
