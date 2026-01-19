import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { colors, LYT_INFO } from './config/constants';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import PortalSelect from './pages/PortalSelect';
import InviteCodePage from './pages/InviteCodePage';

// Portals
import EmployeeOnboarding from './portals/EmployeeOnboarding';
import ContractorOnboarding from './portals/ContractorOnboarding';
import EmployeeLogin from './portals/EmployeeLogin';
import ContractorLogin from './portals/ContractorLogin';
import EmployeeDashboard from './portals/EmployeeDashboard';
import ContractorDashboard from './portals/ContractorDashboard';
import AdminLogin from './portals/AdminLogin';
import AdminDashboard from './portals/AdminDashboard';
import PortalLogin from './portals/PortalLogin';
import SetPassword from './portals/SetPassword';
import ForgotPassword from './portals/ForgotPassword';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const bgColor = darkMode ? '#0d1b2a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'contact', label: 'Contact' },
  ];

  // eslint-disable-next-line no-unused-vars
  const portalLinks = [
    { id: 'portal-login', label: 'Portal' },
    { id: 'onboarding', label: 'Onboarding' },
  ];

  // Browser history integration - back button support
  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Set initial state
    if (!window.history.state) {
      window.history.replaceState({ page: 'home' }, '', window.location.pathname);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavClick = (page) => {
    // Push new state to browser history
    window.history.pushState({ page }, '', `#${page}`);
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  // Pages that don't show the main header/footer
  const portalPages = [
    'portal',
    'portal-login',
    'onboarding',
    'employee-onboarding',
    'contractor-onboarding',
    'employee-login',
    'contractor-login',
    'employee-dashboard',
    'contractor-dashboard',
    'admin-login',
    'admin-dashboard',
    'set-password',
    'forgot-password',
  ];

  const isPortalPage = portalPages.includes(currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={handleNavClick} darkMode={darkMode} />;
      case 'about':
        return <AboutPage darkMode={darkMode} />;
      case 'services':
        return <ServicesPage setCurrentPage={handleNavClick} darkMode={darkMode} />;
      case 'contact':
        return <ContactPage darkMode={darkMode} />;
      case 'portal':
        return <PortalSelect setCurrentPage={handleNavClick} darkMode={darkMode} />;
      case 'employee-onboarding':
        return <EmployeeOnboarding setCurrentPage={handleNavClick} darkMode={darkMode} />;
      case 'contractor-onboarding':
        return <ContractorOnboarding setCurrentPage={handleNavClick} darkMode={darkMode} />;
      case 'employee-login':
        return <EmployeeLogin setCurrentPage={handleNavClick} setLoggedInUser={setLoggedInUser} darkMode={darkMode} />;
      case 'contractor-login':
        return <ContractorLogin setCurrentPage={handleNavClick} setLoggedInUser={setLoggedInUser} darkMode={darkMode} />;
      case 'employee-dashboard':
        return <EmployeeDashboard setCurrentPage={handleNavClick} loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} darkMode={darkMode} />;
      case 'contractor-dashboard':
        return <ContractorDashboard setCurrentPage={handleNavClick} loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} darkMode={darkMode} />;
      case 'admin-login':
        return <AdminLogin setCurrentPage={handleNavClick} setLoggedInUser={setLoggedInUser} darkMode={darkMode} />;
      case 'admin-dashboard':
        return <AdminDashboard setCurrentPage={handleNavClick} loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} darkMode={darkMode} />;
      case 'portal-login':
        return <PortalLogin setCurrentPage={handleNavClick} setLoggedInUser={setLoggedInUser} darkMode={darkMode} />;
      case 'onboarding':
        return <InviteCodePage setCurrentPage={handleNavClick} darkMode={darkMode} />;
      case 'set-password':
        return <SetPassword setCurrentPage={handleNavClick} darkMode={darkMode} />;
      case 'forgot-password':
        return <ForgotPassword setCurrentPage={handleNavClick} darkMode={darkMode} />;
      default:
        return <HomePage setCurrentPage={handleNavClick} darkMode={darkMode} />;
    }
  };

  // For portal pages, render without header/footer
  if (isPortalPage) {
    return (
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {renderPage()}
      </div>
    );
  }

  // Main website with header/footer
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", backgroundColor: bgColor, color: textColor, minHeight: '100vh' }}>
      {/* Top Bar - Minimal */}
      <div style={{ 
        backgroundColor: darkMode ? '#112240' : '#f1f5f9', 
        padding: '6px 20px', 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        fontSize: '0.85rem' 
      }}>
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
          }}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          <span className="hide-mobile">{darkMode ? 'Light' : 'Dark'} Mode</span>
        </button>
      </div>

      {/* Header */}
      <header style={{ 
        backgroundColor: darkMode ? '#0d1b2a' : '#ffffff', 
        padding: '16px 20px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 1000,
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>
              <span style={{ color: colors.teal }}>LYT</span>
              <span style={{ fontWeight: '400', fontSize: '1.25rem', marginLeft: '4px' }}>Communications</span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: currentPage === link.id ? `${colors.teal}20` : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: currentPage === link.id ? colors.teal : textColor,
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => {
                    if (currentPage !== link.id) e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                  }}
                  onMouseOut={(e) => {
                    if (currentPage !== link.id) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleNavClick('portal-login')}
              style={{
                padding: '10px 20px',
                backgroundColor: colors.teal,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginLeft: '12px',
              }}
            >
              Portal
            </button>
            <button
              onClick={() => handleNavClick('onboarding')}
              style={{
                padding: '10px 20px',
                backgroundColor: colors.coral,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginLeft: '8px',
              }}
            >
              Onboarding
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ 
              backgroundColor: 'transparent', 
              border: 'none', 
              color: textColor, 
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu" style={{ 
            padding: '20px', 
            backgroundColor: darkMode ? '#112240' : '#f8fafc', 
            marginTop: '16px', 
            borderRadius: '12px' 
          }}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: currentPage === link.id ? `${colors.teal}20` : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: currentPage === link.id ? colors.teal : textColor,
                  fontSize: '1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '4px',
                }}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => handleNavClick('portal-login')}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 16px',
                backgroundColor: colors.teal,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '12px',
              }}
            >
              Portal
            </button>
            <button
              onClick={() => handleNavClick('onboarding')}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 16px',
                backgroundColor: colors.coral,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              Onboarding
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{renderPage()}</main>

      {/* Footer - Clean & Minimal */}
      <footer style={{ 
        backgroundColor: darkMode ? '#0a1628' : '#1e293b', 
        padding: '48px 20px 24px', 
        color: 'rgba(255,255,255,0.7)' 
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Main Footer Content */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '32px',
            marginBottom: '32px',
          }}>
            {/* Logo & Tagline */}
            <div style={{ flex: '1 1 280px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
                <span style={{ color: colors.teal }}>LYT</span> Communications
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '280px' }}>
                Professional fiber optic construction across the Gulf Coast.
              </p>
              <p style={{ fontSize: '0.8rem', marginTop: '12px', color: 'rgba(255,255,255,0.5)' }}>
                TX • LA • MS • FL • AL
              </p>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ color: '#fff', fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>Navigate</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => handleNavClick(link.id)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'rgba(255,255,255,0.7)', 
                        cursor: 'pointer', 
                        textAlign: 'left', 
                        padding: 0,
                        fontSize: '0.85rem',
                        transition: 'color 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = colors.teal}
                      onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ color: '#fff', fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>Services</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  <span>HDD Drilling</span>
                  <span>Fiber Splicing</span>
                  <span>Aerial Construction</span>
                  <span>Underground</span>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#fff', fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>Team</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => handleNavClick('portal-login')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'rgba(255,255,255,0.7)', 
                      cursor: 'pointer', 
                      textAlign: 'left', 
                      padding: 0,
                      fontSize: '0.85rem',
                    }}
                  >
                    Team Portal
                  </button>
                  <button
                    onClick={() => handleNavClick('onboarding')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'rgba(255,255,255,0.7)', 
                      cursor: 'pointer', 
                      textAlign: 'left', 
                      padding: 0,
                      fontSize: '0.85rem',
                    }}
                  >
                    Onboarding
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{ 
            borderTop: '1px solid rgba(255,255,255,0.1)', 
            paddingTop: '20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '12px' 
          }}>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              © {new Date().getFullYear()} {LYT_INFO.name}
            </p>
            <button
              onClick={() => handleNavClick('contact')}
              style={{
                padding: '8px 20px',
                background: `linear-gradient(135deg, ${colors.teal} 0%, ${colors.blue} 100%)`,
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
              }}
            >
              Get in Touch
            </button>
          </div>
        </div>
      </footer>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .hide-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default App;
