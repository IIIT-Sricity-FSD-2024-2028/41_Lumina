import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * A wrapper component that guards pages based on authentication and user roles.
 *
 * Usage:
 * <ProtectedRoute allowedRoles={['Dean', 'Admin']}>
 *   <DeanDashboard />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, role } = useAuth();
  const location = useLocation();

  // 1. Not logged in at all? Redirect to /login
  // We pass 'state: { from: location }' so after they log in, we can send them back to where they were trying to go!
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Logged in, but their role isn't allowed to view this page?
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. User is authorized! Render the protected component
  return children;
}
