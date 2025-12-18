import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    bio: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchUserReviews();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`/api/users/${id}`);
      setProfile(response.data);
      setEditData({
        username: response.data.username,
        bio: response.data.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const response = await axios.get(`/api/reviews/user/${id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleFollow = async () => {
    try {
      await axios.post(`/api/users/${id}/follow`);
      fetchProfile();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.post(`/api/users/${id}/unfollow`);
      fetchProfile();
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/users/profile', editData);
      setEditing(false);
      fetchProfile();
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return <div className="error">User not found</div>;

  const isOwnProfile = currentUser?.id === id;
  const isFollowing = profile.followers?.some(f => f._id === currentUser?.id);

  return (
    <div className="profile-container">
      <div className="profile-header card">
        <div className="profile-avatar">
          <img src={profile.avatar} alt={profile.username} />
        </div>
        
        <div className="profile-info">
          {editing ? (
            <form onSubmit={handleUpdateProfile} className="edit-form">
              <input
                type="text"
                value={editData.username}
                onChange={(e) => setEditData({...editData, username: e.target.value})}
                placeholder="Username"
              />
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData({...editData, bio: e.target.value})}
                placeholder="Bio"
                rows={3}
              />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1>{profile.username}</h1>
              {profile.bio && <p className="bio">{profile.bio}</p>}
              
              <div className="profile-stats">
                <div className="stat">
                  <strong>{profile.followers?.length || 0}</strong> Followers
                </div>
                <div className="stat">
                  <strong>{profile.following?.length || 0}</strong> Following
                </div>
                <div className="stat">
                  <strong>
                    {(profile.readingList?.currentlyReading?.length || 0) +
                     (profile.readingList?.wantToRead?.length || 0) +
                     (profile.readingList?.read?.length || 0)}
                  </strong> Books
                </div>
              </div>

              <div className="profile-actions">
                {isOwnProfile ? (
                  <button onClick={() => setEditing(true)} className="btn btn-primary">
                    Edit Profile
                  </button>
                ) : (
                  currentUser && (
                    <button 
                      onClick={isFollowing ? handleUnfollow : handleFollow} 
                      className="btn btn-primary"
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="reading-lists card">
          <h2>Reading Lists</h2>
          
          <div className="list-section">
            <h3>📚 Currently Reading ({profile.readingList?.currentlyReading?.length || 0})</h3>
            {profile.readingList?.currentlyReading?.length > 0 ? (
              <div className="books-list">
                {profile.readingList.currentlyReading.map(book => (
                  <div key={book._id} className="book-item">
                    <img src={book.coverImage} alt={book.title} />
                    <span>{book.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-list">No books</p>
            )}
          </div>

          <div className="list-section">
            <h3>📖 Want to Read ({profile.readingList?.wantToRead?.length || 0})</h3>
            {profile.readingList?.wantToRead?.length > 0 ? (
              <div className="books-list">
                {profile.readingList.wantToRead.map(book => (
                  <div key={book._id} className="book-item">
                    <img src={book.coverImage} alt={book.title} />
                    <span>{book.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-list">No books</p>
            )}
          </div>

          <div className="list-section">
            <h3>✅ Read ({profile.readingList?.read?.length || 0})</h3>
            {profile.readingList?.read?.length > 0 ? (
              <div className="books-list">
                {profile.readingList.read.map(book => (
                  <div key={book._id} className="book-item">
                    <img src={book.coverImage} alt={book.title} />
                    <span>{book.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-list">No books</p>
            )}
          </div>
        </div>

        <div className="user-reviews card">
          <h2>Reviews ({reviews.length})</h2>
          {reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review._id} className="review-summary">
                <h4>{review.book?.title}</h4>
                <div className="review-rating">{'⭐'.repeat(review.rating)}</div>
                <p>{review.title}</p>
              </div>
            ))
          ) : (
            <p className="empty-list">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
