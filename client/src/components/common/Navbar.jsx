import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // handle logout click - clears auth and sends to login page
  const handleLogout = () => {
    // console.log('user clicked logout');
    logout();
    navigate('/login');
  };

  // helper to check what role the user has
  // if no user, it's empty string so checks will fail safely
  const userRole = user?.role || '';

  // some inline styles cuz i didnt want to make a whole css file for navbar lol
  const brandStyle = { color: 'white', textDecoration: 'none', fontWeight: 'bold' };
  const pillStyle = { padding: '5px 10px', fontSize: '13px', borderRadius: '4px' };

  return (
    <nav className="navbar">
      <div className="brand">
        <NavLink to="/" style={brandStyle}>
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
            <span style={{ marginRight: '10px', color: '#e0e0e0' }}>
              {user?.name} ({userRole})
            </span>

            {/* Search is available for passengers, booking clerks, and admins */}
            {(userRole === 'Passenger' || userRole === 'Booking Clerk' || userRole === 'Admin') && (
              <NavLink to="/search">Search</NavLink>
            )}

            {/* Passenger specific stuff */}
            {userRole === 'Passenger' && (
              <NavLink to="/passenger/bookings">My Bookings</NavLink>
            )}

            {/* Booking Clerk */}
            {userRole === 'Booking Clerk' && (
              <NavLink to="/clerk/bookings/new">New Booking</NavLink>
            )}

            {/* Ops Staff and Admin manage operations */}
            {(userRole === 'Operations Staff' || userRole === 'Admin') && (
              <>
                <NavLink to="/operations/routes">Routes</NavLink>
                <NavLink to="/operations/transports">Transports</NavLink>
                <NavLink to="/operations/services">Services</NavLink>
              </>
            )}

            {/* Admin only - reports page */}
            {/* TODO: add more report types, currently only basic stuff */}
            {userRole === 'Admin' && (
              <NavLink to="/reports">Reports</NavLink>
            )}

            <button className="btn btn-danger" onClick={handleLogout} style={pillStyle}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
