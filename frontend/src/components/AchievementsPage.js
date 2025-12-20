import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './AchievementsPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AchievementsPage = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    try {
      const [catalogRes, userRes] = await Promise.all([
        axios.get(`${API_URL}/api/achievements/catalog`, {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        axios.get(`${API_URL}/api/achievements/my-achievements`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ]);

      setAchievements(catalogRes.data.achievements);
      setUserAchievements(userRes.data.achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (category) => {
    const icons = {
      milestone: '🏆',
      social: '👥',
      speed: '⚡',
      consistency: '🔥',
      variety: '🎨',
      special: '⭐'
    };
    return icons[category] || '🎖️';
  };

  const isEarned = (achievementId) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getEarnedDate = (achievementId) => {
    const earned = userAchievements.find(ua => ua.achievement_id === achievementId);
    return earned ? new Date(earned.earned_date).toLocaleDateString() : null;
  };

  const getFilteredAchievements = () => {
    if (filter === 'earned') {
      return achievements.filter(a => isEarned(a.id));
    } else if (filter === 'locked') {
      return achievements.filter(a => !isEarned(a.id));
    }
    return achievements;
  };

  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  if (loading) {
    return <div className="achievements-loading">Loading achievements...</div>;
  }

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <div className="header-content">
          <h2>🏆 Achievements</h2>
          <div className="achievements-stats">
            <div className="stat-item">
              <span className="stat-value">{earnedCount}</span>
              <span className="stat-label">Earned</span>
            </div>
            <div className="stat-divider">/</div>
            <div className="stat-item">
              <span className="stat-value">{totalCount}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="progress-percentage">{completionPercentage}% Complete</span>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setFilter('all')}
        >
          All ({totalCount})
        </button>
        <button
          className={filter === 'earned' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setFilter('earned')}
        >
          Earned ({earnedCount})
        </button>
        <button
          className={filter === 'locked' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setFilter('locked')}
        >
          Locked ({totalCount - earnedCount})
        </button>
      </div>

      <div className="achievements-grid">
        {getFilteredAchievements().map((achievement) => {
          const earned = isEarned(achievement.id);
          const earnedDate = getEarnedDate(achievement.id);

          return (
            <div
              key={achievement.id}
              className={`achievement-card ${earned ? 'earned' : 'locked'}`}
            >
              <div className="achievement-icon-container">
                <span className="achievement-icon">
                  {earned ? getAchievementIcon(achievement.category) : '🔒'}
                </span>
                {earned && (
                  <div className="earned-badge">
                    <span>✓</span>
                  </div>
                )}
              </div>

              <div className="achievement-content">
                <h3 className="achievement-title">{achievement.title}</h3>
                <p className="achievement-description">
                  {earned ? achievement.description : '???'}
                </p>

                <div className="achievement-footer">
                  <span className="achievement-category">
                    {achievement.category}
                  </span>
                  {earned && earnedDate && (
                    <span className="achievement-date">
                      Earned: {earnedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {getFilteredAchievements().length === 0 && (
        <div className="achievements-empty">
          <p>No achievements in this category yet</p>
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
