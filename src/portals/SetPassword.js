import React, { useState } from 'react';
import { ArrowLeft, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { colors, LYT_INFO } from '../config/constants';

function SetPassword({ setCurrentPage, darkMode }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Dynamic colors based on theme
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';     // Purple vs Teal
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';   // Orange vs Green
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';       // Error red

  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  // Password requirements
  const requirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'Contains number', test: (p) => /[0-9]/.test(p) },
    { label: 'Contains special character (!@#$%^&*)', test: (p) => /[!@#$%^&*]/.test(p) },
  ];

  const allRequirementsMet = requirements.every(req => req.test(password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRequirementsMet) {
      setError('Please meet all password requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In production, this would call the backend to set the password
    setSuccess(true);
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    border: `1px solid ${darkMode ? '#374151' : '#ddd'}`,
    borderRadius: '8px',
    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    color: textColor,
    boxSizing: 'border-box',
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ backgroundColor: colors.dark, padding: '16px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff' }}>
                <span style={{ color: accentPrimary }}>LYT</span>
              </div>
            </button>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: `${accentSecondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle size={40} color={accentSecondary} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '12px' }}>
                Password Set Successfully!
              </h1>
              <p style={{ color: mutedColor, marginBottom: '32px' }}>
                Your account is now active. You can sign in to access your dashboard.
              </p>
              <button
                onClick={() => setCurrentPage('portal-login')}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: accentPrimary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Sign In to Portal
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ backgroundColor: colors.dark, padding: '16px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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
                <Lock size={32} color={accentPrimary} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '8px' }}>
                Set Your Password
              </h1>
              <p style={{ color: mutedColor }}>
                Create a secure password for your account
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
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

              {/* Password Requirements */}
              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '500', color: textColor, marginBottom: '8px' }}>
                  Password Requirements:
                </p>
                {requirements.map((req, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {req.test(password) ? (
                      <CheckCircle size={14} color={accentSecondary} />
                    ) : (
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `1px solid ${mutedColor}` }} />
                    )}
                    <span style={{ fontSize: '0.8rem', color: req.test(password) ? accentSecondary : mutedColor }}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    style={{ ...inputStyle, paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
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
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p style={{ color: accentError, fontSize: '0.8rem', marginTop: '6px' }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              {error && (
                <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: `${accentError}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} color={accentError} />
                  <span style={{ color: accentError, fontSize: '0.9rem' }}>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !allRequirementsMet || password !== confirmPassword}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: (loading || !allRequirementsMet || password !== confirmPassword) ? colors.gray : accentPrimary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: (loading || !allRequirementsMet || password !== confirmPassword) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Setting Password...' : 'Set Password'}
              </button>
            </form>
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

export default SetPassword;
