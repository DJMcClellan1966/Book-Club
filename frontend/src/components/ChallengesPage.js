import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ChallengesPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ChallengesPage = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user, filter]);

  const fetchChallenges = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/challenges?status=${filter}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setChallenges(response.data.challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallengeDetails = async (challengeId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/challenges/${challengeId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSelectedChallenge(response.data.challenge);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching challenge details:', error);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await axios.post(
        `${API_URL}/api/challenges/${challengeId}/join`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('Successfully joined the challenge! 🎉');
      fetchChallenges();
      if (selectedChallenge?.id === challengeId) {
        fetchChallengeDetails(challengeId);
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      alert(error.response?.data?.message || 'Failed to join challenge');
    }
  };

  const handleLeaveChallenge = async (challengeId) => {
    if (!window.confirm('Are you sure you want to leave this challenge?')) return;

    try {
      await axios.post(
        `${API_URL}/api/challenges/${challengeId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('Left the challenge');
      fetchChallenges();
      if (selectedChallenge?.id === challengeId) {
        setSelectedChallenge(null);
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Error leaving challenge:', error);
    }
  };

  const getChallengeIcon = (type) => {
    switch (type) {
      case 'books': return '📚';
      case 'pages': return '📄';
      case 'genres': return '🎭';
      case 'minutes': return '⏱️';
      default: return '🏆';
    }
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return <div className="challenges-loading">Loading challenges...</div>;
  }

  return (
    <div className="challenges-page">
      <div className="challenges-header">
        <h2>🏆 Community Challenges</h2>
        <div className="challenge-filters">
          <button
            className={filter === 'active' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={filter === 'upcoming' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={filter === 'completed' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="challenges-layout">
        <div className="challenges-list">
          {challenges.length === 0 ? (
            <div className="challenges-empty">
              <p>No {filter} challenges available</p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`challenge-card ${selectedChallenge?.id === challenge.id ? 'selected' : ''}`}
                onClick={() => fetchChallengeDetails(challenge.id)}
              >
                <div className="challenge-card-header">
                  <span className="challenge-icon">{getChallengeIcon(challenge.challenge_type)}</span>
                  <div className="challenge-info">
                    <h3>{challenge.title}</h3>
                    {challenge.is_participant && (
                      <span className="badge-joined">Joined ✓</span>
                    )}
                  </div>
                </div>

                <p className="challenge-description">{challenge.description}</p>

                <div className="challenge-meta">
                  <div className="meta-item">
                    <span className="meta-label">Target:</span>
                    <span className="meta-value">{challenge.target_value}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Participants:</span>
                    <span className="meta-value">{challenge.participant_count}</span>
                  </div>
                  {challenge.status === 'active' && (
                    <div className="meta-item">
                      <span className="meta-label">Days left:</span>
                      <span className="meta-value days-remaining">
                        {getDaysRemaining(challenge.end_date)}
                      </span>
                    </div>
                  )}
                </div>

                {challenge.prize && (
                  <div className="challenge-prize">
                    🎁 Prize: {challenge.prize}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {selectedChallenge && (
          <div className="challenge-details">
            <div className="details-header">
              <h3>{getChallengeIcon(selectedChallenge.challenge_type)} {selectedChallenge.title}</h3>
              {selectedChallenge.is_participant ? (
                <button
                  className="btn-leave"
                  onClick={() => handleLeaveChallenge(selectedChallenge.id)}
                >
                  Leave Challenge
                </button>
              ) : (
                <button
                  className="btn-join"
                  onClick={() => handleJoinChallenge(selectedChallenge.id)}
                  disabled={selectedChallenge.status !== 'active'}
                >
                  {selectedChallenge.status === 'active' ? 'Join Challenge' : 'Challenge Ended'}
                </button>
              )}
            </div>

            <div className="details-content">
              <p className="details-description">{selectedChallenge.description}</p>

              <div className="details-stats">
                <div className="stat-box">
                  <span className="stat-label">Target</span>
                  <span className="stat-value">{selectedChallenge.target_value}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Participants</span>
                  <span className="stat-value">{selectedChallenge.participant_count}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Status</span>
                  <span className="stat-value">{selectedChallenge.status}</span>
                </div>
              </div>

              {selectedChallenge.rules && (
                <div className="details-rules">
                  <h4>Rules</h4>
                  <pre>{JSON.stringify(selectedChallenge.rules, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="leaderboard">
              <h4>🏆 Leaderboard</h4>
              {leaderboard.length === 0 ? (
                <p className="leaderboard-empty">No participants yet. Be the first to join!</p>
              ) : (
                <div className="leaderboard-list">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`leaderboard-entry ${entry.user_id === user.id ? 'current-user' : ''} ${index < 3 ? `rank-${index + 1}` : ''}`}
                    >
                      <div className="entry-rank">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${entry.rank}`}
                      </div>
                      <div className="entry-user">
                        {entry.display_name || entry.email}
                        {entry.user_id === user.id && <span className="you-badge">You</span>}
                      </div>
                      <div className="entry-progress">
                        {entry.progress} / {selectedChallenge.target_value}
                      </div>
                      <div className="entry-percentage">
                        {Math.round((entry.progress / selectedChallenge.target_value) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesPage;
