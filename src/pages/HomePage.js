import React from 'react';
import { ChevronRight, Shield, Award, Users, Zap, LogIn, UserPlus, CheckCircle, MapPin, Construction, Unplug, Radio } from 'lucide-react';
import { colors } from '../config/constants';

const HomePage = ({ setCurrentPage, darkMode }) => {
  const bgColor = darkMode ? '#0d1b2a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#0d1b2a';
  const cardBg = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBgAlt = darkMode ? '#112240' : '#ffffff';
  
  // Logo paths - dark mode gets the pink/orange version, light mode gets blue/green
  const logoSrc = darkMode ? '/lyt_logo_dark.jpg' : '/lyt_logo_light.jpg';

  // Service icons - matched to services
  const serviceIcons = [
    { icon: Construction, title: 'HDD Drilling', desc: 'Horizontal Directional Drilling for underground fiber installation with minimal surface disruption.', color: colors.blue },
    { icon: Unplug, title: 'Fiber Splicing', desc: 'Precision fusion splicing and OTDR testing for optimal network performance.', color: colors.teal },
    { icon: Radio, title: 'Aerial Construction', desc: 'Pole-to-pole fiber installation, strand mapping, and aerial network builds.', color: colors.green },
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
              : `linear-gradient(rgba(0,119,182,0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(0,119,182,0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
        </div>

        {/* Hero Content */}
        <div style={{ 
          position: 'relative', 
          zIndex: 1, 
          textAlign: 'center', 
          padding: '0 20px',
          maxWidth: '900px',
        }}>
          {/* Logo */}
          <div style={{ 
            marginBottom: '30px',
            display: 'flex',
            justifyContent: 'center',
          }}>
            {darkMode ? (
              <img 
                src={logoSrc} 
                alt="LYT Communications" 
                style={{ 
                  maxWidth: '450px', 
                  width: '100%',
                  height: 'auto',
                }} 
              />
            ) : (
              /* Text logo for light mode - avoids checker pattern issue */
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 'clamp(3rem, 8vw, 5rem)', 
                  fontWeight: '800', 
                  letterSpacing: '-0.02em',
                  lineHeight: '1',
                }}>
                  <span style={{ 
                    background: `linear-gradient(135deg, ${colors.teal} 0%, ${colors.blue} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>lyt</span>
                  <span style={{ color: '#1e293b' }}> Communications</span>
                </div>
                <div style={{ 
                  fontSize: 'clamp(0.8rem, 2vw, 1rem)', 
                  color: '#64748b',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  marginTop: '8px',
                  fontWeight: '500',
                }}>
                  Building Digital Futures
                </div>
              </div>
            )}
          </div>

          {/* Tagline */}
          <p style={{ 
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', 
            color: darkMode ? '#94a3b8' : '#64748b', 
            marginBottom: '40px', 
            lineHeight: '1.7',
            maxWidth: '650px',
            margin: '0 auto 40px',
          }}>
            Expert fiber optic construction across the Gulf Coast.
            From Texas to Florida, we connect communities with precision and safety.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentPage('contact')}
              style={{
                padding: '16px 36px',
                fontSize: '1.1rem',
                fontWeight: '600',
                background: `linear-gradient(135deg, ${colors.teal} 0%, ${colors.blue} 100%)`,
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 20px rgba(0,180,216,0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,180,216,0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,180,216,0.3)';
              }}
            >
              Get a Quote <ChevronRight size={20} />
            </button>
            <button
              onClick={() => setCurrentPage('services')}
              style={{
                padding: '16px 36px',
                fontSize: '1.1rem',
                fontWeight: '600',
                backgroundColor: 'transparent',
                color: textColor,
                border: `2px solid ${darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = colors.teal;
                e.currentTarget.style.color = colors.teal;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
                e.currentTarget.style.color = textColor;
              }}
            >
              Our Services
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
          fontSize: '0.8rem',
        }}>
          <span>Scroll</span>
          <div style={{
            width: '2px',
            height: '30px',
            background: `linear-gradient(to bottom, ${colors.teal}, transparent)`,
            animation: 'scrollPulse 2s ease-in-out infinite',
          }} />
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ 
        background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.darkBlue} 100%)`,
        padding: '50px 20px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', textAlign: 'center' }}>
          {[
            { value: '15+', label: 'Years Experience' },
            { value: '500+', label: 'Projects Completed' },
            { value: '1M+', label: 'Fiber Miles Installed' },
            { value: '100%', label: 'Safety Focused' },
          ].map((stat, idx) => (
            <div key={idx}>
              <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Portal Access Section */}
      <section style={{ padding: '100px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: '700', textAlign: 'center', marginBottom: '16px' }}>
            Team <span style={{ color: colors.teal }}>Portal</span>
          </h2>
          <p style={{ textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '60px', maxWidth: '600px', margin: '0 auto 60px' }}>
            Access your dashboard, submit daily reports, and manage your work all in one place.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px' }}>
            {/* Employee/Contractor Login */}
            <div style={{
              padding: '40px',
              backgroundColor: cardBgAlt,
              borderRadius: '20px',
              boxShadow: darkMode ? '0 4px 30px rgba(0,0,0,0.3)' : '0 4px 30px rgba(0,0,0,0.08)',
              border: `2px solid ${colors.teal}`,
              transition: 'transform 0.3s, box-shadow 0.3s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = darkMode ? '0 8px 40px rgba(0,180,216,0.2)' : '0 8px 40px rgba(0,180,216,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = darkMode ? '0 4px 30px rgba(0,0,0,0.3)' : '0 4px 30px rgba(0,0,0,0.08)';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '16px', 
                  background: `linear-gradient(135deg, ${colors.teal}30, ${colors.blue}20)`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <LogIn size={28} color={colors.teal} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Team Login</h3>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.9rem' }}>Employees & Contractors</p>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0' }}>
                {['Daily production logs', 'Time tracking', 'Equipment inspections', 'Safety briefings', 'OTDR test uploads'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', color: darkMode ? '#94a3b8' : '#64748b' }}>
                    <CheckCircle size={18} color={colors.green} /> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setCurrentPage('portal-login')}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  background: `linear-gradient(135deg, ${colors.teal} 0%, ${colors.blue} 100%)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <LogIn size={20} /> Sign In
              </button>
            </div>

            {/* Onboarding Card */}
            <div style={{
              padding: '40px',
              backgroundColor: cardBgAlt,
              borderRadius: '20px',
              boxShadow: darkMode ? '0 4px 30px rgba(0,0,0,0.3)' : '0 4px 30px rgba(0,0,0,0.08)',
              border: `2px solid ${colors.coral}`,
              transition: 'transform 0.3s, box-shadow 0.3s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = darkMode ? '0 8px 40px rgba(232,90,79,0.2)' : '0 8px 40px rgba(232,90,79,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = darkMode ? '0 4px 30px rgba(0,0,0,0.3)' : '0 4px 30px rgba(0,0,0,0.08)';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '16px', 
                  background: `linear-gradient(135deg, ${colors.coral}30, ${colors.orange}20)`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <UserPlus size={28} color={colors.coral} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>New Hire Onboarding</h3>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.9rem' }}>Join the LYT team</p>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0' }}>
                {['Complete tax forms (W-4/W-9)', 'Submit certifications', 'Direct deposit setup', 'Safety acknowledgment', 'COI upload (contractors)'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', color: darkMode ? '#94a3b8' : '#64748b' }}>
                    <CheckCircle size={18} color={colors.green} /> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setCurrentPage('onboarding')}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  background: `linear-gradient(135deg, ${colors.coral} 0%, ${colors.orange} 100%)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <UserPlus size={20} /> Start Onboarding
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '100px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: '700', textAlign: 'center', marginBottom: '16px' }}>
            Why Choose <span style={{ color: colors.teal }}>LYT</span>
          </h2>
          <p style={{ textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '60px', maxWidth: '600px', margin: '0 auto 60px' }}>
            We combine industry expertise with a commitment to safety and quality that sets us apart.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {[
              { icon: Shield, title: 'Safety First', desc: 'Zero-incident culture with comprehensive HSE programs and daily safety briefings.', color: colors.green },
              { icon: Award, title: 'Certified Experts', desc: 'Fully licensed and insured crews with manufacturer certifications.', color: colors.teal },
              { icon: Users, title: 'Experienced Team', desc: 'Skilled technicians with decades of combined field experience.', color: colors.blue },
              { icon: Zap, title: 'Fast Turnaround', desc: 'Efficient project execution without compromising quality.', color: colors.coral },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '36px',
                  backgroundColor: cardBgAlt,
                  borderRadius: '16px',
                  boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
                  textAlign: 'center',
                  transition: 'transform 0.3s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '20px',
                    background: `linear-gradient(135deg, ${item.color}25, ${item.color}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <item.icon size={32} color={item.color} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '12px' }}>{item.title}</h3>
                <p style={{ color: darkMode ? '#94a3b8' : '#64748b', lineHeight: '1.7' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview - Icon Based, No Photos */}
      <section style={{ padding: '100px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: '700', textAlign: 'center', marginBottom: '60px' }}>
            Our <span style={{ color: colors.teal }}>Services</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
            {serviceIcons.map((service, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  backgroundColor: cardBgAlt,
                  boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.3s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Icon Header Instead of Image */}
                <div style={{
                  height: '180px',
                  background: `linear-gradient(135deg, ${service.color}20 0%, ${service.color}05 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Background Pattern */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `radial-gradient(${service.color}15 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                  }} />
                  <service.icon size={64} color={service.color} style={{ position: 'relative', zIndex: 1 }} />
                </div>
                <div style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '12px' }}>{service.title}</h3>
                  <p style={{ color: darkMode ? '#94a3b8' : '#64748b', lineHeight: '1.7' }}>{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <button
              onClick={() => setCurrentPage('services')}
              style={{
                padding: '16px 32px',
                fontSize: '1rem',
                fontWeight: '600',
                background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.darkBlue} 100%)`,
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(0,119,182,0.3)',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              View All Services <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <MapPin size={28} color={colors.teal} />
            <h3 style={{ fontSize: '1.6rem', fontWeight: '600' }}>Serving the Gulf Coast</h3>
          </div>
          <p style={{ textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '30px' }}>
            Professional fiber construction across five states
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
            {[
              { state: 'Texas', cities: 'Houston • Webster • Galveston' },
              { state: 'Louisiana', cities: 'New Orleans • Baton Rouge • Lafayette' },
              { state: 'Mississippi', cities: 'Gulfport • Biloxi • Jackson' },
              { state: 'Alabama', cities: 'Mobile • Gulf Shores' },
              { state: 'Florida', cities: 'Pensacola • Panama City' },
            ].map((region, i) => (
              <div 
                key={i} 
                style={{ 
                  padding: '16px 24px', 
                  backgroundColor: cardBgAlt, 
                  borderRadius: '12px', 
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  textAlign: 'center',
                  minWidth: '180px',
                }}
              >
                <div style={{ fontWeight: '600', color: colors.teal, marginBottom: '4px' }}>{region.state}</div>
                <div style={{ fontSize: '0.85rem', color: darkMode ? '#64748b' : '#94a3b8' }}>{region.cities}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: '100px 20px',
          background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.darkBlue} 100%)`,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(0,180,216,0.1) 1px, transparent 1px)`,
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
              background: `linear-gradient(135deg, ${colors.coral} 0%, ${colors.orange} 100%)`,
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 25px rgba(232,90,79,0.4)',
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
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
