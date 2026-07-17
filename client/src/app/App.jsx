import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import AppRoutes from './routes';

// Main App - wraps everything in auth provider
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

export default App;
