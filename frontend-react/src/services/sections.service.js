import api from './api';

export const sectionsService = {
  /**
   * Get all course sections
   */
  async getAll() {
    const res = await api.get('/sections');
    return res.data;
  },

  /**
   * Create a new course section (AD1 / Dean)
   * @param {Object} sectionData - { sectionId, courseId, capacity, termId }
   */
  async create(sectionData) {
    const res = await api.post('/sections', sectionData);
    return res.data;
  },

  /**
   * Update section capacity or details (AD1 / Dean)
   * @param {string} id - e.g. "PC402-S1"
   * @param {Object} sectionData
   */
  async update(id, sectionData) {
    const res = await api.put(`/sections/${id}`, sectionData);
    return res.data;
  },

  /**
   * Delete a course section (AD1 / Dean)
   * @param {string} id - e.g. "PC402-S1"
   */
  async delete(id) {
    const res = await api.delete(`/sections/${id}`);
    return res.data;
  },
};
