import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Common / Status
  loading: false,
  error: null,
  isPaying: false,
  isSubmittingOverride: false,

  // Student Info & Term context
  currentSemester: 4,
  activeTerm: 'Spring 2026',
  maxCredits: 20,
  policies: null,

  // Financial / Billing
  billing: {
    studentId: '',
    studentName: 'Student',
    flatSemesterTuition: 2500,
    totalAmountDue: 2500,
    amountPaid: 0,
    balanceDue: 2500,
    paymentStatus: 'Pending',
    isFinancialHoldActive: true,
  },

  // Courses & Registrations
  courses: [],
  allCatalog: [],
  registrations: [],
  allRegistrations: [],
  allUserRegistrations: [],
  slots: [],
  announcements: [],
  overrides: [],
  facultyMap: {},

  // Academic Roadmap
  semHistory: {},
  earnedCredits: 0,
  peCourses: [],
  ieCourses: [],
  futureSemData: {},
  selectedCourses: {
    5: { core: {}, PE: {}, IE: {}, SEED: {} },
    6: { core: {}, PE: {}, IE: {}, SEED: {} },
    7: { core: {}, PE: {}, IE: {}, SEED: {} },
    8: { core: {}, PE: {}, IE: {}, SEED: {} },
  },
  claimed: { PE: {}, IE: {}, SEED: {} },
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setIsPaying(state, action) {
      state.isPaying = Boolean(action.payload);
    },
    setIsSubmittingOverride(state, action) {
      state.isSubmittingOverride = Boolean(action.payload);
    },
    setDashboardData(state, action) {
      const {
        billing,
        announcements,
        courses,
        allCatalog,
        allUserRegistrations,
        slots,
        policies,
        currentSemester,
        activeTerm,
        maxCredits,
      } = action.payload;

      if (billing !== undefined) state.billing = billing;
      if (announcements !== undefined) state.announcements = announcements;
      if (courses !== undefined) state.courses = courses;
      if (allCatalog !== undefined) state.allCatalog = allCatalog;
      if (allUserRegistrations !== undefined) state.allUserRegistrations = allUserRegistrations;
      if (slots !== undefined) state.slots = slots;
      if (policies !== undefined) state.policies = policies;
      if (currentSemester !== undefined) state.currentSemester = currentSemester;
      if (activeTerm !== undefined) state.activeTerm = activeTerm;
      if (maxCredits !== undefined) state.maxCredits = maxCredits;
    },
    setRegistrationData(state, action) {
      const {
        courses,
        registrations,
        allRegistrations,
        slots,
        overrides,
        billing,
        facultyMap,
        policies,
        currentSemester,
        activeTerm,
        maxCredits,
      } = action.payload;

      if (courses !== undefined) state.courses = courses;
      if (registrations !== undefined) state.registrations = registrations;
      if (allRegistrations !== undefined) state.allRegistrations = allRegistrations;
      if (slots !== undefined) state.slots = slots;
      if (overrides !== undefined) state.overrides = overrides;
      if (billing !== undefined) state.billing = billing;
      if (facultyMap !== undefined) state.facultyMap = facultyMap;
      if (policies !== undefined) state.policies = policies;
      if (currentSemester !== undefined) state.currentSemester = currentSemester;
      if (activeTerm !== undefined) state.activeTerm = activeTerm;
      if (maxCredits !== undefined) state.maxCredits = maxCredits;
    },
    setRoadmapData(state, action) {
      const { semHistory, earnedCredits, peCourses, ieCourses, futureSemData } = action.payload;
      if (semHistory !== undefined) state.semHistory = semHistory;
      if (earnedCredits !== undefined) state.earnedCredits = earnedCredits;
      if (peCourses !== undefined) state.peCourses = peCourses;
      if (ieCourses !== undefined) state.ieCourses = ieCourses;
      if (futureSemData !== undefined) state.futureSemData = futureSemData;
    },
    setSelectedCourses(state, action) {
      state.selectedCourses = action.payload;
    },
    setClaimed(state, action) {
      state.claimed = action.payload;
    },
    addRegistration(state, action) {
      const newReg = action.payload;
      state.registrations.push(newReg);
      state.allRegistrations.push(newReg);
      state.allUserRegistrations.push(newReg);
    },
    addOverride(state, action) {
      state.overrides.push(action.payload);
    },
    updateBilling(state, action) {
      state.billing = { ...state.billing, ...action.payload };
    },
    resetStudentState() {
      return initialState;
    },
  },
});

export const studentActions = studentSlice.actions;
export default studentSlice;

