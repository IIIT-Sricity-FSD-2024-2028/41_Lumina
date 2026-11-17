import { createSlice } from '@reduxjs/toolkit';

const getInitialSession = () => {
  const saved = localStorage.getItem('Lumina_Session');
  try {
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialSession();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    role: initialUser?.Role || '',
    isAuthenticated: !!initialUser,
    loading: false,
    error: null,
  },
  reducers: {
    login(state, action) {
      state.user = action.payload;
      state.role = action.payload?.Role || action.payload?.role || '';
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('Lumina_Session', JSON.stringify(action.payload));
    },
    logout(state) {
      state.user = null;
      state.role = '';
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('Lumina_Session');
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice;
