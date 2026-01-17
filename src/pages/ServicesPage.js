import React from 'react';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { colors, services } from '../config/constants';

const ServicesPage = ({ setCurrentPage, darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;
  const cardBg = darkMode ? colors.darkLight : '#f8fafc';

  const serviceDetails = {
    'HDD Drilling': [
      'Horizontal Directional Drilling for minimal surface disruption',
      'Rock boring and crossing installations',
      'Utility locating and mapping',
      'Conduit installation up to 6" diameter',
      'Shot lengths up to 1,000+ feet',
    ],
    'Fiber Splicing': [
      'Fusion splicing with <0.02dB loss',
      'OTDR testing and certification',
      'Ribbon and loose tube fiber',
      'Splice enclosure installation',
      'Emergency repair services',
    ],
    'Aerial Construction': [
      'Strand and lashing installation',
      'Self-supporting cable placement',
      'Pole attachment and transfers',
      'Overlash existing routes',
      'Make-ready engineering support',
    ],
    'Underground Construction': [
      'Trenching and plowing',
      'Conduit and innerduct installation',
      'Hand hole and vault placement',
      'Directional boring',
      'Surface restoration',
    ],
    'Network Testing': [
      'OTDR trace analysis',
      'Power meter verification',
      'Insertion loss testing',
      'Return loss measurement',
      'Tier 1 and Tier 2 certification',
    ],
    'Project Management': [
      'End-to-end project coordination',
      'Permitting and ROW acquisition',
      'Material procurement',
      'Crew scheduling and dispatch',
      'Quality assurance and closeout',
    ],
  };

  return (
    <div style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '80px 20px',
          backgroundColor: colors.dark,
          backgroundImage: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.darkBlue} 100%)`,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
            Our <span style={{ color: colors.teal }}>Services</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
            Comprehensive fiber optic construction solutions from design to completion.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
            {services.map((service) => (
              <div
                key={service.id}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              >
                <img
                  src={service.image}
                  alt={service.title}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                <div style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '12px', color: colors.blue }}>
                    {service.title}
                  </h3>
                  <p style={{ color: colors.gray, lineHeight: '1.6', marginBottom: '20px' }}>
                    {service.description}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {serviceDetails[service.title]?.map((detail, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          marginBottom: '10px',
                          fontSize: '0.95rem',
                          color: colors.gray,
                        }}
                      >
                        <CheckCircle size={18} color={colors.green} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Section */}
      <section style={{ padding: '60px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '16px' }}>
            Our <span style={{ color: colors.teal }}>Equipment</span>
          </h2>
          <p style={{ color: colors.gray, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            We maintain a modern fleet of specialized equipment for any project requirement.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
            {[
              'Vermeer HDD Drills',
              'Fusion Splicers',
              'OTDR Test Equipment',
              'Bucket Trucks',
              'Cable Trailers',
              'Locating Equipment',
              'Air Compressors',
              'Excavators',
              'Trenchers',
              'Cable Blowing Machines',
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 20px',
                  backgroundColor: darkMode ? colors.dark : '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? colors.darkLight : '#e5e7eb'}`,
                  fontSize: '0.9rem',
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
      <section style={{ padding: '80px 20px', backgroundColor: colors.blue }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
            Need a Custom Solution?
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', marginBottom: '32px' }}>
            Every project is unique. Let's discuss your specific requirements.
          </p>
          <button
            onClick={() => setCurrentPage('contact')}
            style={{
              padding: '16px 32px',
              fontSize: '1.1rem',
              fontWeight: '600',
              backgroundColor: '#fff',
              color: colors.blue,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Request a Quote <ChevronRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
