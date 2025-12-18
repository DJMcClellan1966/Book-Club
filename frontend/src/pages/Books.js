import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookCard from '../components/BookCard';
import './Books.css';

const Books = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedBooks();
  }, []);

  const fetchSavedBooks = async () => {
    try {
      const response = await axios.get('/api/books');
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/api/books/search?query=${searchQuery}`);
      setBooks(response.data);
    } catch (error) {
      setError('Error searching books. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = async (book) => {
    try {
      // Save book to database if not already saved
      const response = await axios.post('/api/books', book);
      navigate(`/books/${response.data._id}`);
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  return (
    <div className="books-container">
      <h1>Discover Books</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search for books by title, author, or ISBN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Searching...</div>}

      {books.length > 0 ? (
        <div className="grid">
          {books.map((book, index) => (
            <BookCard
              key={book._id || book.googleBooksId || index}
              book={book}
              onClick={() => handleBookClick(book)}
            />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="empty-state">
            <p>No books found. Try searching for something!</p>
          </div>
        )
      )}
    </div>
  );
};

export default Books;
