import { configureStore } from '@reduxjs/toolkit';
import authSlice from './auth/auth-slice';
import studentSlice, { studentActions } from './student/student-slice';
import facultySlice, { facultyActions } from './faculty/faculty-slice';
import adminSlice, { adminActions } from './admin/admin-slice';
import deanSlice, { deanActions } from './dean/dean-slice';
import ad1PlanningSlice, { ad1Actions } from './ad1/ad1-slice';
import ad2Slice, { ad2Actions } from './ad2/ad2-slice';
import superuserSlice, { superuserActions } from './superuser/superuser-slice';

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    student: studentSlice.reducer,
    faculty: facultySlice.reducer,
    admin: adminSlice.reducer,
    dean: deanSlice.reducer,
    ad1Planning: ad1PlanningSlice.reducer,
    ad2: ad2Slice.reducer,
    superuser: superuserSlice.reducer,
  },
});

let currentSessionUser = store.getState().auth.user;
store.subscribe(() => {
  const session = store.getState().auth.user;
  if (session === currentSessionUser) return;
  currentSessionUser = session;
  store.dispatch(ad1Actions.clearPlanning());
  store.dispatch(studentActions.resetStudentState());
  store.dispatch(facultyActions.resetFacultyState());
  store.dispatch(adminActions.resetAdminState());
  store.dispatch(deanActions.resetDeanState());
  store.dispatch(ad2Actions.resetAd2State());
  store.dispatch(superuserActions.resetSuperUserState());
});

export default store;
