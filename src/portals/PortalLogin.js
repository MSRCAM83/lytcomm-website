// PortalLogin.js v2.0 - Updated with shared styling, Sun/Moon toggle, matching header/footer
import React, { useState } from 'react';
import { ArrowLeft, LogIn, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { colors, LYT_INFO } from '../config/constants';

function PortalLogin({ setCurrentPage, setLoggedInUser, darkMode, setDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  // Portal section accent colors
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';     // Purple vs Teal
  const accentSecondary = darkMode ? '#c850c0' : '#0077B6';   // Pink vs Blue
  const accentGradient = darkMode 
    ? 'linear-gradient(135deg, #667eea 0%, #c850c0 100%)'
    : 'linear-gradient(135deg, #00b4d8 0%, #0077B6 100%)';
  
  // Logo text colors matching actual logo
  const logoLY = darkMode ? '#e6c4d9' : '#0a3a7d';
  const logoT = darkMode ? '#e6c4d9' : '#2ec7c0';
  const logoComm = darkMode ? '#ffffff' : '#1e293b';

  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
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

    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = demoAccounts.find(
      acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
    );

    if (user) {
      setLoggedInUser(user);
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

  const getInputStyle = (fieldName) => ({
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    border: `2px solid ${focused === fieldName ? accentPrimary : (darkMode ? '#374151' : '#e5e7eb')}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focused === fieldName ? `0 0 0 3px ${accentPrimary}30` : 'none',
  });

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar with Sun/Moon Toggle */}
      <div style={{ 
        backgroundColor: darkMode ? '#112240' : '#f1f5f9', 
        padding: '6px 20px', 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        fontSize: '0.85rem' 
      }}>
        {setDarkMode && (
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ 
              backgroundColor: 'transparent', 
              border: 'none', 
              color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '0.85rem',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span className="hide-mobile">{darkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
        )}
      </div>

      {/* Header */}
      <header style={{ 
        backgroundColor: darkMode ? '#0d1b2a' : '#ffffff', 
        padding: '16px 20px', 
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
              <span style={{ color: logoLY }}>ly</span>
              <span style={{ color: logoT }}>t</span>
              <span style={{ fontWeight: '400', fontSize: '1.25rem', marginLeft: '4px', color: logoComm }}>Communications</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentPage('home')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '0.9rem',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={18} /> Back to Website
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Gradient border card */}
          <div style={{
            background: accentGradient,
            padding: '2px',
            borderRadius: '18px',
          }}>
            <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '40px' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '16px', 
                  background: `${accentPrimary}20`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 16px' 
                }}>
                  <LogIn size={32} color={accentPrimary} />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '8px' }}>
                  <span style={{ color: accentPrimary }}>Portal</span> Login
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
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="you@example.com"
                    required
                    style={getInputStyle('email')}
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
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      placeholder="Enter your password"
                      required
                      style={{ ...getInputStyle('password'), paddingRight: '48px' }}
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
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '12px', 
                    backgroundColor: darkMode ? 'rgba(255,107,107,0.2)' : 'rgba(232,90,79,0.1)', 
                    borderRadius: '8px', 
                    color: darkMode ? '#ff6b6b' : '#e85a4f', 
                    fontSize: '0.9rem' 
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: loading ? (darkMode ? '#374151' : '#9ca3af') : accentGradient,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
                  New to lyt Communications?
                </p>
                <button
                  onClick={() => setCurrentPage('onboarding')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'transparent',
                    border: `2px solid ${accentSecondary}`,
                    borderRadius: '8px',
                    color: accentSecondary,
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = `${accentSecondary}10`;
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Start Onboarding
                </button>
              </div>
            </div>
          </div>

          {/* Demo Accounts Notice */}
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            backgroundColor: `${accentPrimary}10`, 
            borderRadius: '8px', 
            border: `1px solid ${accentPrimary}30` 
          }}>
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
      <footer style={{ 
        backgroundColor: darkMode ? '#112240' : '#f8fafc', 
        padding: '40px 20px 24px',
        marginTop: 'auto',
      }}>
        {/* Gradient line above footer */}
        <div style={{
          height: '3px',
          background: accentGradient,
          marginBottom: '32px',
          borderRadius: '2px',
          maxWidth: '1200px',
          margin: '0 auto 32px',
        }} />
        
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '24px' }}>
            {/* Brand */}
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>
                <span style={{ color: logoLY }}>ly</span>
                <span style={{ color: logoT }}>t</span>
                <span style={{ fontWeight: '400', fontSize: '1.1rem', marginLeft: '4px', color: logoComm }}>Communications</span>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '280px', color: darkMode ? 'rgba(255,255,255,0.7)' : '#64748b' }}>
                Professional fiber optic construction across the Gulf Coast.
              </p>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ color: darkMode ? '#fff' : '#1e293b', fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>Navigate</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => setCurrentPage(link.id)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: darkMode ? 'rgba(255,255,255,0.7)' : '#64748b', 
                        cursor: 'pointer', 
                        textAlign: 'left', 
                        padding: 0,
                        fontSize: '0.85rem',
                        transition: 'color 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = accentPrimary}
                      onMouseOut={(e) => e.currentTarget.style.color = darkMode ? 'rgba(255,255,255,0.7)' : '#64748b'}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ color: darkMode ? '#fff' : '#1e293b', fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>Team</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentPage('portal-login')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: darkMode ? 'rgba(255,255,255,0.7)' : '#64748b', 
                      cursor: 'pointer', 
                      textAlign: 'left', 
                      padding: 0,
                      fontSize: '0.85rem',
                    }}
                  >
                    Team Portal
                  </button>
                  <button
                    onClick={() => setCurrentPage('onboarding')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: darkMode ? 'rgba(255,255,255,0.7)' : '#64748b', 
                      cursor: 'pointer', 
                      textAlign: 'left', 
                      padding: 0,
                      fontSize: '0.85rem',
                    }}
                  >
                    Onboarding
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{ 
            borderTop: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', 
            paddingTop: '20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '12px' 
          }}>
            <p style={{ fontSize: '0.8rem', color: darkMode ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>
              © {new Date().getFullYear()} {LYT_INFO.name}
            </p>
            <button
              onClick={() => setCurrentPage('contact')}
              style={{
                padding: '8px 20px',
                background: accentGradient,
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Get in Touch
            </button>
          </div>
        </div>
      </footer>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default PortalLogin;
