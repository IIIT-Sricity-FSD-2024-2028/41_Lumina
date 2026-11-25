import api from './api';

export const authService = {
  /**
   * Log in a user with User_ID and Password (supports both positional args and credentials object)
   * @param {string|Object} userIdOrCredentials - User ID string or credentials object
   * @param {string} [password] - The user's password if passing positional args
   * @returns {Promise<Object>} The session object: { User_ID, Full_Name, Role, Dept_ID, Email, accessToken }
   */
  async login(userIdOrCredentials, password) {
    let resolvedUserId = userIdOrCredentials;
    let resolvedPassword = password;

    if (typeof userIdOrCredentials === 'object' && userIdOrCredentials !== null) {
      resolvedUserId = userIdOrCredentials.User_ID || userIdOrCredentials.userId || '';
      resolvedPassword = userIdOrCredentials.Password || userIdOrCredentials.password || '';
    }

    const response = await api.post('/auth/login', {
      User_ID: typeof resolvedUserId === 'string' ? resolvedUserId.trim() : resolvedUserId,
      Password: resolvedPassword,
    });
    return response.data;
  },

  /**
   * Invalidate session server-side and clear client storage
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout notification skipped or failed:', err);
    } finally {
      localStorage.removeItem('Lumina_Session');
    }
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
        return '/ad1/dashboard';
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
