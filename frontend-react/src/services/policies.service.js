import api from './api';

export const policiesService = {
  /**
   * Get academic policy settings and policy audit logs (AD2 / Dean / Student)
   */
  async getPolicies() {
    const res = await api.get('/policies');
    return res.data;
  },

  /**
   * Update academic policy settings (AD2 / Dean)
   * @param {Object} policyDto - { maxCredits, minCredits, enforcePrereqs, ... }
   */
  async updatePolicies(policyDto) {
    const res = await api.put('/policies', policyDto);
    return res.data;
  },

  /**
   * Get all enrollment phases (e.g. Priority Enrollment, Open Enrollment)
   */
  async getPhases() {
    const res = await api.get('/enrollment-phases');
    return res.data;
  },

  /**
   * Create a new enrollment phase (AD2 / Dean)
   * @param {Object} phaseData
   */
  async createPhase(phaseData) {
    const res = await api.post('/enrollment-phases', phaseData);
    return res.data;
  },

  /**
   * Update an enrollment phase (AD2 / Dean)
   * @param {number} id
   * @param {Object} phaseData
   */
  async updatePhase(id, phaseData) {
    const res = await api.put(`/enrollment-phases/${id}`, phaseData);
    return res.data;
  },

  /**
   * Delete an enrollment phase (AD2 / Dean)
   * @param {number} id
   */
  async deletePhase(id) {
    const res = await api.delete(`/enrollment-phases/${id}`);
    return res.data;
  },
};
