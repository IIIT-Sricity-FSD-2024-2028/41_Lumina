import { createContext, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { authActions } from '../store/auth/auth-slice';
import { logoutUser } from '../store/auth/auth-actions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { user, role, id, isAuthenticated, isLoggedIn, loading, error } = useSelector(
    (state) => state.auth,
  );

  const login = (userData) => {
    dispatch(authActions.login(userData));
  };

  const logout = () => {
    dispatch(logoutUser());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        id,
        isAuthenticated,
        isLoggedIn,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
