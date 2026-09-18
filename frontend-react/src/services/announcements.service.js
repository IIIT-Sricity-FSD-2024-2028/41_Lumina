import api from './api';

export const announcementsService = {
  /**
   * Get all departmental and campus announcements
   */
  async getAll() {
    const res = await api.get('/announcements');
    return res.data;
  },

  /**
   * Create an announcement (with optional file attachment)
   * @param {Object} data - { title, content, deptId, courseId }
   * @param {File} [file] - Optional attachment
   */
  async create(data, file) {
    if (file) {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) formData.append(key, data[key]);
      });
      formData.append('file', file);
      const res = await api.post('/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    }

    const res = await api.post('/announcements', data);
    return res.data;
  },

  /**
   * Update an existing announcement
   * @param {number} id
   * @param {Object} data
   */
  async update(id, data) {
    const res = await api.put(`/announcements/${id}`, data);
    return res.data;
  },

  /**
   * Delete an announcement
   * @param {number} id
   */
  async delete(id) {
    const res = await api.delete(`/announcements/${id}`);
    return res.data;
  },
};
