// ForgotPassword.js v2.0 - Updated with shared styling, Sun/Moon toggle, matching header/footer
import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Sun, Moon } from 'lucide-react';
import { colors, LYT_INFO } from '../config/constants';

function ForgotPassword({ setCurrentPage, darkMode, setDarkMode }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(false);

  // Portal section accent colors (purple/teal)
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#c850c0' : '#28a745';
  const accentGradient = darkMode 
    ? 'linear-gradient(135deg, #667eea 0%, #c850c0 100%)'
    : 'linear-gradient(135deg, #00b4d8 0%, #0077B6 100%)';
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';
  
  // Logo colors
  const logoLY = darkMode ? '#e6c4d9' : '#0a3a7d';
  const logoT = darkMode ? '#e6c4d9' : '#2ec7c0';
  const logoComm = darkMode ? '#ffffff' : '#1e293b';

  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccess(true);
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    border: `2px solid ${focused ? accentPrimary : (darkMode ? '#374151' : '#e5e7eb')}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focused ? `0 0 0 3px ${accentPrimary}30` : 'none',
  };

  const navLinks = [{ id: 'home', label: 'Home' }, { id: 'about', label: 'About' }, { id: 'services', label: 'Services' }, { id: 'contact', label: 'Contact' }];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: darkMode ? '#112240' : '#f1f5f9', padding: '6px 20px', display: 'flex', justifyContent: 'flex-end' }}>
        {setDarkMode && (
          <button onClick={() => setDarkMode(!darkMode)} style={{ backgroundColor: 'transparent', border: 'none', color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '4px 8px', borderRadius: '6px' }}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span className="hide-mobile">{darkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
        )}
      </div>

      {/* Header */}
      <header style={{ backgroundColor: darkMode ? '#0d1b2a' : '#ffffff', padding: '16px 20px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setCurrentPage('home')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
              <span style={{ color: logoLY }}>ly</span><span style={{ color: logoT }}>t</span>
              <span style={{ fontWeight: '400', fontSize: '1.25rem', marginLeft: '4px', color: logoComm }}>Communications</span>
            </div>
          </button>
          <button onClick={() => setCurrentPage('portal-login')} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 12px', borderRadius: '8px' }}>
            <ArrowLeft size={18} /> Back to Login
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ background: accentGradient, padding: '2px', borderRadius: '18px' }}>
            <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '40px' }}>
              {success ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: `${accentSecondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <CheckCircle size={40} color={accentSecondary} />
                  </div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '12px' }}>Check Your <span style={{ color: accentSecondary }}>Email</span></h1>
                  <p style={{ color: mutedColor, marginBottom: '32px' }}>We've sent password reset instructions to <strong>{email}</strong></p>
                  <button onClick={() => setCurrentPage('portal-login')} style={{ width: '100%', padding: '14px', background: accentGradient, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>Back to Login</button>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: `${accentPrimary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Mail size={32} color={accentPrimary} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '8px' }}>Forgot <span style={{ color: accentPrimary }}>Password?</span></h1>
                    <p style={{ color: mutedColor }}>Enter your email and we'll send you reset instructions</p>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Email Address</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="you@example.com" required style={inputStyle} />
                    </div>
                    {error && (
                      <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: `${accentError}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} color={accentError} /><span style={{ color: accentError, fontSize: '0.9rem' }}>{error}</span>
                      </div>
                    )}
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? (darkMode ? '#374151' : '#9ca3af') : accentGradient, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease' }}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                  <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <button onClick={() => setCurrentPage('portal-login')} style={{ background: 'none', border: 'none', color: accentPrimary, cursor: 'pointer', fontSize: '0.9rem' }}>Remember your password? Sign in</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: darkMode ? '#112240' : '#f8fafc', padding: '40px 20px 24px', marginTop: 'auto' }}>
        <div style={{ height: '3px', background: accentGradient, marginBottom: '32px', borderRadius: '2px', maxWidth: '1200px', margin: '0 auto 32px' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>
                <span style={{ color: logoLY }}>ly</span><span style={{ color: logoT }}>t</span>
                <span style={{ fontWeight: '400', fontSize: '1.1rem', marginLeft: '4px', color: logoComm }}>Communications</span>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '280px', color: darkMode ? 'rgba(255,255,255,0.7)' : '#64748b' }}>Professional fiber optic construction across the Gulf Coast.</p>
            </div>
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ color: textColor, fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>Navigate</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {navLinks.map(link => <button key={link.id} onClick={() => setCurrentPage(link.id)} style={{ background: 'none', border: 'none', color: mutedColor, cursor: 'pointer', textAlign: 'left', padding: 0, fontSize: '0.85rem' }}>{link.label}</button>)}
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '0.8rem', color: darkMode ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>© {new Date().getFullYear()} {LYT_INFO.name}</p>
          </div>
        </div>
      </footer>
      <style>{`@media (max-width: 768px) { .hide-mobile { display: none !important; } }`}</style>
    </div>
  );
}

export default ForgotPassword;
