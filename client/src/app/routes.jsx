import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// Lazy import pages so they only load when needed
// (Or just import them directly - keeping it simple for a student project)
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import SearchPage from '../pages/SearchPage';
import SearchResultsPage from '../pages/SearchResultsPage';
import SeatSelectionPage from '../pages/SeatSelectionPage';
import BookingDetailPage from '../pages/BookingDetailPage';
import TicketDetailPage from '../pages/TicketDetailPage';
import MyBookingsPage from '../pages/MyBookingsPage';
import ClerkNewBookingPage from '../pages/ClerkNewBookingPage';
import RoutesPage from '../pages/RoutesPage';
import TransportsPage from '../pages/TransportsPage';
import ServicesPage from '../pages/ServicesPage';
import ServiceRunsPage from '../pages/ServiceRunsPage';
import ReportsPage from '../pages/ReportsPage';

// Fallback home redirect based on auth status
const HomeRedirect = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/search" replace />;
  }
  return <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Search routes - passengers, booking clerks, and admins can search */}
      <Route
        path="/search"
        element={
          <ProtectedRoute allowedRoles={['Passenger', 'Booking Clerk', 'Admin']}>
            <SearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search/results"
        element={
          <ProtectedRoute allowedRoles={['Passenger', 'Booking Clerk', 'Admin']}>
            <SearchResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-runs/:id/seats"
        element={
          <ProtectedRoute allowedRoles={['Passenger', 'Booking Clerk', 'Admin']}>
            <SeatSelectionPage />
          </ProtectedRoute>
        }
      />

      {/* Booking routes */}
      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute>
            <BookingDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Passenger routes */}
      <Route
        path="/passenger/bookings"
        element={
          <ProtectedRoute allowedRoles={['Passenger']}>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />

      {/* Booking Clerk routes */}
      <Route
        path="/clerk/bookings/new"
        element={
          <ProtectedRoute allowedRoles={['Booking Clerk']}>
            <ClerkNewBookingPage />
          </ProtectedRoute>
        }
      />

      {/* Operations routes */}
      <Route
        path="/operations/routes"
        element={
          <ProtectedRoute allowedRoles={['Operations Staff', 'Admin']}>
            <RoutesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operations/transports"
        element={
          <ProtectedRoute allowedRoles={['Operations Staff', 'Admin']}>
            <TransportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operations/services"
        element={
          <ProtectedRoute allowedRoles={['Operations Staff', 'Admin']}>
            <ServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operations/service-runs"
        element={
          <ProtectedRoute allowedRoles={['Operations Staff', 'Admin']}>
            <ServiceRunsPage />
          </ProtectedRoute>
        }
      />

      {/* Reports - admin only */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all for unknown routes */}
      <Route path="*" element={<div className="container text-center mt-2"><h2>404 - Page Not Found</h2></div>} />
    </Routes>
  );
};

export default AppRoutes;
