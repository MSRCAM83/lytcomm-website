import React, { useState } from 'react';
import { ArrowLeft, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { colors, mockUsers, LYT_INFO } from '../config/constants';

const AdminLogin = ({ setCurrentPage, setLoggedInUser, darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check for admin users
    const adminEmails = LYT_INFO.adminEmails;
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.role === 'admin');

    if (user && password === 'admin123' && adminEmails.includes(email.toLowerCase())) {
      setLoggedInUser(user);
      setCurrentPage('admin-dashboard');
    } else {
      setError('Invalid credentials or insufficient permissions. Try: matt@lytcomm.com / admin123');
    }

    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
    border: `1px solid ${darkMode ? '#374151' : '#ddd'}`,
    borderRadius: '8px',
    backgroundColor: darkMode ? colors.dark : '#fff',
    color: textColor,
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px', backgroundColor: colors.dark, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setCurrentPage('portal-login')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} /> Back to Portal
        </button>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
          <span style={{ color: colors.coral }}>Admin</span> Login
        </div>
        <div style={{ width: '120px' }} />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: `${colors.coral}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Shield size={32} color={colors.coral} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: textColor, marginBottom: '8px' }}>
                Admin Access
              </h2>
              <p style={{ color: colors.gray }}>Restricted to authorized personnel</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: textColor }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="admin@lytcomm.com"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: textColor }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.gray,
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: `${colors.coral}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: colors.coral, fontSize: '0.9rem' }}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  backgroundColor: loading ? colors.gray : colors.coral,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Verifying...' : 'Access Admin Panel'}
              </button>
            </form>

            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.85rem', color: colors.gray, marginBottom: '8px' }}>
                <strong>Demo Admin Credentials:</strong>
              </p>
              <p style={{ fontSize: '0.85rem', color: colors.gray }}>
                Email: matt@lytcomm.com<br />
                Password: admin123
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
