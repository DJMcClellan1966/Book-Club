import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
      
      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        newSocket.emit('user-connected', user.id);
      });

      newSocket.on('active-users', (users) => {
        setActiveUsers(users);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join-room', roomId);
    }
  };

  const sendMessage = (roomId, message) => {
    if (socket) {
      socket.emit('send-message', { roomId, message });
    }
  };

  const joinVideoRoom = (roomId) => {
    if (socket) {
      socket.emit('join-video-room', roomId);
    }
  };

  const value = {
    socket,
    activeUsers,
    joinRoom,
    sendMessage,
    joinVideoRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
