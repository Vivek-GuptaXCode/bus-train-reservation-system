import httpClient from './httpClient';

// FIXME: password should probably be hashed before sending

/**
 * Log in with username/email and password
 */
export const login = async (name, password) => {
  const response = await httpClient.post('/auth/login', { name, password });
  return response.data;
};

/**
 * Register a new user
 * @param {Object} data - { name, email, password, role, phone_number }
 */
export const register = async (data) => {
  const response = await httpClient.post('/auth/register', data);
  return response.data;
};

/**
 * Get current logged-in user info from token
 */
export const getMe = async () => {
  const response = await httpClient.get('/auth/me');
  return response.data;
};
