import api from './api';

export const usersService = {
  /**
   * Get all registered users (Students, Faculty, Staff)
   */
  async getAll() {
    const res = await api.get('/users');
    return res.data;
  },

  /**
   * Create a new user account (Dean / Admin)
   * @param {Object} userData - { User_ID, Full_Name, Email, Password, Role, Dept_ID }
   */
  async create(userData) {
    const res = await api.post('/users', userData);
    return res.data;
  },

  /**
   * Update an existing user
   * @param {string} id - User ID e.g. "F2024001"
   * @param {Object} userData - { Full_Name, Email, Role, Dept_ID }
   */
  async update(id, userData) {
    const res = await api.put(`/users/${id}`, userData);
    return res.data;
  },

  /**
   * Delete a user by ID (Dean / Admin)
   * @param {string} id - User ID
   */
  async delete(id) {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
};
