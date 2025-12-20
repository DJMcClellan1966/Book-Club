import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './StreakWidget.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const StreakWidget = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStreak();
    }
  }, [user]);

  const fetchStreak = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/streaks/my-streak`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStreak(response.data.streak);
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogToday = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/streaks/update`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setStreak(response.data.streak);
      
      // Show celebration if streak increased
      if (response.data.streak.current_streak > (streak?.current_streak || 0)) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const getStreakEmoji = (days) => {
    if (days === 0) return '📖';
    if (days < 7) return '🔥';
    if (days < 30) return '🔥🔥';
    if (days < 100) return '🔥🔥🔥';
    return '🏆';
  };

  const getMotivationalMessage = () => {
    const days = streak?.current_streak || 0;
    if (days === 0) return 'Start your reading journey today!';
    if (days === 1) return 'Great start! Keep it going!';
    if (days < 7) return `${days} days strong! You're building a habit!`;
    if (days === 7) return '🎉 One week streak! Amazing!';
    if (days < 30) return `${days} days! You're on fire!`;
    if (days === 30) return '🎉 30-day streak! Incredible!';
    if (days < 100) return `${days} days! Unstoppable!`;
    if (days === 100) return '🎉 100-day streak! Legendary!';
    if (days === 365) return '🎉 FULL YEAR! You are a reading master!';
    return `${days} days! You're a reading champion!`;
  };

  const getDaysUntilNextMilestone = () => {
    const days = streak?.current_streak || 0;
    const milestones = [7, 30, 100, 365];
    const nextMilestone = milestones.find(m => m > days);
    return nextMilestone ? nextMilestone - days : null;
  };

  const isLoggedToday = () => {
    if (!streak?.last_read_date) return false;
    const today = new Date().toISOString().split('T')[0];
    const lastRead = new Date(streak.last_read_date).toISOString().split('T')[0];
    return today === lastRead;
  };

  if (loading) {
    return (
      <div className="streak-widget loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const daysUntilMilestone = getDaysUntilNextMilestone();
  const loggedToday = isLoggedToday();

  return (
    <div className={`streak-widget ${showCelebration ? 'celebrating' : ''}`}>
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <span className="celebration-emoji">🎉</span>
            <p className="celebration-text">Streak extended!</p>
          </div>
        </div>
      )}

      <div className="streak-header">
        <div className="streak-icon">
          {getStreakEmoji(streak?.current_streak || 0)}
        </div>
        <div className="streak-title-section">
          <h3 className="streak-title">Reading Streak</h3>
          <p className="streak-subtitle">{getMotivationalMessage()}</p>
        </div>
      </div>

      <div className="streak-stats">
        <div className="stat-box current">
          <span className="stat-label">Current Streak</span>
          <span className="stat-value">{streak?.current_streak || 0}</span>
          <span className="stat-unit">days</span>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-box longest">
          <span className="stat-label">Longest Streak</span>
          <span className="stat-value">{streak?.longest_streak || 0}</span>
          <span className="stat-unit">days</span>
        </div>
      </div>

      {daysUntilMilestone && (
        <div className="milestone-progress">
          <div className="milestone-info">
            <span className="milestone-label">Next Milestone</span>
            <span className="milestone-days">{daysUntilMilestone} days</span>
          </div>
          <div className="milestone-bar">
            <div 
              className="milestone-fill"
              style={{ 
                width: `${((streak?.current_streak || 0) / (daysUntilMilestone + (streak?.current_streak || 0))) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      <div className="streak-actions">
        {loggedToday ? (
          <div className="logged-today">
            <span className="check-icon">✓</span>
            <span>Logged today!</span>
          </div>
        ) : (
          <button className="btn-log-today" onClick={handleLogToday}>
            Log Today's Reading
          </button>
        )}
      </div>

      {streak?.current_streak === 0 && (
        <div className="streak-tip">
          <span className="tip-icon">💡</span>
          <p>Reading every day builds a powerful habit. Start your streak today!</p>
        </div>
      )}
    </div>
  );
};

export default StreakWidget;
