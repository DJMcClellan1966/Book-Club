import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatInterface.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ChatInterface = ({ chatId, onClose }) => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      loadChat();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChat = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/aichats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChat(response.data.chat);
      setMessages(response.data.messages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chat:', error);
      setError('Failed to load chat');
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${API_URL}/aichats/${chatId}/message`,
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages([...messages, response.data.userMessage, response.data.assistantMessage]);
      setSending(false);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.data?.upgrade) {
        alert(error.response.data.message);
      } else {
        alert('Failed to send message. Please try again.');
      }
      setInputMessage(messageText); // Restore message
      setSending(false);
    }
  };

  if (loading) {
    return <div className="chat-loading">Loading chat...</div>;
  }

  if (error) {
    return (
      <div className="chat-error">
        <p>{error}</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-character-info">
          <div className="character-avatar">
            {chat.avatarUrl ? (
              <img src={chat.avatarUrl} alt={chat.characterName} />
            ) : (
              <div className="avatar-placeholder">
                {chat.characterType === 'author' ? '✍️' : '📖'}
              </div>
            )}
          </div>
          <div className="character-details">
            <h3>{chat.characterName}</h3>
            <span className="character-type">
              {chat.characterType === 'author' ? 'Author' : 'Character'}
              {chat.bookTitle && ` • ${chat.bookTitle}`}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="close-chat-btn">×</button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={msg._id || index} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'assistant' ? (
                chat.characterType === 'author' ? '✍️' : '📖'
              ) : (
                '👤'
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{msg.content}</div>
              <div className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="message assistant">
            <div className="message-avatar">
              {chat.characterType === 'author' ? '✍️' : '📖'}
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Talk to ${chat.characterName}...`}
          disabled={sending}
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={!inputMessage.trim() || sending}
          className="send-btn"
        >
          {sending ? '...' : '➤'}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
