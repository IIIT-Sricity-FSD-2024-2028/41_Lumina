import api from './api';

export const coursesService = {
  /**
   * Get the full catalog of courses
   */
  async getAll() {
    const res = await api.get('/courses');
    return res.data;
  },

  /**
   * Get all prerequisite mappings between courses
   */
  async getPrerequisites() {
    const res = await api.get('/courses/prerequisites');
    return res.data;
  },

  /**
   * Get courses available for a specific student in the active term
   * @param {string} studentId - e.g. "S2024001"
   */
  async getForStudent(studentId) {
    const res = await api.get(`/courses/for-student/${studentId}`);
    return res.data;
  },

  /**
   * Create a new course in the catalog (AD1 / Dean only)
   * @param {Object} courseData
   */
  async create(courseData) {
    const res = await api.post('/courses', courseData);
    return res.data;
  },

  /**
   * Update an existing course (AD1 / Dean only)
   * @param {string} id - Course ID e.g. "CS101"
   * @param {Object} courseData
   */
  async update(id, courseData) {
    const res = await api.put(`/courses/${id}`, courseData);
    return res.data;
  },

  /**
   * Get degree completion requirements for student roadmap & degree audit
   */
  async getDegreeRequirements() {
    const res = await api.get('/degree-requirements');
    return res.data;
  },
};
