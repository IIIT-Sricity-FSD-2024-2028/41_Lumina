import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// A simple Navbar to test authentication and logout
function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 32px',
      backgroundColor: 'var(--surface-white)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <Link to="/" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary-dark)' }}>
        Lumina
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isAuthenticated ? (
          <>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {user.Full_Name} ({user.Role})
            </span>
            <button onClick={logout} className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.875rem' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.875rem' }}>
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global Toast notifications */}
        <Toaster position="top-right" />

        {/* Global Navigation Bar */}
        <Navbar />

        {/* Route Definitions */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
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
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
