import React, { useState } from 'react';
import { ArrowLeft, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { colors, URLS } from '../config/constants';

const PORTAL_URL = URLS.portalScript;

const EmployeeLogin = ({ setCurrentPage, setLoggedInUser, darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginResult = (result) => {
    setLoading(false);
    if (result.success) {
      const user = result.user || result.data || result;
      setLoggedInUser({
        email: user.email || email,
        name: user.name || 'Employee',
        role: user.role || 'employee',
        status: user.status || 'active'
      });
      const role = (user.role || 'employee').toLowerCase();
      if (role === 'admin') {
        setCurrentPage('admin-dashboard');
      } else if (role === 'contractor') {
        setCurrentPage('contractor-dashboard');
      } else {
        setCurrentPage('employee-dashboard');
      }
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        action: 'login',
        email: email.trim().toLowerCase(),
        password: password
      };

      const initialResponse = await fetch(PORTAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const initialText = await initialResponse.text();

      if (initialText.includes('HREF="')) {
        const match = initialText.match(/HREF="([^"]+)"/i);
        if (match) {
          const redirectUrl = match[1].replace(/&amp;/g, '&');
          const finalResponse = await fetch(redirectUrl);
          const finalText = await finalResponse.text();
          try {
            const result = JSON.parse(finalText);
            handleLoginResult(result);
            return;
          } catch (parseErr) {
            setError('Server error. Please try again.');
          }
        } else {
          setError('Server configuration error.');
        }
      } else {
        try {
          const result = JSON.parse(initialText);
          handleLoginResult(result);
          return;
        } catch (parseErr) {
          setError('Invalid server response.');
        }
      }
    } catch (err) {
      setError('Unable to connect. Please try again.');
    }

    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
    border: `1px solid ${darkMode ? '#374151' : '#ddd'}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '20px', backgroundColor: colors.dark, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setCurrentPage('portal-login')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} /> Back to Portal
        </button>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
          <span style={{ color: colors.teal }}>Employee</span> Login
        </div>
        <div style={{ width: '120px' }} />
      </header>

      {/* Login Form */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            {/* Logo/Title */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: `${colors.blue}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <LogIn size={32} color={colors.blue} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                Welcome Back
              </h2>
              <p style={{ color: colors.gray }}>Sign in to access your dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#1f2937' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="you@lytcomm.com"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#1f2937' }}>
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
                  backgroundColor: loading ? colors.gray : colors.blue,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Forgot Password */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setCurrentPage('forgot-password')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.teal,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Forgot your password?
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeLogin;
