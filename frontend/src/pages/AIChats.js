import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChatInterface from '../components/ChatInterface';
import './AIChats.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AIChats = () => {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [newChatForm, setNewChatForm] = useState({
    characterName: '',
    characterType: 'author',
    bookTitle: '',
    enableVideo: false
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadChats();
    loadLimits();
  }, []);

  const loadChats = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/aichats/my-chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chats:', error);
      setLoading(false);
    }
  };

  const loadLimits = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/aichats/limits/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLimits(response.data);
    } catch (error) {
      console.error('Error loading limits:', error);
    }
  };

  const handleCreateChat = async (e) => {
    e.preventDefault();

    if (!newChatForm.characterName.trim()) {
      alert('Please enter a character or author name');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${API_URL}/aichats/create`,
        newChatForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChats([response.data.chat, ...chats]);
      setSelectedChatId(response.data.chat._id);
      setShowCreateForm(false);
      setNewChatForm({
        characterName: '',
        characterType: 'author',
        bookTitle: '',
        enableVideo: false
      });
      loadLimits(); // Refresh limits
    } catch (error) {
      console.error('Error creating chat:', error);
      if (error.response?.data?.upgrade) {
        alert(error.response.data.message);
      } else {
        alert('Failed to create chat. Please try again.');
      }
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/aichats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setChats(chats.filter(chat => chat._id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
      loadLimits(); // Refresh limits
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat');
    }
  };

  if (loading) {
    return <div className="aichats-loading">Loading AI Chats...</div>;
  }

  return (
    <div className="aichats-container">
      <div className="aichats-sidebar">
        <div className="sidebar-header">
          <h2>AI Chats</h2>
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="new-chat-btn"
            title="Create new chat"
          >
            +
          </button>
        </div>

        {limits && (
          <div className="usage-info">
            <div className="usage-item">
              <span className="usage-label">Active Chats:</span>
              <span className="usage-value">
                {limits.usage.activeChats}
                {limits.limits.maxActiveChats !== -1 && ` / ${limits.limits.maxActiveChats}`}
              </span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Today's Messages:</span>
              <span className="usage-value">
                {limits.usage.messagesToday}
                {limits.limits.maxMessagesPerDay !== -1 && ` / ${limits.limits.maxMessagesPerDay}`}
              </span>
            </div>
            {limits.tier === 'free' && (
              <button 
                onClick={() => navigate('/pricing')} 
                className="upgrade-btn-small"
              >
                Upgrade for More
              </button>
            )}
          </div>
        )}

        <div className="chats-list">
          {chats.length === 0 ? (
            <div className="no-chats">
              <p>No chats yet!</p>
              <p>Create your first AI conversation</p>
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat._id}
                className={`chat-item ${selectedChatId === chat._id ? 'active' : ''}`}
                onClick={() => setSelectedChatId(chat._id)}
              >
                <div className="chat-item-avatar">
                  {chat.characterType === 'author' ? '✍️' : '📖'}
                </div>
                <div className="chat-item-info">
                  <div className="chat-item-name">{chat.characterName}</div>
                  <div className="chat-item-meta">
                    {chat.characterType} • {chat.messageCount} messages
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat._id);
                  }}
                  className="delete-chat-btn"
                  title="Delete chat"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="aichats-main">
        {selectedChatId ? (
          <ChatInterface 
            chatId={selectedChatId} 
            onClose={() => setSelectedChatId(null)}
          />
        ) : (
          <div className="no-chat-selected">
            <div className="welcome-message">
              <h1>🎭 AI Character & Author Chats</h1>
              <p>Talk to your favorite authors and book characters!</p>
              <div className="features-grid">
                <div className="feature-card">
                  <span className="feature-icon">✍️</span>
                  <h3>Chat with Authors</h3>
                  <p>Discuss writing style, inspiration, and their literary works</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">📖</span>
                  <h3>Meet Characters</h3>
                  <p>Have conversations with your favorite book characters</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">🎥</span>
                  <h3>Video Avatars</h3>
                  <p>Premium feature: Animated video responses (coming soon)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateForm(true)} 
                className="create-first-chat-btn"
              >
                Start Your First Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New AI Chat</h2>
            <form onSubmit={handleCreateChat}>
              <div className="form-group">
                <label>Character Type</label>
                <select
                  value={newChatForm.characterType}
                  onChange={(e) => setNewChatForm({ ...newChatForm, characterType: e.target.value })}
                  className="form-input"
                >
                  <option value="author">Author</option>
                  <option value="character">Book Character</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  {newChatForm.characterType === 'author' ? 'Author Name' : 'Character Name'}
                </label>
                <input
                  type="text"
                  value={newChatForm.characterName}
                  onChange={(e) => setNewChatForm({ ...newChatForm, characterName: e.target.value })}
                  placeholder={newChatForm.characterType === 'author' ? 'e.g., J.K. Rowling' : 'e.g., Hermione Granger'}
                  className="form-input"
                  required
                />
              </div>

              {newChatForm.characterType === 'character' && (
                <div className="form-group">
                  <label>Book Title (Optional)</label>
                  <input
                    type="text"
                    value={newChatForm.bookTitle}
                    onChange={(e) => setNewChatForm({ ...newChatForm, bookTitle: e.target.value })}
                    placeholder="e.g., Harry Potter"
                    className="form-input"
                  />
                </div>
              )}

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newChatForm.enableVideo}
                    onChange={(e) => setNewChatForm({ ...newChatForm, enableVideo: e.target.checked })}
                  />
                  <span>Enable video avatar (Premium/Pro only)</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChats;
