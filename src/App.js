import React, { useState } from 'react';
import { Menu, X, Sun, Moon, Phone, Mail } from 'lucide-react';
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

  const bgColor = darkMode ? colors.dark : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;

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

  const handleNavClick = (page) => {
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
      <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {renderPage()}
      </div>
    );
  }

  // Main website with header/footer
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", backgroundColor: bgColor, color: textColor, minHeight: '100vh' }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: colors.darkLight, padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '20px', color: 'rgba(255,255,255,0.8)' }}>
          <a href={`tel:${LYT_INFO.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'inherit', textDecoration: 'none' }}>
            <Phone size={14} /> {LYT_INFO.phone}
          </a>
          <a href={`mailto:${LYT_INFO.email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'inherit', textDecoration: 'none' }}>
            <Mail size={14} /> {LYT_INFO.email}
          </a>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{ backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      {/* Header */}
      <header style={{ backgroundColor: colors.dark, padding: '16px 20px', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fff' }}>
              <span style={{ color: colors.teal }}>LYT</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', display: 'none' }}>Communications</span>
          </button>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    color: currentPage === link.id ? colors.teal : '#fff',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => {
                    if (currentPage !== link.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
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
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none', backgroundColor: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{ padding: '20px', backgroundColor: colors.darkLight, marginTop: '16px', borderRadius: '8px' }}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: currentPage === link.id ? `${colors.teal}20` : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: currentPage === link.id ? colors.teal : '#fff',
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
                padding: '12px',
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
                padding: '12px',
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

      {/* Footer */}
      <footer style={{ backgroundColor: colors.dark, padding: '60px 20px 24px', color: 'rgba(255,255,255,0.8)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
            {/* Company Info */}
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
                <span style={{ color: colors.teal }}>LYT</span> Communications
              </div>
              <p style={{ lineHeight: '1.7', marginBottom: '16px' }}>
                Professional fiber optic construction services across the Greater Houston area.
              </p>
              <p>{LYT_INFO.address}</p>
              <p>{LYT_INFO.city}, {LYT_INFO.state} {LYT_INFO.zip}</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: '600', marginBottom: '16px' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: '600', marginBottom: '16px' }}>Services</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span>HDD Drilling</span>
                <span>Fiber Splicing</span>
                <span>Aerial Construction</span>
                <span>Network Testing</span>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: '600', marginBottom: '16px' }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href={`tel:${LYT_INFO.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{LYT_INFO.phone}</a>
                <a href={`mailto:${LYT_INFO.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{LYT_INFO.email}</a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ fontSize: '0.9rem' }}>© {new Date().getFullYear()} {LYT_INFO.name}. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleNavClick('portal-login')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.teal}`,
                  borderRadius: '6px',
                  color: colors.teal,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Portal
              </button>
              <button
                onClick={() => handleNavClick('onboarding')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.coral}`,
                  borderRadius: '6px',
                  color: colors.coral,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Onboarding
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
