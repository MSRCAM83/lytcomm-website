import React, { useState } from 'react';
import { ArrowLeft, Users, Building2, Lock, CheckCircle, Shield, Sun, Moon } from 'lucide-react';
import { colors, INVITE_CODE, NDA_INVITE_CODE, LYT_INFO } from '../config/constants';

function InviteCodePage({ setCurrentPage, darkMode, setDarkMode }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeType, setCodeType] = useState(null); // 'onboarding' or 'nda'

  // Dynamic colors based on theme
  const accentPrimary = darkMode ? '#ff6b35' : '#28a745';       // Orange vs Green (Onboarding)
  const accentSecondary = darkMode ? '#c850c0' : '#00b4d8';     // Pink vs Teal
  const accentNDA = darkMode ? '#c850c0' : '#0077B6';         // Pink vs Blue for NDA
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';       // Error red

  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  
  // Logo text colors
  const logoLY = darkMode ? '#e6c4d9' : '#0a3a7d';
  const logoT = darkMode ? '#e6c4d9' : '#2ec7c0';
  const logoComm = darkMode ? '#ffffff' : '#1e293b';

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedCode = code.toLowerCase().trim();
    
    if (trimmedCode === INVITE_CODE.toLowerCase()) {
      setCodeVerified(true);
      setCodeType('onboarding');
    } else if (trimmedCode === NDA_INVITE_CODE.toLowerCase()) {
      setCodeVerified(true);
      setCodeType('nda');
    } else {
      setError('Invalid invite code. Please check with your administrator.');
    }
  };

  const handleTypeSelect = (type) => {
    if (type === 'employee') {
      setCurrentPage('employee-onboarding');
    } else if (type === 'contractor') {
      setCurrentPage('contractor-onboarding');
    } else if (type === 'nda') {
      setCurrentPage('nda-sign');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar with Sun/Moon Toggle */}
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
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 12px', borderRadius: '8px' }}
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
                  Enter your invite code to begin
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
                      backgroundColor: '#ffffff',
                      color: '#1f2937',
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
          ) : codeType === 'nda' ? (
            /* NDA Only - Direct to NDA signing */
            <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: `${accentNDA}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={32} color={accentNDA} />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '8px' }}>
                  Code Verified
                </h1>
                <p style={{ color: mutedColor }}>
                  You've been invited to sign an NDA
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  onClick={() => handleTypeSelect('nda')}
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
                    e.currentTarget.style.borderColor = accentNDA;
                    e.currentTarget.style.backgroundColor = `${accentNDA}10`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? '#374151' : '#e5e7eb';
                    e.currentTarget.style.backgroundColor = darkMode ? colors.dark : '#f8fafc';
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${accentNDA}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={24} color={accentNDA} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor, marginBottom: '4px' }}>
                      Non-Disclosure Agreement
                    </h3>
                    <p style={{ color: mutedColor, fontSize: '0.9rem' }}>
                      Review and sign the confidentiality agreement
                    </p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => {
                  setCodeVerified(false);
                  setCodeType(null);
                  setCode('');
                }}
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
          ) : (
            /* Employee/Contractor Type Selection */
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
                    e.currentTarget.style.borderColor = accentSecondary;
                    e.currentTarget.style.backgroundColor = `${accentSecondary}10`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? '#374151' : '#e5e7eb';
                    e.currentTarget.style.backgroundColor = darkMode ? colors.dark : '#f8fafc';
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${accentSecondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={24} color={accentSecondary} />
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
                onClick={() => {
                  setCodeVerified(false);
                  setCodeType(null);
                  setCode('');
                }}
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
      <footer style={{ backgroundColor: darkMode ? '#112240' : '#f8fafc', padding: '40px 20px 24px', marginTop: 'auto' }}>
        <div style={{ height: '3px', background: `linear-gradient(135deg, ${accentPrimary} 0%, ${accentSecondary} 100%)`, marginBottom: '32px', borderRadius: '2px', maxWidth: '1200px', margin: '0 auto 32px' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>
                <span style={{ color: logoLY }}>ly</span><span style={{ color: logoT }}>t</span>
                <span style={{ fontWeight: '400', fontSize: '1.1rem', marginLeft: '4px', color: logoComm }}>Communications</span>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '280px', color: darkMode ? 'rgba(255,255,255,0.7)' : '#64748b' }}>Professional fiber optic construction across the Gulf Coast.</p>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '0.8rem', color: darkMode ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>© {new Date().getFullYear()} {LYT_INFO.name}</p>
            <button onClick={() => setCurrentPage('contact')} style={{ padding: '8px 20px', background: `linear-gradient(135deg, ${accentPrimary} 0%, ${accentSecondary} 100%)`, border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>Get in Touch</button>
          </div>
        </div>
      </footer>
      
      {/* Responsive Styles */}
      <style>{`@media (max-width: 768px) { .hide-mobile { display: none !important; } }`}</style>
    </div>
  );
}

export default InviteCodePage;
