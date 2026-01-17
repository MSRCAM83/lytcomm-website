import React from 'react';
import { Target, Eye, Heart, Award, Users, Clock } from 'lucide-react';
import { colors, images, LYT_INFO } from '../config/constants';

const AboutPage = ({ darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;
  const cardBg = darkMode ? colors.darkLight : '#f8fafc';

  return (
    <div style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '80px 20px',
          backgroundImage: `linear-gradient(rgba(10, 22, 40, 0.9), rgba(10, 22, 40, 0.95)), url(${images.team})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
            About <span style={{ color: colors.teal }}>LYT Communications</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
            Building reliable fiber networks across the Greater Houston area since 2009.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '24px' }}>
              Our <span style={{ color: colors.teal }}>Story</span>
            </h2>
            <p style={{ color: colors.gray, lineHeight: '1.8', marginBottom: '16px' }}>
              LYT Communications was founded with a simple mission: deliver exceptional fiber optic construction 
              services while maintaining the highest standards of safety and quality. Based in Webster, Texas, 
              we've grown from a small team to a trusted partner for telecommunications projects across the region.
            </p>
            <p style={{ color: colors.gray, lineHeight: '1.8', marginBottom: '16px' }}>
              Our experienced crews bring decades of combined expertise in HDD drilling, fiber splicing, 
              aerial construction, and underground builds. We invest in our people, our equipment, and our 
              processes to ensure every project is completed on time, on budget, and to specification.
            </p>
            <p style={{ color: colors.gray, lineHeight: '1.8' }}>
              Today, LYT Communications continues to connect communities throughout the Greater Houston area, 
              one fiber strand at a time.
            </p>
          </div>
          <div>
            <img
              src={images.team}
              alt="LYT Team"
              style={{ width: '100%', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
            />
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section style={{ padding: '80px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {[
              {
                icon: Target,
                title: 'Our Mission',
                desc: 'To deliver superior fiber optic construction services that connect communities and drive progress, while maintaining unwavering commitment to safety and quality.',
              },
              {
                icon: Eye,
                title: 'Our Vision',
                desc: 'To be the most trusted fiber construction partner in Texas, known for our expertise, reliability, and dedication to excellence in every project we undertake.',
              },
              {
                icon: Heart,
                title: 'Our Values',
                desc: 'Safety First. Quality Always. Integrity in everything we do. We treat every project as if our own community depends on it - because it does.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '40px',
                  backgroundColor: darkMode ? colors.dark : '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    backgroundColor: `${colors.blue}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <item.icon size={28} color={colors.blue} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '12px' }}>{item.title}</h3>
                <p style={{ color: colors.gray, lineHeight: '1.7' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '60px 20px', backgroundColor: colors.blue }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '32px', textAlign: 'center' }}>
          {[
            { icon: Award, value: '15+', label: 'Years in Business' },
            { icon: Users, value: '50+', label: 'Team Members' },
            { icon: Target, value: '500+', label: 'Projects Completed' },
            { icon: Clock, value: '24/7', label: 'Emergency Support' },
          ].map((stat, idx) => (
            <div key={idx}>
              <stat.icon size={32} color="rgba(255,255,255,0.8)" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff' }}>{stat.value}</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '16px' }}>
            Certifications & <span style={{ color: colors.teal }}>Compliance</span>
          </h2>
          <p style={{ color: colors.gray, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            We maintain the highest industry standards and certifications.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px' }}>
            {[
              'OSHA 10/30 Certified',
              'DOT Compliant',
              'Fully Insured',
              'Licensed Contractor',
              'Safety Trained',
              'Drug-Free Workplace',
            ].map((cert, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px 24px',
                  backgroundColor: cardBg,
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? colors.darkLight : '#e5e7eb'}`,
                  fontWeight: '500',
                }}
              >
                {cert}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section style={{ padding: '60px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }}>Our Location</h2>
          <p style={{ color: colors.gray, marginBottom: '8px' }}>{LYT_INFO.address}</p>
          <p style={{ color: colors.gray }}>{LYT_INFO.city}, {LYT_INFO.state} {LYT_INFO.zip}</p>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
