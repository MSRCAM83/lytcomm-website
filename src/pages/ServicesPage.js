import React from 'react';
import { CheckCircle, ChevronRight, HardDrive, Radio, Antenna, Wrench, Activity, ClipboardList, Truck, Settings } from 'lucide-react';
import { colors } from '../config/constants';

const ServicesPage = ({ setCurrentPage, darkMode }) => {
  const bgColor = darkMode ? '#0d1b2a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? '#94a3b8' : '#64748b';
  const cardBg = darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const services = [
    {
      icon: HardDrive,
      title: 'HDD Drilling',
      color: colors.blue,
      description: 'Horizontal Directional Drilling for underground installations with minimal surface disruption.',
      details: [
        'Rock boring and crossing installations',
        'Utility locating and mapping',
        'Conduit installation up to 6" diameter',
        'Shot lengths up to 1,000+ feet',
      ],
    },
    {
      icon: Radio,
      title: 'Fiber Splicing',
      color: colors.teal,
      description: 'Precision fusion splicing with industry-leading loss specifications and certification.',
      details: [
        'Fusion splicing with <0.02dB loss',
        'OTDR testing and certification',
        'Ribbon and loose tube fiber',
        'Emergency repair services',
      ],
    },
    {
      icon: Antenna,
      title: 'Aerial Construction',
      color: colors.coral,
      description: 'Pole-to-pole fiber installation with comprehensive make-ready support.',
      details: [
        'Strand and lashing installation',
        'Self-supporting cable placement',
        'Pole attachment and transfers',
        'Overlash existing routes',
      ],
    },
    {
      icon: Wrench,
      title: 'Underground Construction',
      color: colors.green,
      description: 'Complete underground fiber infrastructure from trenching to restoration.',
      details: [
        'Trenching and plowing',
        'Conduit and innerduct installation',
        'Hand hole and vault placement',
        'Surface restoration',
      ],
    },
    {
      icon: Activity,
      title: 'Network Testing',
      color: colors.blue,
      description: 'Comprehensive fiber testing and Tier 1/Tier 2 certification services.',
      details: [
        'OTDR trace analysis',
        'Power meter verification',
        'Insertion loss testing',
        'Return loss measurement',
      ],
    },
    {
      icon: ClipboardList,
      title: 'Project Management',
      color: colors.teal,
      description: 'End-to-end project coordination from permitting through closeout.',
      details: [
        'Permitting and ROW acquisition',
        'Material procurement',
        'Crew scheduling and dispatch',
        'Quality assurance',
      ],
    },
  ];

  return (
    <div style={{ backgroundColor: bgColor, color: textColor, minHeight: '100vh' }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '100px 20px 80px',
          background: darkMode
            ? 'linear-gradient(135deg, #0d1b2a 0%, #1a365d 50%, #0d1b2a 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '5%',
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${colors.blue}20 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '5%',
          width: '250px',
          height: '250px',
          background: `radial-gradient(circle, ${colors.coral}20 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(40px)',
        }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: darkMode ? 'rgba(0,180,216,0.15)' : 'rgba(0,119,182,0.1)',
            borderRadius: '20px',
            marginBottom: '24px',
          }}>
            <Settings size={16} color={colors.teal} />
            <span style={{ color: colors.teal, fontSize: '0.9rem', fontWeight: '600' }}>Full-Service Solutions</span>
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)', 
            fontWeight: '700', 
            marginBottom: '16px',
            color: textColor,
          }}>
            Our <span style={{ color: colors.teal }}>Services</span>
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
            color: mutedColor, 
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Comprehensive fiber optic construction solutions from design to completion.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
            gap: '24px' 
          }}>
            {services.map((service, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: '16px',
                  border: `1px solid ${cardBorder}`,
                  padding: '32px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = darkMode 
                    ? '0 12px 24px rgba(0,0,0,0.3)' 
                    : '0 12px 24px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Icon header */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: `${service.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}>
                  <service.icon size={32} color={service.color} />
                </div>
                
                <h3 style={{ 
                  fontSize: '1.35rem', 
                  fontWeight: '600', 
                  marginBottom: '12px', 
                  color: textColor,
                }}>
                  {service.title}
                </h3>
                <p style={{ 
                  color: mutedColor, 
                  lineHeight: '1.6', 
                  marginBottom: '20px',
                  fontSize: '0.95rem',
                }}>
                  {service.description}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {service.details.map((detail, detailIdx) => (
                    <li
                      key={detailIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '10px',
                        fontSize: '0.9rem',
                        color: mutedColor,
                      }}
                    >
                      <CheckCircle size={16} color={colors.green} style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Section */}
      <section style={{ padding: '60px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: `${colors.teal}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Truck size={24} color={colors.teal} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '12px' }}>
            Our <span style={{ color: colors.teal }}>Equipment</span>
          </h2>
          <p style={{ color: mutedColor, marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Modern fleet of specialized equipment for any project requirement.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
            {[
              'Vermeer HDD Drills',
              'Fusion Splicers',
              'OTDR Equipment',
              'Bucket Trucks',
              'Cable Trailers',
              'Locating Equipment',
              'Excavators',
              'Trenchers',
              'Cable Blowers',
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 18px',
                  backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '0.85rem',
                  fontWeight: '500',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: '80px 20px', 
        background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.teal} 100%)`,
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
            Need a Custom Solution?
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', marginBottom: '32px' }}>
            Every project is unique. Let's discuss your specific requirements.
          </p>
          <button
            onClick={() => setCurrentPage('contact')}
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              fontWeight: '600',
              backgroundColor: '#fff',
              color: colors.blue,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Request a Quote <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 600px) {
          section { padding: 60px 16px !important; }
        }
        @media (max-width: 400px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ServicesPage;
