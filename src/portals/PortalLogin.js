// PortalLogin.js v3.8 - Mobile Optimized
import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogIn, Eye, EyeOff, Sun, Moon } from 'lucide-react';

// Portal Backend URL
const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec';

function PortalLogin({ setCurrentPage, setLoggedInUser, darkMode, setDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [focused, setFocused] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      const payload = {
        action: 'login',
        email: email.trim().toLowerCase(),
        password: password
      };

      // First, get the redirect URL from GAS
      const initialResponse = await fetch(PORTAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const initialText = await initialResponse.text();
      
      // GAS returns HTML with redirect - extract and follow it
      if (initialText.includes('HREF="')) {
        const match = initialText.match(/HREF="([^"]+)"/i);
        if (match) {
          const redirectUrl = match[1].replace(/&amp;/g, '&');
          
          // Fetch the actual response from redirect URL
          const finalResponse = await fetch(redirectUrl);
          const finalText = await finalResponse.text();
          
          try {
            const result = JSON.parse(finalText);
            handleLoginResult(result);
            return;
          } catch (parseErr) {
            console.error('Parse error after redirect:', finalText.substring(0, 300));
            setError('Server error. Please try again.');
          }
        } else {
          setError('Server configuration error.');
        }
      } else {
        // Direct JSON response (no redirect)
        try {
          const result = JSON.parse(initialText);
          handleLoginResult(result);
          return;
        } catch (parseErr) {
          console.error('Parse error:', initialText.substring(0, 300));
          setError('Invalid server response.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect. Please try again.');
    }

    setLoading(false);
  };

  const handleLoginResult = (result) => {
    setLoading(false);
    
    if (result.success) {
      const user = result.user || result.data || result;
      setLoggedInUser({
        email: user.email || email,
        name: user.name || 'User',
        role: user.role || 'employee',
        status: user.status || 'active'
      });
      
      const role = user.role || 'employee';
      if (role === 'admin') {
        setCurrentPage('admin-dashboard');
      } else if (role === 'employee') {
        setCurrentPage('employee-dashboard');
      } else if (role === 'contractor') {
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
    padding: isMobile ? '16px' : '14px 16px',
    fontSize: '16px', // Prevents iOS zoom
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
    <div 
      style={{ minHeight: '100vh', backgroundColor: bgColor }} 
      onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}
    >
      {/* Dark/Light Mode Toggle Bar */}
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
              padding: '8px 12px', // Larger touch target
              borderRadius: '6px',
              minHeight: '44px', // iOS minimum touch target
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
          onClick={() => setCurrentPage('home')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            backgroundColor: 'transparent', 
            border: 'none', 
            color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', 
            fontSize: isMobile ? '0.9rem' : '1rem', 
            cursor: 'pointer', 
            padding: '10px 12px', // Larger touch target
            borderRadius: '8px',
            minHeight: '44px', // iOS minimum
          }}
        >
          <ArrowLeft size={isMobile ? 18 : 20} /> {!isMobile && 'Back'}
        </button>
        <div style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '700', color: textColor }}>
          <span style={{ color: accentPrimary }}>Team</span> Portal
        </div>
        <button 
          onClick={() => setCurrentPage('home')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            padding: '10px', // Larger touch target
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

      {/* Main Content */}
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
          {/* Icon and Title */}
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
              <LogIn size={isMobile ? 24 : 28} color="#fff" />
            </div>
            <h2 style={{ color: textColor, margin: '0 0 8px', fontSize: isMobile ? '1.35rem' : '1.5rem' }}>Welcome Back</h2>
            <p style={{ color: mutedColor, margin: 0, fontSize: '0.9rem' }}>Sign in to your account</p>
            <p style={{ color: mutedColor, margin: '8px 0 0', fontSize: '0.7rem', opacity: 0.5 }}>v3.8</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: textColor, fontWeight: '500', fontSize: '0.9rem' }}>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                onFocus={() => setFocused('email')} 
                onBlur={() => setFocused(null)} 
                style={getInputStyle('email')} 
                placeholder="you@company.com" 
                required 
                autoComplete="email"
                autoCapitalize="none"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: textColor, fontWeight: '500', fontSize: '0.9rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  onFocus={() => setFocused('password')} 
                  onBlur={() => setFocused(null)} 
                  style={{ ...getInputStyle('password'), paddingRight: '52px' }} 
                  placeholder="••••••••" 
                  required 
                  autoComplete="current-password"
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
                    color: '#6b7280', 
                    padding: '12px', // Larger touch target
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

            {/* Error Message */}
            {error && (
              <div style={{ 
                backgroundColor: '#fef2f2', 
                border: '1px solid #fecaca', 
                color: '#dc2626', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px', 
                fontSize: '0.9rem' 
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: isMobile ? '16px' : '14px', 
                background: loading ? '#9ca3af' : accentGradient, 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '1rem', 
                fontWeight: '600', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                minHeight: '50px', // Good touch target
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button 
              onClick={() => setCurrentPage('forgot-password')} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: accentPrimary, 
                cursor: 'pointer', 
                fontSize: '0.9rem', 
                textDecoration: 'underline',
                padding: '12px', // Larger touch target
                minHeight: '44px',
              }}
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>

      {/* Version indicator (triple-click to show) */}
      {showVersion && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          fontSize: '0.7rem', 
          opacity: 0.5, 
          color: textColor, 
          backgroundColor: cardBg, 
          padding: '4px 8px', 
          borderRadius: '4px' 
        }}>
          PortalLogin v3.8
        </div>
      )}
    </div>
  );
}

export default PortalLogin;
