import { adminActions } from './admin-slice';
import { adminService } from '../../services/admin.service';

/**
 * Async Thunk: Fetch SPOC Admin operational dashboard
 */
export const fetchAdminDashboard = (spocId, instituteId) => {
  return async (dispatch) => {
    dispatch(adminActions.setLoading(true));
    dispatch(adminActions.setError(null));
    try {
      const data = await adminService.getDashboard(spocId, instituteId || undefined);
      dispatch(adminActions.setDashboard(data));
      return data;
    } catch (err) {
      console.error('Failed to load admin dashboard from backend:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch dashboard data from server';
      dispatch(adminActions.setError(msg));
      throw err;
    } finally {
      dispatch(adminActions.setLoading(false));
    }
  };
};

/**
 * Async Thunk: Update docket status and resolution notes
 */
export const updateDocketStatus = (docketId, status, resolutionNotes, spocId, instituteId) => {
  return async (dispatch) => {
    dispatch(adminActions.setIsSubmitting(true));
    try {
      const res = await adminService.updateDocketStatus(docketId, status, resolutionNotes);
      dispatch(
        adminActions.updateDocketInDashboard({
          docketId,
          status,
          resolutionNotes,
        })
      );
      if (spocId) {
        await dispatch(fetchAdminDashboard(spocId, instituteId));
      }
      return res;
    } catch (err) {
      console.error('Failed to update docket status:', err);
      throw err;
    } finally {
      dispatch(adminActions.setIsSubmitting(false));
    }
  };
};

/**
 * Async Thunk: Submit a new support ticket or administrative docket
 */
export const createDocket = (payload, spocId, instituteId) => {
  return async (dispatch) => {
    dispatch(adminActions.setIsSubmitting(true));
    try {
      const res = await adminService.createDocket(payload);
      if (res?.docket) {
        dispatch(adminActions.addDocketToDashboard(res.docket));
      }
      if (spocId) {
        await dispatch(fetchAdminDashboard(spocId, instituteId));
      }
      return res;
    } catch (err) {
      console.error('Failed to create docket:', err);
      throw err;
    } finally {
      dispatch(adminActions.setIsSubmitting(false));
    }
  };
};

/**
 * Async Thunk: Bulk import courses into course catalog
 */
export const bulkImportCourses = (courses) => {
  return async () => {
    return await adminService.bulkImportCourses(courses);
  };
};
