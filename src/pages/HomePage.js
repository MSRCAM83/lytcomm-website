import React from 'react';
import { ChevronRight, Shield, Award, Users, Zap } from 'lucide-react';
import { colors, images, LYT_INFO, services } from '../config/constants';

const HomePage = ({ setCurrentPage, darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;
  const cardBg = darkMode ? colors.darkLight : '#f8fafc';

  return (
    <div style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `linear-gradient(rgba(10, 22, 40, 0.85), rgba(10, 22, 40, 0.9)), url(${images.hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ maxWidth: '700px' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '700', marginBottom: '24px', color: '#fff', lineHeight: '1.1' }}>
              Building the <span style={{ color: colors.teal }}>Fiber Network</span> of Tomorrow
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '32px', lineHeight: '1.6' }}>
              LYT Communications delivers expert fiber optic construction services across the Greater Houston area. 
              From HDD drilling to aerial builds, we connect communities with precision and safety.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentPage('contact')}
                style={{
                  padding: '16px 32px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  backgroundColor: colors.teal,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 180, 216, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Get a Quote <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setCurrentPage('services')}
                style={{
                  padding: '16px 32px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '2px solid #fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Our Services
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ backgroundColor: colors.blue, padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', textAlign: 'center' }}>
          {[
            { value: '15+', label: 'Years Experience' },
            { value: '500+', label: 'Projects Completed' },
            { value: '1M+', label: 'Fiber Miles Installed' },
            { value: '100%', label: 'Safety Focused' },
          ].map((stat, idx) => (
            <div key={idx}>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#fff' }}>{stat.value}</div>
              <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '80px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', textAlign: 'center', marginBottom: '16px' }}>
            Why Choose <span style={{ color: colors.teal }}>LYT</span>
          </h2>
          <p style={{ textAlign: 'center', color: colors.gray, marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
            We combine industry expertise with a commitment to safety and quality that sets us apart.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            {[
              { icon: Shield, title: 'Safety First', desc: 'Zero-incident culture with comprehensive HSE programs and daily safety briefings.' },
              { icon: Award, title: 'Certified Experts', desc: 'Fully licensed and insured crews with manufacturer certifications.' },
              { icon: Users, title: 'Experienced Team', desc: 'Skilled technicians with decades of combined field experience.' },
              { icon: Zap, title: 'Fast Turnaround', desc: 'Efficient project execution without compromising quality.' },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '32px',
                  backgroundColor: darkMode ? colors.dark : '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.teal}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <item.icon size={28} color={colors.teal} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: colors.gray, lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', textAlign: 'center', marginBottom: '48px' }}>
            Our <span style={{ color: colors.teal }}>Services</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {services.slice(0, 3).map((service) => (
              <div
                key={service.id}
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: cardBg,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                <img
                  src={service.image}
                  alt={service.title}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>{service.title}</h3>
                  <p style={{ color: colors.gray, lineHeight: '1.6' }}>{service.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button
              onClick={() => setCurrentPage('services')}
              style={{
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: '600',
                backgroundColor: colors.blue,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              View All Services <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: '80px 20px',
          backgroundColor: colors.dark,
          backgroundImage: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.darkBlue} 100%)`,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
            Ready to Start Your Project?
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>
            Contact us today for a free consultation and quote.
          </p>
          <button
            onClick={() => setCurrentPage('contact')}
            style={{
              padding: '16px 40px',
              fontSize: '1.1rem',
              fontWeight: '600',
              backgroundColor: colors.coral,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Contact Us Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
