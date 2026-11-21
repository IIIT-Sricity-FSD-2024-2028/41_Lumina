import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dashboard: null,
  loading: false,
  error: null,
  currentInstituteId: null,
  isSubmitting: false,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setIsSubmitting(state, action) {
      state.isSubmitting = Boolean(action.payload);
    },
    setDashboard(state, action) {
      state.dashboard = action.payload;
      if (action.payload?.assignedInstitute?.instituteId && !state.currentInstituteId) {
        state.currentInstituteId = action.payload.assignedInstitute.instituteId;
      }
    },
    setCurrentInstituteId(state, action) {
      state.currentInstituteId = action.payload;
    },
    updateDocketInDashboard(state, action) {
      const { docketId, status, resolutionNotes } = action.payload;
      if (state.dashboard?.recentDockets) {
        state.dashboard.recentDockets = state.dashboard.recentDockets.map((docket) =>
          docket.docketId === docketId
            ? {
                ...docket,
                status,
                resolutionNotes,
                resolvedAt: new Date().toISOString(),
              }
            : docket
        );
      }
    },
    addDocketToDashboard(state, action) {
      if (state.dashboard?.recentDockets) {
        state.dashboard.recentDockets.unshift(action.payload);
      }
    },
    resetAdminState() {
      return initialState;
    },
  },
});

export const adminActions = adminSlice.actions;
export default adminSlice;
