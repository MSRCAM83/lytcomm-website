import React from 'react';
import { Target, Eye, Heart, Award, Users, Clock, Shield, Zap, MapPin } from 'lucide-react';

const AboutPage = ({ darkMode }) => {
  const bgColor = darkMode ? '#0d1b2a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? '#94a3b8' : '#64748b';
  const cardBg = darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  // Dynamic accent colors to match logos (same as HomePage)
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
  const accentTertiary = darkMode ? '#e85a4f' : '#28a745';
  const gradientColors = darkMode 
    ? 'linear-gradient(135deg, #667eea 0%, #c850c0 50%, #ff6b35 100%)'
    : 'linear-gradient(135deg, #0077B6 0%, #00b4d8 50%, #28a745 100%)';

  return (
    <div style={{ backgroundColor: bgColor, color: textColor, minHeight: '100vh' }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '100px 20px 80px',
          background: bgColor,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated Background */}
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
            width: '300px',
            height: '300px',
            background: darkMode 
              ? 'radial-gradient(circle, rgba(200,80,192,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0,119,182,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '350px',
            height: '350px',
            background: darkMode
              ? 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(57,181,74,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
          }} />
          
          {/* Grid Pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: darkMode
              ? `linear-gradient(rgba(200,80,192,0.03) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(200,80,192,0.03) 1px, transparent 1px)`
              : `linear-gradient(rgba(0,119,182,0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(0,119,182,0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
        </div>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: darkMode ? 'rgba(200,80,192,0.15)' : 'rgba(0,119,182,0.1)',
            borderRadius: '20px',
            marginBottom: '24px',
          }}>
            <Shield size={16} color={accentPrimary} />
            <span style={{ color: accentPrimary, fontSize: '0.9rem', fontWeight: '600' }}>Est. 2009</span>
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)', 
            fontWeight: '700', 
            marginBottom: '16px',
            color: textColor,
          }}>
            About <span style={{ color: accentSecondary }}>LYT Communications</span>
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
            color: mutedColor, 
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Building reliable fiber networks across the Gulf Coast with excellence, safety, and integrity.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '32px',
            alignItems: 'start',
          }}>
            <div style={{ padding: '20px 0' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '24px' }}>
                Our <span style={{ color: accentSecondary }}>Story</span>
              </h2>
              <p style={{ color: mutedColor, lineHeight: '1.8', marginBottom: '16px' }}>
                LYT Communications was founded with a simple mission: deliver exceptional fiber optic construction 
                services while maintaining the highest standards of safety and quality.
              </p>
              <p style={{ color: mutedColor, lineHeight: '1.8', marginBottom: '16px' }}>
                Based in Webster, Texas, we've grown from a small team to a trusted partner for telecommunications 
                projects across the region. Our experienced crews bring decades of combined expertise in HDD drilling, 
                fiber splicing, aerial construction, and underground builds.
              </p>
              <p style={{ color: mutedColor, lineHeight: '1.8' }}>
                Today, LYT Communications continues to connect communities throughout the Gulf Coast, 
                one fiber strand at a time.
              </p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}>
              {[
                { icon: Zap, label: 'Fast Deployment', color: accentTertiary },
                { icon: Shield, label: 'Safety First', color: accentSecondary },
                { icon: Award, label: 'Quality Work', color: accentPrimary },
                { icon: Users, label: 'Expert Team', color: accentSecondary },
              ].map((item, idx) => (
                <div key={idx} style={{
                  padding: '24px',
                  backgroundColor: cardBg,
                  borderRadius: '12px',
                  border: `1px solid ${cardBorder}`,
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <item.icon size={24} color={item.color} />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: textColor }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section style={{ padding: '80px 20px', backgroundColor: cardBg, position: 'relative', overflow: 'hidden' }}>
        {/* Grid Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: darkMode
            ? `linear-gradient(rgba(200,80,192,0.02) 1px, transparent 1px),
               linear-gradient(90deg, rgba(200,80,192,0.02) 1px, transparent 1px)`
            : `linear-gradient(rgba(0,119,182,0.03) 1px, transparent 1px),
               linear-gradient(90deg, rgba(0,119,182,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            marginBottom: '48px', 
            textAlign: 'center' 
          }}>
            What <span style={{ color: accentSecondary }}>Drives Us</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              {
                icon: Target,
                title: 'Our Mission',
                desc: 'To deliver superior fiber optic construction services that connect communities and drive progress, while maintaining unwavering commitment to safety and quality.',
                color: accentPrimary,
              },
              {
                icon: Eye,
                title: 'Our Vision',
                desc: 'To be the most trusted fiber construction partner in Texas, known for our expertise, reliability, and dedication to excellence in every project we undertake.',
                color: accentSecondary,
              },
              {
                icon: Heart,
                title: 'Our Values',
                desc: 'Safety First. Quality Always. Integrity in everything we do. We treat every project as if our own community depends on it — because it does.',
                color: accentTertiary,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '32px',
                  backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
                  borderRadius: '12px',
                  border: `1px solid ${cardBorder}`,
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    backgroundColor: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <item.icon size={28} color={item.color} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>{item.title}</h3>
                <p style={{ color: mutedColor, lineHeight: '1.7', fontSize: '0.95rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ 
        padding: '60px 20px', 
        background: gradientColors,
      }}>
        <div style={{ 
          maxWidth: '1000px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '32px', 
          textAlign: 'center' 
        }}>
          {[
            { icon: Award, value: '15+', label: 'Years Experience' },
            { icon: Users, value: '50+', label: 'Team Members' },
            { icon: Target, value: '500+', label: 'Projects Done' },
            { icon: Clock, value: '24/7', label: 'Support' },
          ].map((stat, idx) => (
            <div key={idx}>
              <stat.icon size={28} color="rgba(255,255,255,0.9)" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: '700', color: '#fff' }}>{stat.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '16px' }}>
            Certifications & <span style={{ color: accentSecondary }}>Compliance</span>
          </h2>
          <p style={{ color: mutedColor, marginBottom: '40px' }}>
            We maintain the highest industry standards and certifications.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
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
                  padding: '12px 20px',
                  backgroundColor: cardBg,
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  fontWeight: '500',
                  fontSize: '0.9rem',
                }}
              >
                {cert}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Region */}
      <section style={{ padding: '60px 20px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: `${accentSecondary}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <MapPin size={24} color={accentSecondary} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>Serving the Gulf Coast</h2>
          <p style={{ color: mutedColor }}>Texas • Louisiana • Mississippi • Alabama • Florida</p>
        </div>
      </section>

      <style>{`
        @media (max-width: 600px) {
          section { padding: 60px 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
