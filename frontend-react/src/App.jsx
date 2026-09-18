import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Landing from './pages/Landing';
import Login from './pages/Login';

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
