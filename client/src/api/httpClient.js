import axios from 'axios';

// creating axios instance for our backend
// baseURL is /api/v1 cuz that's where our express server handles api requests
const httpClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// attach token to every request if the user is logged in
// TODO: maybe refresh token if it's about to expire
// TODO: figure out why sometimes the token is undefined even though login worked
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // console.log('sending token:', token); // debug - remove later
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// if we get 401 it means token is invalid/expired, kick user to login
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, force re-login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default httpClient;
