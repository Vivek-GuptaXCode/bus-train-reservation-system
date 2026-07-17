import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../api/authApi';

// create the auth context
const AuthContext = createContext(null);

// hook to use auth context in any component
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

// the provider that wraps the whole app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // check if user is already logged in when app loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      // we have a token and saved user, verify it's still valid
      setUser(JSON.parse(savedUser));

      // try to refresh user data from server
      getMe()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          // token might be expired, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // login function - calls API and saves token
  const login = useCallback(async (name, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await loginApi(name, password);

      if (res.success && res.data) {
        const { token, user: userData } = res.data;

        // save to localStorage so we survive page refreshes
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        return userData;
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // register function - creates account then returns
  const registerUser = useCallback(async (data) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await registerApi(data);

      if (res.success) {
        return res.data;
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // logout - clear everything
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  }, []);

  // this is what components will get when they call useAuth()
  const value = {
    user,
    login,
    logout,
    register: registerUser,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
