import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  Award,
  Users,
  Truck,
  ChevronRight,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Building,
  User,
  CreditCard,
  Heart,
  Briefcase,
  Wrench,
  DollarSign,
  ArrowLeft,
  ArrowRight,
  Eye,
  Download,
  Sun,
  Moon,
  LogOut,
  Home,
  FolderOpen,
  UserCircle,
  Edit3,
  RotateCcw,
  Save
} from 'lucide-react';

// ============================================================================
// CONFIGURATION
// ============================================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyfpYe0FaALAAU7XtgqbDswDCnl47e8LZhTxZSzyKv7FqB5q1gFDPjJTpgbuMARLH3t/exec';

const PDF_URLS = {
  w4: '/Form_W-4_sign.pdf',
  w9: '/Form_W-9_sign.pdf',
  msa: '/LYT_MSA_2006_-_v3_4.pdf'
};

const RATE_CARD_URL = 'https://docs.google.com/spreadsheets/d/10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4/edit';

const colors = {
  oceanBlue: '#0077B6',
  teal: '#00B4D8',
  green: '#2E994B',
  coral: '#e85a4f',
  darkNavy: '#0d1b2a',
  darkBg: '#0a1628'
};

// LYT Company Info (pre-filled on forms)
const LYT_INFO = {
  name: 'LYT Communications, LLC',
  address: '12130 State Highway 3',
  cityStateZip: 'Webster, TX 77598',
  ein: '88-3954172',
  phone: '(281) 555-0199'
};

// ============================================================================
// SIGNATURE PAD COMPONENT
// ============================================================================
function SignaturePad({ onSave, onClear, savedSignature, darkMode }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load saved signature if exists
    if (savedSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = savedSignature;
    }
  }, [savedSignature]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onClear) onClear();
  };

  const saveSignature = () => {
    if (!hasSignature) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) onSave(dataUrl);
  };

  const borderColor = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
  const bgColor = darkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa';

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
        <Edit3 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Draw Your Signature
      </label>
      <div style={{ 
        border: `2px solid ${borderColor}`, 
        borderRadius: '8px', 
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          style={{ 
            width: '100%', 
            height: '150px', 
            cursor: 'crosshair',
            touchAction: 'none'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button
          type="button"
          onClick={clearSignature}
          style={{
            padding: '10px 20px',
            backgroundColor: bgColor,
            color: darkMode ? '#fff' : '#333',
            border: `1px solid ${borderColor}`,
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RotateCcw size={16} /> Clear
        </button>
        <button
          type="button"
          onClick={saveSignature}
          disabled={!hasSignature}
          style={{
            padding: '10px 20px',
            background: hasSignature ? `linear-gradient(135deg, ${colors.green}, #28a745)` : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: hasSignature ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Save size={16} /> Save Signature
        </button>
      </div>
      {savedSignature && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: 'rgba(46, 153, 75, 0.1)', 
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: colors.green
        }}>
          <CheckCircle size={18} /> Signature saved
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SSN INPUT COMPONENT (formatted XXX-XX-XXXX)
// ============================================================================
function SSNInput({ value, onChange, darkMode, placeholder = "XXX-XX-XXXX" }) {
  const inputBg = darkMode ? 'rgba(255,255,255,0.08)' : 'white';
  const borderColor = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const textColor = darkMode ? '#ffffff' : '#1a1a2e';

  const formatSSN = (input) => {
    const numbers = input.replace(/\D/g, '').slice(0, 9);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`;
  };

  const handleChange = (e) => {
    const formatted = formatSSN(e.target.value);
    onChange(formatted);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={11}
      style={{
        width: '100%',
        padding: '14px',
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
        backgroundColor: inputBg,
        color: textColor,
        fontSize: '1rem',
        fontFamily: 'monospace'
      }}
    />
  );
}

// ============================================================================
// EIN INPUT COMPONENT (formatted XX-XXXXXXX)
// ============================================================================
function EINInput({ value, onChange, darkMode, placeholder = "XX-XXXXXXX" }) {
  const inputBg = darkMode ? 'rgba(255,255,255,0.08)' : 'white';
  const borderColor = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const textColor = darkMode ? '#ffffff' : '#1a1a2e';

  const formatEIN = (input) => {
    const numbers = input.replace(/\D/g, '').slice(0, 9);
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
  };

  const handleChange = (e) => {
    const formatted = formatEIN(e.target.value);
    onChange(formatted);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={10}
      style={{
        width: '100%',
        padding: '14px',
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
        backgroundColor: inputBg,
        color: textColor,
        fontSize: '1rem',
        fontFamily: 'monospace'
      }}
    />
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setUser(null);
    navigate('home');
  };

  if (currentView === 'employee-onboarding') {
    return <EmployeeOnboarding onBack={() => navigate('portal-select')} darkMode={darkMode} />;
  }

  if (currentView === 'contractor-onboarding') {
    return <ContractorOnboarding onBack={() => navigate('portal-select')} darkMode={darkMode} />;
  }

  if (currentView === 'employee-login') {
    return <EmployeeLogin onLogin={(u) => { setUser(u); navigate('dashboard'); }} onBack={() => navigate('portal-select')} darkMode={darkMode} />;
  }

  if (currentView === 'dashboard' && user) {
    return <EmployeeDashboard user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  const bgColor = darkMode ? colors.darkBg : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1a1a2e';
  const mutedColor = darkMode ? '#a0aec0' : '#666666';
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor }}>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        backgroundColor: darkMode ? 'rgba(10, 22, 40, 0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('home')}>
            <div style={{ width: '40px', height: '40px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>LYT</div>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>LYT Communications</span>
          </div>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }} className="desktop-menu">
            {['home', 'about', 'services', 'contact'].map(item => (
              <span key={item} onClick={() => navigate(item)} style={{ cursor: 'pointer', color: currentView === item ? colors.teal : mutedColor, fontWeight: currentView === item ? '600' : '400', transition: 'color 0.3s' }}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </span>
            ))}
            <button onClick={() => navigate('portal-select')} style={{ padding: '10px 24px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: '600' }}>
              Portal
            </button>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, padding: '8px' }}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: textColor }} className="mobile-menu-btn">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div style={{ padding: '20px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            {['home', 'about', 'services', 'contact'].map(item => (
              <div key={item} onClick={() => navigate(item)} style={{ padding: '15px 0', cursor: 'pointer', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </div>
            ))}
            <button onClick={() => navigate('portal-select')} style={{ width: '100%', marginTop: '15px', padding: '15px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: '600' }}>
              Portal
            </button>
          </div>
        )}
      </nav>

      <main style={{ paddingTop: '80px' }}>
        {currentView === 'home' && <HomePage navigate={navigate} darkMode={darkMode} colors={colors} cardBg={cardBg} mutedColor={mutedColor} />}
        {currentView === 'about' && <AboutPage darkMode={darkMode} colors={colors} cardBg={cardBg} mutedColor={mutedColor} />}
        {currentView === 'services' && <ServicesPage darkMode={darkMode} colors={colors} cardBg={cardBg} mutedColor={mutedColor} />}
        {currentView === 'contact' && <ContactPage darkMode={darkMode} colors={colors} cardBg={cardBg} mutedColor={mutedColor} />}
        {currentView === 'portal-select' && <PortalSelect navigate={navigate} darkMode={darkMode} colors={colors} cardBg={cardBg} mutedColor={mutedColor} />}
      </main>

      <footer style={{ backgroundColor: darkMode ? colors.darkNavy : '#1a1a2e', color: 'white', padding: '60px 20px 30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>LYT</div>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>LYT Communications</span>
              </div>
              <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>Building the future of telecommunications infrastructure across the Greater Houston area.</p>
            </div>
            <div>
              <h4 style={{ marginBottom: '20px', color: colors.teal }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#a0aec0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MapPin size={16} /> 12130 State Highway 3, Webster, TX 77598</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Phone size={16} /> (281) 555-0199</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Mail size={16} /> info@lytcomm.com</div>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '20px', color: colors.teal }}>Services</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#a0aec0' }}>
                <span>HDD Drilling</span>
                <span>Fiber Splicing</span>
                <span>Aerial Construction</span>
                <span>Underground Utilities</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', textAlign: 'center', color: '#a0aec0' }}>
            <p>© 2026 LYT Communications, LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// HOME PAGE
// ============================================================================
function HomePage({ navigate, darkMode, colors, cardBg, mutedColor }) {
  const stats = [
    { value: '500+', label: 'Projects Completed' },
    { value: '15+', label: 'Years Experience' },
    { value: '50+', label: 'Team Members' },
    { value: '99%', label: 'Client Satisfaction' }
  ];

  const services = [
    { icon: <Truck size={32} />, title: 'HDD Drilling', desc: 'Horizontal directional drilling for minimal surface disruption' },
    { icon: <Wrench size={32} />, title: 'Fiber Splicing', desc: 'Precision fiber optic cable splicing and testing' },
    { icon: <Building size={32} />, title: 'Aerial Construction', desc: 'Overhead cable installation and maintenance' }
  ];

  return (
    <>
      <section style={{
        minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 20px',
        background: darkMode ? `linear-gradient(135deg, ${colors.darkBg} 0%, ${colors.darkNavy} 100%)` : `linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)`
      }}>
        <div style={{ maxWidth: '900px' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800', marginBottom: '30px', lineHeight: '1.2' }}>
            Building Tomorrow's
            <span style={{ background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Fiber Network</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: mutedColor, marginBottom: '40px', lineHeight: '1.6' }}>
            LYT Communications delivers expert fiber optic construction services across the Greater Houston area. From underground utilities to aerial installation, we build the infrastructure that connects communities.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('contact')} style={{ padding: '16px 40px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, color: 'white', border: 'none', borderRadius: '30px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Get Started <ChevronRight size={20} />
            </button>
            <button onClick={() => navigate('services')} style={{ padding: '16px 40px', background: 'transparent', color: colors.teal, border: `2px solid ${colors.teal}`, borderRadius: '30px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer' }}>
              Our Services
            </button>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: '800', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</div>
                <div style={{ color: mutedColor, fontSize: '1.1rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '100px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: '700', marginBottom: '60px' }}>Our Core Services</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {services.map((service, i) => (
              <div key={i} style={{ padding: '40px', backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, transition: 'transform 0.3s, box-shadow 0.3s' }}>
                <div style={{ color: colors.teal, marginBottom: '20px' }}>{service.icon}</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '15px' }}>{service.title}</h3>
                <p style={{ color: mutedColor, lineHeight: '1.6' }}>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '100px 20px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '20px' }}>Ready to Build Together?</h2>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', marginBottom: '40px' }}>
            Join our network of skilled contractors or become part of the LYT team.
          </p>
          <button onClick={() => navigate('portal-select')} style={{ padding: '16px 50px', backgroundColor: 'white', color: colors.oceanBlue, border: 'none', borderRadius: '30px', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer' }}>
            Access Portal
          </button>
        </div>
      </section>
    </>
  );
}

// ============================================================================
// ABOUT PAGE
// ============================================================================
function AboutPage({ darkMode, colors, cardBg, mutedColor }) {
  const values = [
    { icon: <Shield size={32} />, title: 'Safety First', desc: 'Zero compromise on safety standards and OSHA compliance' },
    { icon: <Award size={32} />, title: 'Quality Work', desc: 'Precision craftsmanship in every fiber we splice' },
    { icon: <Users size={32} />, title: 'Team Excellence', desc: 'Skilled professionals dedicated to your success' }
  ];

  return (
    <section style={{ padding: '80px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '30px', textAlign: 'center' }}>About LYT Communications</h1>
        <p style={{ fontSize: '1.2rem', color: mutedColor, lineHeight: '1.8', marginBottom: '60px', textAlign: 'center' }}>
          Founded in Webster, Texas, LYT Communications has grown to become a trusted partner in telecommunications infrastructure construction. We specialize in fiber optic installation, HDD drilling, and aerial construction services.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', marginBottom: '60px' }}>
          {values.map((value, i) => (
            <div key={i} style={{ padding: '40px', backgroundColor: cardBg, borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ color: colors.teal, marginBottom: '20px' }}>{value.icon}</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '15px' }}>{value.title}</h3>
              <p style={{ color: mutedColor }}>{value.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
          <h2 style={{ marginBottom: '20px', color: colors.teal }}>Our Mission</h2>
          <p style={{ color: mutedColor, lineHeight: '1.8' }}>
            To deliver exceptional telecommunications infrastructure solutions while maintaining the highest standards of safety, quality, and professionalism. We are committed to building the networks that connect communities and drive progress across the Greater Houston area and beyond.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SERVICES PAGE
// ============================================================================
function ServicesPage({ darkMode, colors, cardBg, mutedColor }) {
  const services = [
    { icon: <Truck size={40} />, title: 'HDD Drilling', desc: 'Horizontal directional drilling services for underground utility installation with minimal surface disruption. Perfect for road crossings, river crossings, and environmentally sensitive areas.', features: ['Mini to Maxi HDD rigs', 'Rock drilling capability', 'GPS tracking and locating'] },
    { icon: <Wrench size={40} />, title: 'Fiber Splicing', desc: 'Expert fiber optic splicing and testing services ensuring optimal signal transmission. Our certified technicians deliver precision results every time.', features: ['Fusion splicing', 'OTDR testing', 'Fiber characterization'] },
    { icon: <Building size={40} />, title: 'Aerial Construction', desc: 'Complete aerial fiber and cable installation services including pole attachments, strand installation, and overlashing.', features: ['Make-ready engineering', 'Pole attachments', 'Strand and cable placement'] },
    { icon: <MapPin size={40} />, title: 'Underground Utilities', desc: 'Comprehensive underground utility construction including trenching, plowing, and conduit installation for fiber and telecommunications infrastructure.', features: ['Trenching and plowing', 'Conduit installation', 'Innerduct placement'] }
  ];

  return (
    <section style={{ padding: '80px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>Our Services</h1>
        <p style={{ fontSize: '1.2rem', color: mutedColor, marginBottom: '60px', textAlign: 'center', maxWidth: '700px', margin: '0 auto 60px' }}>
          Comprehensive telecommunications infrastructure solutions delivered by experienced professionals.
        </p>
        
        <div style={{ display: 'grid', gap: '30px' }}>
          {services.map((service, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', padding: '40px', backgroundColor: cardBg, borderRadius: '16px', alignItems: 'start' }}>
              <div>
                <div style={{ color: colors.teal, marginBottom: '20px' }}>{service.icon}</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '15px' }}>{service.title}</h3>
              </div>
              <div>
                <p style={{ color: mutedColor, lineHeight: '1.8', marginBottom: '20px' }}>{service.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {service.features.map((feature, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: mutedColor }}>
                      <CheckCircle size={16} color={colors.green} /> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CONTACT PAGE
// ============================================================================
function ContactPage({ darkMode, colors, cardBg, mutedColor }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const inputBg = darkMode ? 'rgba(255,255,255,0.08)' : 'white';
  const borderColor = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const textColor = darkMode ? '#ffffff' : '#1a1a2e';

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    backgroundColor: inputBg,
    color: textColor,
    fontSize: '1rem'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section style={{ padding: '80px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>Contact Us</h1>
        <p style={{ fontSize: '1.2rem', color: mutedColor, marginBottom: '60px', textAlign: 'center' }}>
          Ready to start your project? Get in touch with our team.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', color: colors.teal }}>Get in Touch</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <MapPin size={24} color={colors.oceanBlue} />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '5px' }}>Address</p>
                  <p style={{ color: mutedColor }}>12130 State Highway 3<br />Webster, TX 77598</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <Phone size={24} color={colors.oceanBlue} />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '5px' }}>Phone</p>
                  <p style={{ color: mutedColor }}>(281) 555-0199</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <Mail size={24} color={colors.oceanBlue} />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '5px' }}>Email</p>
                  <p style={{ color: mutedColor }}>info@lytcomm.com</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <Clock size={24} color={colors.oceanBlue} />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '5px' }}>Hours</p>
                  <p style={{ color: mutedColor }}>Mon - Fri: 7:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={60} color={colors.green} style={{ marginBottom: '20px' }} />
                <h3 style={{ marginBottom: '15px' }}>Message Sent!</h3>
                <p style={{ color: mutedColor }}>We will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 style={{ marginBottom: '30px', color: colors.teal }}>Send a Message</h2>
                <div style={{ marginBottom: '20px' }}>
                  <input type="text" placeholder="Your Name *" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <input type="email" placeholder="Email Address *" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <textarea placeholder="Your Message *" required rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} style={{...inputStyle, resize: 'vertical'}} />
                </div>
                <button type="submit" style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer' }}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PORTAL SELECT
// ============================================================================
function PortalSelect({ navigate, darkMode, colors, cardBg, mutedColor }) {
  const options = [
    { title: "I'm a New Employee", desc: 'Complete your onboarding paperwork including W-4, direct deposit, and safety acknowledgment.', icon: <User size={48} />, action: () => navigate('employee-onboarding'), color: colors.green },
    { title: "I'm a Contractor", desc: 'Register your company, complete MSA, W-9, insurance verification, and rate card acceptance.', icon: <Building size={48} />, action: () => navigate('contractor-onboarding'), color: colors.teal },
    { title: 'Existing Employee Login', desc: 'Access your dashboard, time clock, projects, and documents.', icon: <UserCircle size={48} />, action: () => navigate('employee-login'), color: colors.oceanBlue }
  ];

  return (
    <section style={{ padding: '80px 20px', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>LYT Portal</h1>
        <p style={{ textAlign: 'center', color: mutedColor, marginBottom: '50px' }}>Select an option to continue</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
          {options.map((option, i) => (
            <div key={i} onClick={option.action} style={{ padding: '40px 30px', backgroundColor: cardBg, borderRadius: '16px', border: '2px solid transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = option.color}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}>
              <div style={{ color: option.color, marginBottom: '20px' }}>{option.icon}</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '15px' }}>{option.title}</h3>
              <p style={{ color: mutedColor, lineHeight: '1.5' }}>{option.desc}</p>
              <div style={{ marginTop: '25px', color: option.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600' }}>
                Continue <ChevronRight size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// EMPLOYEE ONBOARDING - Full W-4 Form Support
// ============================================================================
function EmployeeOnboarding({ onBack, darkMode }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    dateOfBirth: '',
    
    // W-4 Information
    ssn: '',  // Full SSN XXX-XX-XXXX
    filingStatus: '', // single, married, head
    multipleJobs: false, // Step 2(c) checkbox
    
    // Step 3 - Dependents
    qualifyingChildren: '',  // Number * $2,200
    otherDependents: '',     // Number * $500
    otherCredits: '',        // Additional credits
    
    // Step 4 - Other Adjustments
    otherIncome: '',         // 4(a)
    deductions: '',          // 4(b)
    extraWithholding: '',    // 4(c)
    
    // Exemption
    claimExempt: false,
    
    // Direct Deposit
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    
    // Emergency Contact
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
    emergencyEmail: '',
    
    // Safety
    safetyAcknowledged: false
  });
  
  const [signature, setSignature] = useState(null);
  const [documents, setDocuments] = useState({
    w4: { signed: false, signedAt: null, signatureData: null, pdfData: null }
  });
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const totalSteps = 5;
  const bgColor = darkMode ? colors.darkBg : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1a1a2e';
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa';
  const inputBg = darkMode ? 'rgba(255,255,255,0.08)' : 'white';
  const borderColor = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const mutedColor = darkMode ? '#a0aec0' : '#666';

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    backgroundColor: inputBg,
    color: textColor,
    fontSize: '1rem',
    marginBottom: '15px'
  };

  const selectStyle = {
    ...inputStyle,
    color: formData.state || formData.filingStatus ? textColor : mutedColor
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.9rem',
    color: mutedColor,
    fontWeight: '500'
  };

  // Calculate Step 3 total
  const calculateStep3Total = () => {
    const children = (parseInt(formData.qualifyingChildren) || 0) * 2200;
    const others = (parseInt(formData.otherDependents) || 0) * 500;
    const credits = parseFloat(formData.otherCredits) || 0;
    return children + others + credits;
  };

  const handleSignatureSave = (signatureData) => {
    setSignature(signatureData);
    setDocuments(prev => ({
      ...prev,
      w4: {
        ...prev.w4,
        signatureData: signatureData
      }
    }));
  };

  const handleSignatureClear = () => {
    setSignature(null);
    setDocuments(prev => ({
      ...prev,
      w4: {
        ...prev.w4,
        signed: false,
        signedAt: null,
        signatureData: null
      }
    }));
  };

  const signW4Document = () => {
    if (!signature) {
      setError('Please draw and save your signature first');
      return;
    }
    
    // Build the W-4 data object for PDF filling
    const w4Data = {
      // Personal
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      ssn: formData.ssn,
      address: formData.address,
      cityStateZip: `${formData.city}, ${formData.state} ${formData.zip}`,
      
      // Filing Status
      filingStatus: formData.filingStatus,
      
      // Step 2
      multipleJobs: formData.multipleJobs,
      
      // Step 3
      qualifyingChildrenAmount: (parseInt(formData.qualifyingChildren) || 0) * 2200,
      otherDependentsAmount: (parseInt(formData.otherDependents) || 0) * 500,
      step3Total: calculateStep3Total(),
      
      // Step 4
      otherIncome: formData.otherIncome,
      deductions: formData.deductions,
      extraWithholding: formData.extraWithholding,
      
      // Exemption
      claimExempt: formData.claimExempt,
      
      // Employer Info (pre-filled)
      employerName: LYT_INFO.name,
      employerAddress: `${LYT_INFO.address}, ${LYT_INFO.cityStateZip}`,
      employerEIN: LYT_INFO.ein,
      firstDateEmployment: new Date().toLocaleDateString(),
      
      // Signature
      signatureData: signature,
      signatureDate: new Date().toLocaleDateString()
    };
    
    setDocuments(prev => ({
      ...prev,
      w4: {
        signed: true,
        signedAt: new Date().toISOString(),
        signatureData: signature,
        formData: w4Data
      }
    }));
  };

  const canProceed = () => {
    switch(step) {
      case 1: 
        return formData.firstName && formData.lastName && formData.email && formData.phone && 
               formData.address && formData.city && formData.state && formData.zip;
      case 2: 
        return formData.ssn && formData.ssn.replace(/\D/g, '').length === 9 && 
               formData.filingStatus && documents.w4.signed;
      case 3: 
        return formData.bankName && formData.routingNumber && 
               formData.routingNumber.length === 9 && formData.accountNumber;
      case 4: 
        return formData.emergencyName && formData.emergencyPhone && formData.emergencyRelationship;
      case 5: 
        return formData.safetyAcknowledged;
      default: 
        return false;
    }
  };

  const submitOnboarding = async () => {
    setSubmitting(true);
    setError(null);
    
    const payload = {
      type: 'employee',
      formData: {
        ...formData,
        ssnLast4: formData.ssn.slice(-4),
        accountLast4: formData.accountNumber.slice(-4)
      },
      documents: {
        w4: {
          signed: documents.w4.signed,
          signedAt: documents.w4.signedAt,
          formData: documents.w4.formData,
          signatureData: documents.w4.signatureData
        }
      }
    };
    
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        setCompleted(true);
      } else {
        setError(result.error || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Your data has been saved locally. Please contact HR.');
      localStorage.setItem('lyt_employee_onboarding_backup', JSON.stringify(payload));
    }
    setSubmitting(false);
  };

  if (completed) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <CheckCircle size={80} color={colors.green} style={{ marginBottom: '30px' }} />
          <h1 style={{ marginBottom: '20px' }}>Welcome to LYT!</h1>
          <p style={{ color: mutedColor, marginBottom: '30px' }}>
            Your onboarding is complete. Your W-4 and other documents have been securely saved. 
            HR will be in touch with next steps.
          </p>
          <button onClick={onBack} style={{ padding: '14px 40px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.teal, cursor: 'pointer', fontSize: '1rem' }}>
            <ArrowLeft size={20} /> Back
          </button>
          <span style={{ fontWeight: '600' }}>Employee Onboarding</span>
          <span style={{ color: mutedColor }}>Step {step} of {totalSteps}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[1,2,3,4,5].map(s => (
            <div key={s} style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: s <= step ? colors.green : (darkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0') }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.85rem', color: mutedColor }}>
          <span>Personal Info</span>
          <span>W-4 Form</span>
          <span>Direct Deposit</span>
          <span>Emergency</span>
          <span>Safety</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        {error && (
          <div style={{ backgroundColor: 'rgba(232, 90, 79, 0.2)', border: `1px solid ${colors.coral}`, padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle color={colors.coral} />{error}
          </div>
        )}

        {/* STEP 1: Personal Information */}
        {step === 1 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User color={colors.teal} /> Personal Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input 
                  placeholder="John" 
                  value={formData.firstName} 
                  onChange={(e) => updateField('firstName', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>Middle Name</label>
                <input 
                  placeholder="Michael" 
                  value={formData.middleName} 
                  onChange={(e) => updateField('middleName', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input 
                  placeholder="Smith" 
                  value={formData.lastName} 
                  onChange={(e) => updateField('lastName', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div>
                <label style={labelStyle}>Email Address *</label>
                <input 
                  type="email" 
                  placeholder="john.smith@email.com" 
                  value={formData.email} 
                  onChange={(e) => updateField('email', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>Phone Number *</label>
                <input 
                  type="tel" 
                  placeholder="(281) 555-0100" 
                  value={formData.phone} 
                  onChange={(e) => updateField('phone', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
            </div>
            
            <div>
              <label style={labelStyle}>Street Address *</label>
              <input 
                placeholder="123 Main Street, Apt 4B" 
                value={formData.address} 
                onChange={(e) => updateField('address', e.target.value)} 
                style={inputStyle} 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={labelStyle}>City *</label>
                <input 
                  placeholder="Webster" 
                  value={formData.city} 
                  onChange={(e) => updateField('city', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>State *</label>
                <select 
                  value={formData.state} 
                  onChange={(e) => updateField('state', e.target.value)} 
                  style={selectStyle}
                >
                  <option value="">Select</option>
                  <option value="TX">Texas</option>
                  <option value="LA">Louisiana</option>
                  <option value="OK">Oklahoma</option>
                  <option value="AR">Arkansas</option>
                  <option value="NM">New Mexico</option>
                  {/* Add more states as needed */}
                </select>
              </div>
              <div>
                <label style={labelStyle}>ZIP Code *</label>
                <input 
                  placeholder="77598" 
                  value={formData.zip} 
                  onChange={(e) => updateField('zip', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
            </div>
            
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input 
                type="date" 
                value={formData.dateOfBirth} 
                onChange={(e) => updateField('dateOfBirth', e.target.value)} 
                style={inputStyle} 
              />
            </div>
          </div>
        )}

        {/* STEP 2: W-4 Form */}
        {step === 2 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText color={colors.teal} /> Form W-4 (Employee's Withholding Certificate)
            </h2>
            <p style={{ color: mutedColor, marginBottom: '30px' }}>
              Complete the information below. This will be used to fill your official W-4 form.
            </p>

            {/* Step 1: Personal Info for W-4 */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '20px', color: colors.oceanBlue }}>Step 1: Enter Personal Information</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Social Security Number (SSN) *</label>
                <SSNInput 
                  value={formData.ssn}
                  onChange={(val) => updateField('ssn', val)}
                  darkMode={darkMode}
                />
                <small style={{ color: mutedColor, fontSize: '0.8rem' }}>
                  Format: XXX-XX-XXXX (Required for tax withholding)
                </small>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Filing Status *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="filingStatus" 
                      value="single" 
                      checked={formData.filingStatus === 'single'}
                      onChange={(e) => updateField('filingStatus', e.target.value)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Single or Married filing separately</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="filingStatus" 
                      value="married" 
                      checked={formData.filingStatus === 'married'}
                      onChange={(e) => updateField('filingStatus', e.target.value)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Married filing jointly or Qualifying surviving spouse</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="filingStatus" 
                      value="head" 
                      checked={formData.filingStatus === 'head'}
                      onChange={(e) => updateField('filingStatus', e.target.value)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Head of household</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Step 2: Multiple Jobs */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '15px', color: colors.oceanBlue }}>Step 2: Multiple Jobs or Spouse Works (Optional)</h3>
              <p style={{ color: mutedColor, fontSize: '0.9rem', marginBottom: '15px' }}>
                Complete this step if you (1) hold more than one job at a time, or (2) are married filing jointly and your spouse also works.
              </p>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.multipleJobs}
                  onChange={(e) => updateField('multipleJobs', e.target.checked)}
                  style={{ width: '20px', height: '20px', marginTop: '2px' }}
                />
                <span>Check here if there are only two jobs total (yours and spouse's). This option is generally more accurate if pay at the lower paying job is more than half of the pay at the higher paying job.</span>
              </label>
            </div>

            {/* Step 3: Dependents */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '15px', color: colors.oceanBlue }}>Step 3: Claim Dependent and Other Credits (Optional)</h3>
              <p style={{ color: mutedColor, fontSize: '0.9rem', marginBottom: '20px' }}>
                If your total income will be $200,000 or less ($400,000 or less if married filing jointly):
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Number of qualifying children under age 17</label>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="0"
                    value={formData.qualifyingChildren}
                    onChange={(e) => updateField('qualifyingChildren', e.target.value)}
                    style={inputStyle}
                  />
                  <small style={{ color: mutedColor }}>× $2,200 = ${((parseInt(formData.qualifyingChildren) || 0) * 2200).toLocaleString()}</small>
                </div>
                <div>
                  <label style={labelStyle}>Number of other dependents</label>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="0"
                    value={formData.otherDependents}
                    onChange={(e) => updateField('otherDependents', e.target.value)}
                    style={inputStyle}
                  />
                  <small style={{ color: mutedColor }}>× $500 = ${((parseInt(formData.otherDependents) || 0) * 500).toLocaleString()}</small>
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>Other credits (foreign tax credit, education credits, etc.)</label>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  value={formData.otherCredits}
                  onChange={(e) => updateField('otherCredits', e.target.value)}
                  style={inputStyle}
                />
              </div>
              
              <div style={{ padding: '15px', backgroundColor: darkMode ? 'rgba(0,119,182,0.2)' : 'rgba(0,119,182,0.1)', borderRadius: '8px', marginTop: '15px' }}>
                <strong>Step 3 Total: ${calculateStep3Total().toLocaleString()}</strong>
              </div>
            </div>

            {/* Step 4: Other Adjustments */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '15px', color: colors.oceanBlue }}>Step 4: Other Adjustments (Optional)</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>(a) Other income (not from jobs)</label>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  value={formData.otherIncome}
                  onChange={(e) => updateField('otherIncome', e.target.value)}
                  style={inputStyle}
                />
                <small style={{ color: mutedColor }}>Interest, dividends, retirement income, etc.</small>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>(b) Deductions</label>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  value={formData.deductions}
                  onChange={(e) => updateField('deductions', e.target.value)}
                  style={inputStyle}
                />
                <small style={{ color: mutedColor }}>If you expect to claim deductions other than the standard deduction</small>
              </div>
              
              <div>
                <label style={labelStyle}>(c) Extra withholding per pay period</label>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  value={formData.extraWithholding}
                  onChange={(e) => updateField('extraWithholding', e.target.value)}
                  style={inputStyle}
                />
                <small style={{ color: mutedColor }}>Additional tax you want withheld each pay period</small>
              </div>
            </div>

            {/* Exemption */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '15px', color: colors.oceanBlue }}>Exemption from Withholding</h3>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.claimExempt}
                  onChange={(e) => updateField('claimExempt', e.target.checked)}
                  style={{ width: '20px', height: '20px', marginTop: '2px' }}
                />
                <span>
                  I claim exemption from withholding for 2026, and I certify that I meet both of the following conditions: 
                  (1) Last year I had a right to a refund of all federal income tax withheld because I had no tax liability, and 
                  (2) This year I expect a refund of all federal income tax withheld because I expect to have no tax liability.
                </span>
              </label>
            </div>

            {/* PDF Preview Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setShowPdfPreview(!showPdfPreview)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: cardBg,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Eye size={18} /> {showPdfPreview ? 'Hide' : 'Preview'} Official W-4 Form
              </button>
            </div>

            {showPdfPreview && (
              <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                <iframe 
                  src={PDF_URLS.w4} 
                  style={{ width: '100%', height: '500px', border: 'none' }} 
                  title="Form W-4 Preview" 
                />
              </div>
            )}

            {/* Signature Section */}
            <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: darkMode ? 'rgba(46,153,75,0.1)' : 'rgba(46,153,75,0.05)', borderRadius: '8px', border: `1px solid ${colors.green}30` }}>
              <h3 style={{ marginBottom: '15px', color: colors.green }}>Step 5: Sign Here</h3>
              <p style={{ color: mutedColor, marginBottom: '20px', fontSize: '0.9rem' }}>
                Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, is true, correct, and complete.
              </p>
              
              <SignaturePad 
                onSave={handleSignatureSave}
                onClear={handleSignatureClear}
                savedSignature={signature}
                darkMode={darkMode}
              />
            </div>

            {/* Sign Document Button */}
            {documents.w4.signed ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                color: colors.green, 
                padding: '20px', 
                backgroundColor: 'rgba(46, 153, 75, 0.1)', 
                borderRadius: '8px' 
              }}>
                <CheckCircle size={24} />
                <div>
                  <strong>W-4 Signed Successfully</strong>
                  <div style={{ fontSize: '0.9rem', color: mutedColor }}>
                    Signed on {new Date(documents.w4.signedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={signW4Document}
                disabled={!signature || !formData.ssn || !formData.filingStatus}
                style={{ 
                  padding: '16px 40px', 
                  background: (signature && formData.ssn && formData.filingStatus) 
                    ? `linear-gradient(135deg, ${colors.green}, #28a745)` 
                    : '#ccc',
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  cursor: (signature && formData.ssn && formData.filingStatus) ? 'pointer' : 'not-allowed',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}
              >
                <CheckCircle size={20} /> Sign W-4 Document
              </button>
            )}
            
            {!signature && (
              <p style={{ color: colors.coral, marginTop: '10px', fontSize: '0.9rem' }}>
                Please draw and save your signature above before signing
              </p>
            )}
          </div>
        )}

        {/* STEP 3: Direct Deposit */}
        {step === 3 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard color={colors.teal} /> Direct Deposit Information
            </h2>
            
            <div>
              <label style={labelStyle}>Bank Name *</label>
              <input 
                placeholder="Chase Bank" 
                value={formData.bankName} 
                onChange={(e) => updateField('bankName', e.target.value)} 
                style={inputStyle} 
              />
            </div>
            
            <div>
              <label style={labelStyle}>Routing Number (9 digits) *</label>
              <input 
                placeholder="111000025" 
                maxLength={9}
                value={formData.routingNumber} 
                onChange={(e) => updateField('routingNumber', e.target.value.replace(/\D/g, ''))} 
                style={{...inputStyle, fontFamily: 'monospace'}} 
              />
            </div>
            
            <div>
              <label style={labelStyle}>Account Number *</label>
              <input 
                placeholder="123456789012" 
                value={formData.accountNumber} 
                onChange={(e) => updateField('accountNumber', e.target.value.replace(/\D/g, ''))} 
                style={{...inputStyle, fontFamily: 'monospace'}} 
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Account Type</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="accountType" 
                    value="checking" 
                    checked={formData.accountType === 'checking'}
                    onChange={(e) => updateField('accountType', e.target.value)}
                  />
                  Checking
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="accountType" 
                    value="savings" 
                    checked={formData.accountType === 'savings'}
                    onChange={(e) => updateField('accountType', e.target.value)}
                  />
                  Savings
                </label>
              </div>
            </div>

            <div style={{ padding: '15px', backgroundColor: darkMode ? 'rgba(0,119,182,0.2)' : 'rgba(0,119,182,0.1)', borderRadius: '8px', marginTop: '20px' }}>
              <p style={{ fontSize: '0.9rem', color: mutedColor }}>
                <strong>Note:</strong> Your routing and account numbers can be found at the bottom of your checks. 
                For security, we only store the last 4 digits of your account number after verification.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Emergency Contact */}
        {step === 4 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Heart color={colors.teal} /> Emergency Contact
            </h2>
            
            <div>
              <label style={labelStyle}>Contact Name *</label>
              <input 
                placeholder="Jane Smith" 
                value={formData.emergencyName} 
                onChange={(e) => updateField('emergencyName', e.target.value)} 
                style={inputStyle} 
              />
            </div>
            
            <div>
              <label style={labelStyle}>Relationship *</label>
              <select 
                value={formData.emergencyRelationship} 
                onChange={(e) => updateField('emergencyRelationship', e.target.value)} 
                style={selectStyle}
              >
                <option value="">Select relationship</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Child</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div>
                <label style={labelStyle}>Phone Number *</label>
                <input 
                  type="tel" 
                  placeholder="(281) 555-0101" 
                  value={formData.emergencyPhone} 
                  onChange={(e) => updateField('emergencyPhone', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>Email (optional)</label>
                <input 
                  type="email" 
                  placeholder="jane.smith@email.com" 
                  value={formData.emergencyEmail} 
                  onChange={(e) => updateField('emergencyEmail', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Safety Acknowledgment */}
        {step === 5 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield color={colors.teal} /> Safety Acknowledgment
            </h2>
            
            <div style={{ padding: '25px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px', marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '15px' }}>Safety Commitment</h3>
              <p style={{ color: mutedColor, lineHeight: '1.8', marginBottom: '20px' }}>
                LYT Communications is committed to providing a safe work environment. By acknowledging below, you confirm that you:
              </p>
              <ul style={{ color: mutedColor, lineHeight: '2', paddingLeft: '20px' }}>
                <li>Will comply with all OSHA regulations and company safety policies</li>
                <li>Will attend all required safety training sessions</li>
                <li>Will use proper personal protective equipment (PPE) at all times</li>
                <li>Will report any unsafe conditions or incidents immediately</li>
                <li>Will follow all lockout/tagout procedures</li>
                <li>Understand that safety violations may result in disciplinary action</li>
              </ul>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', cursor: 'pointer', padding: '20px', backgroundColor: darkMode ? 'rgba(46,153,75,0.1)' : 'rgba(46,153,75,0.05)', borderRadius: '8px', border: `2px solid ${formData.safetyAcknowledged ? colors.green : 'transparent'}` }}>
              <input 
                type="checkbox" 
                checked={formData.safetyAcknowledged}
                onChange={(e) => updateField('safetyAcknowledged', e.target.checked)}
                style={{ width: '24px', height: '24px', marginTop: '2px' }}
              />
              <span style={{ fontSize: '1rem' }}>
                <strong>I acknowledge that I have read and understand the safety requirements above.</strong> 
                I agree to comply with all safety policies and procedures as a condition of my employment with LYT Communications, LLC.
              </span>
            </label>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          <button 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1}
            style={{ 
              padding: '14px 30px', 
              backgroundColor: step === 1 ? 'transparent' : cardBg, 
              color: step === 1 ? 'transparent' : textColor, 
              border: step === 1 ? 'none' : `1px solid ${borderColor}`, 
              borderRadius: '8px', 
              cursor: step === 1 ? 'default' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <ArrowLeft size={20} /> Previous
          </button>
          
          {step < totalSteps ? (
            <button 
              onClick={() => setStep(step + 1)} 
              disabled={!canProceed()}
              style={{ 
                padding: '14px 30px', 
                background: canProceed() ? `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})` : (darkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0'), 
                color: canProceed() ? 'white' : (darkMode ? '#666' : '#999'), 
                border: 'none', 
                borderRadius: '8px', 
                cursor: canProceed() ? 'pointer' : 'not-allowed', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontWeight: '600' 
              }}
            >
              Next <ArrowRight size={20} />
            </button>
          ) : (
            <button 
              onClick={submitOnboarding} 
              disabled={!canProceed() || submitting}
              style={{ 
                padding: '14px 40px', 
                background: canProceed() ? `linear-gradient(135deg, ${colors.green}, #28a745)` : (darkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0'), 
                color: canProceed() ? 'white' : (darkMode ? '#666' : '#999'), 
                border: 'none', 
                borderRadius: '8px', 
                cursor: canProceed() && !submitting ? 'pointer' : 'not-allowed', 
                fontWeight: '600' 
              }}
            >
              {submitting ? 'Submitting...' : 'Complete Onboarding'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONTRACTOR ONBOARDING - Full W-9 and MSA Support
// ============================================================================
function ContractorOnboarding({ onBack, darkMode }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    dba: '',
    entityType: '', // LLC, Corporation, Sole Proprietor, Partnership, Trust/Estate, Other
    llcTaxClass: '', // C, S, P (only if LLC)
    ein: '',
    ssn: '', // For sole proprietors
    taxIdType: 'ein', // 'ein' or 'ssn'
    
    // Company Address
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    
    // W-9 Specific Fields
    exemptPayeeCode: '',
    fatcaCode: '',
    accountNumbers: '',
    
    // Primary Contact
    contactName: '',
    contactTitle: '',
    contactEmail: '',
    contactPhone: '',
    
    // MSA Signer Info
    signerName: '',
    signerTitle: '',
    witness1Name: '',
    witness2Name: '',
    
    // Insurance
    insuranceCarrier: '',
    policyNumber: '',
    insuranceExpiration: '',
    coiUploaded: false,
    
    // Fleet
    fleet: [{ type: '', makeModel: '', year: '', vin: '' }],
    
    // Personnel
    personnel: [{ name: '', role: '', phone: '', certifications: '' }],
    
    // Skills
    skills: {
      hddDrilling: false,
      fiberSplicing: false,
      aerialConstruction: false,
      undergroundUtilities: false,
      projectManagement: false,
      locating: false,
      safetyTraining: false,
      cdlDrivers: false
    },
    
    // Rate Card
    rateCardAccepted: false,
    
    // Banking
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking'
  });
  
  const [signatures, setSignatures] = useState({
    w9: null,
    msa: null
  });
  
  const [documents, setDocuments] = useState({
    msa: { signed: false, signedAt: null, signatureData: null },
    w9: { signed: false, signedAt: null, signatureData: null }
  });
  
  const [coiFile, setCoiFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [showW9Preview, setShowW9Preview] = useState(false);
  const [showMsaPreview, setShowMsaPreview] = useState(false);

  const totalSteps = 8;
  const bgColor = darkMode ? colors.darkBg : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1a1a2e';
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa';
  const inputBg = darkMode ? 'rgba(255,255,255,0.08)' : 'white';
  const borderColor = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const mutedColor = darkMode ? '#a0aec0' : '#666';

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateSkill = (skill, value) => setFormData(prev => ({ ...prev, skills: { ...prev.skills, [skill]: value } }));

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    backgroundColor: inputBg,
    color: textColor,
    fontSize: '1rem',
    marginBottom: '15px'
  };

  const selectStyle = {
    ...inputStyle,
    color: textColor
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.9rem',
    color: mutedColor,
    fontWeight: '500'
  };

  const handleCoiUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCoiFile({
          name: file.name,
          mimeType: file.type,
          data: reader.result.split(',')[1]
        });
        updateField('coiUploaded', true);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFleetItem = () => setFormData(prev => ({ 
    ...prev, 
    fleet: [...prev.fleet, { type: '', makeModel: '', year: '', vin: '' }] 
  }));
  
  const addPersonnel = () => setFormData(prev => ({ 
    ...prev, 
    personnel: [...prev.personnel, { name: '', role: '', phone: '', certifications: '' }] 
  }));
  
  const updateFleet = (index, field, value) => {
    const newFleet = [...formData.fleet];
    newFleet[index][field] = value;
    setFormData(prev => ({ ...prev, fleet: newFleet }));
  };
  
  const updatePersonnel = (index, field, value) => {
    const newPersonnel = [...formData.personnel];
    newPersonnel[index][field] = value;
    setFormData(prev => ({ ...prev, personnel: newPersonnel }));
  };

  const removeFleetItem = (index) => {
    if (formData.fleet.length > 1) {
      setFormData(prev => ({ ...prev, fleet: prev.fleet.filter((_, i) => i !== index) }));
    }
  };

  const removePersonnel = (index) => {
    if (formData.personnel.length > 1) {
      setFormData(prev => ({ ...prev, personnel: prev.personnel.filter((_, i) => i !== index) }));
    }
  };

  // Signature handlers
  const handleW9SignatureSave = (signatureData) => {
    setSignatures(prev => ({ ...prev, w9: signatureData }));
  };

  const handleW9SignatureClear = () => {
    setSignatures(prev => ({ ...prev, w9: null }));
    setDocuments(prev => ({ ...prev, w9: { signed: false, signedAt: null, signatureData: null } }));
  };

  const handleMsaSignatureSave = (signatureData) => {
    setSignatures(prev => ({ ...prev, msa: signatureData }));
  };

  const handleMsaSignatureClear = () => {
    setSignatures(prev => ({ ...prev, msa: null }));
    setDocuments(prev => ({ ...prev, msa: { signed: false, signedAt: null, signatureData: null } }));
  };

  const signW9Document = () => {
    if (!signatures.w9) {
      setError('Please draw and save your signature first');
      return;
    }
    
    const w9Data = {
      // Line 1 - Name
      name: formData.taxIdType === 'ssn' ? formData.contactName : formData.companyName,
      // Line 2 - Business name
      businessName: formData.dba || '',
      // Tax Classification
      entityType: formData.entityType,
      llcTaxClass: formData.llcTaxClass,
      // Exemptions
      exemptPayeeCode: formData.exemptPayeeCode,
      fatcaCode: formData.fatcaCode,
      // Address
      address: formData.companyAddress,
      cityStateZip: `${formData.companyCity}, ${formData.companyState} ${formData.companyZip}`,
      // Requester
      requesterInfo: `${LYT_INFO.name}\n${LYT_INFO.address}\n${LYT_INFO.cityStateZip}`,
      // Account numbers
      accountNumbers: formData.accountNumbers,
      // TIN
      taxIdType: formData.taxIdType,
      ssn: formData.ssn,
      ein: formData.ein,
      // Signature
      signatureData: signatures.w9,
      signatureDate: new Date().toLocaleDateString()
    };
    
    setDocuments(prev => ({
      ...prev,
      w9: {
        signed: true,
        signedAt: new Date().toISOString(),
        signatureData: signatures.w9,
        formData: w9Data
      }
    }));
  };

  const signMsaDocument = () => {
    if (!signatures.msa) {
      setError('Please draw and save your signature first');
      return;
    }
    
    const msaData = {
      // Subcontractor info
      companyName: formData.companyName,
      entityType: formData.entityType === 'LLC' 
        ? `${formData.entityType} (${formData.llcTaxClass === 'C' ? 'C Corporation' : formData.llcTaxClass === 'S' ? 'S Corporation' : 'Partnership'})`
        : formData.entityType,
      // Signer
      signerName: formData.signerName || formData.contactName,
      signerTitle: formData.signerTitle || formData.contactTitle,
      // Witnesses (optional)
      witness1: formData.witness1Name,
      witness2: formData.witness2Name,
      // Dates
      signatureDate: new Date().toLocaleDateString(),
      // Signature
      signatureData: signatures.msa
    };
    
    setDocuments(prev => ({
      ...prev,
      msa: {
        signed: true,
        signedAt: new Date().toISOString(),
        signatureData: signatures.msa,
        formData: msaData
      }
    }));
  };

  const canProceed = () => {
    switch(step) {
      case 1: 
        return formData.companyName && formData.entityType && formData.contactName && formData.contactEmail;
      case 2: 
        return documents.msa.signed;
      case 3: 
        // W-9 requires tax ID and entity type
        const hasTaxId = formData.taxIdType === 'ein' 
          ? formData.ein && formData.ein.replace(/\D/g, '').length === 9
          : formData.ssn && formData.ssn.replace(/\D/g, '').length === 9;
        return hasTaxId && documents.w9.signed;
      case 4: 
        return formData.coiUploaded;
      case 5: 
        return true; // Fleet/Personnel optional
      case 6: 
        return Object.values(formData.skills).some(v => v);
      case 7: 
        return formData.rateCardAccepted;
      case 8: 
        return formData.bankName && formData.routingNumber && 
               formData.routingNumber.length === 9 && formData.accountNumber;
      default: 
        return false;
    }
  };

  const submitOnboarding = async () => {
    setSubmitting(true);
    setError(null);
    
    const payload = {
      type: 'contractor',
      formData: {
        ...formData,
        taxIdLast4: formData.taxIdType === 'ein' 
          ? formData.ein.slice(-4) 
          : formData.ssn.slice(-4),
        accountLast4: formData.accountNumber.slice(-4)
      },
      documents: {
        msa: {
          signed: documents.msa.signed,
          signedAt: documents.msa.signedAt,
          formData: documents.msa.formData,
          signatureData: documents.msa.signatureData
        },
        w9: {
          signed: documents.w9.signed,
          signedAt: documents.w9.signedAt,
          formData: documents.w9.formData,
          signatureData: documents.w9.signatureData
        }
      },
      coiFile
    };
    
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        setCompleted(true);
      } else {
        setError(result.error || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Your data has been saved locally. Please contact us.');
      localStorage.setItem('lyt_contractor_onboarding_backup', JSON.stringify(payload));
    }
    setSubmitting(false);
  };

  if (completed) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <CheckCircle size={80} color={colors.green} style={{ marginBottom: '30px' }} />
          <h1 style={{ marginBottom: '20px' }}>Registration Complete!</h1>
          <p style={{ color: mutedColor, marginBottom: '30px' }}>
            Your contractor registration is complete. Your MSA, W-9, and insurance documents have been securely saved.
            We will review your information and be in touch within 2-3 business days.
          </p>
          <button onClick={onBack} style={{ padding: '14px 40px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.teal, cursor: 'pointer', fontSize: '1rem' }}>
            <ArrowLeft size={20} /> Back
          </button>
          <span style={{ fontWeight: '600' }}>Contractor Registration</span>
          <span style={{ color: mutedColor }}>Step {step} of {totalSteps}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {[1,2,3,4,5,6,7,8].map(s => (
            <div key={s} style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: s <= step ? colors.teal : (darkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0') }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.7rem', color: mutedColor }}>
          <span>Company</span>
          <span>MSA</span>
          <span>W-9</span>
          <span>Insurance</span>
          <span>Fleet</span>
          <span>Skills</span>
          <span>Rates</span>
          <span>Banking</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        {error && (
          <div style={{ backgroundColor: 'rgba(232, 90, 79, 0.2)', border: `1px solid ${colors.coral}`, padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle color={colors.coral} />{error}
          </div>
        )}

        {/* STEP 1: Company Information */}
        {step === 1 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building color={colors.teal} /> Company Information
            </h2>
            
            <div>
              <label style={labelStyle}>Company Name *</label>
              <input 
                placeholder="ABC Construction, LLC" 
                value={formData.companyName} 
                onChange={(e) => updateField('companyName', e.target.value)} 
                style={inputStyle} 
              />
            </div>
            
            <div>
              <label style={labelStyle}>DBA (Doing Business As) - if different</label>
              <input 
                placeholder="ABC Fiber Services" 
                value={formData.dba} 
                onChange={(e) => updateField('dba', e.target.value)} 
                style={inputStyle} 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div>
                <label style={labelStyle}>Entity Type *</label>
                <select 
                  value={formData.entityType} 
                  onChange={(e) => updateField('entityType', e.target.value)} 
                  style={selectStyle}
                >
                  <option value="">Select Entity Type</option>
                  <option value="Individual/Sole Proprietor">Individual/Sole Proprietor</option>
                  <option value="LLC">LLC (Limited Liability Company)</option>
                  <option value="C Corporation">C Corporation</option>
                  <option value="S Corporation">S Corporation</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Trust/Estate">Trust/Estate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {formData.entityType === 'LLC' && (
                <div>
                  <label style={labelStyle}>LLC Tax Classification *</label>
                  <select 
                    value={formData.llcTaxClass} 
                    onChange={(e) => updateField('llcTaxClass', e.target.value)} 
                    style={selectStyle}
                  >
                    <option value="">Select Classification</option>
                    <option value="C">C - C Corporation</option>
                    <option value="S">S - S Corporation</option>
                    <option value="P">P - Partnership</option>
                  </select>
                </div>
              )}
            </div>
            
            <div>
              <label style={labelStyle}>Company Address *</label>
              <input 
                placeholder="456 Industrial Blvd, Suite 100" 
                value={formData.companyAddress} 
                onChange={(e) => updateField('companyAddress', e.target.value)} 
                style={inputStyle} 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={labelStyle}>City *</label>
                <input 
                  placeholder="Houston" 
                  value={formData.companyCity} 
                  onChange={(e) => updateField('companyCity', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>State *</label>
                <select 
                  value={formData.companyState} 
                  onChange={(e) => updateField('companyState', e.target.value)} 
                  style={selectStyle}
                >
                  <option value="">Select</option>
                  <option value="TX">Texas</option>
                  <option value="LA">Louisiana</option>
                  <option value="OK">Oklahoma</option>
                  <option value="AR">Arkansas</option>
                  <option value="NM">New Mexico</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>ZIP *</label>
                <input 
                  placeholder="77001" 
                  value={formData.companyZip} 
                  onChange={(e) => updateField('companyZip', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
            </div>
            
            <h3 style={{ marginTop: '30px', marginBottom: '20px', color: colors.teal }}>Primary Contact</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div>
                <label style={labelStyle}>Contact Name *</label>
                <input 
                  placeholder="John Contractor" 
                  value={formData.contactName} 
                  onChange={(e) => updateField('contactName', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>Title</label>
                <input 
                  placeholder="Owner / Manager" 
                  value={formData.contactTitle} 
                  onChange={(e) => updateField('contactTitle', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input 
                  type="email" 
                  placeholder="john@abcconstruction.com" 
                  value={formData.contactEmail} 
                  onChange={(e) => updateField('contactEmail', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input 
                  type="tel" 
                  placeholder="(713) 555-0100" 
                  value={formData.contactPhone} 
                  onChange={(e) => updateField('contactPhone', e.target.value)} 
                  style={inputStyle} 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MSA (Master Subcontractor Agreement) */}
        {step === 2 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText color={colors.teal} /> Master Subcontractor Agreement (MSA)
            </h2>
            <p style={{ color: mutedColor, marginBottom: '30px' }}>
              Review and sign the Master Subcontractor Agreement between {formData.companyName || 'your company'} and LYT Communications, LLC.
            </p>

            {/* Signer Information */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '20px', color: colors.oceanBlue }}>Authorized Signer Information</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Signer's Full Name *</label>
                  <input 
                    placeholder="John Contractor" 
                    value={formData.signerName} 
                    onChange={(e) => updateField('signerName', e.target.value)} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Signer's Title *</label>
                  <input 
                    placeholder="Owner / Managing Member" 
                    value={formData.signerTitle} 
                    onChange={(e) => updateField('signerTitle', e.target.value)} 
                    style={inputStyle} 
                  />
                </div>
              </div>
              
              <p style={{ color: mutedColor, fontSize: '0.9rem', marginTop: '10px' }}>
                The signer must be authorized to legally bind {formData.companyName || 'the company'} to this agreement.
              </p>
            </div>

            {/* Witnesses (Optional) */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '15px', color: colors.oceanBlue }}>Witnesses (Optional)</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Witness 1 Name</label>
                  <input 
                    placeholder="Witness name (optional)" 
                    value={formData.witness1Name} 
                    onChange={(e) => updateField('witness1Name', e.target.value)} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Witness 2 Name</label>
                  <input 
                    placeholder="Witness name (optional)" 
                    value={formData.witness2Name} 
                    onChange={(e) => updateField('witness2Name', e.target.value)} 
                    style={inputStyle} 
                  />
                </div>
              </div>
            </div>

            {/* MSA Preview Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setShowMsaPreview(!showMsaPreview)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: cardBg,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Eye size={18} /> {showMsaPreview ? 'Hide' : 'View'} Full MSA Document
              </button>
            </div>

            {showMsaPreview && (
              <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                <iframe 
                  src={PDF_URLS.msa} 
                  style={{ width: '100%', height: '500px', border: 'none' }} 
                  title="MSA Preview" 
                />
              </div>
            )}

            {/* Key Terms Summary */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,119,182,0.1)' : 'rgba(0,119,182,0.05)', borderRadius: '8px', border: `1px solid ${colors.oceanBlue}30` }}>
              <h4 style={{ marginBottom: '15px', color: colors.oceanBlue }}>Key Terms Summary</h4>
              <ul style={{ color: mutedColor, lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                <li><strong>Retainage:</strong> 5% held until project completion</li>
                <li><strong>Payment Terms:</strong> Net 10 days after LYT receives payment from Owner</li>
                <li><strong>Insurance Requirements:</strong> Workers Comp $1M, CGL $2M aggregate, Auto $1M, Umbrella varies by job size</li>
                <li><strong>Non-Solicitation:</strong> 2-year period for LYT customers</li>
                <li><strong>Dispute Resolution:</strong> Binding arbitration in Galveston, TX</li>
              </ul>
            </div>

            {/* Signature Section */}
            <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: darkMode ? 'rgba(46,153,75,0.1)' : 'rgba(46,153,75,0.05)', borderRadius: '8px', border: `1px solid ${colors.green}30` }}>
              <h3 style={{ marginBottom: '15px', color: colors.green }}>Sign Master Subcontractor Agreement</h3>
              <p style={{ color: mutedColor, marginBottom: '20px', fontSize: '0.9rem' }}>
                By signing below, {formData.signerName || 'the authorized signer'} certifies that they have read, understand, and agree to all terms and conditions of this Master Subcontractor Agreement on behalf of {formData.companyName || 'the Subcontractor'}.
              </p>
              
              <SignaturePad 
                onSave={handleMsaSignatureSave}
                onClear={handleMsaSignatureClear}
                savedSignature={signatures.msa}
                darkMode={darkMode}
              />
            </div>

            {/* Sign Document Button */}
            {documents.msa.signed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.green, padding: '20px', backgroundColor: 'rgba(46, 153, 75, 0.1)', borderRadius: '8px' }}>
                <CheckCircle size={24} />
                <div>
                  <strong>MSA Signed Successfully</strong>
                  <div style={{ fontSize: '0.9rem', color: mutedColor }}>
                    Signed by {formData.signerName || formData.contactName} on {new Date(documents.msa.signedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={signMsaDocument}
                disabled={!signatures.msa || !formData.signerName}
                style={{ 
                  padding: '16px 40px', 
                  background: (signatures.msa && formData.signerName) 
                    ? `linear-gradient(135deg, ${colors.green}, #28a745)` 
                    : '#ccc',
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  cursor: (signatures.msa && formData.signerName) ? 'pointer' : 'not-allowed',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}
              >
                <CheckCircle size={20} /> Sign MSA Document
              </button>
            )}
            
            {!signatures.msa && (
              <p style={{ color: colors.coral, marginTop: '10px', fontSize: '0.9rem' }}>
                Please draw and save your signature above before signing
              </p>
            )}
          </div>
        )}

        {/* STEP 3: W-9 Form */}
        {step === 3 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText color={colors.teal} /> Form W-9 (Request for Taxpayer Identification Number)
            </h2>
            <p style={{ color: mutedColor, marginBottom: '30px' }}>
              Complete the W-9 form for tax reporting purposes.
            </p>

            {/* Tax ID Type Selection */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '20px', color: colors.oceanBlue }}>Taxpayer Identification Number (TIN)</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>TIN Type *</label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="taxIdType" 
                      value="ein" 
                      checked={formData.taxIdType === 'ein'}
                      onChange={(e) => updateField('taxIdType', e.target.value)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Employer Identification Number (EIN)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="taxIdType" 
                      value="ssn" 
                      checked={formData.taxIdType === 'ssn'}
                      onChange={(e) => updateField('taxIdType', e.target.value)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Social Security Number (SSN)</span>
                  </label>
                </div>
              </div>

              {formData.taxIdType === 'ein' ? (
                <div>
                  <label style={labelStyle}>Employer Identification Number (EIN) *</label>
                  <EINInput 
                    value={formData.ein}
                    onChange={(val) => updateField('ein', val)}
                    darkMode={darkMode}
                  />
                  <small style={{ color: mutedColor, fontSize: '0.8rem' }}>
                    Format: XX-XXXXXXX
                  </small>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Social Security Number (SSN) *</label>
                  <SSNInput 
                    value={formData.ssn}
                    onChange={(val) => updateField('ssn', val)}
                    darkMode={darkMode}
                  />
                  <small style={{ color: mutedColor, fontSize: '0.8rem' }}>
                    Format: XXX-XX-XXXX (For sole proprietors)
                  </small>
                </div>
              )}
            </div>

            {/* Exemptions (Optional) */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '15px', color: colors.oceanBlue }}>Exemptions (If Applicable)</h3>
              <p style={{ color: mutedColor, fontSize: '0.9rem', marginBottom: '15px' }}>
                Most contractors should leave these blank. Only enter codes if you qualify for exemptions.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Exempt Payee Code</label>
                  <input 
                    placeholder="Leave blank if not applicable"
                    value={formData.exemptPayeeCode}
                    onChange={(e) => updateField('exemptPayeeCode', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>FATCA Exemption Code</label>
                  <input 
                    placeholder="Leave blank if not applicable"
                    value={formData.fatcaCode}
                    onChange={(e) => updateField('fatcaCode', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Account Numbers (Optional) */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '15px', color: colors.oceanBlue }}>Account Numbers (Optional)</h3>
              <div>
                <label style={labelStyle}>Account Number(s)</label>
                <input 
                  placeholder="Optional - for requester's use"
                  value={formData.accountNumbers}
                  onChange={(e) => updateField('accountNumbers', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* W-9 Preview Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setShowW9Preview(!showW9Preview)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: cardBg,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Eye size={18} /> {showW9Preview ? 'Hide' : 'Preview'} Official W-9 Form
              </button>
            </div>

            {showW9Preview && (
              <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                <iframe 
                  src={PDF_URLS.w9} 
                  style={{ width: '100%', height: '500px', border: 'none' }} 
                  title="W-9 Preview" 
                />
              </div>
            )}

            {/* Certification Text */}
            <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,119,182,0.1)' : 'rgba(0,119,182,0.05)', borderRadius: '8px', border: `1px solid ${colors.oceanBlue}30` }}>
              <h4 style={{ marginBottom: '10px', color: colors.oceanBlue }}>Certification</h4>
              <p style={{ color: mutedColor, fontSize: '0.9rem', lineHeight: '1.6' }}>
                Under penalties of perjury, I certify that: (1) The number shown on this form is my correct taxpayer identification number, 
                (2) I am not subject to backup withholding, (3) I am a U.S. citizen or other U.S. person, and 
                (4) The FATCA code(s) entered (if any) indicating I am exempt from FATCA reporting is correct.
              </p>
            </div>

            {/* Signature Section */}
            <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: darkMode ? 'rgba(46,153,75,0.1)' : 'rgba(46,153,75,0.05)', borderRadius: '8px', border: `1px solid ${colors.green}30` }}>
              <h3 style={{ marginBottom: '15px', color: colors.green }}>Sign W-9 Form</h3>
              
              <SignaturePad 
                onSave={handleW9SignatureSave}
                onClear={handleW9SignatureClear}
                savedSignature={signatures.w9}
                darkMode={darkMode}
              />
            </div>

            {/* Sign Document Button */}
            {documents.w9.signed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.green, padding: '20px', backgroundColor: 'rgba(46, 153, 75, 0.1)', borderRadius: '8px' }}>
                <CheckCircle size={24} />
                <div>
                  <strong>W-9 Signed Successfully</strong>
                  <div style={{ fontSize: '0.9rem', color: mutedColor }}>
                    Signed on {new Date(documents.w9.signedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={signW9Document}
                disabled={!signatures.w9 || !(formData.taxIdType === 'ein' ? formData.ein : formData.ssn)}
                style={{ 
                  padding: '16px 40px', 
                  background: (signatures.w9 && (formData.taxIdType === 'ein' ? formData.ein : formData.ssn)) 
                    ? `linear-gradient(135deg, ${colors.green}, #28a745)` 
                    : '#ccc',
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  cursor: (signatures.w9 && (formData.taxIdType === 'ein' ? formData.ein : formData.ssn)) ? 'pointer' : 'not-allowed',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}
              >
                <CheckCircle size={20} /> Sign W-9 Document
              </button>
            )}
            
            {!signatures.w9 && (
              <p style={{ color: colors.coral, marginTop: '10px', fontSize: '0.9rem' }}>
                Please draw and save your signature above before signing
              </p>
            )}
          </div>
        )}

        {/* STEP 4: Insurance & COI */}
        {step === 4 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield color={colors.teal} /> Insurance & Certificate of Insurance
            </h2>
            
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,119,182,0.1)' : 'rgba(0,119,182,0.05)', borderRadius: '8px', border: `1px solid ${colors.oceanBlue}30` }}>
              <h4 style={{ marginBottom: '10px', color: colors.oceanBlue }}>Required Coverage Minimums</h4>
              <ul style={{ color: mutedColor, lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                <li>Workers' Compensation: $1,000,000 each accident</li>
                <li>Commercial General Liability: $2,000,000 aggregate</li>
                <li>Automobile Liability: $1,000,000 combined single limit</li>
                <li>Umbrella: $1M-$5M based on job size</li>
              </ul>
            </div>

            <div>
              <label style={labelStyle}>Insurance Carrier *</label>
              <input 
                placeholder="State Farm, Liberty Mutual, etc." 
                value={formData.insuranceCarrier} 
                onChange={(e) => updateField('insuranceCarrier', e.target.value)} 
                style={inputStyle} 
              />
            </div>
            
            <div>
              <label style={labelStyle}>Policy Number *</label>
              <input 
                placeholder="ABC-123456-789" 
                value={formData.policyNumber} 
                onChange={(e) => updateField('policyNumber', e.target.value)} 
                style={inputStyle} 
              />
            </div>
            
            <div>
              <label style={labelStyle}>Policy Expiration Date *</label>
              <input 
                type="date" 
                value={formData.insuranceExpiration} 
                onChange={(e) => updateField('insuranceExpiration', e.target.value)} 
                style={inputStyle} 
              />
            </div>
            
            <div style={{ border: `2px dashed ${borderColor}`, borderRadius: '12px', padding: '40px', textAlign: 'center', marginTop: '20px' }}>
              <Upload size={48} color={colors.teal} style={{ marginBottom: '15px' }} />
              <h3 style={{ marginBottom: '10px' }}>Upload Certificate of Insurance (COI)</h3>
              <p style={{ color: mutedColor, marginBottom: '20px' }}>
                PDF or image file (max 10MB). LYT Communications, LLC must be listed as Additional Insured.
              </p>
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={handleCoiUpload} 
                style={{ display: 'none' }} 
                id="coi-upload" 
              />
              <label 
                htmlFor="coi-upload" 
                style={{ 
                  padding: '12px 30px', 
                  background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, 
                  color: 'white', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'inline-block', 
                  fontWeight: '600' 
                }}
              >
                Select File
              </label>
            </div>
            
            {coiFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.green, padding: '15px', backgroundColor: 'rgba(46, 153, 75, 0.1)', borderRadius: '8px', marginTop: '20px' }}>
                <CheckCircle /> {coiFile.name} uploaded successfully
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Fleet & Personnel */}
        {step === 5 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Truck color={colors.teal} /> Fleet & Personnel
            </h2>
            
            <h3 style={{ marginBottom: '20px' }}>Equipment / Vehicles</h3>
            {formData.fleet.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '10px', marginBottom: '15px', alignItems: 'start' }}>
                <input 
                  placeholder="Type (Truck, Drill, etc.)" 
                  value={item.type} 
                  onChange={(e) => updateFleet(index, 'type', e.target.value)} 
                  style={{...inputStyle, marginBottom: 0}} 
                />
                <input 
                  placeholder="Make/Model" 
                  value={item.makeModel} 
                  onChange={(e) => updateFleet(index, 'makeModel', e.target.value)} 
                  style={{...inputStyle, marginBottom: 0}} 
                />
                <input 
                  placeholder="Year" 
                  value={item.year} 
                  onChange={(e) => updateFleet(index, 'year', e.target.value)} 
                  style={{...inputStyle, marginBottom: 0}} 
                />
                <input 
                  placeholder="VIN/ID" 
                  value={item.vin} 
                  onChange={(e) => updateFleet(index, 'vin', e.target.value)} 
                  style={{...inputStyle, marginBottom: 0}} 
                />
                {formData.fleet.length > 1 && (
                  <button 
                    onClick={() => removeFleetItem(index)}
                    style={{ padding: '14px', backgroundColor: 'rgba(232,90,79,0.2)', color: colors.coral, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={addFleetItem} 
              style={{ background: 'none', border: `1px dashed ${borderColor}`, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', color: colors.teal, marginBottom: '40px' }}
            >
              + Add Equipment
            </button>
            
            <h3 style={{ marginBottom: '20px' }}>Personnel</h3>
            {formData.personnel.map((person, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '10px', marginBottom: '15px', alignItems: 'start' }}>
                <input 
                  placeholder="Name" 
                  value={person.name} 
                  onChange={(e) => updatePersonnel(index, 'name', e.target.value)} 
                  style={{...inputStyle, marginBottom: 0}} 
                />
                <input 
                  placeholder="Role" 
                  value={person.role} 
                  onChange={(e) => updatePersonnel(index, 'role', e.target.value)} 
                  style={{...inputStyle, marginBottom: 0}} 
                />
                <input 
                  placeholder="Phone" 
                  value={person.phone} 
                  onChange={(e) => updatePersonnel(index, 'phone', e.target.value)} 
                  style={{...inputStyle, marginBottom: 0}} 
                />
                <input 
                  placeholder="Certifications" 
                  value={person.certifications} 
                  onChange={(e) => updatePersonnel(index, 'certifications', e.target.value)} 
                  style={{...inputStyle, marginBottom: 0}} 
                />
                {formData.personnel.length > 1 && (
                  <button 
                    onClick={() => removePersonnel(index)}
                    style={{ padding: '14px', backgroundColor: 'rgba(232,90,79,0.2)', color: colors.coral, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={addPersonnel} 
              style={{ background: 'none', border: `1px dashed ${borderColor}`, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', color: colors.teal }}
            >
              + Add Personnel
            </button>
          </div>
        )}

        {/* STEP 6: Skills */}
        {step === 6 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wrench color={colors.teal} /> Skills & Capabilities
            </h2>
            <p style={{ color: mutedColor, marginBottom: '30px' }}>
              Select all services your company can provide. This helps us match you with appropriate projects.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {[
                { key: 'hddDrilling', label: 'HDD Drilling', desc: 'Horizontal directional drilling' },
                { key: 'fiberSplicing', label: 'Fiber Splicing', desc: 'Fusion splicing and testing' },
                { key: 'aerialConstruction', label: 'Aerial Construction', desc: 'Pole attachments, strand work' },
                { key: 'undergroundUtilities', label: 'Underground Utilities', desc: 'Trenching, plowing, conduit' },
                { key: 'projectManagement', label: 'Project Management', desc: 'Coordination and oversight' },
                { key: 'locating', label: 'Utility Locating', desc: 'Underground utility detection' },
                { key: 'safetyTraining', label: 'Safety Training', desc: 'OSHA certified trainers' },
                { key: 'cdlDrivers', label: 'CDL Drivers', desc: 'Commercial driver capability' }
              ].map(skill => (
                <label 
                  key={skill.key}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px', 
                    padding: '20px', 
                    backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    border: `2px solid ${formData.skills[skill.key] ? colors.teal : 'transparent'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={formData.skills[skill.key]}
                    onChange={(e) => updateSkill(skill.key, e.target.checked)}
                    style={{ width: '20px', height: '20px', marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{skill.label}</div>
                    <div style={{ fontSize: '0.85rem', color: mutedColor }}>{skill.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: Rate Card */}
        {step === 7 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DollarSign color={colors.teal} /> Rate Card Acceptance
            </h2>
            <p style={{ color: mutedColor, marginBottom: '30px' }}>
              Review our current rate card. Rates are project-specific and may vary based on scope, location, and complexity.
            </p>
            
            <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '30px' }}>
              <iframe 
                src={RATE_CARD_URL} 
                style={{ width: '100%', height: '500px', border: 'none' }} 
                title="Rate Card" 
              />
            </div>
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px', 
              cursor: 'pointer',
              padding: '20px',
              backgroundColor: darkMode ? 'rgba(46,153,75,0.1)' : 'rgba(46,153,75,0.05)',
              borderRadius: '8px',
              border: `2px solid ${formData.rateCardAccepted ? colors.green : 'transparent'}`
            }}>
              <input 
                type="checkbox" 
                checked={formData.rateCardAccepted}
                onChange={(e) => updateField('rateCardAccepted', e.target.checked)}
                style={{ width: '24px', height: '24px', marginTop: '2px' }}
              />
              <span>
                <strong>I have reviewed and accept the current rate card terms.</strong>
                <br />
                <span style={{ color: mutedColor, fontSize: '0.9rem' }}>
                  I understand that specific rates for each project will be outlined in the Statement of Work (SOW).
                </span>
              </span>
            </label>
          </div>
        )}

        {/* STEP 8: Banking */}
        {step === 8 && (
          <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard color={colors.teal} /> Banking / Payment Information
            </h2>
            
            <div>
              <label style={labelStyle}>Bank Name *</label>
              <input 
                placeholder="Chase Bank" 
                value={formData.bankName} 
                onChange={(e) => updateField('bankName', e.target.value)} 
                style={inputStyle} 
              />
            </div>
            
            <div>
              <label style={labelStyle}>Routing Number (9 digits) *</label>
              <input 
                placeholder="111000025" 
                maxLength={9}
                value={formData.routingNumber} 
                onChange={(e) => updateField('routingNumber', e.target.value.replace(/\D/g, ''))} 
                style={{...inputStyle, fontFamily: 'monospace'}} 
              />
            </div>
            
            <div>
              <label style={labelStyle}>Account Number *</label>
              <input 
                placeholder="123456789012" 
                value={formData.accountNumber} 
                onChange={(e) => updateField('accountNumber', e.target.value.replace(/\D/g, ''))} 
                style={{...inputStyle, fontFamily: 'monospace'}} 
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Account Type</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="cAccountType" 
                    value="checking" 
                    checked={formData.accountType === 'checking'}
                    onChange={(e) => updateField('accountType', e.target.value)}
                  />
                  Checking
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="cAccountType" 
                    value="savings" 
                    checked={formData.accountType === 'savings'}
                    onChange={(e) => updateField('accountType', e.target.value)}
                  />
                  Savings
                </label>
              </div>
            </div>

            <div style={{ padding: '15px', backgroundColor: darkMode ? 'rgba(0,119,182,0.2)' : 'rgba(0,119,182,0.1)', borderRadius: '8px', marginTop: '20px' }}>
              <p style={{ fontSize: '0.9rem', color: mutedColor }}>
                <strong>Payment Terms:</strong> Payments are processed within 10 days of LYT receiving payment from the project owner, 
                less 5% retainage per the MSA terms.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          <button 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1}
            style={{ 
              padding: '14px 30px', 
              backgroundColor: step === 1 ? 'transparent' : cardBg, 
              color: step === 1 ? 'transparent' : textColor, 
              border: step === 1 ? 'none' : `1px solid ${borderColor}`, 
              borderRadius: '8px', 
              cursor: step === 1 ? 'default' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <ArrowLeft size={20} /> Previous
          </button>
          
          {step < totalSteps ? (
            <button 
              onClick={() => setStep(step + 1)} 
              disabled={!canProceed()}
              style={{ 
                padding: '14px 30px', 
                background: canProceed() ? `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})` : (darkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0'), 
                color: canProceed() ? 'white' : (darkMode ? '#666' : '#999'), 
                border: 'none', 
                borderRadius: '8px', 
                cursor: canProceed() ? 'pointer' : 'not-allowed', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontWeight: '600' 
              }}
            >
              Next <ArrowRight size={20} />
            </button>
          ) : (
            <button 
              onClick={submitOnboarding} 
              disabled={!canProceed() || submitting}
              style={{ 
                padding: '14px 40px', 
                background: canProceed() ? `linear-gradient(135deg, ${colors.green}, #28a745)` : (darkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0'), 
                color: canProceed() ? 'white' : (darkMode ? '#666' : '#999'), 
                border: 'none', 
                borderRadius: '8px', 
                cursor: canProceed() && !submitting ? 'pointer' : 'not-allowed', 
                fontWeight: '600' 
              }}
            >
              {submitting ? 'Submitting...' : 'Complete Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EMPLOYEE LOGIN
// ============================================================================
function EmployeeLogin({ onLogin, onBack, darkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const bgColor = darkMode ? colors.darkBg : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1a1a2e';
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa';
  const inputBg = darkMode ? 'rgba(255,255,255,0.08)' : 'white';
  const borderColor = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';

  const users = [
    { email: 'matt@lytcomm.com', password: 'demo123', name: 'Matt Roy', role: 'admin' },
    { email: 'john@lytcomm.com', password: 'demo123', name: 'John Smith', role: 'supervisor' },
    { email: 'sarah@lytcomm.com', password: 'demo123', name: 'Sarah Johnson', role: 'employee' }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.teal, cursor: 'pointer', marginBottom: '30px' }}>
          <ArrowLeft size={20} /> Back to Portal
        </button>
        
        <div style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ width: '60px', height: '60px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontWeight: 'bold', color: 'white', fontSize: '1.5rem' }}>
              LYT
            </div>
            <h2>Employee Login</h2>
          </div>
          
          {error && (
            <div style={{ backgroundColor: 'rgba(232, 90, 79, 0.2)', border: `1px solid ${colors.coral}`, padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: textColor, fontSize: '1rem', marginBottom: '15px' }} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: textColor, fontSize: '1rem', marginBottom: '25px' }} 
            />
            <button 
              type="submit" 
              style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Sign In
            </button>
          </form>
          
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#e9ecef', borderRadius: '8px', fontSize: '0.9rem' }}>
            <p style={{ fontWeight: '600', marginBottom: '10px' }}>Demo Accounts:</p>
            <p style={{ color: darkMode ? '#a0aec0' : '#666' }}>matt@lytcomm.com / demo123</p>
            <p style={{ color: darkMode ? '#a0aec0' : '#666' }}>john@lytcomm.com / demo123</p>
            <p style={{ color: darkMode ? '#a0aec0' : '#666' }}>sarah@lytcomm.com / demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EMPLOYEE DASHBOARD
// ============================================================================
function EmployeeDashboard({ user, onLogout, darkMode, setDarkMode }) {
  const [activeTab, setActiveTab] = useState('home');
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);

  const bgColor = darkMode ? colors.darkBg : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1a1a2e';
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa';
  const borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const mutedColor = darkMode ? '#a0aec0' : '#666';

  const handleClockIn = () => {
    if (clockedIn) {
      setClockedIn(false);
      setClockInTime(null);
    } else {
      setClockedIn(true);
      setClockInTime(new Date());
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const projects = [
    { id: 1, name: 'AT&T Fiber Expansion - Webster', status: 'In Progress', progress: 65 },
    { id: 2, name: 'Verizon Underground - League City', status: 'In Progress', progress: 30 },
    { id: 3, name: 'Comcast Aerial - Clear Lake', status: 'Scheduled', progress: 0 }
  ];

  const recentFiles = [
    { name: 'Safety Manual 2026', type: 'PDF', date: '2026-01-15' },
    { name: 'W-4 Form (Signed)', type: 'PDF', date: '2026-01-10' },
    { name: 'Equipment Checklist', type: 'PDF', date: '2026-01-08' }
  ];

  const teamMembers = [
    { name: 'Matt Roy', role: 'Owner', status: 'online' },
    { name: 'John Smith', role: 'Supervisor', status: 'online' },
    { name: 'Sarah Johnson', role: 'Technician', status: 'away' },
    { name: 'Mike Davis', role: 'Technician', status: 'offline' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor }}>
      {/* Top Nav */}
      <nav style={{ 
        backgroundColor: darkMode ? 'rgba(10, 22, 40, 0.95)' : 'rgba(255,255,255,0.95)', 
        borderBottom: `1px solid ${borderColor}`,
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
            LYT
          </div>
          <span style={{ fontWeight: '600' }}>Employee Portal</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor }}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: `linear-gradient(135deg, ${colors.green}, #28a745)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600' }}>
              {user.name.charAt(0)}
            </div>
            <span>{user.name}</span>
          </div>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: colors.coral, cursor: 'pointer' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside style={{ 
          width: '240px', 
          minHeight: 'calc(100vh - 70px)', 
          backgroundColor: cardBg, 
          borderRight: `1px solid ${borderColor}`,
          padding: '20px'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              { id: 'home', icon: <Home size={20} />, label: 'Dashboard' },
              { id: 'time', icon: <Clock size={20} />, label: 'Time Clock' },
              { id: 'projects', icon: <Briefcase size={20} />, label: 'Projects' },
              { id: 'files', icon: <FolderOpen size={20} />, label: 'Files' },
              { id: 'team', icon: <Users size={20} />, label: 'Team' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 15px',
                  backgroundColor: activeTab === item.id ? (darkMode ? 'rgba(0,180,216,0.2)' : 'rgba(0,119,182,0.1)') : 'transparent',
                  color: activeTab === item.id ? colors.teal : textColor,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  fontWeight: activeTab === item.id ? '600' : '400'
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '30px' }}>
          {activeTab === 'home' && (
            <>
              <h1 style={{ marginBottom: '10px' }}>Welcome back, {user.name.split(' ')[0]}!</h1>
              <p style={{ color: mutedColor, marginBottom: '30px' }}>Here's what's happening today.</p>
              
              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '25px', backgroundColor: cardBg, borderRadius: '12px', borderLeft: `4px solid ${colors.oceanBlue}` }}>
                  <div style={{ color: mutedColor, marginBottom: '8px' }}>Active Projects</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>3</div>
                </div>
                <div style={{ padding: '25px', backgroundColor: cardBg, borderRadius: '12px', borderLeft: `4px solid ${colors.green}` }}>
                  <div style={{ color: mutedColor, marginBottom: '8px' }}>Hours This Week</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>32.5</div>
                </div>
                <div style={{ padding: '25px', backgroundColor: cardBg, borderRadius: '12px', borderLeft: `4px solid ${colors.teal}` }}>
                  <div style={{ color: mutedColor, marginBottom: '8px' }}>Tasks Completed</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>12</div>
                </div>
              </div>

              {/* Time Clock Card */}
              <div style={{ padding: '30px', backgroundColor: cardBg, borderRadius: '12px', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock color={colors.teal} /> Time Clock
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                  <button
                    onClick={handleClockIn}
                    style={{
                      padding: '16px 40px',
                      background: clockedIn 
                        ? `linear-gradient(135deg, ${colors.coral}, #c0392b)` 
                        : `linear-gradient(135deg, ${colors.green}, #28a745)`,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {clockedIn ? 'Clock Out' : 'Clock In'}
                  </button>
                  {clockedIn && clockInTime && (
                    <div>
                      <div style={{ color: mutedColor, fontSize: '0.9rem' }}>Clocked in at</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '600', color: colors.green }}>{formatTime(clockInTime)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Projects */}
              <div style={{ padding: '30px', backgroundColor: cardBg, borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Briefcase color={colors.teal} /> Active Projects
                </h3>
                {projects.map(project => (
                  <div key={project.id} style={{ padding: '15px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '500' }}>{project.name}</span>
                      <span style={{ 
                        padding: '4px 12px', 
                        backgroundColor: project.status === 'In Progress' ? 'rgba(46,153,75,0.2)' : 'rgba(0,180,216,0.2)',
                        color: project.status === 'In Progress' ? colors.green : colors.teal,
                        borderRadius: '20px',
                        fontSize: '0.85rem'
                      }}>
                        {project.status}
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${project.progress}%`, height: '100%', backgroundColor: colors.green, borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'time' && (
            <>
              <h1 style={{ marginBottom: '30px' }}>Time Clock</h1>
              
              <div style={{ padding: '40px', backgroundColor: cardBg, borderRadius: '12px', textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '20px' }}>
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div style={{ color: mutedColor, marginBottom: '30px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <button
                  onClick={handleClockIn}
                  style={{
                    padding: '20px 60px',
                    background: clockedIn 
                      ? `linear-gradient(135deg, ${colors.coral}, #c0392b)` 
                      : `linear-gradient(135deg, ${colors.green}, #28a745)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {clockedIn ? 'Clock Out' : 'Clock In'}
                </button>
                {clockedIn && clockInTime && (
                  <div style={{ marginTop: '20px', color: colors.green }}>
                    Currently clocked in since {formatTime(clockInTime)}
                  </div>
                )}
              </div>

              <div style={{ padding: '30px', backgroundColor: cardBg, borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '20px' }}>This Week's Timesheet</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: mutedColor }}>Day</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: mutedColor }}>Clock In</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: mutedColor }}>Clock Out</th>
                      <th style={{ textAlign: 'right', padding: '12px 0', color: mutedColor }}>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, i) => (
                      <tr key={day} style={{ borderBottom: `1px solid ${borderColor}` }}>
                        <td style={{ padding: '12px 0' }}>{day}</td>
                        <td style={{ padding: '12px 0' }}>{i < 3 ? '7:00 AM' : '-'}</td>
                        <td style={{ padding: '12px 0' }}>{i < 3 ? '3:30 PM' : '-'}</td>
                        <td style={{ padding: '12px 0', textAlign: 'right' }}>{i < 3 ? '8.5' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ padding: '12px 0', fontWeight: '600' }}>Total</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '600', color: colors.green }}>25.5 hours</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {activeTab === 'projects' && (
            <>
              <h1 style={{ marginBottom: '30px' }}>Projects</h1>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                {projects.map(project => (
                  <div key={project.id} style={{ padding: '30px', backgroundColor: cardBg, borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ marginBottom: '8px' }}>{project.name}</h3>
                        <span style={{ 
                          padding: '4px 12px', 
                          backgroundColor: project.status === 'In Progress' ? 'rgba(46,153,75,0.2)' : 'rgba(0,180,216,0.2)',
                          color: project.status === 'In Progress' ? colors.green : colors.teal,
                          borderRadius: '20px',
                          fontSize: '0.85rem'
                        }}>
                          {project.status}
                        </span>
                      </div>
                      <span style={{ fontSize: '2rem', fontWeight: '700', color: colors.oceanBlue }}>{project.progress}%</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${project.progress}%`, height: '100%', backgroundColor: colors.green, borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'files' && (
            <>
              <h1 style={{ marginBottom: '30px' }}>Files</h1>
              
              <div style={{ padding: '30px', backgroundColor: cardBg, borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '20px' }}>Recent Documents</h3>
                {recentFiles.map((file, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '15px',
                    backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <FileText color={colors.coral} size={24} />
                      <div>
                        <div style={{ fontWeight: '500' }}>{file.name}</div>
                        <div style={{ fontSize: '0.85rem', color: mutedColor }}>{file.type} • {file.date}</div>
                      </div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: colors.teal, cursor: 'pointer' }}>
                      <Download size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'team' && (
            <>
              <h1 style={{ marginBottom: '30px' }}>Team Directory</h1>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {teamMembers.map((member, i) => (
                  <div key={i} style={{ padding: '25px', backgroundColor: cardBg, borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        background: `linear-gradient(135deg, ${colors.oceanBlue}, ${colors.teal})`, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white', 
                        fontWeight: '600',
                        fontSize: '1.2rem'
                      }}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{member.name}</div>
                        <div style={{ fontSize: '0.9rem', color: mutedColor }}>{member.role}</div>
                      </div>
                    </div>
                    <div style={{ 
                      marginTop: '15px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: member.status === 'online' ? colors.green : member.status === 'away' ? '#f1c40f' : mutedColor 
                      }} />
                      <span style={{ color: mutedColor, textTransform: 'capitalize' }}>{member.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
