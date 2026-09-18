import api from './api';

export const authService = {
  /**
   * Log in a user with User_ID and Password
   * @param {string} userId - The user's ID/username
   * @param {string} password - The user's password
   * @returns {Promise<Object>} The session object: { User_ID, Full_Name, Role, Dept_ID, Email }
   */
  async login(userId, password) {
    const response = await api.post('/auth/login', {
      User_ID: userId,
      Password: password,
    });
    return response.data;
  },

  /**
   * Helper function: Maps a user role to their default dashboard URL route
   * @param {string} role - The role string returned by the backend
   * @returns {string} The URL path to navigate to
   */
  getDashboardRoute(role) {
    switch (role) {
      case 'Student':
        return '/student';
      case 'Faculty':
        return '/faculty';
      case 'Dean':
        return '/dean';
      case 'Assistant_Dean_1':
        return '/dean1';
      case 'Assistant_Dean_2':
        return '/dean2';
      case 'Super_User':
        return '/superuser';
      case 'Admin':
      case 'Lumina_SPOC':
        return '/admin';
      default:
        return '/';
    }
  },
};
