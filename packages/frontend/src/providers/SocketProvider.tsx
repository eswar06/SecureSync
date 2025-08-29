import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { addNotification } from '../store/slices/notificationsSlice';
import { setOnlineStatus } from '../store/slices/authSlice';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, accessToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token: accessToken,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        dispatch(setOnlineStatus(true));
        dispatch(addNotification({
          type: 'success',
          title: 'Connected',
          message: 'SecureSync Pro is now online',
        }));
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        dispatch(setOnlineStatus(false));
        
        if (reason !== 'io client disconnect') {
          dispatch(addNotification({
            type: 'warning',
            title: 'Connection Lost',
            message: 'Attempting to reconnect...',
          }));
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        dispatch(addNotification({
          type: 'error',
          title: 'Connection Error',
          message: 'Failed to connect to SecureSync Pro servers',
        }));
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        dispatch(addNotification({
          type: 'success',
          title: 'Reconnected',
          message: 'SecureSync Pro is back online',
        }));
      });

      // Security event handlers
      newSocket.on('security-violation', (data) => {
        dispatch(addNotification({
          type: 'error',
          title: 'Security Violation',
          message: data.message,
          persistent: true,
        }));
      });

      newSocket.on('security-warning', (data) => {
        dispatch(addNotification({
          type: 'warning',
          title: 'Security Alert',
          message: data.message,
        }));
      });

      newSocket.on('security-notice', (data) => {
        dispatch(addNotification({
          type: 'info',
          title: 'Security Notice',
          message: data.message,
        }));
      });

      // Meeting event handlers
      newSocket.on('meeting-joined', (data) => {
        dispatch(addNotification({
          type: 'info',
          title: 'Meeting Joined',
          message: `You've joined the meeting`,
        }));
      });

      newSocket.on('participant-joined', (data) => {
        dispatch(addNotification({
          type: 'info',
          title: 'Participant Joined',
          message: `${data.userId} joined the meeting`,
        }));
      });

      newSocket.on('participant-left', (data) => {
        dispatch(addNotification({
          type: 'info',
          title: 'Participant Left',
          message: `${data.userId} left the meeting`,
        }));
      });

      // Real-time feature handlers
      newSocket.on('transcription-update', (data) => {
        // Handle real-time transcription updates
        console.log('Transcription update:', data);
      });

      newSocket.on('new-message', (data) => {
        dispatch(addNotification({
          type: 'info',
          title: 'New Message',
          message: `New message in ${data.threadId}`,
        }));
      });

      newSocket.on('document-shared', (data) => {
        dispatch(addNotification({
          type: 'info',
          title: 'Document Shared',
          message: `${data.sharedBy} shared a document with you`,
        }));
      });

      newSocket.on('reminder-notification', (data) => {
        dispatch(addNotification({
          type: 'info',
          title: 'Reminder',
          message: data.reminder.title,
        }));
      });

      // Store socket instance
      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Clean up socket if not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, accessToken, dispatch]);

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
