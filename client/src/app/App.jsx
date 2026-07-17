import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import AppRoutes from './routes';

// main App component - this is the entry point for our react app
// wraps everything in AuthProvider so all components can access auth state
const App = () => {
  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <div className="container">
          <AppRoutes />
        </div>
      </div>
    </AuthProvider>
  );
};

// TODO: might need to add error boundary here for production

export default App;
