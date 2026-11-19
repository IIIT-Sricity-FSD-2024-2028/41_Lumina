import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // General status
  loading: false,
  error: null,

  // Faculty profile & general dashboard
  profile: null,
  courses: [],
  todaysClasses: [],
  allStudents: [],

  // Course-specific details (Rosters, Grading, Materials)
  currentCourseStudents: [],
  currentCourseMaterials: [],
  materialsLoading: false,
  gradesLoading: false,
  isSubmittingGrades: false,

  // Announcements
  announcements: [],
  announcementsLoading: false,
};

const facultySlice = createSlice({
  name: 'faculty',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setProfile(state, action) {
      state.profile = action.payload;
    },
    setCourses(state, action) {
      state.courses = action.payload || [];
    },
    setTodaysClasses(state, action) {
      state.todaysClasses = action.payload || [];
    },
    setAllStudents(state, action) {
      state.allStudents = action.payload || [];
    },
    setDashboardData(state, action) {
      const { profile, courses, todaysClasses, allStudents } = action.payload;
      if (profile !== undefined) state.profile = profile;
      if (courses !== undefined) state.courses = courses || [];
      if (todaysClasses !== undefined) state.todaysClasses = todaysClasses || [];
      if (allStudents !== undefined) state.allStudents = allStudents || [];
    },
    setCurrentCourseStudents(state, action) {
      state.currentCourseStudents = action.payload || [];
    },
    updateStudentGradeInState(state, action) {
      const { roll, field, val, finalGrade } = action.payload;
      const idx = state.currentCourseStudents.findIndex((s) => s.roll === roll);
      if (idx !== -1) {
        state.currentCourseStudents[idx][field] = val;
        if (finalGrade !== undefined) {
          state.currentCourseStudents[idx].finalGrade = finalGrade;
        }
        state.currentCourseStudents[idx].submitted = false;
      }
    },
    setCurrentCourseMaterials(state, action) {
      state.currentCourseMaterials = action.payload || [];
    },
    addMaterialToState(state, action) {
      state.currentCourseMaterials.unshift(action.payload);
    },
    setMaterialsLoading(state, action) {
      state.materialsLoading = Boolean(action.payload);
    },
    setGradesLoading(state, action) {
      state.gradesLoading = Boolean(action.payload);
    },
    setSubmittingGrades(state, action) {
      state.isSubmittingGrades = Boolean(action.payload);
    },
    setAnnouncements(state, action) {
      state.announcements = action.payload || [];
    },
    addAnnouncementToState(state, action) {
      state.announcements.unshift(action.payload);
    },
    updateAnnouncementInState(state, action) {
      const updated = action.payload;
      const idx = state.announcements.findIndex((a) => a.id === updated.id);
      if (idx !== -1) {
        state.announcements[idx] = { ...state.announcements[idx], ...updated };
      }
    },
    removeAnnouncementFromState(state, action) {
      const id = action.payload;
      state.announcements = state.announcements.filter((a) => a.id !== id);
    },
    setAnnouncementsLoading(state, action) {
      state.announcementsLoading = Boolean(action.payload);
    },
    resetFacultyState() {
      return initialState;
    },
  },
});

export const facultyActions = facultySlice.actions;
export default facultySlice;
