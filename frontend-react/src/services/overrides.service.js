import api from './api';

export const overridesService = {
  /**
   * Get all override requests across the university (Dean / AD1 / AD2)
   */
  async getAll() {
    const res = await api.get('/overrides');
    return res.data;
  },

  /**
   * Get override requests submitted by a specific student
   * @param {string} studentId
   */
  async getByStudent(studentId) {
    const res = await api.get(`/overrides/my/${studentId}`);
    return res.data;
  },

  /**
   * Submit an override request for a course (Student)
   * @param {Object} overrideData - { Student_ID, Course_ID, Reason }
   */
  async create(overrideData) {
    const res = await api.post('/overrides', overrideData);
    return res.data;
  },

  /**
   * Approve or reject an override request (AD1 / AD2)
   * @param {number} id - Numeric override ID
   * @param {'Approved' | 'Rejected'} status
   */
  async updateStatus(id, status) {
    const res = await api.patch(`/overrides/${id}/status`, {
      Approval_Status: status,
    });
    return res.data;
  },
};
