import React, { useState, useEffect } from 'react';
import { Clock, MapPin, FileText, Users, DollarSign, Bell, Settings, LogOut, Sun, Moon, Menu, X, Plus, Check, ChevronRight, Upload, Download, Folder, Search, Filter, Calendar, Phone, Mail, AlertCircle, CheckCircle, Edit, Trash2, Eye, Play, Pause, Coffee, ChevronDown, Zap, Shield, Award, Target, ArrowRight, Send, Facebook, Linkedin, Instagram } from 'lucide-react';

// Theme colors based on LYT logo
const colors = {
  blue: '#0077B6',
  teal: '#00B4D8',
  green: '#2E994B',
  darkBlue: '#023E8A',
  dark: '#0a1628',
};

// Stock images from Unsplash (free to use) - matched to content
const images = {
  hero: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1920&q=80', // fiber optic blue glow
  fiberClose: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', // fiber optic strands
  networkSwitch: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', // network equipment
  construction: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', // construction workers
  aerial: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80', // utility poles
  underground: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&q=80', // excavation trench
  testing: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80', // tech testing
  team: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80', // professional team meeting
  aboutHero: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80', // construction work
  servicesHero: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1920&q=80', // fiber
  contactHero: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1920&q=80', // team
};

// Mock data for portal (same as before)
const mockUsers = [
  { id: 1, name: 'Matt Campbell', email: 'matt@lytcomm.com', role: 'admin', phone: '555-0100', emergency_contact: 'Jane Campbell - 555-0101', avatar: 'MC' },
  { id: 2, name: 'John Rivera', email: 'john@lytcomm.com', role: 'supervisor', phone: '555-0102', emergency_contact: 'Maria Rivera - 555-0103', avatar: 'JR' },
  { id: 3, name: 'Sarah Chen', email: 'sarah@lytcomm.com', role: 'technician', phone: '555-0104', emergency_contact: 'Mike Chen - 555-0105', avatar: 'SC' },
  { id: 4, name: 'Marcus Johnson', email: 'marcus@lytcomm.com', role: 'technician', phone: '555-0106', emergency_contact: 'Lisa Johnson - 555-0107', avatar: 'MJ' },
];

const mockProjects = [
  { id: 1, name: 'Downtown Fiber Expansion', client: 'City of Springfield', address: '450 Main St, Springfield, TX', status: 'active', crew: [3, 4], start_date: '2024-12-01', end_date: '2025-02-15', notes: 'Phase 2 of city infrastructure upgrade. 12-strand single mode.' },
  { id: 2, name: 'Bayshore Business Park', client: 'Bayshore Properties LLC', address: '8900 Seawall Blvd, Galveston, TX', status: 'active', crew: [3], start_date: '2024-12-15', end_date: '2025-01-30', notes: 'New construction FTTH. 48-count distribution.' },
  { id: 3, name: 'Harbor Medical Center', client: 'UTMB Health', address: '301 University Blvd, Galveston, TX', status: 'on-hold', crew: [4], start_date: '2025-01-10', end_date: '2025-03-01', notes: 'Waiting on permits. High-priority medical facility.' },
  { id: 4, name: 'Strand District Upgrade', client: 'Galveston Historical Foundation', address: '2100 Strand, Galveston, TX', status: 'complete', crew: [3, 4], start_date: '2024-10-01', end_date: '2024-11-30', notes: 'Underground boring complete. All testing passed.' },
];

const mockTimeEntries = [
  { id: 1, user_id: 3, date: '2024-12-30', clock_in: '07:00', clock_out: '16:30', break_mins: 60, status: 'approved' },
  { id: 2, user_id: 3, date: '2024-12-29', clock_in: '06:30', clock_out: '15:00', break_mins: 30, status: 'approved' },
  { id: 3, user_id: 4, date: '2024-12-30', clock_in: '07:15', clock_out: '17:00', break_mins: 45, status: 'pending' },
  { id: 4, user_id: 3, date: '2024-12-31', clock_in: '07:00', clock_out: null, break_mins: 0, status: 'active' },
];

const mockFiles = [
  { id: 1, name: 'Safety Manual 2024.pdf', folder: 'Safety Docs', size: '2.4 MB', uploaded_by: 'Matt Campbell', date: '2024-11-15' },
  { id: 2, name: 'OTDR Testing Procedures.pdf', folder: 'SOPs & Procedures', size: '1.1 MB', uploaded_by: 'Matt Campbell', date: '2024-10-20' },
  { id: 3, name: 'Daily Safety Checklist.pdf', folder: 'Forms', size: '245 KB', uploaded_by: 'John Rivera', date: '2024-12-01' },
  { id: 4, name: 'Splice Closure Specs.pdf', folder: 'Project Files', size: '3.8 MB', uploaded_by: 'Matt Campbell', date: '2024-12-10' },
  { id: 5, name: 'Vehicle Inspection Form.pdf', folder: 'Forms', size: '180 KB', uploaded_by: 'John Rivera', date: '2024-11-28' },
  { id: 6, name: 'Fusion Splicer SOP.pdf', folder: 'SOPs & Procedures', size: '890 KB', uploaded_by: 'Matt Campbell', date: '2024-09-15' },
];

const mockInvoices = [
  { id: 1, number: 'INV-2024-001', client: 'Galveston Historical Foundation', amount: 45750.00, status: 'paid', date: '2024-12-01' },
  { id: 2, number: 'INV-2024-002', client: 'City of Springfield', amount: 28500.00, status: 'sent', date: '2024-12-20' },
  { id: 3, number: 'INV-2024-003', client: 'Bayshore Properties LLC', amount: 12350.00, status: 'draft', date: '2024-12-28' },
];

const mockAnnouncements = [
  { id: 1, title: 'Holiday Schedule', content: 'Office closed Jan 1st for New Year. Emergency on-call rotation in effect.', date: '2024-12-28', author: 'Matt Campbell' },
  { id: 2, title: 'New Safety Vests', content: 'Class 3 high-vis vests are now required on all job sites. Pick yours up from the warehouse.', date: '2024-12-20', author: 'Matt Campbell' },
];

// Services data with images - matched to descriptions
const services = [
  { icon: Zap, title: 'Fiber Optic Splicing', description: 'Precision fusion splicing for single-mode and multi-mode fiber. Low-loss connections guaranteed with comprehensive OTDR testing and documentation.', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80' }, // Blue glowing fiber strands
  { icon: Play, title: 'Activation Services', description: 'End-to-end fiber activation including equipment installation, signal testing, and network turn-up. Get your infrastructure online fast.', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80' }, // Server/network rack with cables
  { icon: Search, title: 'Troubleshooting & Testing', description: 'Expert fault location and repair using advanced OTDR, power meters, and visual fault locators. Full test reports provided.', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80' }, // Technician with testing equipment
  { icon: Target, title: 'Aerial Construction', description: 'Complete aerial fiber installation including strand placement, lashing, and cable installation. Pole attachment coordination included.', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80' }, // Utility poles with wires against sky
  { icon: MapPin, title: 'Underground Construction', description: 'Directional boring, trenching, and conduit installation. Minimal surface disruption with professional restoration.', image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&q=80' }, // Excavation/construction trench
  { icon: Shield, title: 'Emergency Response', description: '24/7 emergency fiber repair services. Rapid response to minimize downtime and restore critical communications.', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' }, // Construction worker at night/urgent work
];

// Logo Component
const Logo = ({ size = 'normal', light = false }) => {
  const sizes = {
    small: { text: '24px', sub: '8px' },
    normal: { text: '32px', sub: '10px' },
    large: { text: '48px', sub: '12px' },
  };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ 
        fontSize: sizes[size].text, 
        fontWeight: '700',
        background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal}, ${colors.green})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-1px'
      }}>
        lyt
      </div>
      <div style={{ 
        fontSize: sizes[size].sub, 
        fontWeight: '600', 
        color: light ? 'rgba(255,255,255,0.7)' : '#64748b',
        letterSpacing: '1.5px',
        lineHeight: 1.2
      }}>
        <div>COMMUNICATIONS</div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('public');
  const [currentPage, setCurrentPage] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  
  // Portal state
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [portalPage, setPortalPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Auth state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Time clock state
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Other state
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Contact form
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      const activeEntry = mockTimeEntries.find(e => e.user_id === currentUser.id && e.status === 'active');
      if (activeEntry) {
        setIsClockedIn(true);
        setClockInTime(activeEntry.clock_in);
      }
    }
  }, [currentUser]);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = mockUsers.find(u => u.email === loginEmail);
    if (user) {
      setCurrentUser(user);
      setPortalPage('dashboard');
      setLoginError('');
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('public');
    setCurrentPage('home');
    setIsClockedIn(false);
    setClockInTime(null);
  };

  const handleClockIn = () => {
    setIsClockedIn(true);
    setClockInTime(currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    setClockInTime(null);
    setIsOnBreak(false);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
    setContactForm({ name: '', email: '', phone: '', company: '', message: '' });
  };

  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    bgCard: darkMode ? '#1e293b' : '#ffffff',
    bgHover: darkMode ? '#334155' : '#f1f5f9',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textMuted: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    accent: colors.blue,
    accentLight: darkMode ? '#0077B620' : '#0077B610',
  };

  const getNavItems = () => {
    const base = [
      { id: 'dashboard', label: 'Dashboard', icon: Bell },
      { id: 'timeclock', label: 'Time Clock', icon: Clock },
      { id: 'projects', label: 'Projects', icon: MapPin },
      { id: 'files', label: 'Files', icon: FileText },
    ];
    if (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') {
      base.push({ id: 'invoices', label: 'Invoices', icon: DollarSign });
    }
    base.push({ id: 'team', label: 'Team', icon: Users });
    if (currentUser?.role === 'admin') {
      base.push({ id: 'users', label: 'Manage Users', icon: Settings });
    }
    return base;
  };

  // ============================================
  // PUBLIC WEBSITE
  // ============================================
  if (view === 'public') {
    return (
      <div style={{ fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", color: '#1e293b' }}>
        {/* Navigation */}
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled ? 'rgba(255,255,255,0.98)' : (currentPage === 'home' ? 'transparent' : 'rgba(255,255,255,0.98)'),
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid #e2e8f0' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Logo light={!scrolled && currentPage === 'home'} />

            {/* Desktop Nav */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              {['Home', 'About', 'Services', 'Contact'].map(item => (
                <button
                  key={item}
                  onClick={() => { setCurrentPage(item.toLowerCase()); window.scrollTo(0, 0); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: currentPage === item.toLowerCase() 
                      ? colors.blue 
                      : (scrolled || currentPage !== 'home' ? '#374151' : 'rgba(255,255,255,0.9)'),
                    cursor: 'pointer',
                    padding: '8px 0',
                    position: 'relative',
                    transition: 'color 0.3s'
                  }}
                >
                  {item}
                  {currentPage === item.toLowerCase() && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: colors.blue,
                      borderRadius: '2px'
                    }} />
                  )}
                </button>
              ))}
              <button
                onClick={() => setView('portal')}
                style={{
                  background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`,
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0,119,182,0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Users size={16} /> Employee Portal
              </button>
            </nav>
          </div>
        </header>

        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <>
            {/* Hero Section with Background Image */}
            <section style={{
              minHeight: '100vh',
              background: `linear-gradient(135deg, rgba(10,22,40,0.92), rgba(2,62,138,0.88)), url(${images.hero})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}>
              <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '140px 24px 100px',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{ maxWidth: '720px' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    fontSize: '13px',
                    color: colors.teal,
                    fontWeight: '600',
                    marginBottom: '24px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    letterSpacing: '2px'
                  }}>
                    BUILDING DIGITAL FUTURES
                  </div>
                  
                  <h1 style={{
                    fontSize: 'clamp(42px, 6vw, 68px)',
                    fontWeight: '700',
                    color: 'white',
                    lineHeight: '1.1',
                    margin: '0 0 24px 0'
                  }}>
                    Expert Fiber Optic
                    <span style={{
                      background: `linear-gradient(135deg, ${colors.teal}, ${colors.green})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'block'
                    }}>
                      Construction Services
                    </span>
                  </h1>
                  
                  <p style={{
                    fontSize: '19px',
                    color: 'rgba(255,255,255,0.75)',
                    lineHeight: '1.7',
                    margin: '0 0 40px 0',
                    maxWidth: '540px'
                  }}>
                    From splicing to activation, aerial to underground — we deliver reliable fiber optic infrastructure across Texas and the Gulf Coast region.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { setCurrentPage('contact'); window.scrollTo(0, 0); }}
                      style={{
                        background: colors.green,
                        color: 'white',
                        border: 'none',
                        padding: '16px 32px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(46,153,75,0.5)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Request a Quote <ArrowRight size={18} />
                    </button>
                    <button
                      onClick={() => { setCurrentPage('services'); window.scrollTo(0, 0); }}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.25)',
                        padding: '16px 32px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                      Our Services
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section style={{ background: 'white', padding: '80px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '40px',
                textAlign: 'center'
              }}>
                {[
                  { value: '15+', label: 'Years Experience' },
                  { value: '500+', label: 'Projects Completed' },
                  { value: '10K+', label: 'Miles of Fiber' },
                  { value: '24/7', label: 'Emergency Support' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div style={{
                      fontSize: '52px',
                      fontWeight: '700',
                      background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '8px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Services Preview with Images */}
            <section style={{ padding: '100px 24px', background: '#f8fafc' }}>
              <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                  <h2 style={{ fontSize: '40px', fontWeight: '700', margin: '0 0 16px 0', color: '#1e293b' }}>
                    Our Services
                  </h2>
                  <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
                    Comprehensive fiber optic solutions from installation to maintenance
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '28px'
                }}>
                  {services.slice(0, 3).map((service, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = '0 25px 50px -15px rgba(0,0,0,0.12)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        height: '200px',
                        background: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.4)), url(${service.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          bottom: '16px',
                          left: '16px',
                          width: '50px',
                          height: '50px',
                          borderRadius: '12px',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}>
                          <service.icon size={26} color={colors.blue} />
                        </div>
                      </div>
                      <div style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 10px 0', color: '#1e293b' }}>
                          {service.title}
                        </h3>
                        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                          {service.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '48px' }}>
                  <button
                    onClick={() => { setCurrentPage('services'); window.scrollTo(0, 0); }}
                    style={{
                      background: 'none',
                      border: `2px solid ${colors.blue}`,
                      color: colors.blue,
                      padding: '14px 32px',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = colors.blue;
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = colors.blue;
                    }}
                  >
                    View All Services <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </section>

            {/* Why Choose Us with Image */}
            <section style={{ padding: '100px 24px', background: 'white' }}>
              <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '38px', fontWeight: '700', margin: '0 0 24px 0', color: '#1e293b' }}>
                      Why Choose LYT Communications?
                    </h2>
                    <p style={{ fontSize: '17px', color: '#64748b', lineHeight: '1.7', marginBottom: '32px' }}>
                      We bring decades of combined experience to every project. Our team of certified technicians delivers quality workmanship with a commitment to safety and customer satisfaction.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {[
                        { icon: Award, title: 'Certified Technicians', desc: 'Factory-trained and certified splicing professionals' },
                        { icon: Shield, title: 'Safety First', desc: 'Rigorous safety protocols on every job site' },
                        { icon: Clock, title: 'On-Time Delivery', desc: 'We meet deadlines and keep projects on schedule' },
                        { icon: CheckCircle, title: 'Quality Guaranteed', desc: 'Comprehensive testing and documentation provided' },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '16px' }}>
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '12px',
                            background: `${colors.green}12`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <item.icon size={24} color={colors.green} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px', fontSize: '16px' }}>{item.title}</div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Image + CTA Card */}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
                    }}>
                      <img 
                        src={images.team} 
                        alt="Professional team" 
                        style={{ width: '100%', height: '320px', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-40px',
                      left: '20px',
                      right: '20px',
                      background: `linear-gradient(135deg, ${colors.darkBlue}, ${colors.blue})`,
                      borderRadius: '16px',
                      padding: '28px',
                      color: 'white',
                      boxShadow: '0 20px 40px -10px rgba(2,62,138,0.4)'
                    }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 12px 0' }}>
                        Ready to Start Your Project?
                      </h3>
                      <p style={{ fontSize: '14px', opacity: 0.85, margin: '0 0 20px 0' }}>
                        Get in touch for a free consultation and quote.
                      </p>
                      <button
                        onClick={() => { setCurrentPage('contact'); window.scrollTo(0, 0); }}
                        style={{
                          background: colors.green,
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        Contact Us <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Spacer for overlapping card */}
            <div style={{ height: '60px', background: 'white' }} />
          </>
        )}

        {/* ABOUT PAGE */}
        {currentPage === 'about' && (
          <>
            <section style={{
              paddingTop: '140px',
              paddingBottom: '80px',
              background: `linear-gradient(135deg, rgba(10,22,40,0.95), rgba(2,62,138,0.9)), url(${images.aboutHero})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: 'white'
            }}>
              <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                <h1 style={{ fontSize: '52px', fontWeight: '700', margin: '0 0 16px 0' }}>About Us</h1>
                <p style={{ fontSize: '20px', opacity: 0.85, maxWidth: '600px' }}>
                  Building digital futures through quality fiber optic infrastructure
                </p>
              </div>
            </section>

            <section style={{ padding: '80px 24px' }}>
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
                  <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80" alt="Construction crew at work" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '16px' }} />
                  <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80" alt="Fiber optic technology" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '16px' }} />
                </div>
                
                <h2 style={{ fontSize: '34px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>
                  Our Story
                </h2>
                <p style={{ fontSize: '17px', color: '#475569', lineHeight: '1.8', marginBottom: '24px' }}>
                  LYT Communications was founded with a simple mission: deliver reliable, high-quality fiber optic infrastructure that powers the connections businesses and communities depend on.
                </p>
                <p style={{ fontSize: '17px', color: '#475569', lineHeight: '1.8', marginBottom: '24px' }}>
                  Based in Texas and serving the Gulf Coast region, our team brings together decades of combined experience in telecommunications construction. From small business installations to large-scale municipal projects, we approach every job with the same commitment to excellence.
                </p>
                <p style={{ fontSize: '17px', color: '#475569', lineHeight: '1.8', marginBottom: '48px' }}>
                  We specialize in fiber optic splicing, activation, testing, and troubleshooting, as well as aerial and underground construction. Our certified technicians use state-of-the-art equipment and follow rigorous safety protocols to ensure every project meets the highest standards.
                </p>

                <h2 style={{ fontSize: '34px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>
                  Our Values
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                  {[
                    { title: 'Quality', desc: 'Every splice, every connection, every project done right the first time.' },
                    { title: 'Safety', desc: 'Zero compromise on safety for our team, clients, and communities.' },
                    { title: 'Integrity', desc: 'Honest communication, fair pricing, and dependable service.' },
                    { title: 'Innovation', desc: 'Staying current with the latest technology and best practices.' },
                  ].map((val, i) => (
                    <div key={i} style={{
                      background: '#f8fafc',
                      padding: '28px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.blue, marginBottom: '10px' }}>
                        {val.title}
                      </h3>
                      <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                        {val.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* SERVICES PAGE */}
        {currentPage === 'services' && (
          <>
            <section style={{
              paddingTop: '140px',
              paddingBottom: '80px',
              background: `linear-gradient(135deg, rgba(10,22,40,0.95), rgba(2,62,138,0.9)), url(${images.servicesHero})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: 'white'
            }}>
              <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                <h1 style={{ fontSize: '52px', fontWeight: '700', margin: '0 0 16px 0' }}>Our Services</h1>
                <p style={{ fontSize: '20px', opacity: 0.85, maxWidth: '600px' }}>
                  Comprehensive fiber optic solutions for every project
                </p>
              </div>
            </section>

            <section style={{ padding: '80px 24px' }}>
              <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                  gap: '32px'
                }}>
                  {services.map((service, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{
                        height: '200px',
                        background: `url(${service.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }} />
                      <div style={{ padding: '28px' }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '14px',
                          background: `linear-gradient(135deg, ${colors.blue}15, ${colors.teal}15)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '20px',
                          marginTop: '-50px',
                          position: 'relative',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          backgroundColor: 'white'
                        }}>
                          <service.icon size={28} color={colors.blue} />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: '600', margin: '0 0 12px 0', color: '#1e293b' }}>
                          {service.title}
                        </h3>
                        <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.7', margin: 0 }}>
                          {service.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{
                  marginTop: '80px',
                  background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`,
                  borderRadius: '20px',
                  padding: '60px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <h2 style={{ fontSize: '34px', fontWeight: '700', margin: '0 0 16px 0' }}>
                    Need a Custom Solution?
                  </h2>
                  <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Every project is unique. Contact us to discuss your specific requirements and get a customized quote.
                  </p>
                  <button
                    onClick={() => { setCurrentPage('contact'); window.scrollTo(0, 0); }}
                    style={{
                      background: 'white',
                      color: colors.blue,
                      border: 'none',
                      padding: '16px 40px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Get a Quote
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* CONTACT PAGE */}
        {currentPage === 'contact' && (
          <>
            <section style={{
              paddingTop: '140px',
              paddingBottom: '80px',
              background: `linear-gradient(135deg, rgba(10,22,40,0.95), rgba(2,62,138,0.9)), url(${images.contactHero})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: 'white'
            }}>
              <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                <h1 style={{ fontSize: '52px', fontWeight: '700', margin: '0 0 16px 0' }}>Contact Us</h1>
                <p style={{ fontSize: '20px', opacity: 0.85, maxWidth: '600px' }}>
                  Ready to start your project? Get in touch with our team.
                </p>
              </div>
            </section>

            <section style={{ padding: '80px 24px' }}>
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '60px' }}>
                  {/* Form */}
                  <div>
                    <h2 style={{ fontSize: '30px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>
                      Request a Quote
                    </h2>

                    {formSubmitted ? (
                      <div style={{
                        background: `${colors.green}10`,
                        border: `1px solid ${colors.green}30`,
                        borderRadius: '12px',
                        padding: '40px',
                        textAlign: 'center'
                      }}>
                        <CheckCircle size={56} color={colors.green} style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: colors.green, marginBottom: '8px', fontSize: '22px' }}>Thank You!</h3>
                        <p style={{ color: '#64748b', fontSize: '16px' }}>We'll be in touch within 24 hours.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleContactSubmit}>
                        <div style={{ display: 'grid', gap: '20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={contactForm.name}
                                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '14px 16px',
                                  border: '2px solid #e2e8f0',
                                  borderRadius: '8px',
                                  fontSize: '15px',
                                  boxSizing: 'border-box',
                                  transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = colors.blue}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                Company
                              </label>
                              <input
                                type="text"
                                value={contactForm.company}
                                onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '14px 16px',
                                  border: '2px solid #e2e8f0',
                                  borderRadius: '8px',
                                  fontSize: '15px',
                                  boxSizing: 'border-box',
                                  transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = colors.blue}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                Email *
                              </label>
                              <input
                                type="email"
                                required
                                value={contactForm.email}
                                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '14px 16px',
                                  border: '2px solid #e2e8f0',
                                  borderRadius: '8px',
                                  fontSize: '15px',
                                  boxSizing: 'border-box',
                                  transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = colors.blue}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                Phone
                              </label>
                              <input
                                type="tel"
                                value={contactForm.phone}
                                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '14px 16px',
                                  border: '2px solid #e2e8f0',
                                  borderRadius: '8px',
                                  fontSize: '15px',
                                  boxSizing: 'border-box',
                                  transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = colors.blue}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                              Project Details *
                            </label>
                            <textarea
                              required
                              rows={5}
                              value={contactForm.message}
                              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                              placeholder="Tell us about your project..."
                              style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '15px',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.2s'
                              }}
                              onFocus={(e) => e.target.style.borderColor = colors.blue}
                              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                          </div>

                          <button
                            type="submit"
                            style={{
                              background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`,
                              color: 'white',
                              border: 'none',
                              padding: '16px 32px',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px'
                            }}
                          >
                            <Send size={18} /> Send Message
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h2 style={{ fontSize: '30px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>
                      Get In Touch
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
                      {[
                        { icon: Phone, label: 'Phone', value: '(409) 555-0123' },
                        { icon: Mail, label: 'Email', value: 'info@lytcomm.com' },
                        { icon: MapPin, label: 'Service Area', value: 'Texas & Gulf Coast Region' },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '16px' }}>
                          <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '12px',
                            background: `${colors.blue}10`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <item.icon size={24} color={colors.blue} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px', fontSize: '15px' }}>{item.label}</div>
                            <div style={{ color: '#64748b', fontSize: '16px' }}>{item.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '28px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '14px', color: '#1e293b' }}>
                        Business Hours
                      </h3>
                      <div style={{ fontSize: '15px', color: '#64748b', lineHeight: '2' }}>
                        Monday - Friday: 7:00 AM - 5:00 PM<br />
                        Saturday: By Appointment<br />
                        Sunday: Closed<br /><br />
                        <span style={{ color: colors.green, fontWeight: '600' }}>24/7 Emergency Service Available</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <footer style={{ background: colors.dark, color: 'white', padding: '70px 24px 30px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '50px' }}>
              <div>
                <Logo size="normal" light />
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginTop: '16px', maxWidth: '260px' }}>
                  Building digital futures through quality fiber optic infrastructure.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '20px', color: 'rgba(255,255,255,0.9)' }}>Quick Links</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Home', 'About', 'Services', 'Contact'].map(link => (
                    <button
                      key={link}
                      onClick={() => { setCurrentPage(link.toLowerCase()); window.scrollTo(0, 0); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0
                      }}
                    >
                      {link}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '20px', color: 'rgba(255,255,255,0.9)' }}>Services</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                  <span>Fiber Optic Splicing</span>
                  <span>Activation Services</span>
                  <span>Testing & Troubleshooting</span>
                  <span>Aerial Construction</span>
                  <span>Underground Construction</span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '20px', color: 'rgba(255,255,255,0.9)' }}>Contact</h4>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '2' }}>
                  <div>(409) 555-0123</div>
                  <div>info@lytcomm.com</div>
                  <div>Texas & Gulf Coast</div>
                </div>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                © 2025 LYT Communications. All rights reserved.
              </div>
              <button
                onClick={() => setView('portal')}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.8)',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Users size={14} /> Employee Portal
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================
  // EMPLOYEE PORTAL LOGIN
  // ============================================
  if (view === 'portal' && !currentUser) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: `linear-gradient(135deg, ${colors.darkBlue} 0%, ${colors.blue} 50%, ${colors.teal} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Segoe UI', system-ui, sans-serif"
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '48px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)'
        }}>
          <button
            onClick={() => setView('public')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '24px',
              padding: 0
            }}
          >
            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to website
          </button>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Logo size="large" />
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '12px', fontWeight: '500' }}>
              EMPLOYEE PORTAL
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = colors.blue}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = colors.blue}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {loginError && (
              <div style={{ 
                background: '#fef2f2', 
                color: '#dc2626', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px',
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a href="#" style={{ color: colors.blue, fontSize: '14px', textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>

          <div style={{ 
            marginTop: '32px', 
            padding: '18px', 
            background: '#f8fafc', 
            borderRadius: '10px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            <strong>Demo Accounts:</strong><br />
            Admin: matt@lytcomm.com<br />
            Supervisor: john@lytcomm.com<br />
            Technician: sarah@lytcomm.com<br />
            <span style={{ fontSize: '12px', opacity: 0.8 }}>(any password works)</span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // PORTAL DASHBOARD (same as before, abbreviated for length)
  // ============================================
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.bg,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: theme.text,
      display: 'flex'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '72px',
        background: theme.bgCard,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s',
        position: 'fixed',
        height: '100vh',
        zIndex: 40
      }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo size="small" />
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {getNavItems().map(item => (
            <button
              key={item.id}
              onClick={() => setPortalPage(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                background: portalPage === item.id ? theme.accentLight : 'transparent',
                color: portalPage === item.id ? theme.accent : theme.text,
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: portalPage === item.id ? '600' : '400',
                marginBottom: '4px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center'
              }}
            >
              <item.icon size={20} />
              {sidebarOpen && item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            {currentUser?.avatar}
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name}
              </div>
              <div style={{ fontSize: '12px', color: theme.textMuted, textTransform: 'capitalize' }}>
                {currentUser?.role}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: sidebarOpen ? '260px' : '72px', transition: 'margin-left 0.3s' }}>
        <header style={{
          background: theme.bgCard,
          borderBottom: `1px solid ${theme.border}`,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: '8px', borderRadius: '8px' }}>
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0, textTransform: 'capitalize' }}>
              {portalPage === 'timeclock' ? 'Time Clock' : portalPage === 'users' ? 'Manage Users' : portalPage}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: theme.bgHover, border: 'none', cursor: 'pointer', color: theme.text, padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={handleLogout} style={{ background: theme.bgHover, border: 'none', cursor: 'pointer', color: theme.text, padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div style={{ padding: '24px' }}>
          {/* Dashboard */}
          {portalPage === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {[
                  { label: 'Hours This Week', value: '38.5', icon: Clock, color: colors.blue },
                  { label: 'Active Projects', value: mockProjects.filter(p => p.status === 'active').length, icon: MapPin, color: colors.teal },
                  { label: 'Pending Invoices', value: '$' + mockInvoices.filter(i => i.status !== 'paid').reduce((a, b) => a + b.amount, 0).toLocaleString(), icon: DollarSign, color: colors.green },
                  { label: 'Team Members', value: mockUsers.length, icon: Users, color: colors.darkBlue },
                ].map((stat, i) => (
                  <div key={i} style={{ background: theme.bgCard, borderRadius: '12px', padding: '24px', border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: theme.textMuted, fontSize: '14px' }}>{stat.label}</span>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <stat.icon size={20} color={stat.color} />
                      </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700' }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: theme.bgCard, borderRadius: '12px', border: `1px solid ${theme.border}`, marginBottom: '24px' }}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}` }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Announcements</h2>
                </div>
                <div style={{ padding: '16px 24px' }}>
                  {mockAnnouncements.map(ann => (
                    <div key={ann.id} style={{ padding: '16px 0', borderBottom: `1px solid ${theme.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Bell size={16} color={colors.blue} />
                        <span style={{ fontWeight: '600' }}>{ann.title}</span>
                        <span style={{ fontSize: '12px', color: theme.textMuted, marginLeft: 'auto' }}>{ann.date}</span>
                      </div>
                      <p style={{ margin: 0, color: theme.textMuted, fontSize: '14px', lineHeight: '1.5' }}>{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={{ background: theme.bgCard, borderRadius: '12px', border: `1px solid ${theme.border}`, padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Time Status</h3>
                  <div style={{ background: isClockedIn ? `${colors.green}15` : theme.bgHover, borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: isClockedIn ? colors.green : theme.textMuted, marginBottom: '8px' }}>
                      {currentTime.toLocaleTimeString()}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '16px' }}>
                      {isClockedIn ? `Clocked in at ${clockInTime}` : 'Not clocked in'}
                    </div>
                    <button onClick={() => setPortalPage('timeclock')} style={{ background: theme.accent, color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                      Go to Time Clock
                    </button>
                  </div>
                </div>

                <div style={{ background: theme.bgCard, borderRadius: '12px', border: `1px solid ${theme.border}`, padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Your Active Projects</h3>
                  {mockProjects.filter(p => p.status === 'active').slice(0, 3).map(project => (
                    <div key={project.id} style={{ padding: '12px', background: theme.bgHover, borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{project.name}</div>
                      <div style={{ fontSize: '13px', color: theme.textMuted }}>{project.client}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Time Clock */}
          {portalPage === 'timeclock' && (
            <div>
              <div style={{ background: theme.bgCard, borderRadius: '12px', border: `1px solid ${theme.border}`, padding: '32px', textAlign: 'center', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>{currentTime.toLocaleTimeString()}</div>
                <div style={{ color: theme.textMuted, marginBottom: '24px' }}>{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

                {!isClockedIn ? (
                  <button onClick={handleClockIn} style={{ background: colors.green, color: 'white', border: 'none', padding: '16px 48px', borderRadius: '12px', fontSize: '18px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <Play size={22} /> Clock In
                  </button>
                ) : (
                  <div>
                    <div style={{ background: `${colors.green}15`, borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                      <div style={{ color: colors.green, fontWeight: '600', marginBottom: '4px' }}>Currently Working</div>
                      <div style={{ fontSize: '14px', color: theme.textMuted }}>Clocked in at {clockInTime}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button onClick={() => setIsOnBreak(!isOnBreak)} style={{ background: isOnBreak ? colors.teal : theme.bgHover, color: isOnBreak ? 'white' : theme.text, border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Coffee size={18} /> {isOnBreak ? 'End Break' : 'Start Break'}
                      </button>
                      <button onClick={handleClockOut} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Pause size={18} /> Clock Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: theme.bgCard, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}` }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Timesheet History</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: theme.bgHover }}>
                        {['Date', 'Clock In', 'Clock Out', 'Break', 'Total', 'Status'].map(h => (
                          <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: theme.textMuted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockTimeEntries.filter(e => currentUser?.role === 'admin' || e.user_id === currentUser?.id).map(entry => {
                        const clockIn = entry.clock_in ? new Date(`2024-01-01T${entry.clock_in}`) : null;
                        const clockOut = entry.clock_out ? new Date(`2024-01-01T${entry.clock_out}`) : null;
                        const totalMins = clockIn && clockOut ? (clockOut - clockIn) / 60000 - entry.break_mins : 0;
                        const totalHrs = Math.floor(totalMins / 60);
                        const totalRemMins = Math.round(totalMins % 60);
                        return (
                          <tr key={entry.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                            <td style={{ padding: '16px 24px', fontSize: '14px' }}>{entry.date}</td>
                            <td style={{ padding: '16px 24px', fontSize: '14px' }}>{entry.clock_in}</td>
                            <td style={{ padding: '16px 24px', fontSize: '14px' }}>{entry.clock_out || '—'}</td>
                            <td style={{ padding: '16px 24px', fontSize: '14px' }}>{entry.break_mins} min</td>
                            <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500' }}>{entry.clock_out ? `${totalHrs}h ${totalRemMins}m` : '—'}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: entry.status === 'approved' ? `${colors.green}15` : entry.status === 'active' ? `${colors.blue}15` : `${colors.teal}15`, color: entry.status === 'approved' ? colors.green : entry.status === 'active' ? colors.blue : colors.teal }}>
                                {entry.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Projects, Files, Invoices, Team, Users pages... */}
          {portalPage === 'projects' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {['all', 'active', 'on-hold', 'complete'].map(filter => (
                  <button key={filter} onClick={() => setProjectFilter(filter)} style={{ padding: '8px 20px', border: 'none', borderRadius: '20px', background: projectFilter === filter ? theme.accent : theme.bgCard, color: projectFilter === filter ? 'white' : theme.text, cursor: 'pointer', fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>
                    {filter}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {mockProjects.filter(p => projectFilter === 'all' || p.status === projectFilter).map(project => (
                  <div key={project.id} style={{ background: theme.bgCard, borderRadius: '12px', border: `1px solid ${theme.border}`, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}>
                    <div style={{ height: '120px', background: `linear-gradient(135deg, ${colors.darkBlue}20, ${colors.teal}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <MapPin size={36} color={theme.textMuted} style={{ opacity: 0.3 }} />
                      <span style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', background: project.status === 'active' ? colors.green : project.status === 'on-hold' ? '#f59e0b' : colors.blue, color: 'white' }}>
                        {project.status}
                      </span>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>{project.name}</h3>
                      <div style={{ fontSize: '14px', color: theme.textMuted, marginBottom: '12px' }}>{project.client}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: theme.textMuted }}>
                        <MapPin size={14} /> {project.address}
                      </div>
                      {selectedProject?.id === project.id && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${theme.border}`, fontSize: '14px' }}>
                          <p><strong>Dates:</strong> {project.start_date} — {project.end_date}</p>
                          <p><strong>Notes:</strong> {project.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {portalPage === 'files' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
                  <input type="text" placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 42px', border: `1px solid ${theme.border}`, borderRadius: '8px', background: theme.bgCard, color: theme.text, fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto' }}>
                {['all', 'Safety Docs', 'SOPs & Procedures', 'Forms', 'Project Files'].map(folder => (
                  <button key={folder} onClick={() => setSelectedFolder(folder)} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: selectedFolder === folder ? theme.accent : theme.bgCard, color: selectedFolder === folder ? 'white' : theme.text, cursor: 'pointer', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Folder size={14} /> {folder === 'all' ? 'All Files' : folder}
                  </button>
                ))}
              </div>
              <div style={{ background: theme.bgCard, borderRadius: '12px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: theme.bgHover }}>
                      {['Name', 'Folder', 'Size', 'Uploaded', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 24px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: '13px', fontWeight: '600', color: theme.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockFiles.filter(f => selectedFolder === 'all' || f.folder === selectedFolder).filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(file => (
                      <tr key={file.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileText size={20} color={colors.blue} />
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{file.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: theme.textMuted }}>{file.folder}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: theme.textMuted }}>{file.size}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: theme.textMuted }}>{file.date}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <button style={{ background: theme.bgHover, border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', color: theme.text, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <Download size={14} /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {portalPage === 'invoices' && (
            <div style={{ background: theme.bgCard, borderRadius: '12px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: theme.bgHover }}>
                    {['Invoice #', 'Client', 'Date', 'Amount', 'Status', 'Actions'].map((h, i) => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: h === 'Amount' ? 'right' : h === 'Status' || h === 'Actions' ? 'center' : 'left', fontSize: '13px', fontWeight: '600', color: theme.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockInvoices.map(invoice => (
                    <tr key={invoice.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500' }}>{invoice.number}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px' }}>{invoice.client}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: theme.textMuted }}>{invoice.date}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize', background: invoice.status === 'paid' ? `${colors.green}15` : invoice.status === 'sent' ? `${colors.blue}15` : `${theme.textMuted}15`, color: invoice.status === 'paid' ? colors.green : invoice.status === 'sent' ? colors.blue : theme.textMuted }}>
                          {invoice.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: theme.textMuted }}><Eye size={16} /></button>
                          <button style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: theme.textMuted }}><Download size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {portalPage === 'team' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {mockUsers.map(user => (
                <div key={user.id} style={{ background: theme.bgCard, borderRadius: '12px', border: `1px solid ${theme.border}`, padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '18px' }}>{user.avatar}</div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>{user.name}</div>
                      <div style={{ fontSize: '13px', color: 'white', background: user.role === 'admin' ? colors.darkBlue : user.role === 'supervisor' ? colors.teal : colors.green, padding: '2px 10px', borderRadius: '12px', display: 'inline-block', marginTop: '4px', textTransform: 'capitalize' }}>{user.role}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: theme.textMuted }}><Mail size={16} />{user.email}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: theme.textMuted }}><Phone size={16} />{user.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {portalPage === 'users' && currentUser?.role === 'admin' && (
            <div style={{ background: theme.bgCard, borderRadius: '12px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: theme.bgHover }}>
                    {['User', 'Email', 'Role', 'Phone', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: '13px', fontWeight: '600', color: theme.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map(user => (
                    <tr key={user.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '13px' }}>{user.avatar}</div>
                          <span style={{ fontWeight: '500' }}>{user.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: theme.textMuted }}>{user.email}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize', background: user.role === 'admin' ? `${colors.darkBlue}15` : user.role === 'supervisor' ? `${colors.teal}15` : `${colors.green}15`, color: user.role === 'admin' ? colors.darkBlue : user.role === 'supervisor' ? colors.teal : colors.green }}>{user.role}</span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: theme.textMuted }}>{user.phone}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button style={{ background: theme.bgHover, border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', color: theme.text, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Edit size={14} /> Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
