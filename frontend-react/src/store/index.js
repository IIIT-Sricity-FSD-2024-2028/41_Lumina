<<<<<<< HEAD
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
=======
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './auth/auth-slice';
import studentSlice from './student/student-slice';
import facultySlice from './faculty/faculty-slice';
import adminSlice from './admin/admin-slice';
import ad2Slice from './ad2/ad2-slice';

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    student: studentSlice.reducer,
    faculty: facultySlice.reducer,
    admin: adminSlice.reducer,
    ad2: ad2Slice.reducer,
  },
});

export default store;
>>>>>>> aa1ddfac (Added ad2 index.js code)
t default store;

