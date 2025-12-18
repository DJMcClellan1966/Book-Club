import io from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  socket = null;

  async connect() {
    const token = await AsyncStorage.getItem('token');
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Forum specific methods
  joinForum(forumId) {
    this.emit('join-forum', { forumId });
  }

  leaveForum(forumId) {
    this.emit('leave-forum', { forumId });
  }

  sendForumMessage(forumId, message) {
    this.emit('forum-message', { forumId, message });
  }

  // Space specific methods
  joinSpace(spaceId) {
    this.emit('join-space', { spaceId });
  }

  leaveSpace(spaceId) {
    this.emit('leave-space', { spaceId });
  }

  sendSpaceMessage(spaceId, message) {
    this.emit('space-message', { spaceId, message });
  }
}

export default new SocketService();
