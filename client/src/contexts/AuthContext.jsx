import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../api/authApi';

// got this pattern from a react tutorial on youtube lol
// create the auth context - this is basically global state
const AuthContext = createContext(null);

// hook to use auth context in any component
// throwing an error if someone uses it outside provider (saw this in a tutorial)
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
  // we store token + user in localStorage so they don't have to login every time
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      // we have a token, so just try to refresh from server
      setUser(JSON.parse(savedUser));

      // verify the token is still good
      getMe()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        })
        .catch((err) => {
          // console.log('token expired probably', err);
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
  // TODO: should add proper validation here maybe
  const login = async (name, password) => {
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
        throw new Error(res.message || 'Login failed somehow');
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // register function - creates account then returns user data
  const registerUser = async (data) => {
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
  };

  // logout - just clears everything from state and localStorage
  const logout = () => {
    // console.log('logging out user:', user?.name);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  // this is what components will get when they call useAuth()
  // added isAuthenticated cuz the navbar kept showing login link even after login lol
  const value = {
    user,
    isAuthenticated: !!user,
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
