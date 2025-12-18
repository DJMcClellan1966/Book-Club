import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ForumDetail.css';

const ForumDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [forum, setForum] = useState(null);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForum();
  }, [id]);

  const fetchForum = async () => {
    try {
      const response = await axios.get(`/api/forums/${id}`);
      setForum(response.data);
    } catch (error) {
      console.error('Error fetching forum:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinForum = async () => {
    try {
      await axios.post(`/api/forums/${id}/join`);
      fetchForum();
    } catch (error) {
      console.error('Error joining forum:', error);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`/api/forums/${id}/posts`, { content: newPost });
      setNewPost('');
      fetchForum();
    } catch (error) {
      if (error.response?.data?.moderated) {
        alert(`Your post was flagged by AI moderation: ${error.response.data.reason}`);
      } else {
        alert('Error adding post');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!forum) return <div className="error">Forum not found</div>;

  const isMember = user && forum.members?.some(m => m._id === user.id);

  return (
    <div className="forum-detail-container">
      <div className="forum-header-detail card">
        <div className="forum-title-section">
          <span className="forum-category-badge">{forum.category}</span>
          <h1>{forum.title}</h1>
          <p>{forum.description}</p>
          <div className="forum-stats">
            <span>👥 {forum.members?.length || 0} members</span>
            <span>💬 {forum.posts?.length || 0} posts</span>
          </div>
        </div>
        
        {user && !isMember && (
          <button onClick={handleJoinForum} className="btn btn-primary">
            Join Forum
          </button>
        )}
      </div>

      {isMember && (
        <form onSubmit={handleAddPost} className="post-form card">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            required
          />
          <button type="submit" className="btn btn-primary">Post</button>
        </form>
      )}

      <div className="posts-list">
        <h2>Posts</h2>
        {forum.posts && forum.posts.length > 0 ? (
          forum.posts.map(post => (
            <div key={post._id} className="post-card card">
              {post.moderationWarning && (
                <div className="moderation-warning">
                  ⚠️ AI Moderation: {post.moderationWarning}
                </div>
              )}
              <div className="post-header">
                <div>
                  <strong>{post.user?.username}</strong>
                  <span className="post-time">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="post-content">{post.content}</p>
              <div className="post-actions">
                <span>👍 {post.likes?.length || 0}</span>
                <span>💬 {post.replies?.length || 0} replies</span>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No posts yet. Be the first to post!</p>
        )}
      </div>
    </div>
  );
};

export default ForumDetail;
