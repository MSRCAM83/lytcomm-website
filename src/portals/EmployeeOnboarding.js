import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, User, FileText, CreditCard, Heart, Shield, AlertCircle } from 'lucide-react';
import { colors, LYT_INFO, URLS } from '../config/constants';
import SignaturePad from '../components/SignaturePad';
import SSNInput from '../components/SSNInput';

const EmployeeOnboarding = ({ setCurrentPage, darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [showW4Pdf, setShowW4Pdf] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    dateOfBirth: '',
    ssn: '',
    // W-4 Info
    filingStatus: 'single',
    multipleJobs: false,
    qualifyingChildren: 0,
    otherDependents: 0,
    otherIncome: '',
    deductions: '',
    extraWithholding: '',
    exempt: false,
    w4Signature: null,
    w4Date: new Date().toISOString().split('T')[0],
    // Direct Deposit
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    // Emergency Contact
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    emergencyEmail: '',
    // Safety
    safetyAcknowledged: false,
    safetySignature: null,
    safetyDate: new Date().toISOString().split('T')[0],
  });

  const steps = [
    { id: 'personal', title: 'Personal Info', icon: User },
    { id: 'w4', title: 'W-4 Tax Form', icon: FileText },
    { id: 'direct-deposit', title: 'Direct Deposit', icon: CreditCard },
    { id: 'emergency', title: 'Emergency Contact', icon: Heart },
    { id: 'safety', title: 'Safety Training', icon: Shield },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSSNChange = (value) => {
    setFormData({ ...formData, ssn: value });
  };

  const handleW4SignatureChange = (signature) => {
    setFormData({ ...formData, w4Signature: signature });
  };

  const handleSafetySignatureChange = (signature) => {
    setFormData({ ...formData, safetySignature: signature });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // In production, this would submit to Google Apps Script
      const payload = {
        type: 'employee',
        ...formData,
        submittedAt: new Date().toISOString(),
      };

      console.log('Employee onboarding submission:', payload);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: `1px solid ${darkMode ? '#374151' : '#ddd'}`,
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

  // Step content renderers
  const renderPersonalInfo = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Personal Information</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>First Name *</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Middle Name</label>
          <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Last Name *</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Phone *</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Date of Birth *</label>
          <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required style={inputStyle} />
        </div>
      </div>

      <SSNInput value={formData.ssn} onChange={handleSSNChange} />

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Street Address *</label>
        <input type="text" name="address" value={formData.address} onChange={handleChange} required style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>City *</label>
          <input type="text" name="city" value={formData.city} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>State *</label>
          <input type="text" name="state" value={formData.state} onChange={handleChange} required maxLength={2} style={inputStyle} placeholder="TX" />
        </div>
        <div>
          <label style={labelStyle}>ZIP *</label>
          <input type="text" name="zip" value={formData.zip} onChange={handleChange} required style={inputStyle} />
        </div>
      </div>
    </div>
  );

  const renderW4Form = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>W-4 Employee's Withholding Certificate</h3>
        <button
          onClick={() => setShowW4Pdf(!showW4Pdf)}
          style={{ 
            padding: '8px 16px',
            backgroundColor: showW4Pdf ? colors.teal : 'transparent',
            border: `1px solid ${colors.teal}`,
            borderRadius: '6px',
            color: showW4Pdf ? '#fff' : colors.teal,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {showW4Pdf ? 'Hide PDF' : 'View PDF Form'}
        </button>
      </div>

      {/* Embedded PDF Viewer */}
      {showW4Pdf && (
        <div style={{ marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${darkMode ? '#374151' : '#ddd'}` }}>
          <iframe
            src={`${URLS.w4Pdf}#toolbar=0&navpanes=0&scrollbar=1`}
            style={{
              width: '100%',
              height: '600px',
              border: 'none',
              backgroundColor: '#fff',
            }}
            title="W-4 Form"
          />
          <div style={{ padding: '12px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderTop: `1px solid ${darkMode ? '#374151' : '#ddd'}`, textAlign: 'center' }}>
            <a
              href={URLS.w4Pdf}
              download="W-4_Form.pdf"
              style={{ color: colors.teal, fontSize: '0.85rem', textDecoration: 'none' }}
            >
              Download PDF
            </a>
          </div>
        </div>
      )}

      {/* Filing Status */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '12px' }}>Step 1(c): Filing Status *</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { value: 'single', label: 'Single or Married filing separately' },
            { value: 'married', label: 'Married filing jointly' },
            { value: 'head', label: 'Head of household' },
          ].map((option) => (
            <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="filingStatus"
                value={option.value}
                checked={formData.filingStatus === option.value}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Multiple Jobs */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '12px' }}>Step 2: Multiple Jobs or Spouse Works</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="multipleJobs"
            checked={formData.multipleJobs}
            onChange={handleChange}
            style={{ width: '18px', height: '18px' }}
          />
          <span>Check if you have more than one job or your spouse works</span>
        </label>
      </div>

      {/* Dependents */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '12px' }}>Step 3: Claim Dependents</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>Qualifying children under age 17 (×$2,000)</label>
            <input
              type="number"
              name="qualifyingChildren"
              value={formData.qualifyingChildren}
              onChange={handleChange}
              min={0}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>Other dependents (×$500)</label>
            <input
              type="number"
              name="otherDependents"
              value={formData.otherDependents}
              onChange={handleChange}
              min={0}
              style={inputStyle}
            />
          </div>
        </div>
        <p style={{ marginTop: '12px', fontSize: '0.9rem', color: colors.gray }}>
          Total claim amount: ${(formData.qualifyingChildren * 2000) + (formData.otherDependents * 500)}
        </p>
      </div>

      {/* Other Adjustments */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '12px' }}>Step 4: Other Adjustments (Optional)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>4(a) Other income (not from jobs)</label>
            <input
              type="number"
              name="otherIncome"
              value={formData.otherIncome}
              onChange={handleChange}
              placeholder="$"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>4(b) Deductions (if > standard)</label>
            <input
              type="number"
              name="deductions"
              value={formData.deductions}
              onChange={handleChange}
              placeholder="$"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>4(c) Extra withholding per paycheck</label>
            <input
              type="number"
              name="extraWithholding"
              value={formData.extraWithholding}
              onChange={handleChange}
              placeholder="$"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Exempt */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="exempt"
            checked={formData.exempt}
            onChange={handleChange}
            style={{ width: '18px', height: '18px' }}
          />
          <span>I claim exemption from withholding</span>
        </label>
        <p style={{ marginTop: '8px', fontSize: '0.85rem', color: colors.gray }}>
          (Only check if you had no tax liability last year AND expect none this year)
        </p>
      </div>

      {/* Signature */}
      <div style={{ marginBottom: '16px' }}>
        <SignaturePad onSignatureChange={handleW4SignatureChange} label="Employee Signature" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" name="w4Date" value={formData.w4Date} onChange={handleChange} style={inputStyle} />
        </div>
      </div>
    </div>
  );

  const renderDirectDeposit = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Direct Deposit Information</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Bank Name *</label>
        <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Routing Number *</label>
          <input
            type="text"
            name="routingNumber"
            value={formData.routingNumber}
            onChange={handleChange}
            required
            maxLength={9}
            style={inputStyle}
            placeholder="9 digits"
          />
        </div>
        <div>
          <label style={labelStyle}>Account Number *</label>
          <input
            type="text"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Account Type *</label>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['checking', 'savings'].map((type) => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="accountType"
                value={type}
                checked={formData.accountType === type}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ textTransform: 'capitalize' }}>{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', backgroundColor: `${colors.teal}10`, borderRadius: '8px', marginTop: '24px' }}>
        <p style={{ fontSize: '0.9rem', color: colors.gray }}>
          <strong>Note:</strong> Please double-check your routing and account numbers. 
          Incorrect information may delay your paycheck.
        </p>
      </div>
    </div>
  );

  const renderEmergencyContact = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Emergency Contact</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Contact Name *</label>
          <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Relationship *</label>
          <input type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} required style={inputStyle} placeholder="e.g., Spouse, Parent" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Phone Number *</label>
          <input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" name="emergencyEmail" value={formData.emergencyEmail} onChange={handleChange} style={inputStyle} />
        </div>
      </div>
    </div>
  );

  const renderSafetyTraining = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Safety Training Acknowledgment</h3>
      
      <div style={{ padding: '24px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
        <h4 style={{ fontWeight: '600', marginBottom: '16px' }}>Safety Commitment</h4>
        <p style={{ color: colors.gray, lineHeight: '1.7', marginBottom: '16px' }}>
          As an employee of {LYT_INFO.name}, I understand and agree to the following:
        </p>
        <ul style={{ color: colors.gray, lineHeight: '1.8', paddingLeft: '20px' }}>
          <li>I will follow all safety procedures and protocols at all times</li>
          <li>I will wear required Personal Protective Equipment (PPE) on job sites</li>
          <li>I will report any unsafe conditions or incidents immediately</li>
          <li>I will attend all required safety training sessions</li>
          <li>I will not perform any task that I feel is unsafe without first consulting my supervisor</li>
          <li>I understand that safety violations may result in disciplinary action</li>
        </ul>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="safetyAcknowledged"
            checked={formData.safetyAcknowledged}
            onChange={handleChange}
            style={{ width: '20px', height: '20px', marginTop: '2px' }}
          />
          <span style={{ lineHeight: '1.5' }}>
            I have read, understand, and agree to comply with all {LYT_INFO.name} safety policies and procedures. 
            I understand that failure to follow these policies may result in disciplinary action up to and including termination.
          </span>
        </label>
      </div>

      <SignaturePad onSignatureChange={handleSafetySignatureChange} label="Signature" />
      
      <div style={{ marginTop: '16px' }}>
        <label style={labelStyle}>Date</label>
        <input type="date" name="safetyDate" value={formData.safetyDate} onChange={handleChange} style={{ ...inputStyle, maxWidth: '200px' }} />
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderPersonalInfo();
      case 1: return renderW4Form();
      case 2: return renderDirectDeposit();
      case 3: return renderEmergencyContact();
      case 4: return renderSafetyTraining();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.firstName && formData.lastName && formData.email && formData.phone && formData.ssn && formData.address && formData.city && formData.state && formData.zip;
      case 1:
        return formData.filingStatus && formData.w4Signature;
      case 2:
        return formData.bankName && formData.routingNumber && formData.accountNumber;
      case 3:
        return formData.emergencyName && formData.emergencyRelation && formData.emergencyPhone;
      case 4:
        return formData.safetyAcknowledged && formData.safetySignature;
      default:
        return false;
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <CheckCircle size={80} color={colors.green} style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '16px', color: textColor }}>
            Welcome to the Team!
          </h2>
          <p style={{ color: colors.gray, fontSize: '1.1rem', marginBottom: '32px' }}>
            Your onboarding paperwork has been submitted successfully. 
            You'll receive a confirmation email shortly.
          </p>
          <button
            onClick={() => setCurrentPage('home')}
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              fontWeight: '600',
              backgroundColor: colors.teal,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Return to Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor }}>
      {/* Header */}
      <header style={{ padding: '20px', backgroundColor: colors.dark, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setCurrentPage('portal-login')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} /> Back to Portal
        </button>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
          <span style={{ color: colors.teal }}>Employee</span> Onboarding
        </div>
        <div style={{ width: '120px' }} />
      </header>

      {/* Progress Steps */}
      <div style={{ padding: '20px', backgroundColor: cardBg, borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          {steps.map((step, idx) => (
            <div
              key={step.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: idx <= currentStep ? colors.teal : (darkMode ? colors.dark : '#e5e7eb'),
                  color: idx <= currentStep ? '#fff' : colors.gray,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}
              >
                {idx < currentStep ? <CheckCircle size={20} /> : idx + 1}
              </div>
              <span style={{ fontSize: '0.75rem', color: idx <= currentStep ? textColor : colors.gray, textAlign: 'center' }}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <main style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            {renderStepContent()}

            {error && (
              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: `${colors.coral}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: colors.coral }}>
                <AlertCircle size={20} /> {error}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  backgroundColor: 'transparent',
                  border: `1px solid ${currentStep === 0 ? '#ccc' : colors.gray}`,
                  color: currentStep === 0 ? '#ccc' : textColor,
                  borderRadius: '8px',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ArrowLeft size={18} /> Previous
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  style={{
                    padding: '12px 24px',
                    fontSize: '1rem',
                    backgroundColor: canProceed() ? colors.teal : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: canProceed() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  Next <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  style={{
                    padding: '12px 24px',
                    fontSize: '1rem',
                    backgroundColor: canProceed() ? colors.green : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: canProceed() && !submitting ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Complete Onboarding'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeOnboarding;
