import { deanActions } from './dean-slice';
import { usersService } from '../../services/users.service';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { revenueService } from '../../services/revenue.service';
import { policiesService } from '../../services/policies.service';
import { overridesService } from '../../services/overrides.service';

/**
 * Fetch all initial datasets for Dean Console
 */
export const fetchDeanDashboardData = () => {
  return async (dispatch) => {
    dispatch(deanActions.setLoading(true));
    dispatch(deanActions.setError(null));

    try {
      const [
        uRes,
        cRes,
        rRes,
        revRes,
        clearRes,
        lifeRes,
        polRes,
        phasesRes,
        ovRes,
      ] = await Promise.allSettled([
        usersService.getAll(),
        coursesService.getAll(),
        registrationsService.getAll(),
        revenueService.getSummary(),
        revenueService.getClearanceRoster(),
        revenueService.getLifecycle(),
        policiesService.getPolicies(),
        policiesService.getPhases(),
        overridesService.getAll(),
      ]);

      const users = uRes.status === 'fulfilled' && Array.isArray(uRes.value) ? uRes.value : [];
      const courses = cRes.status === 'fulfilled' && Array.isArray(cRes.value) ? cRes.value : [];
      const registrations = rRes.status === 'fulfilled' && Array.isArray(rRes.value) ? rRes.value : [];
      const revenueData = revRes.status === 'fulfilled' ? revRes.value : null;
      const clearanceRoster = clearRes.status === 'fulfilled' && Array.isArray(clearRes.value) ? clearRes.value : [];
      const graceLifecycle = lifeRes.status === 'fulfilled' ? lifeRes.value : null;
      const policies = polRes.status === 'fulfilled' && polRes.value ? (polRes.value.settings || polRes.value) : {};
      const phases = phasesRes.status === 'fulfilled' && Array.isArray(phasesRes.value) ? phasesRes.value : [];
      const overrides = ovRes.status === 'fulfilled' && Array.isArray(ovRes.value) ? ovRes.value : [];

      dispatch(
        deanActions.setDeanDashboardData({
          users,
          courses,
          registrations,
          revenueData,
          clearanceRoster,
          graceLifecycle,
          policies,
          phases,
          overrides,
        })
      );

      return {
        users,
        courses,
        registrations,
        revenueData,
        clearanceRoster,
        graceLifecycle,
        policies,
        phases,
        overrides,
      };
    } catch (err) {
      console.error('Failed to fetch Dean dashboard data', err);
      dispatch(deanActions.setError(err.message || 'Failed to load Dean dashboard data'));
      throw err;
    } finally {
      dispatch(deanActions.setLoading(false));
    }
  };
};

/**
 * Fetch and refresh system users
 */
export const fetchUsersAction = () => {
  return async (dispatch) => {
    try {
      const users = await usersService.getAll();
      dispatch(deanActions.setUsers(users));
      return users;
    } catch (err) {
      console.error('Failed to fetch users', err);
      throw err;
    }
  };
};

/**
 * Create a new user in system
 */
export const createUserAction = (userData) => {
  return async (dispatch) => {
    try {
      const result = await usersService.create(userData);
      const refreshedUsers = await usersService.getAll();
      dispatch(deanActions.setUsers(refreshedUsers));
      return result;
    } catch (err) {
      console.error('Failed to create user', err);
      throw err;
    }
  };
};

/**
 * Update an existing user in system
 */
export const updateUserAction = (userId, userData) => {
  return async (dispatch) => {
    try {
      const result = await usersService.update(userId, userData);
      const refreshedUsers = await usersService.getAll();
      dispatch(deanActions.setUsers(refreshedUsers));
      return result;
    } catch (err) {
      console.error('Failed to update user', err);
      throw err;
    }
  };
};

/**
 * Delete a user from system
 */
export const deleteUserAction = (userId) => {
  return async (dispatch) => {
    try {
      const result = await usersService.delete(userId);
      const refreshedUsers = await usersService.getAll();
      dispatch(deanActions.setUsers(refreshedUsers));
      return result;
    } catch (err) {
      console.error('Failed to delete user', err);
      throw err;
    }
  };
};

/**
 * Record student tuition payment and refresh financial data
 */
export const recordStudentPaymentAction = (studentId, amount = 2500) => {
  return async (dispatch) => {
    try {
      const res = await revenueService.payStudentTuition(studentId, amount);
      const [revRes, clearRes] = await Promise.all([
        revenueService.getSummary(),
        revenueService.getClearanceRoster(),
      ]);
      dispatch(deanActions.setRevenueData(revRes));
      dispatch(deanActions.setClearanceRoster(clearRes));
      return res;
    } catch (err) {
      console.error('Failed to record student payment', err);
      throw err;
    }
  };
};

/**
 * Waive student financial hold and refresh financial data
 */
export const waiveStudentHoldAction = (studentId, reason) => {
  return async (dispatch) => {
    try {
      const res = await revenueService.waiveHold(studentId, reason);
      const [revRes, clearRes] = await Promise.all([
        revenueService.getSummary(),
        revenueService.getClearanceRoster(),
      ]);
      dispatch(deanActions.setRevenueData(revRes));
      dispatch(deanActions.setClearanceRoster(clearRes));
      return res;
    } catch (err) {
      console.error('Failed to waive financial hold', err);
      throw err;
    }
  };
};

/**
 * Upgrade or change active SaaS subscription tier
 */
export const updateSaasTierAction = (tier, billingCycle) => {
  return async (dispatch) => {
    try {
      const res = await revenueService.setActiveTier(tier, billingCycle);
      const [revRes, lifeRes] = await Promise.all([
        revenueService.getSummary(),
        revenueService.getLifecycle(),
      ]);
      dispatch(deanActions.setRevenueData(revRes));
      dispatch(deanActions.setGraceLifecycle(lifeRes));
      return res;
    } catch (err) {
      console.error('Failed to update SaaS subscription tier', err);
      throw err;
    }
  };
};

/**
 * Cancel SaaS subscription auto-renewal
 */
export const cancelSaasSubscriptionAction = () => {
  return async (dispatch) => {
    try {
      const res = await revenueService.cancelSubscription();
      const revRes = await revenueService.getSummary();
      dispatch(deanActions.setRevenueData(revRes));
      return res;
    } catch (err) {
      console.error('Failed to cancel SaaS subscription', err);
      throw err;
    }
  };
};

/**
 * Toggle grace period simulation
 */
export const toggleGracePeriodAction = (enable) => {
  return async (dispatch) => {
    try {
      const res = await revenueService.simulateGracePeriod(enable);
      const [revRes, lifeRes] = await Promise.all([
        revenueService.getSummary(),
        revenueService.getLifecycle(),
      ]);
      dispatch(deanActions.setRevenueData(revRes));
      dispatch(deanActions.setGraceLifecycle(lifeRes));
      return res;
    } catch (err) {
      console.error('Failed to toggle grace period', err);
      throw err;
    }
  };
};
