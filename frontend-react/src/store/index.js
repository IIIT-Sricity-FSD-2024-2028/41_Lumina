import { configureStore } from '@reduxjs/toolkit';
import authSlice from './auth/auth-slice';
import studentSlice from './student/student-slice';

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    student: studentSlice.reducer,
  },
});

export default store;
