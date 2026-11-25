import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  error: null,
  operationLoading: false,

  // Core Dean oversight datasets
  users: [],
  courses: [],
  registrations: [],
  revenueData: null,
  clearanceRoster: [],
  graceLifecycle: null,
  policies: {},
  phases: [],
  overrides: [],
};

const deanSlice = createSlice({
  name: 'dean',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setOperationLoading(state, action) {
      state.operationLoading = Boolean(action.payload);
    },
    setDeanDashboardData(state, action) {
      const {
        users,
        courses,
        registrations,
        revenueData,
        clearanceRoster,
        graceLifecycle,
        policies,
        phases,
        overrides,
      } = action.payload;

      if (users !== undefined) state.users = users || [];
      if (courses !== undefined) state.courses = courses || [];
      if (registrations !== undefined) state.registrations = registrations || [];
      if (revenueData !== undefined) state.revenueData = revenueData;
      if (clearanceRoster !== undefined) state.clearanceRoster = clearanceRoster || [];
      if (graceLifecycle !== undefined) state.graceLifecycle = graceLifecycle;
      if (policies !== undefined) state.policies = policies || {};
      if (phases !== undefined) state.phases = phases || [];
      if (overrides !== undefined) state.overrides = overrides || [];
    },
    setUsers(state, action) {
      state.users = action.payload || [];
    },
    addUser(state, action) {
      state.users.unshift(action.payload);
    },
    editUser(state, action) {
      const updated = action.payload;
      const targetId = updated.userId || updated.User_ID;
      const idx = state.users.findIndex(
        (u) => (u.userId || u.User_ID) === targetId
      );
      if (idx !== -1) {
        state.users[idx] = { ...state.users[idx], ...updated };
      }
    },
    removeUser(state, action) {
      const targetId = action.payload;
      state.users = state.users.filter(
        (u) => (u.userId || u.User_ID) !== targetId
      );
    },
    setCourses(state, action) {
      state.courses = action.payload || [];
    },
    setRegistrations(state, action) {
      state.registrations = action.payload || [];
    },
    updateRegistrationStatus(state, action) {
      const { enrollmentId, status } = action.payload;
      const idx = state.registrations.findIndex(
        (r) => (r.enrollmentId || r.Enrollment_ID) === enrollmentId
      );
      if (idx !== -1) {
        state.registrations[idx].status = status;
      }
    },
    setRevenueData(state, action) {
      state.revenueData = action.payload;
    },
    setClearanceRoster(state, action) {
      state.clearanceRoster = action.payload || [];
    },
    updateClearanceRosterItem(state, action) {
      const { studentId, updates } = action.payload;
      const idx = state.clearanceRoster.findIndex(
        (s) => (s.studentId || s.Student_ID) === studentId
      );
      if (idx !== -1) {
        state.clearanceRoster[idx] = { ...state.clearanceRoster[idx], ...updates };
      }
    },
    setGraceLifecycle(state, action) {
      state.graceLifecycle = action.payload;
    },
    setPolicies(state, action) {
      state.policies = action.payload || {};
    },
    setPhases(state, action) {
      state.phases = action.payload || [];
    },
    setOverrides(state, action) {
      state.overrides = action.payload || [];
    },
    updateOverrideStatus(state, action) {
      const { overrideId, status } = action.payload;
      const idx = state.overrides.findIndex(
        (o) => (o.overrideId || o.Override_ID) === overrideId
      );
      if (idx !== -1) {
        state.overrides[idx].status = status;
      }
    },
    resetDeanState() {
      return initialState;
    },
  },
});

export const deanActions = deanSlice.actions;
export default deanSlice;
