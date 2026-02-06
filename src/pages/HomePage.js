import React from 'react';
import { ChevronRight, Shield, Award, Users, Zap, LogIn, UserPlus, MapPin, Construction, Unplug, Radio } from 'lucide-react';

const HomePage = ({ setCurrentPage, darkMode }) => {
  const bgColor = darkMode ? '#0d1b2a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#0d1b2a';
  const cardBg = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBgAlt = darkMode ? '#112240' : '#ffffff';

  // Logo - PNG with transparent background
  const logoSrc = darkMode ? '/lyt_logo_dark.png' : '/lyt_logo_light.png';

  // Dynamic accent colors to match logos
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
  const accentTertiary = darkMode ? '#e85a4f' : '#28a745';
  const gradientColors = darkMode
    ? 'linear-gradient(135deg, #667eea 0%, #c850c0 50%, #ff6b35 100%)'
    : 'linear-gradient(135deg, #0077B6 0%, #00b4d8 50%, #28a745 100%)';

  // Service icons - matched to services with dynamic colors
  const serviceIcons = [
    { icon: Construction, title: 'HDD Drilling', desc: 'Horizontal Directional Drilling for underground fiber installation with minimal surface disruption.', color: accentPrimary },
    { icon: Unplug, title: 'Fiber Splicing', desc: 'Precision fusion splicing and OTDR testing for optimal network performance.', color: accentSecondary },
    { icon: Radio, title: 'Aerial Construction', desc: 'Pole-to-pole fiber installation, strand mapping, and aerial network builds.', color: accentTertiary },
  ];

  return (
    <div style={{ backgroundColor: bgColor, color: textColor }}>

      {/* Hero Section - Logo Centered */}
      <section
        style={{
          position: 'relative',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: bgColor,
        }}
      >
        {/* Animated Background - Fiber Optic Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {/* Gradient Orbs */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '400px',
            height: '400px',
            background: darkMode
              ? 'radial-gradient(circle, rgba(0,180,216,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0,119,182,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'pulse 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: '500px',
            height: '500px',
            background: darkMode
              ? 'radial-gradient(circle, rgba(232,90,79,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(57,181,74,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'pulse 10s ease-in-out infinite reverse',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            background: darkMode
              ? 'radial-gradient(circle, rgba(0,119,182,0.08) 0%, transparent 60%)'
              : 'radial-gradient(circle, rgba(0,180,216,0.08) 0%, transparent 60%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }} />

          {/* Grid Pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: darkMode
              ? `linear-gradient(rgba(0,180,216,0.03) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(0,180,216,0.03) 1px, transparent 1px)`
              : `linear-gradient(rgba(0,119,182,0.03) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(0,119,182,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />
        </div>

        {/* Hero Content */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '40px 20px',
          maxWidth: '900px',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '40px' }}>
            <img
              src={logoSrc}
              alt="LYT Communications"
              style={{
                maxWidth: '550px',
                width: '100%',
                height: 'auto',
                filter: darkMode ? 'drop-shadow(0 0 30px rgba(200,80,192,0.3))' : 'drop-shadow(0 0 30px rgba(0,119,182,0.2))',
              }}
            />
          </div>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setCurrentPage('contact')}
              style={{
                padding: '16px 40px',
                fontSize: '1.1rem',
                fontWeight: '600',
                background: gradientColors,
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 20px rgba(0,119,182,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,119,182,0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,119,182,0.3)';
              }}
            >
              Get a Quote <ChevronRight size={20} />
            </button>
            <button
              onClick={() => setCurrentPage('services')}
              style={{
                padding: '16px 40px',
                fontSize: '1.1rem',
                fontWeight: '600',
                background: 'transparent',
                color: textColor,
                border: `2px solid ${accentPrimary}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = accentPrimary;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = textColor;
              }}
            >
              Our Services
            </button>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section style={{
        padding: '100px 20px',
        backgroundColor: cardBgAlt,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: '700',
              marginBottom: '20px',
            }}>
              Expert <span style={{ color: accentPrimary }}>Fiber Optic</span> Solutions
            </h2>
            <p style={{ fontSize: '1.2rem', color: darkMode ? '#94a3b8' : '#64748b', maxWidth: '600px', margin: '0 auto' }}>
              From underground construction to aerial builds, we deliver complete fiber infrastructure.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
          }}>
            {serviceIcons.map((service, index) => (
              <div
                key={index}
                style={{
                  padding: '40px 30px',
                  backgroundColor: cardBg,
                  borderRadius: '16px',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 20px 40px ${darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => setCurrentPage('services')}
              >
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${service.color}20, ${service.color}40)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '25px',
                }}>
                  <service.icon size={32} style={{ color: service.color }} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '15px' }}>
                  {service.title}
                </h3>
                <p style={{ color: darkMode ? '#94a3b8' : '#64748b', lineHeight: '1.7' }}>
                  {service.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <button
              onClick={() => setCurrentPage('services')}
              style={{
                padding: '14px 36px',
                fontSize: '1rem',
                fontWeight: '600',
                background: 'transparent',
                color: accentPrimary,
                border: `2px solid ${accentPrimary}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = accentPrimary;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = accentPrimary;
              }}
            >
              View All Services
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: '80px 20px',
        background: gradientColors,
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          textAlign: 'center',
        }}>
          {[
            { value: '500+', label: 'Miles of Fiber Installed' },
            { value: '15+', label: 'Years Experience' },
            { value: '100%', label: 'Safety Record' },
            { value: '24/7', label: 'Emergency Response' },
          ].map((stat, index) => (
            <div key={index}>
              <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '700', color: '#fff' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '100px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '700', marginBottom: '20px' }}>
              Why Choose <span style={{ color: accentPrimary }}>LYT</span>?
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
          }}>
            {[
              { icon: Shield, title: 'Safety First', desc: 'OSHA compliant with zero-incident track record.' },
              { icon: Award, title: 'Certified Team', desc: 'Factory-trained technicians with industry certifications.' },
              { icon: Users, title: 'Local Experts', desc: 'Gulf Coast based, serving TX, LA, MS, FL, and AL.' },
              { icon: Zap, title: 'Fast Turnaround', desc: 'Efficient project delivery without compromising quality.' },
            ].map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px',
                padding: '25px',
                backgroundColor: cardBgAlt,
                borderRadius: '12px',
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: `${accentPrimary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <item.icon size={24} style={{ color: accentPrimary }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>{item.title}</h4>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Portal CTA */}
      <section style={{
        padding: '80px 20px',
        backgroundColor: cardBgAlt,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: '700', marginBottom: '20px' }}>
            Team Member?
          </h2>
          <p style={{ fontSize: '1.1rem', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '30px' }}>
            Access your dashboard or start your onboarding process.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentPage('portal-login')}
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                fontWeight: '600',
                backgroundColor: accentPrimary,
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <LogIn size={18} /> Team Login
            </button>
            <button
              onClick={() => setCurrentPage('onboarding')}
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                fontWeight: '600',
                backgroundColor: 'transparent',
                color: accentSecondary,
                border: `2px solid ${accentSecondary}`,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = accentSecondary;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = accentSecondary;
              }}
            >
              <UserPlus size={18} /> New Onboarding
            </button>
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section style={{ padding: '80px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <MapPin size={40} style={{ color: accentPrimary, marginBottom: '20px' }} />
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: '700', marginBottom: '20px' }}>
            Serving the Gulf Coast
          </h2>
          <p style={{ fontSize: '1.1rem', color: darkMode ? '#94a3b8' : '#64748b', lineHeight: '1.8' }}>
            Texas • Louisiana • Mississippi • Florida • Alabama
          </p>
          <p style={{ fontSize: '1rem', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '15px' }}>
            Houston • Dallas • New Orleans • Baton Rouge • Mobile • Pensacola
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section
        style={{
          padding: '100px 20px',
          background: gradientColors,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>
            Ready to Start Your Project?
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', marginBottom: '40px' }}>
            Contact us today for a free consultation and quote.
          </p>
          <button
            onClick={() => setCurrentPage('contact')}
            style={{
              padding: '18px 48px',
              fontSize: '1.1rem',
              fontWeight: '600',
              background: '#fff',
              color: darkMode ? '#c850c0' : '#0077B6',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 25px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Contact Us Now
          </button>
        </div>
      </section>

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
