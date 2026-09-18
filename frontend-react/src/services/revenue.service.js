import api from './api';

export const revenueService = {
  /**
   * Get institutional revenue, tuition collections, and SaaS metrics
   */
  async getSummary() {
    const res = await api.get('/revenue/summary');
    return res.data;
  },

  /**
   * Get public B2B SaaS plans
   */
  async getPlans() {
    const res = await api.get('/revenue/plans');
    return res.data;
  },

  /**
   * Get current active SaaS tier and enabled modules
   */
  async getActiveTier() {
    const res = await api.get('/revenue/tier');
    return res.data;
  },

  /**
   * Calculate real-time prorated invoice for upgrading/downgrading
   * @param {'Starter' | 'Campus' | 'Enterprise'} targetTier
   * @param {'monthly' | 'annual'} [billingCycle='annual']
   */
  async getProrationPreview(targetTier, billingCycle = 'annual') {
    const res = await api.get('/revenue/tier/proration-preview', {
      params: { targetTier, billingCycle },
    });
    return res.data;
  },

  /**
   * Update active SaaS tier
   * @param {'Starter' | 'Campus' | 'Enterprise'} tier
   * @param {'monthly' | 'annual'} billingCycle
   */
  async setActiveTier(tier, billingCycle = 'annual') {
    const res = await api.post('/revenue/tier', { tier, billingCycle });
    return res.data;
  },

  /**
   * Get student financial clearance roster
   */
  async getClearanceRoster() {
    const res = await api.get('/revenue/students/clearance-roster');
    return res.data;
  },

  /**
   * Get itemized semester tuition billing for a student
   * @param {string} studentId
   */
  async getStudentBilling(studentId) {
    const res = await api.get(`/revenue/student/${studentId}`);
    return res.data;
  },

  /**
   * Pay outstanding tuition balance for a student
   * @param {string} studentId
   * @param {number} amount
   */
  async payStudentTuition(studentId, amount) {
    const res = await api.post(`/revenue/student/${studentId}/pay`, { amount });
    return res.data;
  },

  /**
   * Waive tuition hold for a student (Dean / SPOC)
   * @param {string} studentId
   * @param {string} reason
   */
  async waiveHold(studentId, reason) {
    const res = await api.post(`/revenue/student/${studentId}/waive-hold`, { reason });
    return res.data;
  },
};
