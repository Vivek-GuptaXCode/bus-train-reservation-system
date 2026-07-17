import httpClient from './httpClient';

// FIXME: password should probably be hashed before sending
// but the server handles that anyway so maybe it's fine?

// login a user - takes name/email and password
// returns token + user object on success
export const login = async (name, password) => {
  const res = await httpClient.post('/auth/login', { name, password });
  return res.data;
};

// register a new account
// data should have: name, email, password, role, phone_number
export const register = async (data) => {
  const res = await httpClient.post('/auth/register', data);
  return res.data;
};

// getting the current user info from the token
// the server reads the token from Authorization header
export const getMe = async () => {
  const res = await httpClient.get('/auth/me');
  // console.log('getMe response:', res); // sometimes this fails, check network tab
  return res.data;
};
