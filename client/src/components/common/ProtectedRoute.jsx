import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// this component checks if the user is logged in before showing protected pages
// if not logged in -> sends them to login page
// if wrong role -> sends them to search page (or home?)

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();

  // while checking auth state, show this loading thing
  if (isLoading) {
    return <div className="loading">Checking authentication...</div>;
  }

  // not logged in? redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // role check - if roles are specified, make sure user has the right one
  // TODO: maybe show a "permission denied" message instead of just redirecting
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // console.log('user role mismatch:', user.role, 'needed one of:', allowedRoles);
      return <Navigate to="/search" replace />;
    }
  }

  // user is logged in and has the right role, show the page
  return children;
}

export default ProtectedRoute;
