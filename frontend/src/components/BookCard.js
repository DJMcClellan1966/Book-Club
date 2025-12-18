import React from 'react';
import './BookCard.css';

const BookCard = ({ book, onClick }) => {
  return (
    <div className="book-card" onClick={onClick}>
      <div className="book-cover">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} />
        ) : (
          <div className="book-cover-placeholder">📖</div>
        )}
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-authors">
          {book.authors?.join(', ') || 'Unknown Author'}
        </p>
        {book.averageRating > 0 && (
          <div className="book-rating">
            ⭐ {book.averageRating.toFixed(1)} ({book.ratingsCount} reviews)
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
