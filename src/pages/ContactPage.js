import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { colors, LYT_INFO } from '../config/constants';

const ContactPage = ({ darkMode }) => {
  const bgColor = darkMode ? '#0d1b2a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? '#94a3b8' : '#64748b';
  const cardBg = darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const inputBg = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const inputBorder = darkMode ? 'rgba(255,255,255,0.2)' : '#e2e8f0';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    border: `1px solid ${inputBorder}`,
    borderRadius: '8px',
    backgroundColor: inputBg,
    color: textColor,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    fontSize: '0.9rem',
    color: textColor,
  };

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
          right: '10%',
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${colors.teal}20 0%, transparent 70%)`,
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
            <MessageSquare size={16} color={colors.teal} />
            <span style={{ color: colors.teal, fontSize: '0.9rem', fontWeight: '600' }}>Let's Talk</span>
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)', 
            fontWeight: '700', 
            marginBottom: '16px',
            color: textColor,
          }}>
            Contact <span style={{ color: colors.teal }}>Us</span>
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
            color: mutedColor, 
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Ready to start your project? Get in touch with our team.
          </p>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
        <div style={{ 
          maxWidth: '1100px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '48px' 
        }}>
          {/* Contact Info */}
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '20px' }}>
              Get in <span style={{ color: colors.teal }}>Touch</span>
            </h2>
            <p style={{ color: mutedColor, lineHeight: '1.7', marginBottom: '32px' }}>
              Have questions about our services or want to discuss a project? 
              We're here to help. Reach out using any of the methods below.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { icon: Phone, label: 'Phone', value: LYT_INFO.phone, href: `tel:${LYT_INFO.phone}`, color: colors.blue },
                { icon: Mail, label: 'Email', value: LYT_INFO.email, href: `mailto:${LYT_INFO.email}`, color: colors.teal },
                { icon: MapPin, label: 'Address', value: `${LYT_INFO.address}\n${LYT_INFO.city}, ${LYT_INFO.state} ${LYT_INFO.zip}`, href: null, color: colors.coral },
                { icon: Clock, label: 'Hours', value: 'Mon - Fri: 7:00 AM - 5:00 PM\nEmergency: 24/7', href: null, color: colors.green },
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  alignItems: 'flex-start',
                  padding: '16px',
                  backgroundColor: cardBg,
                  borderRadius: '12px',
                  border: `1px solid ${cardBorder}`,
                }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <item.icon size={20} color={item.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.95rem' }}>{item.label}</div>
                    {item.href ? (
                      <a
                        href={item.href}
                        style={{ color: mutedColor, textDecoration: 'none', whiteSpace: 'pre-line', fontSize: '0.9rem' }}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <div style={{ color: mutedColor, whiteSpace: 'pre-line', fontSize: '0.9rem' }}>{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div
            style={{
              backgroundColor: cardBg,
              padding: '32px',
              borderRadius: '16px',
              border: `1px solid ${cardBorder}`,
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: `${colors.green}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <CheckCircle size={32} color={colors.green} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>Message Sent!</h3>
                <p style={{ color: mutedColor }}>
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', marginBottom: '24px' }}>Send a Message</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      style={inputStyle}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={inputStyle}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="Company name"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Project Type</label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    style={{ ...inputStyle, color: formData.projectType ? textColor : mutedColor }}
                  >
                    <option value="">Select a service...</option>
                    <option value="hdd">HDD Drilling</option>
                    <option value="splicing">Fiber Splicing</option>
                    <option value="aerial">Aerial Construction</option>
                    <option value="underground">Underground Construction</option>
                    <option value="testing">Network Testing</option>
                    <option value="pm">Project Management</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Tell us about your project..."
                  />
                </div>

                <button
                  type="submit"
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
                    transition: 'transform 0.2s, background-color 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#d14940';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = colors.coral;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Send size={18} /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 600px) {
          section { padding: 60px 16px !important; }
        }
        input:focus, select:focus, textarea:focus {
          border-color: ${colors.teal} !important;
        }
        select option {
          background-color: ${darkMode ? '#0d1b2a' : '#ffffff'};
          color: ${textColor};
        }
      `}</style>
    </div>
  );
};

export default ContactPage;
