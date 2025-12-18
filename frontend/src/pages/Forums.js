import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Forums.css';

const Forums = () => {
  const [forums, setForums] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general'
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      const response = await axios.get('/api/forums');
      setForums(response.data);
    } catch (error) {
      console.error('Error fetching forums:', error);
    }
  };

  const handleCreateForum = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/api/forums', formData);
      setShowCreateForm(false);
      setFormData({ title: '', description: '', category: 'general' });
      navigate(`/forums/${response.data._id}`);
    } catch (error) {
      alert('Error creating forum');
    }
  };

  return (
    <div className="forums-container">
      <div className="forums-header">
        <h1>Discussion Forums</h1>
        {user && (
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="btn btn-primary"
          >
            Create Forum
          </button>
        )}
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateForum} className="create-forum-form card">
          <h3>Create New Forum</h3>
          
          <label>
            Title
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              placeholder="Forum title"
            />
          </label>
          
          <label>
            Description
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              placeholder="What is this forum about?"
            />
          </label>
          
          <label>
            Category
            <select 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="general">General</option>
              <option value="book-discussion">Book Discussion</option>
              <option value="recommendations">Recommendations</option>
              <option value="author-talk">Author Talk</option>
              <option value="other">Other</option>
            </select>
          </label>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="forums-list">
        {forums.map(forum => (
          <div 
            key={forum._id} 
            className="forum-card card"
            onClick={() => navigate(`/forums/${forum._id}`)}
          >
            <div className="forum-category">{forum.category}</div>
            <h3>{forum.title}</h3>
            <p>{forum.description}</p>
            <div className="forum-meta">
              <span>👥 {forum.members?.length || 0} members</span>
              <span>💬 {forum.posts?.length || 0} posts</span>
              <span>by {forum.creator?.username}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Forums;
