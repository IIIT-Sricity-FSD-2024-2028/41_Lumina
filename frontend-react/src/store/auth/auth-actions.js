import { authActions } from './auth-slice';
import { authService } from '../../services/auth.service';

export const loginUser = (credentials) => {
  return async (dispatch) => {
    dispatch(authActions.setLoading(true));
    try {
      const data = await authService.login(credentials);
      dispatch(authActions.login(data));
      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      dispatch(authActions.setError(message));
      throw err;
    } finally {
      dispatch(authActions.setLoading(false));
    }
  };
};

export const logoutUser = () => {
  return (dispatch) => {
    dispatch(authActions.logout());
  };
};
