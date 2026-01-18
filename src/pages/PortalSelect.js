import React from 'react';
import { UserPlus, Briefcase, LogIn, Shield, FileText, ArrowLeft } from 'lucide-react';
import { colors, LYT_INFO } from '../config/constants';

const PortalSelect = ({ setCurrentPage, darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;

  const portalOptions = [
    {
      id: 'employee-login',
      title: 'Employee Login',
      subtitle: 'Existing employees',
      description: 'Access your dashboard, time clock, projects, and documents.',
      icon: LogIn,
      color: colors.blue,
      page: 'employee-login',
      features: ['Time Clock', 'Projects', 'Documents', 'Team Directory'],
    },
    {
      id: 'new-employee',
      title: 'New Employee',
      subtitle: 'Join our team',
      description: 'Complete your onboarding paperwork including W-4, direct deposit, and safety training.',
      icon: UserPlus,
      color: colors.green,
      page: 'employee-onboarding',
      features: ['W-4 Tax Form', 'Direct Deposit', 'Emergency Contact', 'Safety Training'],
    },
    {
      id: 'contractor-login',
      title: 'Contractor Login',
      subtitle: 'Existing contractors',
      description: 'Manage your jobs, submit invoices, and track payments.',
      icon: Briefcase,
      color: colors.teal,
      page: 'contractor-login',
      features: ['Job Assignments', 'Submit Invoices', 'Payment Status', 'Documents'],
    },
    {
      id: 'new-contractor',
      title: 'New Contractor',
      subtitle: 'Partner with us',
      description: 'Register your company and complete subcontractor onboarding.',
      icon: FileText,
      color: colors.coral,
      page: 'contractor-onboarding',
      features: ['Company Registration', 'MSA Agreement', 'W-9 Tax Form', 'Insurance & Rates'],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor }}>
      {/* Header */}
      <header
        style={{
          padding: '20px',
          backgroundColor: colors.dark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => setCurrentPage('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={20} /> Back to Website
        </button>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
          <span style={{ color: colors.teal }}>LYT</span> Portal
        </div>
        <div style={{ width: '120px' }} /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: '700', marginBottom: '12px' }}>
              Welcome to the <span style={{ color: colors.teal }}>LYT Portal</span>
            </h1>
            <p style={{ color: colors.gray, fontSize: '1.1rem' }}>
              Select your portal below to get started.
            </p>
          </div>

          {/* Portal Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {portalOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => setCurrentPage(option.page)}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: '16px',
                  padding: '32px',
                  cursor: 'pointer',
                  border: `2px solid transparent`,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = option.color;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 24px rgba(0,0,0,0.1)`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: `${option.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <option.icon size={32} color={option.color} />
                </div>

                {/* Title & Subtitle */}
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '600', marginBottom: '4px' }}>
                    {option.title}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: option.color,
                      fontWeight: '500',
                    }}
                  >
                    {option.subtitle}
                  </span>
                </div>

                {/* Description */}
                <p style={{ color: colors.gray, lineHeight: '1.6', marginBottom: '20px', fontSize: '0.95rem' }}>
                  {option.description}
                </p>

                {/* Features */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {option.features.map((feature, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: darkMode ? colors.dark : '#f1f5f9',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: colors.gray,
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Admin Login Link */}
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button
              onClick={() => setCurrentPage('admin-login')}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${colors.gray}`,
                color: colors.gray,
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Shield size={18} /> Admin Login
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '24px', textAlign: 'center', color: colors.gray, fontSize: '0.85rem' }}>
        © {new Date().getFullYear()} {LYT_INFO.name}. All rights reserved.
      </footer>
    </div>
  );
};

export default PortalSelect;
