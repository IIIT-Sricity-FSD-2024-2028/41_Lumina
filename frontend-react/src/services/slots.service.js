import api from './api';

export const slotsService = {
  /**
   * Get all timetable course slots
   */
  async getAll() {
    const res = await api.get('/course-slots');
    return res.data;
  },

  /**
   * Create a new timetable course slot (AD1 / Dean)
   * @param {Object} slotData - { sectionId, facultyId, roomNumber, dayOfWeek, startTime, endTime }
   */
  async create(slotData) {
    const res = await api.post('/course-slots', slotData);
    return res.data;
  },

  /**
   * Upload a syllabus document for a course slot (AD1, Dean, Faculty)
   * @param {number} slotId
   * @param {File} file - PDF / document file object
   */
  async uploadSyllabus(slotId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/course-slots/${slotId}/syllabus`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  /**
   * Update an existing timetable course slot (AD1 / Dean)
   * @param {number} slotId
   * @param {Object} slotData
   */
  async update(slotId, slotData) {
    const res = await api.put(`/course-slots/${slotId}`, slotData);
    return res.data;
  },

  /**
   * Delete a course slot (AD1 / Dean)
   * @param {number} slotId
   */
  async delete(slotId) {
    const res = await api.delete(`/course-slots/${slotId}`);
    return res.data;
  },
};
