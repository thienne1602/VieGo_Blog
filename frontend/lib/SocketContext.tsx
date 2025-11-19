"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const userIdRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Get current port from window.location
  const getCurrentPort = (): string => {
    if (typeof window !== 'undefined') {
      const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
      return port;
    }
    return '3000'; // Default fallback
  };

  // Get storage key with port suffix to ensure isolation between clients
  const getStorageKey = (baseKey: string): string => {
    const port = getCurrentPort();
    return `${baseKey}_${port}`;
  };

  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = userIdRef.current;
    
    // If user changed (logout or login with different user), disconnect old socket
    if (previousUserId !== null && previousUserId !== currentUserId && socketRef.current) {
      console.log(`[Socket.IO] User changed from ${previousUserId} to ${currentUserId}, disconnecting old socket`);
      socketRef.current.disconnect();
      socketRef.current.close();
      setSocket(null);
      setIsConnected(false);
      socketRef.current = null;
    }
    
    userIdRef.current = currentUserId;

    // If no user or no token, don't connect
    if (!user || !currentUserId) {
      console.log("ℹ️ No user found, skipping Socket.IO connection");
      return;
    }

    // If socket already exists and connected for this user, don't reconnect
    if (socketRef.current && socketRef.current.connected && previousUserId === currentUserId) {
      console.log(`[Socket.IO] Socket already connected for user ${currentUserId}`);
      return;
    }

    // Enable Socket.IO by default since backend now supports it
    const token = localStorage.getItem(getStorageKey("access_token"));

    if (!token) {
      console.log("ℹ️ No token found, skipping Socket.IO connection");
      return;
    }

    console.log(`[Socket.IO] Connecting for user ${currentUserId}`);

    const socketInstance = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
      {
        auth: {
          token: token,
        },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 5000,
        transports: ['websocket', 'polling'],
      }
    );

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log(`✅ Connected to VieGo Socket.IO server for user ${currentUserId}`);
    });

    socketInstance.on("connect_error", (error) => {
      console.warn("⚠️ Socket.IO connection error:", error.message);
      setIsConnected(false);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log(`🔌 Disconnected from Socket.IO server (user ${currentUserId})`);
    });

    setSocket(socketInstance);
    socketRef.current = socketInstance;

    return () => {
      // Cleanup when user changes or component unmounts
      console.log(`[Socket.IO] Cleaning up socket for user ${currentUserId}`);
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance.close();
      }
      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }
    };
  }, [user?.id]); // Re-run when user.id changes

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
