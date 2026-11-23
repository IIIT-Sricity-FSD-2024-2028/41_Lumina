import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  institutes: [],
  adminTeam: [],
  systemHealth: null,
  logs: [],
  loading: false,
  logsLoading: false,
  error: null,
  isSubmitting: false,
};

const superuserSlice = createSlice({
  name: 'superuser',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    setLogsLoading(state, action) {
      state.logsLoading = Boolean(action.payload);
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setIsSubmitting(state, action) {
      state.isSubmitting = Boolean(action.payload);
    },
    setInstitutes(state, action) {
      state.institutes = action.payload || [];
    },
    setAdminTeam(state, action) {
      state.adminTeam = action.payload || [];
    },
    setSystemHealth(state, action) {
      state.systemHealth = action.payload || null;
    },
    setOverview(state, action) {
      const { institutes, adminTeam, systemHealth } = action.payload || {};
      if (institutes) state.institutes = institutes;
      if (adminTeam) state.adminTeam = adminTeam;
      if (systemHealth) state.systemHealth = systemHealth;
    },
    setLogs(state, action) {
      state.logs = action.payload || [];
    },
    resetSuperUserState() {
      return initialState;
    },
  },
});

export const superuserActions = superuserSlice.actions;
export default superuserSlice;
