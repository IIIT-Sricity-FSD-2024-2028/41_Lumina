import { configureStore } from '@reduxjs/toolkit';
import authSlice from './auth/auth-slice';
import studentSlice from './student/student-slice';
import facultySlice from './faculty/faculty-slice';
import adminSlice from './admin/admin-slice';
import deanSlice from './dean/dean-slice';
import ad1PlanningSlice from './ad1/ad1-slice';
import ad2Slice from './ad2/ad2-slice';
import superuserSlice from './superuser/superuser-slice';

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

export default store;
