import React from 'react';
import { ChevronRight, Shield, Award, Users, Zap, LogIn, UserPlus, CheckCircle, MapPin, Clock, Briefcase } from 'lucide-react';
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
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `linear-gradient(rgba(10, 22, 40, 0.85), rgba(10, 22, 40, 0.9)), url(${images.hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', width: '100%' }}>
          <div style={{ maxWidth: '700px' }}>
            <div style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: `${colors.teal}20`, borderRadius: '20px', marginBottom: '20px' }}>
              <span style={{ color: colors.teal, fontSize: '0.9rem', fontWeight: '500' }}>🚀 Now Hiring Experienced Fiber Technicians</span>
            </div>
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

      {/* Team Portal Access Section */}
      <section style={{ padding: '80px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', textAlign: 'center', marginBottom: '16px' }}>
            Team <span style={{ color: colors.teal }}>Portal</span>
          </h2>
          <p style={{ textAlign: 'center', color: colors.gray, marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
            Access your dashboard, submit daily reports, and manage your work all in one place.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {/* Employee/Contractor Login */}
            <div style={{
              padding: '40px',
              backgroundColor: darkMode ? colors.dark : '#fff',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: `2px solid ${colors.teal}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: `${colors.teal}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogIn size={28} color={colors.teal} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Team Login</h3>
                  <p style={{ color: colors.gray, fontSize: '0.9rem' }}>Employees & Contractors</p>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                {['Daily production logs', 'Time tracking', 'Equipment inspections', 'Safety briefings', 'OTDR test uploads'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', color: colors.gray }}>
                    <CheckCircle size={18} color={colors.green} /> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setCurrentPage('portal-login')}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  backgroundColor: colors.teal,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <LogIn size={20} /> Sign In to Portal
              </button>
            </div>

            {/* New Employee/Contractor Onboarding */}
            <div style={{
              padding: '40px',
              backgroundColor: darkMode ? colors.dark : '#fff',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: `2px solid ${colors.coral}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: `${colors.coral}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={28} color={colors.coral} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>New Hire Onboarding</h3>
                  <p style={{ color: colors.gray, fontSize: '0.9rem' }}>Join the LYT team</p>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                {['Complete tax forms (W-4/W-9)', 'Submit certifications', 'Direct deposit setup', 'Safety acknowledgment', 'COI upload (contractors)'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', color: colors.gray }}>
                    <CheckCircle size={18} color={colors.green} /> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setCurrentPage('onboarding')}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  backgroundColor: colors.coral,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <UserPlus size={20} /> Start Onboarding
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
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
                  backgroundColor: cardBg,
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
      <section style={{ padding: '80px 20px', backgroundColor: cardBg }}>
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
                  backgroundColor: darkMode ? colors.dark : '#fff',
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

      {/* Service Areas */}
      <section style={{ padding: '60px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            <MapPin size={24} color={colors.teal} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Serving the Greater Houston Area</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
            {['Houston', 'Webster', 'League City', 'Pearland', 'Sugar Land', 'Katy', 'The Woodlands', 'Galveston', 'Pasadena', 'Baytown'].map((city, i) => (
              <span key={i} style={{ padding: '8px 16px', backgroundColor: cardBg, borderRadius: '20px', fontSize: '0.9rem', color: colors.gray }}>
                {city}
              </span>
            ))}
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
