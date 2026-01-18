import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { colors, LYT_INFO } from '../config/constants';

const ContactPage = ({ darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;
  const cardBg = darkMode ? colors.darkLight : '#f8fafc';

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
    // In production, this would submit to the backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
    border: `1px solid ${darkMode ? colors.darkLight : '#ddd'}`,
    borderRadius: '8px',
    backgroundColor: darkMode ? colors.dark : '#fff',
    color: textColor,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    fontSize: '0.9rem',
    color: textColor,
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
            Contact <span style={{ color: colors.teal }}>Us</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
            Ready to start your project? Get in touch with our team.
          </p>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section style={{ padding: '80px 20px', backgroundColor: bgColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '48px' }}>
          {/* Contact Info */}
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '24px' }}>
              Get in <span style={{ color: colors.teal }}>Touch</span>
            </h2>
            <p style={{ color: colors.gray, lineHeight: '1.7', marginBottom: '32px' }}>
              Have questions about our services or want to discuss a project? 
              We're here to help. Reach out using any of the methods below or fill out the form.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                { icon: Phone, label: 'Phone', value: LYT_INFO.phone, href: `tel:${LYT_INFO.phone}` },
                { icon: Mail, label: 'Email', value: LYT_INFO.email, href: `mailto:${LYT_INFO.email}` },
                { icon: MapPin, label: 'Address', value: `${LYT_INFO.address}\n${LYT_INFO.city}, ${LYT_INFO.state} ${LYT_INFO.zip}`, href: null },
                { icon: Clock, label: 'Hours', value: 'Mon - Fri: 7:00 AM - 5:00 PM\nEmergency: 24/7', href: null },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      backgroundColor: `${colors.teal}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <item.icon size={22} color={colors.teal} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.label}</div>
                    {item.href ? (
                      <a
                        href={item.href}
                        style={{ color: colors.gray, textDecoration: 'none', whiteSpace: 'pre-line' }}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <div style={{ color: colors.gray, whiteSpace: 'pre-line' }}>{item.value}</div>
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
              padding: '40px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={64} color={colors.green} style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>Message Sent!</h3>
                <p style={{ color: colors.gray }}>
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '24px' }}>Send a Message</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      style={inputStyle}
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
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      style={inputStyle}
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
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Project Type</label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    style={{ ...inputStyle, color: formData.projectType ? textColor : colors.gray }}
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
                    padding: '16px',
                    fontSize: '1.1rem',
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
                  <Send size={20} /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
