import { createSlice } from '@reduxjs/toolkit';

// Purge obsolete legacy mock keys to keep localStorage minimal and uncluttered
const purgeLegacyStorage = () => {
  const legacyKeys = [
    'Lumina_Current_Student_ID',
    'Lumina_Current_User_ID',
    'currentStudentId',
    'currentUserId',
    'Lumina_Students',
    'Lumina_Users',
    'Lumina_Mock_Data',
  ];
  legacyKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore if localStorage unavailable
    }
  });
};

const getInitialSession = () => {
  purgeLegacyStorage();

  const saved = localStorage.getItem('Lumina_Session');
  if (!saved) return null;

  try {
    const session = JSON.parse(saved);
    if (!session) return null;

    // Validate JWT token expiration
    const token = session.accessToken || session.token;
    if (token && typeof token === 'string') {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          // Base64URL decode standard JWT payload
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));

          // If token has an exp claim and is in the past, invalidate immediately
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            console.warn('Saved session has expired. Clearing invalid storage.');
            localStorage.removeItem('Lumina_Session');
            return null;
          }
        }
      } catch (err) {
        console.warn('Failed to parse session token, clearing storage.', err);
        localStorage.removeItem('Lumina_Session');
        return null;
      }
    } else {
      // No token present in session
      localStorage.removeItem('Lumina_Session');
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem('Lumina_Session');
    return null;
  }
};

const initialUser = getInitialSession();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    role: initialUser?.Role || initialUser?.role || '',
    id: initialUser?.User_ID || initialUser?.id || '',
    isAuthenticated: !!initialUser,
    isLoggedIn: !!initialUser,
    loading: false,
    error: null,
  },
  reducers: {
    login(state, action) {
      state.user = action.payload;
      state.role = action.payload?.Role || action.payload?.role || '';
      state.id = action.payload?.User_ID || action.payload?.id || '';
      state.isAuthenticated = true;
      state.isLoggedIn = true;
      state.error = null;

      // Store only the minimal necessary session data (no clutter, no unbounded caching)
      const minimalSession = {
        accessToken: action.payload?.accessToken || action.payload?.token,
        tokenType: action.payload?.tokenType || 'Bearer',
        User_ID: action.payload?.User_ID || action.payload?.userId,
        Full_Name: action.payload?.Full_Name || action.payload?.fullName,
        Role: action.payload?.Role || action.payload?.role,
        Dept_ID: action.payload?.Dept_ID || action.payload?.deptId,
        Email: action.payload?.Email || action.payload?.email,
        ...(action.payload?.Current_Semester !== undefined && { Current_Semester: action.payload.Current_Semester }),
      };
      localStorage.setItem('Lumina_Session', JSON.stringify(minimalSession));
    },
    logout(state) {
      state.user = null;
      state.role = '';
      state.id = '';
      state.isAuthenticated = false;
      state.isLoggedIn = false;
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
