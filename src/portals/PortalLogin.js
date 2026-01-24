// PortalLogin.js v3.3 - Uses Gateway sheetsRead for authentication
import React, { useState } from 'react';
import { ArrowLeft, LogIn, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { colors, LYT_INFO, URLS } from '../config/constants';

// Gateway configuration
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const USERS_SHEET_ID = '1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw';

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
      // Read users from sheet via Gateway
      const payload = {
        secret: GATEWAY_SECRET,
        action: 'sheetsRead',
        params: {
          spreadsheetId: USERS_SHEET_ID,
          range: 'A:H'
        }
      };

      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success && result.data && result.data.data) {
        const rows = result.data.data;
        const headers = rows[0];
        
        const emailCol = headers.indexOf('email');
        const nameCol = headers.indexOf('name');
        const roleCol = headers.indexOf('role');
        const statusCol = headers.indexOf('status');
        const passwordCol = headers.indexOf('passwordHash');

        let foundUser = null;
        const inputEmail = email.toLowerCase().trim();

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row[emailCol] && row[emailCol].toString().toLowerCase() === inputEmail) {
            // Found user
            if (row[statusCol] !== 'active') {
              setError('Account is not active');
              setLoading(false);
              return;
            }
            
            if (row[passwordCol] === password) {
              foundUser = {
                email: row[emailCol],
                name: row[nameCol],
                role: row[roleCol],
                status: row[statusCol]
              };
              break;
            } else {
              setError('Invalid password');
              setLoading(false);
              return;
            }
          }
        }

        if (foundUser) {
          // Update last login via sheetsWrite
          try {
            const lastLoginCol = headers.indexOf('lastLogin');
            if (lastLoginCol >= 0) {
              for (let i = 1; i < rows.length; i++) {
                if (rows[i][emailCol] && rows[i][emailCol].toString().toLowerCase() === inputEmail) {
                  const updatePayload = {
                    secret: GATEWAY_SECRET,
                    action: 'sheetsWrite',
                    params: {
                      spreadsheetId: USERS_SHEET_ID,
                      range: `${String.fromCharCode(65 + lastLoginCol)}${i + 1}`,
                      values: [[new Date().toISOString()]]
                    }
                  };
                  fetch(GATEWAY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatePayload)
                  });
                  break;
                }
              }
            }
          } catch (e) {
            console.log('Could not update last login');
          }

          setLoggedInUser(foundUser);
          if (foundUser.role === 'admin') {
            setCurrentPage('admin-dashboard');
          } else if (foundUser.role === 'employee') {
            setCurrentPage('employee-dashboard');
          } else if (foundUser.role === 'contractor') {
            setCurrentPage('contractor-dashboard');
          }
        } else {
          setError('User not found');
        }
      } else {
        setError('Unable to verify credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect. Please try again.');
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
