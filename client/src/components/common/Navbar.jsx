import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to check user role
  const userRole = user?.role || '';

  return (
    <nav className="navbar">
      <div className="brand">
        <NavLink to="/" style={{ color: 'white', textDecoration: 'none' }}>
          Bus &amp; Train Reservation
        </NavLink>
      </div>

      <div className="nav-links">
        {!isAuthenticated ? (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        ) : (
          <>
            {/* Show user name and role */}
            <span style={{ marginRight: '10px' }}>
              {user?.name} ({userRole})
            </span>

            {/* Search is available for passengers, booking clerks, and admins */}
            {(userRole === 'Passenger' || userRole === 'Booking Clerk' || userRole === 'Admin') && (
              <NavLink to="/search">Search</NavLink>
            )}

            {/* Passenger-specific links */}
            {userRole === 'Passenger' && (
              <NavLink to="/passenger/bookings">My Bookings</NavLink>
            )}

            {/* Booking Clerk */}
            {userRole === 'Booking Clerk' && (
              <NavLink to="/clerk/bookings/new">New Booking</NavLink>
            )}

            {/* Operations Staff and Admin can manage operations */}
            {(userRole === 'Operations Staff' || userRole === 'Admin') && (
              <>
                <NavLink to="/operations/routes">Routes</NavLink>
                <NavLink to="/operations/transports">Transports</NavLink>
                <NavLink to="/operations/services">Services</NavLink>
              </>
            )}

            {/* Reports for admin only */}
            {userRole === 'Admin' && (
              <NavLink to="/reports">Reports</NavLink>
            )}

            <button className="btn btn-danger" onClick={handleLogout} style={{ padding: '5px 10px', fontSize: '13px' }}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
