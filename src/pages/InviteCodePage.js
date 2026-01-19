import React, { useState } from 'react';
import { ArrowLeft, Users, Building2, Lock, CheckCircle } from 'lucide-react';
import { colors, INVITE_CODE, LYT_INFO } from '../config/constants';

function InviteCodePage({ setCurrentPage, darkMode }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);

  // Dynamic colors based on theme
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';     // Purple vs Teal
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';   // Orange vs Green
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';       // Error red

  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (code.toLowerCase().trim() === INVITE_CODE.toLowerCase()) {
      setCodeVerified(true);
    } else {
      setError('Invalid invite code. Please check with your administrator.');
    }
  };

  const handleTypeSelect = (type) => {
    if (type === 'employee') {
      setCurrentPage('employee-onboarding');
    } else {
      setCurrentPage('contractor-onboarding');
    }
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
        <div style={{ width: '100%', maxWidth: '500px' }}>
          {!codeVerified ? (
            /* Invite Code Entry */
            <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: `${accentError}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Lock size={32} color={accentError} />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '8px' }}>
                  Welcome to Onboarding
                </h1>
                <p style={{ color: mutedColor }}>
                  Enter your invite code to begin the onboarding process
                </p>
              </div>

              <form onSubmit={handleCodeSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your invite code"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '1rem',
                      border: `1px solid ${error ? accentError : (darkMode ? '#374151' : '#ddd')}`,
                      borderRadius: '8px',
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      color: textColor,
                      boxSizing: 'border-box',
                    }}
                  />
                  {error && (
                    <p style={{ color: accentError, fontSize: '0.85rem', marginTop: '8px' }}>{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: accentError,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Continue
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '24px', color: mutedColor, fontSize: '0.85rem' }}>
                Don't have an invite code? Contact{' '}
                <a href={`mailto:${LYT_INFO.email}`} style={{ color: accentPrimary }}>
                  {LYT_INFO.email}
                </a>
              </p>
            </div>
          ) : (
            /* Type Selection */
            <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: `${accentSecondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={32} color={accentSecondary} />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '8px' }}>
                  Code Verified
                </h1>
                <p style={{ color: mutedColor }}>
                  Select your onboarding type to continue
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  onClick={() => handleTypeSelect('employee')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    backgroundColor: darkMode ? '#111827' : '#f8fafc',
                    border: `2px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = accentPrimary;
                    e.currentTarget.style.backgroundColor = `${accentPrimary}10`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? '#374151' : '#e5e7eb';
                    e.currentTarget.style.backgroundColor = darkMode ? colors.dark : '#f8fafc';
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${accentPrimary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={24} color={accentPrimary} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor, marginBottom: '4px' }}>
                      Employee
                    </h3>
                    <p style={{ color: mutedColor, fontSize: '0.9rem' }}>
                      I'm joining as a W-2 employee of LYT Communications
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleTypeSelect('contractor')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    backgroundColor: darkMode ? '#111827' : '#f8fafc',
                    border: `2px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = accentError;
                    e.currentTarget.style.backgroundColor = `${accentError}10`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? '#374151' : '#e5e7eb';
                    e.currentTarget.style.backgroundColor = darkMode ? colors.dark : '#f8fafc';
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${accentError}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={24} color={accentError} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor, marginBottom: '4px' }}>
                      Contractor / Subcontractor
                    </h3>
                    <p style={{ color: mutedColor, fontSize: '0.9rem' }}>
                      I'm registering my company as a contractor
                    </p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setCodeVerified(false)}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '24px',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: mutedColor,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                ← Back to code entry
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '20px', textAlign: 'center', color: mutedColor, fontSize: '0.85rem' }}>
        © {new Date().getFullYear()} {LYT_INFO.name}. All rights reserved.
      </footer>
    </div>
  );
}

export default InviteCodePage;
