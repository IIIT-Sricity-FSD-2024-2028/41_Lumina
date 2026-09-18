import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Welcome to Lumina</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
        Next-generation Academic Management Portal
      </p>

      <div style={{ marginTop: '24px' }}>
        {isAuthenticated ? (
          <p>Logged in as: <strong>{user?.Full_Name}</strong> ({user?.Role})</p>
        ) : (
          <Link to="/login" className="btn-primary">
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
}
