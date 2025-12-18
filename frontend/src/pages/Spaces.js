import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Spaces.css';

const Spaces = () => {
  const [spaces, setSpaces] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'permanent',
    visibility: 'public',
    hasVideoEnabled: false
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const response = await axios.get('/api/spaces');
      setSpaces(response.data);
    } catch (error) {
      console.error('Error fetching spaces:', error);
    }
  };

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/api/spaces', formData);
      setShowCreateForm(false);
      setFormData({ 
        name: '', 
        description: '', 
        type: 'permanent', 
        visibility: 'public',
        hasVideoEnabled: false 
      });
      navigate(`/spaces/${response.data._id}`);
    } catch (error) {
      alert('Error creating space');
    }
  };

  return (
    <div className="spaces-container">
      <div className="spaces-header">
        <h1>Book Spaces</h1>
        {user && (
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="btn btn-primary"
          >
            Create Space
          </button>
        )}
      </div>

      <p className="spaces-description">
        Create or join spaces for book discussions, both text and video-based conversations.
      </p>

      {showCreateForm && (
        <form onSubmit={handleCreateSpace} className="create-space-form card">
          <h3>Create New Space</h3>
          
          <label>
            Name
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              placeholder="Space name"
            />
          </label>
          
          <label>
            Description
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              placeholder="What is this space about?"
            />
          </label>
          
          <label>
            Type
            <select 
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="permanent">Permanent</option>
              <option value="temporary">Temporary (expires in 7 days)</option>
            </select>
          </label>
          
          <label>
            Visibility
            <select 
              value={formData.visibility}
              onChange={(e) => setFormData({...formData, visibility: e.target.value})}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.hasVideoEnabled}
              onChange={(e) => setFormData({...formData, hasVideoEnabled: e.target.checked})}
            />
            Enable Video Chat
          </label>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="spaces-grid">
        {spaces.map(space => (
          <div 
            key={space._id} 
            className="space-card card"
            onClick={() => navigate(`/spaces/${space._id}`)}
          >
            <div className="space-badges">
              <span className={`badge ${space.type}`}>{space.type}</span>
              {space.hasVideoEnabled && <span className="badge video">🎥 Video</span>}
            </div>
            <h3>{space.name}</h3>
            <p>{space.description}</p>
            <div className="space-meta">
              <span>👥 {space.members?.length || 0} members</span>
              <span>💬 {space.messages?.length || 0} messages</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Spaces;
