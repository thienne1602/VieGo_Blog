/**
 * Socket.IO Client Helper with Reconnection and Error Handling
 * Provides robust connection management for chat clients
 */

class SocketIOClientHelper {
  constructor(url, options = {}) {
    this.url = url;
    this.token = options.token || null;
    this.userId = options.userId || null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.messageQueue = [];
    this.isConnected = false;
    this.socket = null;

    // Event handlers
    this.handlers = {
      onConnect: options.onConnect || (() => {}),
      onDisconnect: options.onDisconnect || (() => {}),
      onError: options.onError || ((error) => console.error(error)),
      onNewMessage: options.onNewMessage || (() => {}),
      onUserTyping: options.onUserTyping || (() => {}),
      onUserOnline: options.onUserOnline || (() => {}),
      onUserOffline: options.onUserOffline || (() => {}),
      onMessageStatusUpdated: options.onMessageStatusUpdated || (() => {}),
      onFriendRequest: options.onFriendRequest || (() => {}),
    };

    this.init();
  }

  init() {
    if (typeof io === "undefined") {
      throw new Error("Socket.IO client library not loaded");
    }

    this.socket = io(this.url, {
      auth: {
        token: this.token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
    });

    this.registerEventHandlers();
  }

  registerEventHandlers() {
    // Connection events
    this.socket.on("connect", () => {
      console.log("[Socket.IO] ✓ Connected");
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Process queued messages
      this.processMessageQueue();

      this.handlers.onConnect();
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] ✗ Disconnected: ${reason}`);
      this.isConnected = false;

      this.handlers.onDisconnect(reason);

      // Attempt reconnection for certain reasons
      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Socket.IO] Connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("[Socket.IO] Max reconnection attempts reached");
        this.handlers.onError({
          type: "MAX_RECONNECT_ATTEMPTS",
          message: "Unable to connect to server",
        });
      }
    });

    this.socket.on("error", (error) => {
      console.error("[Socket.IO] Error:", error);
      this.handlers.onError({
        type: "SOCKET_ERROR",
        message: error.message || error,
      });
    });

    // Chat events
    this.socket.on("connected", (data) => {
      console.log("[Socket.IO] Server confirmed connection:", data);
    });

    this.socket.on("new_message", (data) => {
      console.log("[Socket.IO] New message received:", data);
      this.handlers.onNewMessage(data);
    });

    this.socket.on("message_sent", (data) => {
      console.log("[Socket.IO] Message sent confirmation:", data);
    });

    this.socket.on("user_typing", (data) => {
      this.handlers.onUserTyping(data);
    });

    this.socket.on("user_online", (data) => {
      console.log("[Socket.IO] User online:", data);
      this.handlers.onUserOnline(data);
    });

    this.socket.on("user_offline", (data) => {
      console.log("[Socket.IO] User offline:", data);
      this.handlers.onUserOffline(data);
    });

    this.socket.on("message_status_updated", (data) => {
      this.handlers.onMessageStatusUpdated(data);
    });

    this.socket.on("friend_request_received", (data) => {
      console.log("[Socket.IO] Friend request received:", data);
      this.handlers.onFriendRequest(data);
    });
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`[Socket.IO] Reconnecting in ${delay}ms...`);

      setTimeout(() => {
        console.log("[Socket.IO] Attempting to reconnect...");
        this.socket.connect();
      }, delay);
    }
  }

  // Message queue for offline messages
  queueMessage(event, data) {
    this.messageQueue.push({ event, data, timestamp: Date.now() });
    console.log(`[Socket.IO] Message queued: ${event}`);
  }

  processMessageQueue() {
    console.log(
      `[Socket.IO] Processing ${this.messageQueue.length} queued messages`
    );

    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift();
      this.socket.emit(event, data);
    }
  }

  // Send methods with queue support
  sendTypingIndicator(receiverId, isTyping) {
    const data = {
      sender_id: this.userId,
      receiver_id: receiverId,
      is_typing: isTyping,
    };

    if (this.isConnected) {
      this.socket.emit("typing_message", data);
    } else {
      // Don't queue typing indicators
      console.log("[Socket.IO] Cannot send typing indicator: not connected");
    }
  }

  joinConversation(otherUserId) {
    const data = {
      user_id: this.userId,
      other_user_id: otherUserId,
    };

    if (this.isConnected) {
      this.socket.emit("join_direct_conversation", data);
    } else {
      this.queueMessage("join_direct_conversation", data);
    }
  }

  leaveConversation(otherUserId) {
    const data = {
      user_id: this.userId,
      other_user_id: otherUserId,
    };

    if (this.isConnected) {
      this.socket.emit("leave_direct_conversation", data);
    }
  }

  markMessageDelivered(messageId, receiverId) {
    const data = {
      message_id: messageId,
      receiver_id: receiverId,
    };

    if (this.isConnected) {
      this.socket.emit("message_delivered", data);
    } else {
      this.queueMessage("message_delivered", data);
    }
  }

  markMessageRead(messageId, readerId) {
    const data = {
      message_id: messageId,
      reader_id: readerId,
    };

    if (this.isConnected) {
      this.socket.emit("message_read", data);
    } else {
      this.queueMessage("message_read", data);
    }
  }

  getOnlineStatus(userIds) {
    const data = {
      user_ids: userIds,
    };

    if (this.isConnected) {
      this.socket.emit("get_online_status", data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  updateToken(newToken) {
    this.token = newToken;

    // Reconnect with new token
    if (this.socket) {
      this.socket.disconnect();
      this.socket.auth = { token: newToken };
      this.socket.connect();
    }
  }
}

// Export for use in different environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = SocketIOClientHelper;
}

// Usage example:
/*
const chatSocket = new SocketIOClientHelper('http://localhost:5000', {
    token: 'your_jwt_token',
    userId: 1,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    
    onConnect: () => {
        console.log('Connected to chat server!');
    },
    
    onDisconnect: (reason) => {
        console.log('Disconnected:', reason);
    },
    
    onError: (error) => {
        console.error('Socket error:', error);
        // Show error to user
    },
    
    onNewMessage: (message) => {
        // Add message to chat UI
        addMessageToChat(message);
        
        // Mark as delivered
        chatSocket.markMessageDelivered(message.id, currentUserId);
    },
    
    onUserTyping: (data) => {
        if (data.is_typing) {
            showTypingIndicator(data.sender_name);
        } else {
            hideTypingIndicator();
        }
    },
    
    onUserOnline: (data) => {
        updateUserStatus(data.user_id, 'online');
    },
    
    onUserOffline: (data) => {
        updateUserStatus(data.user_id, 'offline');
    },
    
    onMessageStatusUpdated: (data) => {
        updateMessageStatus(data.message_id, data.status);
    },
    
    onFriendRequest: (data) => {
        showFriendRequestNotification(data.requester);
    }
});

// Usage in chat component
function handleTyping() {
    chatSocket.sendTypingIndicator(receiverId, true);
    
    // Stop typing after delay
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        chatSocket.sendTypingIndicator(receiverId, false);
    }, 2000);
}

function handleSendMessage(message) {
    // Send via API (not Socket.IO)
    fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            receiver_id: receiverId,
            message: message,
            message_type: 'text'
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Message sent:', data);
        // Socket.IO events will be automatically emitted by server
    })
    .catch(error => {
        console.error('Error sending message:', error);
    });
}

// Cleanup when component unmounts
function cleanup() {
    chatSocket.disconnect();
}
*/
