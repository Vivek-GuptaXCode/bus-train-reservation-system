import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// i just import all the pages here, lazy loading was being weird
// maybe figure out React.lazy() later
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

// home redirect - sends logged in users to search, others to login
const HomeRedirect = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/search" replace />;
  }
  return <Navigate to="/login" replace />;
};

// all our app routes in one place
// FIXME: some routes might need different allowedRoles depending on business logic
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes - anyone can hit these */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Search stuff - passengers, clerks, and admins can all search */}
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

      {/* Seat selection - this is the page after search results */}
      {/* TODO: add a back button on this page so users can change their search */}
      <Route
        path="/service-runs/:id/seats"
        element={
          <ProtectedRoute allowedRoles={['Passenger', 'Booking Clerk', 'Admin']}>
            <SeatSelectionPage />
          </ProtectedRoute>
        }
      />

      {/* Booking and ticket detail pages */}
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

      {/* Passenger-only stuff */}
      <Route
        path="/passenger/bookings"
        element={
          <ProtectedRoute allowedRoles={['Passenger']}>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />

      {/* Booking Clerk pages */}
      <Route
        path="/clerk/bookings/new"
        element={
          <ProtectedRoute allowedRoles={['Booking Clerk']}>
            <ClerkNewBookingPage />
          </ProtectedRoute>
        }
      />

      {/* Operations management - for ops staff and admins */}
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

      {/* Reports page - admin only for now */}
      {/* 
      // maybe add these later
      <Route
        path="/operations/service-runs/:id"
        element={
          <ProtectedRoute allowedRoles={['Operations Staff', 'Admin']}>
            <ServiceRunDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      {/* 404 for anything else */}
      <Route path="*" element={<div className="container text-center mt-2"><h2>404 - Page Not Found</h2></div>} />
    </Routes>
  );
};

export default AppRoutes;
