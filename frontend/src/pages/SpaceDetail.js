import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import VideoChat from '../components/VideoChat';
import './SpaceDetail.css';

const SpaceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, joinRoom, sendMessage } = useSocket();
  const [space, setSpace] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSpace();
    
    if (socket) {
      joinRoom(id);

      socket.on('receive-message', (data) => {
        setMessages(prev => [...prev, data]);
      });
    }

    return () => {
      if (socket) {
        socket.off('receive-message');
      }
    };
  }, [id, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSpace = async () => {
    try {
      const response = await axios.get(`/api/spaces/${id}`);
      setSpace(response.data);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching space:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSpace = async () => {
    try {
      await axios.post(`/api/spaces/${id}/join`);
      fetchSpace();
    } catch (error) {
      console.error('Error joining space:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      await axios.post(`/api/spaces/${id}/messages`, { content: newMessage });
      sendMessage(id, newMessage);
      setNewMessage('');
    } catch (error) {
      if (error.response?.data?.moderated) {
        alert(`Your message was flagged by AI moderation: ${error.response.data.reason}`);
      } else {
        console.error('Error sending message:', error);
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!space) return <div className="error">Space not found</div>;

  const isMember = space.members?.some(m => m.user._id === user?.id);

  return (
    <div className="space-detail-container">
      <div className="space-header-detail card">
        <div className="space-title-section">
          <div className="space-badges">
            <span className={`badge ${space.type}`}>{space.type}</span>
            <span className={`badge ${space.visibility}`}>{space.visibility}</span>
          </div>
          <h1>{space.name}</h1>
          <p>{space.description}</p>
          <div className="space-stats">
            <span>👥 {space.members?.length || 0} members</span>
            <span>💬 {messages.length} messages</span>
          </div>
        </div>
        
        {!isMember && (
          <button onClick={handleJoinSpace} className="btn btn-primary">
            Join Space
          </button>
        )}
      </div>

      {isMember && (
        <>
          {space.hasVideoEnabled && (
            <div className="video-section">
              <button 
                onClick={() => setShowVideo(!showVideo)} 
                className="btn btn-primary"
              >
                {showVideo ? 'Hide Video Chat' : '🎥 Join Video Chat'}
              </button>
              
              {showVideo && <VideoChat roomId={space.videoRoomId} />}
            </div>
          )}

          <div className="chat-container card">
            <h3>Chat</h3>
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.user?._id === user?.id ? 'own-message' : ''}`}
                >
                  {msg.moderationWarning && (
                    <div className="message-moderation">
                      ⚠️ {msg.moderationWarning}
                    </div>
                  )}
                  <div className="message-header">
                    <strong>{msg.user?.username || 'Unknown'}</strong>
                    <span className="message-time">
                      {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">{msg.content || msg.message}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                required
              />
              <button type="submit" className="btn btn-primary">Send</button>
            </form>
          </div>
        </>
      )}

      {!isMember && (
        <div className="card">
          <p className="text-center">Join this space to participate in discussions</p>
        </div>
      )}
    </div>
  );
};

export default SpaceDetail;
