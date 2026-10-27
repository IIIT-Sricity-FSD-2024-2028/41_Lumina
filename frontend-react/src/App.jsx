import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentRegistration from './pages/student/StudentRegistration';
import StudentRoadmap from './pages/student/StudentRoadmap';

// AD1 (Assistant Dean 1) Pages
import AD1Dashboard from './pages/ad1/AD1Dashboard';
import CourseCatalog from './pages/ad1/CourseCatalog';
import CourseSection from './pages/ad1/CourseSection';
import Timetable from './pages/ad1/Timetable';

// Dean 2 Pages
import Dean2Home from './pages/ad2/Dean2Home';
import Dean2Policies from './pages/ad2/Dean2Policies';
import Dean2Enrollment from './pages/ad2/Dean2Enrollment';
import Dean2Overrides from './pages/ad2/Dean2Overrides';
import Dean2Analytics from './pages/ad2/Dean2Analytics';
import Dean2Gradesheets from './pages/ad2/Dean2Gradesheets';
import Dean2GradesheetDetail from './pages/ad2/Dean2GradesheetDetail';
import SuperUserDashboard from './pages/superuser/SuperUserDashboard';
import DeanDashboard from './pages/dean/DeanDashboard';

// Faculty Portal Pages
import FacultyLayout from './pages/faculty/FacultyLayout';
import FacultyHome from './pages/faculty/FacultyHome';
import FacultyCourses from './pages/faculty/FacultyCourses';
import FacultyGrades from './pages/faculty/FacultyGrades';
import FacultyRosters from './pages/faculty/FacultyRosters';
import FacultyAnnouncements from './pages/faculty/FacultyAnnouncements';

// Admin / SPOC Portal
import AdminPortalPage from './pages/admin/AdminPortalPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position='top-right' />

        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/login' element={<Login />} />

          {/* Student Role Routes */}
          <Route
            path='/student'
            element={
              <ProtectedRoute allowedRoles={['Student', 'student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/student/dashboard'
            element={<Navigate to='/student' replace />}
          />
          <Route
            path='/student/registration'
            element={
              <ProtectedRoute allowedRoles={['Student', 'student']}>
                <StudentRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path='/student/roadmap'
            element={
              <ProtectedRoute allowedRoles={['Student', 'student']}>
                <StudentRoadmap />
              </ProtectedRoute>
            }
          />

          {/* AD1 Routes */}
          <Route
            path='/ad1/dashboard'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_1']}>
                <AD1Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/ad1/course-catalog'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_1']}>
                <CourseCatalog />
              </ProtectedRoute>
            }
          />
          <Route
            path='/ad1/course-section'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_1']}>
                <CourseSection />
              </ProtectedRoute>
            }
          />
          <Route
            path='/ad1/timetable'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_1']}>
                <Timetable />
              </ProtectedRoute>
            }
          />
          <Route
            path='/dean1'
            element={<Navigate to='/ad1/dashboard' replace />}
          />

          {/* Dean 2 Routes */}
          <Route
            path='/ad2'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Home />
              </ProtectedRoute>
            }
          />
          <Route
            path='/ad2/policies'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Policies />
              </ProtectedRoute>
            }
          />
          <Route
            path='/ad2/enrollment'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Enrollment />
              </ProtectedRoute>
            }
          />
          <Route
            path='/ad2/overrides'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Overrides />
              </ProtectedRoute>
            }
          />
          <Route
            path='/ad2/analytics'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path='/ad2/gradesheets'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2Gradesheets />
              </ProtectedRoute>
            }
          />
          <Route
            path='/ad2/gradesheets/:courseId/:termId'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2GradesheetDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path='/ad2/gradesheets/detail'
            element={
              <ProtectedRoute allowedRoles={['Assistant_Dean_2']}>
                <Dean2GradesheetDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin / SPOC Operations Portal */}
          <Route
            path='/admin'
            element={
              <ProtectedRoute allowedRoles={['Lumina_SPOC', 'Admin', 'Super_User']}>
                <AdminPortalPage />
              </ProtectedRoute>
            }
          />
          {/* Admin sub-tabs share the same page component (tab state managed internally) */}
          <Route
            path='/admin/*'
            element={
              <ProtectedRoute allowedRoles={['Lumina_SPOC', 'Admin', 'Super_User']}>
                <AdminPortalPage />
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

          {/* Faculty Portal Routes */}
          <Route
            path='/faculty'
            element={
              <ProtectedRoute
                allowedRoles={[
                  'Faculty'
                ]}
              >
                <FacultyLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<FacultyHome />} />
            <Route path='courses' element={<FacultyCourses />} />
            <Route path='grades' element={<FacultyGrades />} />
            <Route path='grades/:courseId' element={<FacultyGrades />} />
            <Route path='roster' element={<FacultyRosters />} />
            <Route path='roster/:courseId' element={<FacultyRosters />} />
            <Route
              path='announcements'
              element={<FacultyAnnouncements />}
            />
          </Route>

          {/* Unauthorized Page */}
          <Route
            path='/unauthorized'
            element={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>403 - Unauthorized Access</h2>
                <p>You do not have permission to view this page.</p>
                <Link
                  to='/'
                  style={{
                    color: 'var(--accent-blue)',
                    marginTop: '8px',
                    display: 'inline-block',
                  }}
                >
                  Return to Home
                </Link>
              </div>
            }
          />

          {/* 404 Catch-all */}
          <Route
            path='*'
            element={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>404 - Page Not Found</h2>
                <Link
                  to='/'
                  style={{
                    color: 'var(--accent-blue)',
                    marginTop: '8px',
                    display: 'inline-block',
                  }}
                >
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