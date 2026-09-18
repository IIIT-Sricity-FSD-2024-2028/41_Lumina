import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Student');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Simulated login for setup verification
    const mockUser = {
      User_ID: 'U101',
      Full_Name: email.split('@')[0] || 'Demo User',
      Email: email,
      Role: role,
    };

    login(mockUser);
    toast.success(`Welcome back, ${mockUser.Full_Name}!`);
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '24px', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
      <h2 style={{ marginBottom: '16px', color: 'var(--primary-dark)' }}>Lumina Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@lumina.edu"
            required
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
          >
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Dean">Dean</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
          Sign In
        </button>
      </form>
    </div>
  );
}
