import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // ── Home Dashboard ──────────────────────────────────────────────
  policies: {},
  activePhase: null,
  pendingOverridesCount: 0,
  metrics: {
    totalEnrolled: 0,
    yetToEnroll: 0,
    targetStudents: 0,
    enrollmentProgress: 0,
    totalCourses: 0,
  },
  ugBreakdown: [],

  // ── Shared raw data ─────────────────────────────────────────────
  users: [],
  courses: [],
  registrations: [],
  sections: [],

  // ── Enrollment Setup ────────────────────────────────────────────
  enrollmentSettings: {
    systemStatus: 'Active',
    windowStatus: 'Open',
    startDate: '',
    endDate: '',
  },
  phases: [],

  // ── Overrides ───────────────────────────────────────────────────
  overridesList: [],

  // ── Grade Sheets ────────────────────────────────────────────────
  gradesheetCourses: [],
  gradesheetRegistrations: [],

  // ── Gradesheet Detail ───────────────────────────────────────────
  gradesheetDetail: {
    course: null,
    term: 'Spring 2026',
    enrollments: [],
    sheetStatus: 'REVIEW',
    gpaStats: null,
  },

  // ── Policies ────────────────────────────────────────────────────
  policySettings: {
    academicYear: '2025-2026',
    term: 'Spring',
    termLocked: true,
    minCredits: 12,
    maxCredits: 21,
    maxCourses: 6,
    enforcePrereq: true,
    allowConditional: false,
    allowAdvisorOverride: true,
    minGpa: 5.0,
    financialClearance: true,
    advisorApproval: true,
    status: 'Validated',
    isLocked: false,
  },
  policyLogs: [],

  // ── Analytics ───────────────────────────────────────────────────
  analyticsLoaded: false,

  // ── UI state ────────────────────────────────────────────────────
  loading: false,
  actionLoading: false,
  saving: false,
  error: null,
};

const ad2Slice = createSlice({
  name: 'ad2',
  initialState,
  reducers: {
    // ── Generic loading flags ─────────────────────────────────────
    setLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    setActionLoading(state, action) {
      state.actionLoading = Boolean(action.payload);
    },
    setSaving(state, action) {
      state.saving = Boolean(action.payload);
    },
    setError(state, action) {
      state.error = action.payload;
    },

    // ── Home Dashboard ────────────────────────────────────────────
    setPolicies(state, action) {
      state.policies = action.payload;
    },
    setActivePhase(state, action) {
      state.activePhase = action.payload;
    },
    setPendingOverridesCount(state, action) {
      state.pendingOverridesCount = action.payload;
    },
    setMetrics(state, action) {
      state.metrics = { ...state.metrics, ...action.payload };
    },
    setUgBreakdown(state, action) {
      state.ugBreakdown = action.payload;
    },

    // ── Shared raw data ───────────────────────────────────────────
    setUsers(state, action) {
      state.users = action.payload;
    },
    setCourses(state, action) {
      state.courses = action.payload;
    },
    setRegistrations(state, action) {
      state.registrations = action.payload;
    },
    setSections(state, action) {
      state.sections = action.payload;
    },

    // ── Enrollment Setup ──────────────────────────────────────────
    setEnrollmentSettings(state, action) {
      state.enrollmentSettings = { ...state.enrollmentSettings, ...action.payload };
    },
    setPhases(state, action) {
      state.phases = action.payload;
    },
    addPhase(state, action) {
      state.phases.push(action.payload);
    },
    updatePhaseInList(state, action) {
      const updated = action.payload;
      state.phases = state.phases.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
    },
    removePhase(state, action) {
      state.phases = state.phases.filter((p) => p.id !== action.payload);
    },

    // ── Overrides ─────────────────────────────────────────────────
    setOverridesList(state, action) {
      state.overridesList = action.payload;
    },
    updateOverrideStatus(state, action) {
      const { id, status } = action.payload;
      state.overridesList = state.overridesList.map((r) =>
        r.id === id ? { ...r, status } : r
      );
    },

    // ── Gradesheets list ──────────────────────────────────────────
    setGradesheetCourses(state, action) {
      state.gradesheetCourses = action.payload;
    },
    setGradesheetRegistrations(state, action) {
      state.gradesheetRegistrations = action.payload;
    },

    // ── Gradesheet Detail ─────────────────────────────────────────
    setGradesheetDetailCourse(state, action) {
      state.gradesheetDetail.course = action.payload;
    },
    setGradesheetDetailTerm(state, action) {
      state.gradesheetDetail.term = action.payload;
    },
    setGradesheetDetailEnrollments(state, action) {
      state.gradesheetDetail.enrollments = action.payload;
    },
    setGradesheetDetailStatus(state, action) {
      state.gradesheetDetail.sheetStatus = action.payload;
    },
    setGradesheetDetailGpaStats(state, action) {
      state.gradesheetDetail.gpaStats = action.payload;
    },

    // ── Policies ──────────────────────────────────────────────────
    setPolicySettings(state, action) {
      state.policySettings = { ...state.policySettings, ...action.payload };
    },
    setPolicyLogs(state, action) {
      state.policyLogs = action.payload;
    },

    // ── Analytics flag ────────────────────────────────────────────
    setAnalyticsLoaded(state, action) {
      state.analyticsLoaded = Boolean(action.payload);
    },

    // ── Reset ─────────────────────────────────────────────────────
    resetAd2State() {
      return initialState;
    },
  },
});

export const ad2Actions = ad2Slice.actions;
export default ad2Slice;

