import api from './api';

export const registrationsService = {
  /**
   * Get all registration records
   */
  async getAll() {
    const res = await api.get('/registrations');
    return res.data;
  },

  /**
   * Enroll a student in a course
   * @param {string} studentId - e.g. "S2024001"
   * @param {string} courseId - e.g. "CS101"
   */
  async enroll(studentId, courseId) {
    const res = await api.post('/registrations', {
      Student_ID: studentId,
      Course_ID: courseId,
    });
    return res.data;
  },

  /**
   * Submit/update final grade for a single registration (Faculty / Dean)
   * @param {number} id - Enrollment numeric ID
   * @param {string} finalGrade - e.g. "A", "B+", "F"
   */
  async updateGrade(id, finalGrade) {
    const res = await api.patch(`/registrations/${id}/grade`, {
      finalGrade,
    });
    return res.data;
  },

  /**
   * Batch-submit grades for multiple students simultaneously (Faculty / Dean)
   * @param {Array<{ enrollmentId: number, finalGrade: string }>} grades
   */
  async batchUpdateGrades(grades) {
    const res = await api.patch('/registrations/batch-grades', {
      grades,
    });
    return res.data;
  },

  /**
   * Assign a course section to a single registration (AD1 / Dean)
   * @param {number} id - Enrollment ID
   * @param {string} sectionId - e.g. "PC402-S1"
   */
  async assignSection(id, sectionId) {
    const res = await api.patch(`/registrations/${id}/section`, {
      sectionId,
    });
    return res.data;
  },

  /**
   * Batch-assign sections to multiple registrations (AD1 / Dean)
   * @param {Array<{ enrollmentId: number, sectionId: string }>} assignments
   */
  async batchAssignSections(assignments) {
    const res = await api.patch('/registrations/batch-sections', {
      assignments,
    });
    return res.data;
  },
};
