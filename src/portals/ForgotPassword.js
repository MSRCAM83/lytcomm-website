// ForgotPassword.js v2.0 - Connected to Portal Backend
import React, { useState } from 'react';
import { ArrowLeft, Mail, Sun, Moon, AlertCircle, CheckCircle } from 'lucide-react';
import { colors } from '../config/constants';

// Portal Backend URL
const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec';

function ForgotPassword({ setCurrentPage, darkMode, setDarkMode }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.includes('@')) { 
      setError('Please enter a valid email address.'); 
      return; 
    }
    
    setLoading(true);

    try {
      const payload = {
        action: 'forgotPassword',
        email: email.trim().toLowerCase()
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
            // If user not found, still show success (security - don't reveal if email exists)
            setSuccess(true);
            setLoading(false);
            return;
          }
        } else {
          setSuccess(true);
          setLoading(false);
          return;
        }
      } else {
        try {
          result = JSON.parse(text);
        } catch (e) {
          setSuccess(true);
          setLoading(false);
          return;
        }
      }

      // Always show success for security (don't reveal if email exists)
      setSuccess(true);
      
    } catch (err) {
      console.error('Forgot password error:', err);
      // Still show success for security
      setSuccess(true);
    }

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor }}>
      {/* Top Bar */}
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
          onClick={() => setCurrentPage('portal-login')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: 'none', color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', fontSize: '1rem', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px' }}
        >
          <ArrowLeft size={20} /> Back
        </button>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: textColor }}>
          <span style={{ color: accentPrimary }}>Reset</span> Password
        </div>
        <button onClick={() => setCurrentPage('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            <span style={{ color: logoLY }}>ly</span><span style={{ color: logoT }}>t</span>
          </div>
        </button>
      </header>

      {/* Form */}
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Mail size={28} color="#fff" />
            </div>
            <h2 style={{ color: textColor, margin: '0 0 8px', fontSize: '1.5rem' }}>Forgot Password?</h2>
            <p style={{ color: mutedColor, margin: 0, fontSize: '0.9rem' }}>Enter your email to receive a reset link</p>
            <p style={{ color: mutedColor, margin: '8px 0 0', fontSize: '0.7rem', opacity: 0.5 }}>v2.0</p>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: `${accentSecondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} color={accentSecondary} />
              </div>
              <h3 style={{ color: textColor, margin: '0 0 8px' }}>Check Your Email</h3>
              <p style={{ color: mutedColor, fontSize: '0.9rem', margin: '0 0 24px' }}>
                If an account exists for {email}, you'll receive a password reset link shortly.
              </p>
              <button
                onClick={() => setCurrentPage('portal-login')}
                style={{ width: '100%', padding: '14px', background: accentGradient, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    onFocus={() => setFocused(true)} 
                    onBlur={() => setFocused(false)} 
                    placeholder="you@company.com" 
                    required 
                    style={inputStyle} 
                  />
                </div>
                {error && (
                  <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: `${accentError}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} color={accentError} />
                    <span style={{ color: accentError, fontSize: '0.9rem' }}>{error}</span>
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
                    cursor: loading ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button 
                  onClick={() => setCurrentPage('portal-login')} 
                  style={{ background: 'none', border: 'none', color: accentPrimary, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Remember your password? Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
