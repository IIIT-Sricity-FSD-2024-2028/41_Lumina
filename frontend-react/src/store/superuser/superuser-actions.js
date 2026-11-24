import { superuserActions } from './superuser-slice';
import { adminService } from '../../services/admin.service';
import { revenueService } from '../../services/revenue.service';

/**
 * Async Thunk: Fetch Super User overview (institutes, admin staff, system health)
 */
export const fetchSuperUserOverview = () => {
  return async (dispatch) => {
    dispatch(superuserActions.setLoading(true));
    dispatch(superuserActions.setError(null));
    try {
      const [instData, teamData, healthData] = await Promise.allSettled([
        adminService.getInstitutes(),
        adminService.getAdminTeam(),
        adminService.getSystemHealth(),
      ]);

      const institutes = instData.status === 'fulfilled' && Array.isArray(instData.value) ? instData.value : [];
      const adminTeam = teamData.status === 'fulfilled' && Array.isArray(teamData.value) ? teamData.value : [];
      const systemHealth = healthData.status === 'fulfilled' && healthData.value ? healthData.value : null;

      dispatch(superuserActions.setOverview({ institutes, adminTeam, systemHealth }));
      return { institutes, adminTeam, systemHealth };
    } catch (err) {
      console.error('Failed to load superuser overview from backend:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to fetch platform overview';
      dispatch(superuserActions.setError(msg));
      throw err;
    } finally {
      dispatch(superuserActions.setLoading(false));
    }
  };
};

/**
 * Async Thunk: Fetch access / system logs
 */
export const fetchSuperUserLogs = (logType = 'access', limit = 100, isBackground = false) => {
  return async (dispatch) => {
    if (!isBackground) dispatch(superuserActions.setLogsLoading(true));
    try {
      const res = await adminService.getLogs(logType, limit);
      let rawLines = [];
      if (Array.isArray(res)) {
        rawLines = res;
      } else if (res && Array.isArray(res.logs)) {
        rawLines = res.logs;
      } else if (res && Array.isArray(res.lines)) {
        rawLines = res.lines;
      }
      return rawLines;
    } catch (err) {
      console.warn('System log stream unavailable:', err);
      throw err;
    } finally {
      if (!isBackground) dispatch(superuserActions.setLogsLoading(false));
    }
  };
};

/**
 * Async Thunk: Update institute tenant details & seat quota
 */
export const updateInstitute = (instId, payload) => {
  return async (dispatch) => {
    dispatch(superuserActions.setIsSubmitting(true));
    try {
      const res = await adminService.updateInstitute(instId, payload);
      await dispatch(fetchSuperUserOverview());
      return res;
    } catch (err) {
      console.error('Failed to update institute:', err);
      throw err;
    } finally {
      dispatch(superuserActions.setIsSubmitting(false));
    }
  };
};

/**
 * Async Thunk: Assign SPOC to an institute
 */
export const assignSpoc = (instId, spocId) => {
  return async (dispatch) => {
    dispatch(superuserActions.setIsSubmitting(true));
    try {
      const res = await adminService.assignSpoc(instId, spocId);
      await dispatch(fetchSuperUserOverview());
      return res;
    } catch (err) {
      console.error('Failed to assign SPOC:', err);
      throw err;
    } finally {
      dispatch(superuserActions.setIsSubmitting(false));
    }
  };
};

/**
 * Async Thunk: Change institute subscription tier
 */
export const updateInstituteTier = (instId, tier) => {
  return async (dispatch) => {
    dispatch(superuserActions.setIsSubmitting(true));
    try {
      const res = await adminService.updateInstituteTier(instId, tier);
      revenueService.setActiveTier(tier).catch(() => null);
      await dispatch(fetchSuperUserOverview());
      return res;
    } catch (err) {
      console.error('Failed to change subscription tier:', err);
      throw err;
    } finally {
      dispatch(superuserActions.setIsSubmitting(false));
    }
  };
};

/**
 * Async Thunk: Archive institute tenant
 */
export const archiveInstitute = (instId) => {
  return async (dispatch) => {
    dispatch(superuserActions.setIsSubmitting(true));
    try {
      const res = await adminService.archiveInstitute(instId);
      await dispatch(fetchSuperUserOverview());
      return res;
    } catch (err) {
      console.error('Failed to archive tenant:', err);
      throw err;
    } finally {
      dispatch(superuserActions.setIsSubmitting(false));
    }
  };
};

/**
 * Async Thunk: Add new Admin SPOC
 */
export const addAdminSpoc = (payload) => {
  return async (dispatch) => {
    dispatch(superuserActions.setIsSubmitting(true));
    try {
      const res = await adminService.addAdminSpoc(payload);
      await dispatch(fetchSuperUserOverview());
      return res;
    } catch (err) {
      console.error('Failed to add admin SPOC:', err);
      throw err;
    } finally {
      dispatch(superuserActions.setIsSubmitting(false));
    }
  };
};

/**
 * Async Thunk: Offboard / Delete Admin SPOC
 */
export const deleteAdminSpoc = (adminId) => {
  return async (dispatch) => {
    dispatch(superuserActions.setIsSubmitting(true));
    try {
      const res = await adminService.deleteAdminSpoc(adminId);
      await dispatch(fetchSuperUserOverview());
      return res;
    } catch (err) {
      console.error('Failed to delete admin SPOC:', err);
      throw err;
    } finally {
      dispatch(superuserActions.setIsSubmitting(false));
    }
  };
};

/**
 * Async Thunk: Provision / Onboard new university tenant
 */
export const createInstitute = (payload) => {
  return async (dispatch) => {
    dispatch(superuserActions.setIsSubmitting(true));
    try {
      const res = await adminService.createInstitute(payload);
      await dispatch(fetchSuperUserOverview());
      return res;
    } catch (err) {
      console.error('Failed to create institute:', err);
      throw err;
    } finally {
      dispatch(superuserActions.setIsSubmitting(false));
    }
  };
};
