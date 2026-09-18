import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // State to hold the logged-in user object
  const [user, setUser] = useState(() => {
    // Read from localStorage on initial page load
    const saved = localStorage.getItem('Lumina_Session');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login function: updates state and saves to browser storage
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('Lumina_Session', JSON.stringify(userData));
  };

  // Logout function: clears state and browser storage
  const logout = () => {
    setUser(null);
    localStorage.removeItem('Lumina_Session');
  };

  const role = user?.Role || null;
  const isAuthenticated = !!user;

  // Provide these values to all child components
  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
