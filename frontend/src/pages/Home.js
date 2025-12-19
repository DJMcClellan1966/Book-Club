import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <section className="hero">
        <h1>Welcome to Community Hub{user ? `, ${user.username || user.email?.split('@')[0]}!` : ''}</h1>
        <p className="hero-subtitle">
          Connect with fellow readers, share reviews, discuss books, and join video chats
        </p>
        {!user && (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </div>
        )}
      </section>

      <section className="features">
        <h2>What You Can Do</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Track Your Reading</h3>
            <p>Keep track of books you've read, are currently reading, or want to read</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">✍️</div>
            <h3>Share Reviews</h3>
            <p>Write and read reviews from the community about your favorite books</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Join Forums</h3>
            <p>Participate in text-based discussions about books and authors</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎥</div>
            <h3>Video Chat</h3>
            <p>Join live video discussions with other book lovers</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🏠</div>
            <h3>Create Spaces</h3>
            <p>Create temporary or permanent spaces for book discussions</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Discover Books</h3>
            <p>Search and explore millions of books with Google Books integration</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Start Your Reading Journey?</h2>
        <div className="cta-actions">
          <Link to="/books" className="btn btn-primary">Browse Books</Link>
          <Link to="/forums" className="btn btn-secondary">Explore Forums</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
