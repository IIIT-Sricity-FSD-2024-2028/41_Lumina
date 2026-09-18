import axios from 'axios';

// 1. Create the Axios client with defaults
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor (runs BEFORE every single outgoing request)
api.interceptors.request.use(
  (config) => {
    // Read the saved session from browser storage
    const sessionData = localStorage.getItem('Lumina_Session');
    if (sessionData) {
      try {
        const user = JSON.parse(sessionData);
        // Attach the user's role to the request headers
        if (user.Role) {
          config.headers['x-role'] = user.Role;
        }
        // If there's an auth token, attach it too
        if (user.token) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error('Failed to parse Lumina_Session', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor (runs whenever a response arrives from the backend)
api.interceptors.response.use(
  (response) => response, // If request succeeded (200 OK), just pass it through
  (error) => {
    // If backend rejected because session expired or invalid
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('Lumina_Session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;