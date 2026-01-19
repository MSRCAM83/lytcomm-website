import React, { useState } from 'react';
import { ArrowLeft, LogIn, Eye, EyeOff } from 'lucide-react';
import { colors, LYT_INFO } from '../config/constants';

function PortalLogin({ setCurrentPage, setLoggedInUser, darkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic colors based on theme
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';     // Purple vs Teal
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';   // Orange vs Green
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';       // Error red

  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  // Demo accounts for testing
  const demoAccounts = [
    { email: 'matt@lytcomm.com', password: 'Empire083#', role: 'admin', name: 'Matt Campbell' },
    { email: 'demo.employee@lytcomm.com', password: 'demo123', role: 'employee', name: 'Demo Employee' },
    { email: 'demo.contractor@lytcomm.com', password: 'demo123', role: 'contractor', name: 'Demo Contractor', company: 'Demo Contracting LLC' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check credentials
    const user = demoAccounts.find(
      acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
    );

    if (user) {
      setLoggedInUser(user);
      
      // Route based on role
      if (user.role === 'admin') {
        setCurrentPage('admin-dashboard');
      } else if (user.role === 'employee') {
        setCurrentPage('employee-dashboard');
      } else if (user.role === 'contractor') {
        setCurrentPage('contractor-dashboard');
      }
    } else {
      setError('Invalid email or password. Please try again.');
    }

    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    border: `1px solid ${darkMode ? '#374151' : '#ddd'}`,
    borderRadius: '8px',
    backgroundColor: darkMode ? colors.dark : '#fff',
    color: textColor,
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ backgroundColor: colors.dark, padding: '16px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff' }}>
              <span style={{ color: accentPrimary }}>LYT</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentPage('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            <ArrowLeft size={18} /> Back to Website
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: `${accentPrimary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <LogIn size={32} color={accentPrimary} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '8px' }}>
                Portal Login
              </h1>
              <p style={{ color: mutedColor }}>
                Sign in to access your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{ ...inputStyle, paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: mutedColor,
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: `${accentError}20`, borderRadius: '8px', color: accentError, fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: loading ? colors.gray : accentPrimary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                onClick={() => setCurrentPage('forgot-password')}
                style={{ background: 'none', border: 'none', color: accentPrimary, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Forgot your password?
              </button>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
              <p style={{ textAlign: 'center', color: mutedColor, fontSize: '0.9rem', marginBottom: '12px' }}>
                New to LYT Communications?
              </p>
              <button
                onClick={() => setCurrentPage('onboarding')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${accentError}`,
                  borderRadius: '8px',
                  color: accentError,
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Start Onboarding
              </button>
            </div>
          </div>

          {/* Demo Accounts Notice */}
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: `${accentPrimary}10`, borderRadius: '8px', border: `1px solid ${accentPrimary}30` }}>
            <p style={{ color: textColor, fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
              Demo Accounts:
            </p>
            <div style={{ fontSize: '0.8rem', color: mutedColor }}>
              <p>• Admin: matt@lytcomm.com</p>
              <p>• Employee: demo.employee@lytcomm.com (demo123)</p>
              <p>• Contractor: demo.contractor@lytcomm.com (demo123)</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '20px', textAlign: 'center', color: mutedColor, fontSize: '0.85rem' }}>
        © {new Date().getFullYear()} {LYT_INFO.name}. All rights reserved.
      </footer>
    </div>
  );
}

export default PortalLogin;
