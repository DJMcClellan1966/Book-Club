import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './BookDetail.css';

const BookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    content: ''
  });

  useEffect(() => {
    fetchBookDetails();
    fetchReviews();
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      const response = await axios.get(`/api/books/${id}`);
      setBook(response.data);
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/reviews/book/${id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToList = async (listType) => {
    if (!user) {
      alert('Please login to add books to your reading list');
      return;
    }

    try {
      await axios.post(`/api/users/reading-list/${listType}`, { bookId: id });
      alert('Book added to your reading list!');
    } catch (error) {
      console.error('Error adding to list:', error);
      alert('Error adding book to list');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/reviews', {
        book: id,
        ...reviewData
      });
      setShowReviewForm(false);
      setReviewData({ rating: 5, title: '', content: '' });
      fetchReviews();
      fetchBookDetails(); // Refresh to update rating
      alert('Review submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting review');
    }
  };

  const handleAffiliateClick = async (platform) => {
    try {
      // Get affiliate link
      const linkResponse = await axios.get(`/api/affiliates/book/${id}/link/${platform}`);
      const { affiliateLink } = linkResponse.data;

      // Track the click
      await axios.post('/api/affiliates/track-click', {
        bookId: id,
        platform,
        affiliateLink
      });

      // Open link in new tab
      window.open(affiliateLink, '_blank');
    } catch (error) {
      console.error('Error with affiliate link:', error);
      alert('Unable to generate purchase link. This book may not have ISBN information.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!book) return <div className="error">Book not found</div>;

  return (
    <div className="book-detail-container">
      <div className="book-header">
        <div className="book-cover-large">
          {book.coverImage ? (
            <img src={book.coverImage} alt={book.title} />
          ) : (
            <div className="cover-placeholder">📖</div>
          )}
        </div>
        
        <div className="book-info-detailed">
          <h1>{book.title}</h1>
          <p className="authors">by {book.authors?.join(', ') || 'Unknown Author'}</p>
          
          {book.averageRating > 0 && (
            <div className="rating-display">
              ⭐ {book.averageRating.toFixed(1)} ({book.ratingsCount} reviews)
            </div>
          )}
          
          {book.description && (
            <p className="description">{book.description}</p>
          )}
          
          <div className="book-meta">
            {book.publishedDate && <p><strong>Published:</strong> {book.publishedDate}</p>}
            {book.pageCount && <p><strong>Pages:</strong> {book.pageCount}</p>}
            {book.categories && book.categories.length > 0 && (
              <p><strong>Categories:</strong> {book.categories.join(', ')}</p>
            )}
          </div>
          
          {user && (
            <div className="action-buttons">
              <button onClick={() => handleAddToList('currentlyReading')} className="btn btn-primary">
                Currently Reading
              </button>
              <button onClick={() => handleAddToList('wantToRead')} className="btn btn-secondary">
                Want to Read
              </button>
              <button onClick={() => handleAddToList('read')} className="btn btn-secondary">
                Already Read
              </button>
            </div>
          )}
          
          <div className="purchase-links">
            <h3>Buy this book:</h3>
            <div className="affiliate-buttons">
              <button onClick={() => handleAffiliateClick('amazon')} className="affiliate-btn amazon">
                <span>📚</span> Amazon
              </button>
              <button onClick={() => handleAffiliateClick('bookshop')} className="affiliate-btn bookshop">
                <span>📖</span> Bookshop.org
              </button>
              <button onClick={() => handleAffiliateClick('barnes-noble')} className="affiliate-btn barnes-noble">
                <span>🏪</span> Barnes & Noble
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Reviews</h2>
          {user && (
            <button 
              onClick={() => setShowReviewForm(!showReviewForm)} 
              className="btn btn-primary"
            >
              Write a Review
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="review-form card">
            <h3>Write Your Review</h3>
            
            <label>
              Rating
              <select 
                value={reviewData.rating}
                onChange={(e) => setReviewData({...reviewData, rating: Number(e.target.value)})}
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
                <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
                <option value={3}>⭐⭐⭐ (3 stars)</option>
                <option value={2}>⭐⭐ (2 stars)</option>
                <option value={1}>⭐ (1 star)</option>
              </select>
            </label>
            
            <label>
              Title
              <input
                type="text"
                value={reviewData.title}
                onChange={(e) => setReviewData({...reviewData, title: e.target.value})}
                required
                placeholder="Sum up your review"
              />
            </label>
            
            <label>
              Your Review
              <textarea
                value={reviewData.content}
                onChange={(e) => setReviewData({...reviewData, content: e.target.value})}
                required
                rows={6}
                placeholder="Share your thoughts about this book"
              />
            </label>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Submit Review</button>
              <button type="button" onClick={() => setShowReviewForm(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="reviews-list">
          {reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review._id} className="review-card card">
                <div className="review-header">
                  <div>
                    <h4>{review.title}</h4>
                    <p className="reviewer">by {review.user?.username}</p>
                  </div>
                  <div className="review-rating">
                    {'⭐'.repeat(review.rating)}
                  </div>
                </div>
                <p className="review-content">{review.content}</p>
                <div className="review-footer">
                  <span>👍 {review.likes?.length || 0} likes</span>
                  <span>💬 {review.comments?.length || 0} comments</span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">No reviews yet. Be the first to review this book!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
