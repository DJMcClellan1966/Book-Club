import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './GoalsDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const GoalsDashboard = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'books',
    target_value: '',
    time_period: 'monthly'
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reading-goals/my-goals`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setGoals(response.data.goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/api/reading-goals`,
        newGoal,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setShowCreateModal(false);
      setNewGoal({ goal_type: 'books', target_value: '', time_period: 'monthly' });
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      alert(error.response?.data?.message || 'Failed to create goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/reading-goals/${goalId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getGoalIcon = (type) => {
    switch (type) {
      case 'books': return '📚';
      case 'pages': return '📄';
      case 'minutes': return '⏱️';
      case 'genres': return '🎭';
      default: return '🎯';
    }
  };

  const getGoalLabel = (type) => {
    switch (type) {
      case 'books': return 'Books';
      case 'pages': return 'Pages';
      case 'minutes': return 'Minutes';
      case 'genres': return 'Genres';
      default: return type;
    }
  };

  if (loading) {
    return <div className="goals-loading">Loading goals...</div>;
  }

  return (
    <div className="goals-dashboard">
      <div className="goals-header">
        <h2>📖 My Reading Goals</h2>
        <button className="btn-create-goal" onClick={() => setShowCreateModal(true)}>
          + New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="goals-empty">
          <p>No goals yet. Create your first reading goal!</p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Create Goal
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => (
            <div key={goal.id} className={`goal-card ${goal.status}`}>
              <div className="goal-card-header">
                <span className="goal-icon">{getGoalIcon(goal.goal_type)}</span>
                <div className="goal-info">
                  <h3>{getGoalLabel(goal.goal_type)}</h3>
                  <span className="goal-period">{goal.time_period}</span>
                </div>
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteGoal(goal.id)}
                  title="Delete goal"
                >
                  ×
                </button>
              </div>

              <div className="goal-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                  />
                </div>
                <div className="progress-text">
                  <span className="progress-current">{goal.current_progress}</span>
                  <span className="progress-separator"> / </span>
                  <span className="progress-target">{goal.target_value}</span>
                  <span className="progress-percentage">({goal.percentage}%)</span>
                </div>
              </div>

              {goal.status === 'completed' && (
                <div className="goal-completed">
                  ✅ Completed! 🎉
                </div>
              )}

              {goal.status === 'active' && goal.percentage >= 80 && (
                <div className="goal-almost">
                  🔥 Almost there! Just {goal.target_value - goal.current_progress} more!
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Reading Goal</h3>
            <form onSubmit={handleCreateGoal}>
              <div className="form-group">
                <label>Goal Type</label>
                <select
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                  required
                >
                  <option value="books">Books Read</option>
                  <option value="pages">Pages Read</option>
                  <option value="minutes">Minutes Reading</option>
                  <option value="genres">Different Genres</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target</label>
                <input
                  type="number"
                  min="1"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                  placeholder="e.g., 12"
                  required
                />
              </div>

              <div className="form-group">
                <label>Time Period</label>
                <select
                  value={newGoal.time_period}
                  onChange={(e) => setNewGoal({ ...newGoal, time_period: e.target.value })}
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsDashboard;
