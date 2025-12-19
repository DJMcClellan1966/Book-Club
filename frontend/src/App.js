import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './App.css';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Home from './pages/Home';
import Forums from './pages/Forums';
import ForumDetail from './pages/ForumDetail';
import Spaces from './pages/Spaces';
import SpaceDetail from './pages/SpaceDetail';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';
import Billing from './pages/Billing';
import AIChats from './pages/AIChats';

// Import components
import Navbar from './components/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/" element={<Home />} />
                <Route path="/forums" element={<Forums />} />
                <Route path="/forums/:id" element={<ForumDetail />} />
                <Route path="/spaces" element={<Spaces />} />
                <Route path="/spaces/:id" element={
                  <ProtectedRoute>
                    <SpaceDetail />
                  </ProtectedRoute>
                } />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } />
                <Route path="/billing" element={
                  <ProtectedRoute>
                    <Billing />
                  </ProtectedRoute>
                } />
                <Route path="/ai-chats" element={
                  <ProtectedRoute>
                    <AIChats />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
