import { configureStore } from '@reduxjs/toolkit';
import authSlice from './auth/auth-slice';
import studentSlice from './student/student-slice';
import facultySlice from './faculty/faculty-slice';
import adminSlice from './admin/admin-slice';
import deanSlice from './dean/dean-slice';

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    student: studentSlice.reducer,
    faculty: facultySlice.reducer,
    admin: adminSlice.reducer,
    dean: deanSlice.reducer,
  },
});

export default store;
