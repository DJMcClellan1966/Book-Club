import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState('');
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchRecommendations();
      fetchInsights();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`/api/users/${user.id}`);
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const response = await axios.get('/api/users/recommendations');
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await axios.get('/api/users/reading-insights');
      setInsights(response.data.insights || '');
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username || user?.email?.split('@')[0] || 'User'}!</h1>
        <button onClick={() => navigate(`/profile/${user.id}`)} className="btn btn-secondary">
          View Profile
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section card">
          <h2>📚 Currently Reading</h2>
          {userData?.readingList?.currentlyReading?.length > 0 ? (
            <div className="books-mini-grid">
              {userData.readingList.currentlyReading.slice(0, 4).map(book => (
                <BookCard 
                  key={book._id} 
                  book={book} 
                  onClick={() => navigate(`/books/${book._id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="empty-message">No books currently reading</p>
          )}
          <button onClick={() => navigate('/books')} className="btn btn-primary btn-sm">
            Add Books
          </button>
        </div>

        <div className="dashboard-section card">
          <h2>📖 Want to Read</h2>
          {userData?.readingList?.wantToRead?.length > 0 ? (
            <div className="books-mini-grid">
              {userData.readingList.wantToRead.slice(0, 4).map(book => (
                <BookCard 
                  key={book._id} 
                  book={book} 
                  onClick={() => navigate(`/books/${book._id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="empty-message">No books in your want to read list</p>
          )}
        </div>

        <div className="dashboard-section card">
          <h2>✅ Read</h2>
          {userData?.readingList?.read?.length > 0 ? (
            <div className="books-mini-grid">
              {userData.readingList.read.slice(0, 4).map(book => (
                <BookCard 
                  key={book._id} 
                  book={book} 
                  onClick={() => navigate(`/books/${book._id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="empty-message">No books marked as read</p>
          )}
        </div>

        <div className="dashboard-section card">
          <h2>👥 Social</h2>
          <div className="social-stats">
            <div className="stat-item">
              <div className="stat-number">{userData?.followers?.length || 0}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{userData?.following?.length || 0}</div>
              <div className="stat-label">Following</div>
            </div>
          </div>
        </div>
      </div>

      {insights && (
        <div className="reading-insights card">
          <h2>📊 Your Reading Insights</h2>
          <p className="insights-text">{insights}</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="ai-recommendations card">
          <div className="recommendations-header">
            <h2>🤖 AI Book Recommendations</h2>
            <button onClick={fetchRecommendations} className="btn btn-secondary btn-sm" disabled={loadingRecommendations}>
              {loadingRecommendations ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
          <p className="recommendations-subtitle">Based on your reading history</p>
          <div className="recommendations-list">
            {recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <div className="recommendation-number">{index + 1}</div>
                <div className="recommendation-content">
                  <h4>{rec.title}</h4>
                  <p className="recommendation-author">by {rec.author}</p>
                  <p className="recommendation-reason">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="quick-actions card">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button onClick={() => navigate('/books')} className="action-btn">
            📚 Browse Books
          </button>
          <button onClick={() => navigate('/forums')} className="action-btn">
            💬 Join Forums
          </button>
          <button onClick={() => navigate('/spaces')} className="action-btn">
            🏠 Explore Spaces
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
