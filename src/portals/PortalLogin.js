// PortalLogin.js v3.5 - Uses LYT Portal Backend for authentication
import React, { useState } from 'react';
import { ArrowLeft, LogIn, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { colors, LYT_INFO } from '../config/constants';

// Portal Backend URL - handles login directly
const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec';

function PortalLogin({ setCurrentPage, setLoggedInUser, darkMode, setDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentGradient = darkMode 
    ? 'linear-gradient(135deg, #c850c0 0%, #ff6b35 100%)'
    : 'linear-gradient(135deg, #0077B6 0%, #00b4d8 100%)';
  
  const logoLY = darkMode ? '#e6c4d9' : '#0a3a7d';
  const logoT = darkMode ? '#e6c4d9' : '#2ec7c0';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call Portal Backend login action
      const payload = {
        action: 'login',
        email: email.trim().toLowerCase(),
        password: password
      };

      // Use form submission approach to handle GAS redirects
      const formData = new URLSearchParams();
      formData.append('payload', JSON.stringify(payload));
      
      const response = await fetch(PORTAL_URL, {
        method: 'POST',
        redirect: 'follow',
        body: formData
      });

      const text = await response.text();
      
      // Check if we got HTML (redirect issue) or JSON
      if (text.trim().startsWith('<') || text.trim().startsWith('<!')) {
        // Try to extract redirect URL and fetch it
        const match = text.match(/HREF="([^"]+)"/i);
        if (match) {
          const redirectUrl = match[1].replace(/&amp;/g, '&');
          const redirectResponse = await fetch(redirectUrl);
          const redirectText = await redirectResponse.text();
          
          try {
            const result = JSON.parse(redirectText);
            handleLoginResult(result);
            return;
          } catch (e) {
            console.error('Redirect parse error:', redirectText.substring(0, 200));
          }
        }
        setError('Server configuration issue. Please try again.');
        setLoading(false);
        return;
      }
      
      try {
        const result = JSON.parse(text);
        handleLoginResult(result);
      } catch (parseErr) {
        console.error('Parse error:', text.substring(0, 200));
        setError('Invalid server response');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect. Please try again.');
      setLoading(false);
    }
  };

  const handleLoginResult = (result) => {
    setLoading(false);
    
    if (result.success) {
      const user = result.user || result.data;
      setLoggedInUser({
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status || 'active'
      });
      
      if (user.role === 'admin') {
        setCurrentPage('admin-dashboard');
      } else if (user.role === 'employee') {
        setCurrentPage('employee-dashboard');
      } else if (user.role === 'contractor') {
        setCurrentPage('contractor-dashboard');
      } else {
        setCurrentPage('home');
      }
    } else {
      setError(result.message || 'Login failed');
    }
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
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: focused === fieldName ? `0 0 0 3px ${accentPrimary}22` : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor }}>
      {/* Top Bar with Sun/Moon Toggle */}
      <div style={{ backgroundColor: darkMode ? '#112240' : '#f1f5f9', padding: '6px 20px', display: 'flex', justifyContent: 'flex-end' }}>
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
              transition: 'all 0.2s ease'
            }}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span>{darkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
        )}
      </div>

      {/* Header */}
      <header style={{ padding: '16px 20px', backgroundColor: darkMode ? '#0d1b2a' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
        <button
          onClick={() => setCurrentPage('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: 'none', color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', fontSize: '1rem', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'all 0.2s ease' }}
        >
          <ArrowLeft size={20} /> Back
        </button>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: textColor }}>
          <span style={{ color: accentPrimary }}>Team</span> Portal
        </div>
        <button
          onClick={() => setCurrentPage('home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
        >
          <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            <span style={{ color: logoLY }}>ly</span><span style={{ color: logoT }}>t</span>
          </div>
        </button>
      </header>

      {/* Login Form */}
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <LogIn size={28} color="#fff" />
            </div>
            <h2 style={{ color: textColor, margin: '0 0 8px', fontSize: '1.5rem' }}>Welcome Back</h2>
            <p style={{ color: mutedColor, margin: 0, fontSize: '0.9rem' }}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500', fontSize: '0.9rem' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                style={getInputStyle('email')}
                placeholder="you@company.com"
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500', fontSize: '0.9rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  style={{ ...getInputStyle('password'), paddingRight: '48px' }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#9ca3af' : accentGradient,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={() => setCurrentPage('forgot-password')}
              style={{ background: 'none', border: 'none', color: accentPrimary, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortalLogin;
