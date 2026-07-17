import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// wraps routes that need authentication
// if user is not logged in, redirect to login page
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();

  // show loading while checking auth state
  if (isLoading) {
    return <div className="loading">Checking authentication...</div>;
  }

  // not logged in? go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // if allowedRoles is specified, check if user has the right role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // user doesn't have the right role, redirect to search or home
      return <Navigate to="/search" replace />;
    }
  }

  // all good, render the protected content
  return children;
}

export default ProtectedRoute;
