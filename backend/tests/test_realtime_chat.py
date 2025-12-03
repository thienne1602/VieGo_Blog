"""
Real-time Chat Test Script
Simulates two users chatting with each other in real-time using Socket.IO
Run this script to test cross-client messaging
"""

import socketio
import time
import threading
import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = 'http://localhost:5000'
SOCKET_URL = 'http://localhost:5000'

# Test users credentials
USER1 = {
    'username': 'testuser1',
    'email': 'test1@example.com',
    'password': 'password123',
    'full_name': 'Test User 1'
}

USER2 = {
    'username': 'testuser2', 
    'email': 'test2@example.com',
    'password': 'password123',
    'full_name': 'Test User 2'
}

class ChatClient:
    """Socket.IO chat client for testing"""
    
    def __init__(self, name, credentials):
        self.name = name
        self.credentials = credentials
        self.token = None
        self.user_id = None
        self.sio = socketio.Client(logger=False, engineio_logger=False)
        self.messages_received = []
        self.typing_events = []
        self.online_events = []
        
        # Register event handlers
        self.sio.on('connected', self.on_connected)
        self.sio.on('new_message', self.on_new_message)
        self.sio.on('message_sent', self.on_message_sent)
        self.sio.on('user_typing', self.on_user_typing)
        self.sio.on('user_online', self.on_user_online)
        self.sio.on('user_offline', self.on_user_offline)
        self.sio.on('message_status_updated', self.on_message_status_updated)
        self.sio.on('friend_request_received', self.on_friend_request_received)
        self.sio.on('error', self.on_error)
    
    def login(self):
        """Login and get access token"""
        print(f"[{self.name}] Logging in...")
        
        response = requests.post(
            f'{API_BASE_URL}/api/auth/login',
            json={
                'email': self.credentials['email'],
                'password': self.credentials['password']
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access_token']
            self.user_id = data['user']['id']
            print(f"[{self.name}] ✓ Logged in successfully (User ID: {self.user_id})")
            return True
        else:
            print(f"[{self.name}] ✗ Login failed: {response.text}")
            return False
    
    def connect_socket(self):
        """Connect to Socket.IO server"""
        print(f"[{self.name}] Connecting to Socket.IO...")
        
        try:
            self.sio.connect(
                SOCKET_URL,
                auth={'token': self.token},
                wait_timeout=10
            )
            print(f"[{self.name}] ✓ Socket.IO connected")
            return True
        except Exception as e:
            print(f"[{self.name}] ✗ Socket.IO connection failed: {e}")
            return False
    
    def disconnect_socket(self):
        """Disconnect from Socket.IO server"""
        if self.sio.connected:
            self.sio.disconnect()
            print(f"[{self.name}] Disconnected from Socket.IO")
    
    def send_friend_request(self, target_user_id):
        """Send friend request via API"""
        print(f"[{self.name}] Sending friend request to user {target_user_id}...")
        
        response = requests.post(
            f'{API_BASE_URL}/api/social/friends/request/{target_user_id}',
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if response.status_code == 200:
            print(f"[{self.name}] ✓ Friend request sent")
            return True
        else:
            print(f"[{self.name}] ✗ Failed to send friend request: {response.text}")
            return False
    
    def accept_friend_request(self, request_id):
        """Accept friend request via API"""
        print(f"[{self.name}] Accepting friend request {request_id}...")
        
        response = requests.post(
            f'{API_BASE_URL}/api/social/friends/accept/{request_id}',
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if response.status_code == 200:
            print(f"[{self.name}] ✓ Friend request accepted")
            return True
        else:
            print(f"[{self.name}] ✗ Failed to accept friend request: {response.text}")
            return False
    
    def get_pending_friend_requests(self):
        """Get pending friend requests"""
        response = requests.get(
            f'{API_BASE_URL}/api/social/friends/requests',
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('received_requests', [])
        return []
    
    def send_message(self, receiver_id, message):
        """Send message via API"""
        print(f"[{self.name}] Sending message: '{message}' to user {receiver_id}")
        
        response = requests.post(
            f'{API_BASE_URL}/api/chat/messages',
            headers={'Authorization': f'Bearer {self.token}'},
            json={
                'receiver_id': receiver_id,
                'message': message,
                'message_type': 'text'
            }
        )
        
        if response.status_code == 201:
            print(f"[{self.name}] ✓ Message sent")
            return True
        else:
            print(f"[{self.name}] ✗ Failed to send message: {response.text}")
            return False
    
    def send_typing_indicator(self, receiver_id, is_typing):
        """Send typing indicator via Socket.IO"""
        self.sio.emit('typing_message', {
            'sender_id': self.user_id,
            'receiver_id': receiver_id,
            'is_typing': is_typing
        })
    
    # Event handlers
    def on_connected(self, data):
        print(f"[{self.name}] 🔌 Connected event received: {data}")
    
    def on_new_message(self, data):
        timestamp = datetime.now().strftime('%H:%M:%S')
        sender_name = data.get('sender', {}).get('full_name', 'Unknown')
        message = data.get('message', '')
        print(f"[{self.name}] 💬 [{timestamp}] New message from {sender_name}: {message}")
        self.messages_received.append(data)
    
    def on_message_sent(self, data):
        print(f"[{self.name}] ✓ Message sent confirmation received")
    
    def on_user_typing(self, data):
        sender_name = data.get('sender_name', 'Unknown')
        is_typing = data.get('is_typing', False)
        if is_typing:
            print(f"[{self.name}] ⌨️  {sender_name} is typing...")
        else:
            print(f"[{self.name}] {sender_name} stopped typing")
        self.typing_events.append(data)
    
    def on_user_online(self, data):
        username = data.get('username', 'Unknown')
        print(f"[{self.name}] 🟢 {username} is now online")
        self.online_events.append(('online', data))
    
    def on_user_offline(self, data):
        username = data.get('username', 'Unknown')
        print(f"[{self.name}] 🔴 {username} is now offline")
        self.online_events.append(('offline', data))
    
    def on_message_status_updated(self, data):
        status = data.get('status', 'unknown')
        print(f"[{self.name}] 📝 Message status updated to: {status}")
    
    def on_friend_request_received(self, data):
        requester = data.get('requester', {})
        print(f"[{self.name}] 👋 Friend request received from {requester.get('full_name', 'Unknown')}")
    
    def on_error(self, data):
        print(f"[{self.name}] ❌ Error: {data}")


def run_test_scenario():
    """Run complete test scenario"""
    print("\n" + "="*80)
    print("🚀 STARTING REAL-TIME CHAT TEST")
    print("="*80 + "\n")
    
    # Create clients
    client1 = ChatClient("Client 1", USER1)
    client2 = ChatClient("Client 2", USER2)
    
    try:
        # Step 1: Login both users
        print("\n📝 STEP 1: Login")
        print("-" * 80)
        if not client1.login() or not client2.login():
            print("❌ Login failed")
            return
        
        time.sleep(1)
        
        # Step 2: Connect to Socket.IO
        print("\n🔌 STEP 2: Connect to Socket.IO")
        print("-" * 80)
        if not client1.connect_socket() or not client2.connect_socket():
            print("❌ Socket connection failed")
            return
        
        time.sleep(2)
        
        # Step 3: Send friend request
        print("\n👋 STEP 3: Send Friend Request")
        print("-" * 80)
        if not client1.send_friend_request(client2.user_id):
            print("❌ Failed to send friend request")
            return
        
        time.sleep(2)
        
        # Step 4: Accept friend request
        print("\n✅ STEP 4: Accept Friend Request")
        print("-" * 80)
        pending_requests = client2.get_pending_friend_requests()
        if pending_requests:
            request_id = pending_requests[0]['id']
            if not client2.accept_friend_request(request_id):
                print("❌ Failed to accept friend request")
                return
        else:
            print("❌ No pending friend requests found")
            return
        
        time.sleep(2)
        
        # Step 5: Test typing indicator
        print("\n⌨️  STEP 5: Test Typing Indicator")
        print("-" * 80)
        client1.send_typing_indicator(client2.user_id, True)
        time.sleep(1)
        client1.send_typing_indicator(client2.user_id, False)
        time.sleep(1)
        
        # Step 6: Send messages back and forth
        print("\n💬 STEP 6: Exchange Messages")
        print("-" * 80)
        
        # Client 1 sends message
        client1.send_message(client2.user_id, "Hello! Testing real-time chat!")
        time.sleep(2)
        
        # Client 2 replies
        client2.send_typing_indicator(client1.user_id, True)
        time.sleep(1)
        client2.send_typing_indicator(client1.user_id, False)
        client2.send_message(client1.user_id, "Hi! I received your message!")
        time.sleep(2)
        
        # Client 1 sends another message
        client1.send_message(client2.user_id, "Great! The chat system is working!")
        time.sleep(2)
        
        # Step 7: Verify results
        print("\n📊 STEP 7: Verify Results")
        print("-" * 80)
        print(f"[Client 1] Messages received: {len(client1.messages_received)}")
        print(f"[Client 1] Typing events received: {len(client1.typing_events)}")
        print(f"[Client 2] Messages received: {len(client2.messages_received)}")
        print(f"[Client 2] Typing events received: {len(client2.typing_events)}")
        
        # Step 8: Test disconnect/reconnect
        print("\n🔄 STEP 8: Test Disconnect/Reconnect")
        print("-" * 80)
        client1.disconnect_socket()
        time.sleep(2)
        print(f"[Client 2] Should see Client 1 offline event")
        time.sleep(1)
        
        client1.connect_socket()
        time.sleep(2)
        print(f"[Client 2] Should see Client 1 online event")
        time.sleep(1)
        
        # Final summary
        print("\n" + "="*80)
        print("✅ TEST COMPLETED SUCCESSFULLY!")
        print("="*80)
        print(f"\n📈 Summary:")
        print(f"  • Client 1 received {len(client1.messages_received)} messages")
        print(f"  • Client 2 received {len(client2.messages_received)} messages")
        print(f"  • Client 1 saw {len(client1.typing_events)} typing events")
        print(f"  • Client 2 saw {len(client2.typing_events)} typing events")
        print(f"  • Client 1 saw {len([e for e in client1.online_events if e[0] == 'online'])} online events")
        print(f"  • Client 2 saw {len([e for e in client2.online_events if e[0] == 'online'])} online events")
        print()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        print("\n🧹 Cleaning up...")
        client1.disconnect_socket()
        client2.disconnect_socket()
        print("✓ Cleanup complete\n")


if __name__ == '__main__':
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                   REAL-TIME CHAT TESTING SCRIPT                              ║
║                                                                              ║
║  This script tests the complete chat and friend request functionality       ║
║  including real-time messaging between two different clients.               ║
║                                                                              ║
║  Requirements:                                                               ║
║    • Backend server must be running on http://localhost:5000                ║
║    • Test users must exist in the database                                  ║
║    • Socket.IO must be properly configured                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    # Check if server is running
    try:
        response = requests.get(f'{API_BASE_URL}/api/health', timeout=5)
        print("✓ Server is running\n")
    except:
        print("❌ Server is not running. Please start the backend server first.\n")
        exit(1)
    
    # Run the test
    run_test_scenario()
