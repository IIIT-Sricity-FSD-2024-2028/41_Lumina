import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Landing from './pages/Landing';
import Login from './pages/Login';

/* ── Deal1 (AD1) Pages ── */
import AD1Dashboard from './pages/ad1/AD1Dashboard';
import CourseCatalog from './pages/ad1/CourseCatalog';
import CourseSection from './pages/ad1/CourseSection';
import Timetable from './pages/ad1/Timetable';

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

          {/* Deal1 (AD1) Routes */}
          <Route path="/ad1/dashboard" element={<AD1Dashboard />} />
          <Route path="/ad1/course-catalog" element={<CourseCatalog />} />
          <Route path="/ad1/course-section" element={<CourseSection />} />
          <Route path="/ad1/timetable" element={<Timetable />} />
          <Route path="/dean1" element={<Navigate to="/ad1/dashboard" replace />} />

          {/* 404 Catch-all */}
          <Route path="*" element={
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>404 - Page Not Found</h2>
              <Link to="/" style={{ color: 'var(--accent-blue)', marginTop: '8px', display: 'inline-block' }}>
                Return to Home
              </Link>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
