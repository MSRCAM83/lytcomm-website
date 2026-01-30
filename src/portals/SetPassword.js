// SetPassword.js v2.1 - Mobile Optimized
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, Sun, Moon, CheckCircle, AlertCircle } from 'lucide-react';
import { colors } from '../config/constants';

// Portal Backend URL
const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec';

function SetPassword({ setCurrentPage, darkMode, setDarkMode }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get token and email from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    setToken(params.get('token') || '');
    setEmail(params.get('email') || '');
  }, []);

  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const accentError = '#dc2626';
  const accentGradient = darkMode 
    ? 'linear-gradient(135deg, #c850c0 0%, #ff6b35 100%)'
    : 'linear-gradient(135deg, #0077B6 0%, #00b4d8 100%)';
  
  const logoLY = darkMode ? '#e6c4d9' : '#0a3a7d';
  const logoT = darkMode ? '#e6c4d9' : '#2ec7c0';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  const requirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
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

    try {
      const payload = {
        action: 'setPassword',
        email: email,
        token: token,
        password: password
      };

      const response = await fetch(PORTAL_URL, {
        method: 'POST',
        redirect: 'follow',
        body: new URLSearchParams({ payload: JSON.stringify(payload) })
      });

      const text = await response.text();
      let result;

      // Handle GAS redirect
      if (text.trim().startsWith('<')) {
        const match = text.match(/HREF="([^"]+)"/i);
        if (match) {
          const redirectUrl = match[1].replace(/&amp;/g, '&');
          const redirectResponse = await fetch(redirectUrl);
          const redirectText = await redirectResponse.text();
          try {
            result = JSON.parse(redirectText);
          } catch (e) {
            setError('Server error. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          setError('Server error. Please try again.');
          setLoading(false);
          return;
        }
      } else {
        try {
          result = JSON.parse(text);
        } catch (e) {
          setError('Server error. Please try again.');
          setLoading(false);
          return;
        }
      }

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || 'Failed to set password. Please try again.');
      }
      
    } catch (err) {
      console.error('Set password error:', err);
      setError('Unable to connect. Please try again.');
    }

    setLoading(false);
  };

  const getInputStyle = (field) => ({
    width: '100%',
    padding: isMobile ? '16px' : '14px 16px',
    paddingRight: '52px',
    fontSize: '16px', // Prevents iOS zoom
    border: `2px solid ${focused === field ? accentPrimary : (darkMode ? '#374151' : '#e5e7eb')}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focused === field ? `0 0 0 3px ${accentPrimary}30` : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor }}>
      {/* Top Bar */}
      <div style={{ 
        backgroundColor: darkMode ? '#112240' : '#f1f5f9', 
        padding: isMobile ? '8px 16px' : '6px 20px', 
        display: 'flex', 
        justifyContent: 'flex-end' 
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
              padding: '8px 12px',
              borderRadius: '6px',
              minHeight: '44px',
            }}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="hide-mobile">{darkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
        )}
      </div>

      {/* Header */}
      <header style={{ 
        padding: isMobile ? '12px 16px' : '16px 20px', 
        backgroundColor: darkMode ? '#0d1b2a' : '#ffffff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` 
      }}>
        <button
          onClick={() => setCurrentPage('portal-login')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            backgroundColor: 'transparent', 
            border: 'none', 
            color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', 
            fontSize: isMobile ? '0.9rem' : '1rem', 
            cursor: 'pointer', 
            padding: '10px 12px', 
            borderRadius: '8px',
            minHeight: '44px',
          }}
        >
          <ArrowLeft size={isMobile ? 18 : 20} /> {!isMobile && 'Back'}
        </button>
        <div style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '700', color: textColor }}>
          <span style={{ color: accentPrimary }}>Set</span> Password
        </div>
        <button 
          onClick={() => setCurrentPage('home')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            padding: '10px',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '700' }}>
            <span style={{ color: logoLY }}>ly</span><span style={{ color: logoT }}>t</span>
          </div>
        </button>
      </header>

      {/* Form */}
      <div style={{ 
        maxWidth: '400px', 
        margin: isMobile ? '24px auto' : '60px auto', 
        padding: isMobile ? '0 16px' : '0 20px' 
      }}>
        <div style={{ 
          backgroundColor: cardBg, 
          borderRadius: isMobile ? '12px' : '16px', 
          padding: isMobile ? '24px 20px' : '32px', 
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '24px' }}>
            <div style={{ 
              width: isMobile ? '56px' : '64px', 
              height: isMobile ? '56px' : '64px', 
              borderRadius: '50%', 
              background: accentGradient, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px' 
            }}>
              <Lock size={isMobile ? 24 : 28} color="#fff" />
            </div>
            <h2 style={{ color: textColor, margin: '0 0 8px', fontSize: isMobile ? '1.35rem' : '1.5rem' }}>Create Password</h2>
            <p style={{ color: mutedColor, margin: 0, fontSize: '0.9rem' }}>Set up your account password</p>
            <p style={{ color: mutedColor, margin: '8px 0 0', fontSize: '0.7rem', opacity: 0.5 }}>v2.1</p>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ 
                width: isMobile ? '56px' : '64px', 
                height: isMobile ? '56px' : '64px', 
                borderRadius: '50%', 
                backgroundColor: `${accentSecondary}20`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px' 
              }}>
                <CheckCircle size={isMobile ? 28 : 32} color={accentSecondary} />
              </div>
              <h3 style={{ color: textColor, margin: '0 0 8px' }}>Password Set!</h3>
              <p style={{ color: mutedColor, fontSize: '0.9rem', margin: '0 0 24px' }}>
                Your password has been set successfully. You can now sign in.
              </p>
              <button
                onClick={() => setCurrentPage('portal-login')}
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '16px' : '14px', 
                  background: accentGradient, 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  minHeight: '50px',
                }}
              >
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onFocus={() => setFocused('password')} 
                    onBlur={() => setFocused(null)} 
                    placeholder="Create a password" 
                    required 
                    style={getInputStyle('password')}
                    autoComplete="new-password"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={{ 
                      position: 'absolute', 
                      right: '4px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: mutedColor,
                      padding: '12px',
                      minWidth: '44px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: darkMode ? '#112240' : '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '500', color: textColor, marginBottom: '8px' }}>Password Requirements:</p>
                {requirements.map((req, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', padding: '4px 0' }}>
                    {req.test(password) ? <CheckCircle size={16} color={accentSecondary} /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `1px solid ${mutedColor}` }} />}
                    <span style={{ fontSize: '0.85rem', color: req.test(password) ? accentSecondary : mutedColor }}>{req.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showConfirm ? 'text' : 'password'} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    onFocus={() => setFocused('confirm')} 
                    onBlur={() => setFocused(null)} 
                    placeholder="Confirm your password" 
                    required 
                    style={getInputStyle('confirm')}
                    autoComplete="new-password"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirm(!showConfirm)} 
                    style={{ 
                      position: 'absolute', 
                      right: '4px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: mutedColor,
                      padding: '12px',
                      minWidth: '44px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p style={{ color: accentError, fontSize: '0.85rem', marginTop: '8px' }}>Passwords do not match</p>
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
                disabled={loading || !allRequirementsMet} 
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '16px' : '14px', 
                  background: (loading || !allRequirementsMet) ? (darkMode ? '#374151' : '#9ca3af') : accentGradient, 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  cursor: (loading || !allRequirementsMet) ? 'not-allowed' : 'pointer',
                  minHeight: '50px',
                }}
              >
                {loading ? 'Setting Password...' : 'Set Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default SetPassword;
