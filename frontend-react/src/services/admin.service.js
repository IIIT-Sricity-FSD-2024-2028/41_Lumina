import api from './api';

export const adminService = {
  // --- Admin & SPOC Operations ---

  /**
   * Get SPOC Admin operational dashboard
   * @param {string} spocId
   * @param {string} [instituteId]
   */
  async getDashboard(spocId, instituteId) {
    const res = await api.get(`/admin/dashboard/${spocId}`, {
      params: { instituteId },
    });
    return res.data;
  },

  /**
   * Get support dockets and registration exception tickets
   * @param {string} [spocId]
   * @param {string} [instituteId]
   */
  async getDockets(spocId, instituteId) {
    const res = await api.get('/admin/dockets', {
      params: { spocId, instituteId },
    });
    return res.data;
  },

  /**
   * Submit a new support ticket or administrative docket
   * @param {Object} payload
   */
  async createDocket(payload) {
    const res = await api.post('/admin/dockets', payload);
    return res.data;
  },

  /**
   * Update docket status and resolution notes
   * @param {string} id
   * @param {'Open' | 'In_Progress' | 'Resolved'} status
   * @param {string} [resolutionNotes]
   */
  async updateDocketStatus(id, status, resolutionNotes) {
    const res = await api.patch(`/admin/dockets/${id}/status`, {
      status,
      resolutionNotes,
    });
    return res.data;
  },

  /**
   * Bulk ingest courses for the institute
   * @param {Array} courses
   */
  async bulkImportCourses(courses) {
    const res = await api.post('/admin/bulk-import/courses', { courses });
    return res.data;
  },

  // --- Super User System & Logs Operations ---

  /**
   * View live system logs from disk (Super User only)
   * @param {'access' | 'error' | 'auth'} [type='access']
   * @param {number} [lines=50]
   */
  async getLogs(type = 'access', lines = 50) {
    const res = await api.get('/super-user/logs', {
      params: { type, lines },
    });
    return res.data;
  },

  /**
   * Trigger immediate log snapshot archival
   */
  async archiveLogs() {
    const res = await api.post('/super-user/logs/archive');
    return res.data;
  },

  /**
   * Get platform health status
   */
  async getSystemHealth() {
    const res = await api.get('/super-user/system-health');
    return res.data;
  },

  /**
   * Get list of client institutes
   */
  async getInstitutes() {
    const res = await api.get('/super-user/institutes');
    return res.data;
  },

  /**
   * Register a new client institute
   * @param {Object} instituteData
   */
  async createInstitute(instituteData) {
    const res = await api.post('/super-user/institutes', instituteData);
    return res.data;
  },
};
