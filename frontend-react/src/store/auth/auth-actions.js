import { authActions } from './auth-slice';
import { authService } from '../../services/auth.service';

export const loginUser = (userIdOrCredentials, password) => {
  return async (dispatch) => {
    dispatch(authActions.setLoading(true));
    dispatch(authActions.setError(null));
    try {
      const data = await authService.login(userIdOrCredentials, password);
      dispatch(authActions.login(data));
      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Invalid Username or Password.';
      dispatch(authActions.setError(message));
      throw err;
    } finally {
      dispatch(authActions.setLoading(false));
    }
  };
};

export const logoutUser = () => {
  return async (dispatch) => {
    dispatch(authActions.setLoading(true));
    try {
      await authService.logout();
    } finally {
      dispatch(authActions.logout());
      dispatch(authActions.setLoading(false));
    }
  };
};
