import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';

import Dean2Home from './pages/ad2/Dean2Home';
import Dean2Policies from './pages/ad2/Dean2Policies';
import Dean2Enrollment from './pages/ad2/Dean2Enrollment';
import Dean2Overrides from './pages/ad2/Dean2Overrides';
import Dean2Analytics from './pages/ad2/Dean2Analytics';
import Dean2Gradesheets from './pages/ad2/Dean2Gradesheets';
import Dean2GradesheetDetail from './pages/ad2/Dean2GradesheetDetail';
import SuperUserDashboard from './pages/superuser/SuperUserDashboard';
import DeanDashboard from './pages/dean/DeanDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global Toast notifications */}
        <Toaster position="top-right" />

        {/* Clean Route Table */}
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Dean 2 (Assistant Dean 2) Routes */}
          <Route
            path="/ad2"
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ad2/policies"
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Policies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ad2/enrollment"
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Enrollment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ad2/overrides"
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Overrides />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ad2/analytics"
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ad2/gradesheets"
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Gradesheets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ad2/gradesheets/:courseId/:termId"
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2GradesheetDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ad2/gradesheets/detail"
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2GradesheetDetail />
              </ProtectedRoute>
            }
          />

          {/* Super User Console Route */}
          <Route
            path="/superuser"
            element={
              <ProtectedRoute allowedRoles={['Super_User']}>
                <SuperUserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superuser/*"
            element={
              <ProtectedRoute allowedRoles={['Super_User']}>
                <SuperUserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Dean Executive Console Route */}
          <Route
            path="/dean"
            element={
              <ProtectedRoute allowedRoles={['Dean']}>
                <DeanDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dean/*"
            element={
              <ProtectedRoute allowedRoles={['Dean']}>
                <DeanDashboard />
              </ProtectedRoute>
            }
          />

          {/* Alias /dean2 to /ad2 */}
          <Route path="/dean2" element={<Navigate to="/ad2" replace />} />
          <Route path="/dean2/*" element={<Navigate to="/ad2" replace />} />

          {/* Unauthorized page */}
          <Route
            path="/unauthorized"
            element={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>403 - Unauthorized Access</h2>
                <p>You do not have permission to view this page.</p>
                <Link to="/" style={{ color: 'var(--accent-blue)', marginTop: '8px', display: 'inline-block' }}>
                  Return to Home
                </Link>
              </div>
            }
          />

          {/* 404 Catch-all */}
          <Route
            path="*"
            element={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>404 - Page Not Found</h2>
                <Link to="/" style={{ color: 'var(--accent-blue)', marginTop: '8px', display: 'inline-block' }}>
                  Return to Home
                </Link>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
