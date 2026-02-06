import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageSquare, Loader } from 'lucide-react';
import { LYT_INFO, URLS } from '../config/constants';

const ContactPage = ({ darkMode }) => {
  const bgColor = darkMode ? '#0d1b2a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? '#94a3b8' : '#64748b';
  const cardBg = darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const inputBg = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const inputBorder = darkMode ? 'rgba(255,255,255,0.2)' : '#e2e8f0';

  // Dynamic accent colors to match logos (same as HomePage)
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
  const accentTertiary = darkMode ? '#e85a4f' : '#28a745';
  const gradientColors = darkMode 
    ? 'linear-gradient(135deg, #667eea 0%, #c850c0 50%, #ff6b35 100%)'
    : 'linear-gradient(135deg, #0077B6 0%, #00b4d8 50%, #28a745 100%)';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        action: 'contactForm',
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        company: formData.company || '',
        projectType: formData.projectType || '',
        message: formData.message,
      };

      const response = await fetch(URLS.appsScript, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      // Handle GAS redirect
      let result;
      if (text.includes('HREF="')) {
        const match = text.match(/HREF="([^"]+)"/i);
        if (match) {
          const redirectUrl = match[1].replace(/&amp;/g, '&');
          const finalResponse = await fetch(redirectUrl);
          const finalText = await finalResponse.text();
          result = JSON.parse(finalText);
        }
      } else {
        result = JSON.parse(text);
      }

      if (result && result.success) {
        setSubmitted(true);
      } else {
        // Even if GAS doesn't handle contactForm, show success since we tried
        // Fall back to mailto link
        const subject = encodeURIComponent(`Website Contact: ${formData.projectType || 'General Inquiry'}`);
        const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nCompany: ${formData.company}\nProject Type: ${formData.projectType}\n\nMessage:\n${formData.message}`);
        window.open(`mailto:${LYT_INFO.email}?subject=${subject}&body=${body}`, '_self');
        setSubmitted(true);
      }
    } catch (err) {
      // If API fails, fall back to mailto
      const subject = encodeURIComponent(`Website Contact: ${formData.projectType || 'General Inquiry'}`);
      const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nCompany: ${formData.company}\nProject Type: ${formData.projectType}\n\nMessage:\n${formData.message}`);
      window.open(`mailto:${LYT_INFO.email}?subject=${subject}&body=${body}`, '_self');
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
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
            top: '20%',
            right: '10%',
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
            left: '5%',
            width: '250px',
            height: '250px',
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
            <MessageSquare size={16} color={accentPrimary} />
            <span style={{ color: accentPrimary, fontSize: '0.9rem', fontWeight: '600' }}>Let's Talk</span>
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)', 
            fontWeight: '700', 
            marginBottom: '16px',
            color: textColor,
          }}>
            Contact <span style={{ color: accentSecondary }}>Us</span>
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
      <section style={{ padding: '80px 20px', backgroundColor: bgColor, position: 'relative', overflow: 'hidden' }}>
        {/* Subtle Grid Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: darkMode
            ? `linear-gradient(rgba(200,80,192,0.015) 1px, transparent 1px),
               linear-gradient(90deg, rgba(200,80,192,0.015) 1px, transparent 1px)`
            : `linear-gradient(rgba(0,119,182,0.02) 1px, transparent 1px),
               linear-gradient(90deg, rgba(0,119,182,0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />
        
        <div style={{ 
          maxWidth: '1100px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '48px',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Contact Info */}
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '20px' }}>
              Get in <span style={{ color: accentSecondary }}>Touch</span>
            </h2>
            <p style={{ color: mutedColor, lineHeight: '1.7', marginBottom: '32px' }}>
              Have questions about our services or want to discuss a project? 
              We're here to help. Reach out using any of the methods below.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { icon: Phone, label: 'Phone', value: LYT_INFO.phone, href: `tel:${LYT_INFO.phone}`, color: accentPrimary },
                { icon: Mail, label: 'Email', value: LYT_INFO.email, href: `mailto:${LYT_INFO.email}`, color: accentSecondary },
                { icon: MapPin, label: 'Address', value: `${LYT_INFO.address}\n${LYT_INFO.city}, ${LYT_INFO.state} ${LYT_INFO.zip}`, href: null, color: accentTertiary },
                { icon: Clock, label: 'Hours', value: 'Mon - Fri: 7:00 AM - 5:00 PM\nEmergency: 24/7', href: null, color: accentSecondary },
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
                  backgroundColor: `${accentTertiary}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <CheckCircle size={32} color={accentTertiary} />
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
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    background: loading ? '#9ca3af' : gradientColors,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: `0 4px 15px ${accentPrimary}30`,
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = `0 6px 20px ${accentPrimary}40`;
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 4px 15px ${accentPrimary}30`;
                  }}
                >
                  {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : <><Send size={18} /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 600px) {
          section { padding: 60px 16px !important; }
        }
        input:focus, select:focus, textarea:focus {
          border-color: ${accentSecondary} !important;
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
