import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for existing session
    loadSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        setSession(session);

        if (session) {
          // Load user profile
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loadSession = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { session, user: userData } = await authAPI.login(email, password);
      setSession(session);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, username) => {
    setLoading(true);
    try {
      const data = await authAPI.register(email, password, username);
      setSession(data.session);
      
      // Load full user profile
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
      
      return currentUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = async (updates) => {
    try {
      const updatedProfile = await authAPI.updateProfile(updates);
      setUser((prev) => ({ ...prev, ...updatedProfile }));
      return updatedProfile;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const getAccessToken = () => {
    return session?.access_token || null;
  };

  const value = {
    user,
    session,
    loading,
    login,
    register,
    logout,
    updateUser,
    getAccessToken,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
