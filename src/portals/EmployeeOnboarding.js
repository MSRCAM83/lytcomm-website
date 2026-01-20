import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, User, FileText, CreditCard, Heart, Shield, AlertCircle, Upload } from 'lucide-react';
import { colors, LYT_INFO, URLS } from '../config/constants';
import SignaturePad from '../components/SignaturePad';
import SSNInput from '../components/SSNInput';

const EmployeeOnboarding = ({ setCurrentPage, darkMode }) => {
  // Dynamic colors based on theme
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';     // Purple vs Teal
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';   // Orange vs Green
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';       // Error red

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
    voidedCheck: null,
    voidedCheckName: '',
    directDepositAgreed: false,
    directDepositSignature: null,
    directDepositDate: new Date().toISOString().split('T')[0],
    // ID Verification
    idType: 'drivers-license',
    idFile: null,
    idFileName: '',
    // Emergency Contact
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    emergencyEmail: '',
    // Background & Drug Test Consents
    backgroundCheckConsent: false,
    backgroundCheckSignature: null,
    drugTestConsent: false,
    drugTestSignature: null,
    consentsDate: new Date().toISOString().split('T')[0],
    // Safety
    safetyAcknowledged: false,
    safetySignature: null,
    safetyDate: new Date().toISOString().split('T')[0],
  });

  const steps = [
    { id: 'personal', title: 'Personal Info', icon: User },
    { id: 'w4', title: 'W-4 Tax Form', icon: FileText },
    { id: 'direct-deposit', title: 'Direct Deposit', icon: CreditCard },
    { id: 'id-verification', title: 'ID Verification', icon: FileText },
    { id: 'emergency', title: 'Emergency Contact', icon: Heart },
    { id: 'consents', title: 'Consents', icon: Shield },
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
      // Prepare file uploads as base64
      let voidedCheckData = null;
      if (formData.voidedCheck) {
        const reader = new FileReader();
        voidedCheckData = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({
              name: formData.voidedCheckName,
              data: base64,
              mimeType: formData.voidedCheck.type
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(formData.voidedCheck);
        });
      }

      let idFileData = null;
      if (formData.idFile) {
        const reader = new FileReader();
        idFileData = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({
              name: formData.idFileName,
              data: base64,
              mimeType: formData.idFile.type
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(formData.idFile);
        });
      }

      // Prepare data for Google Apps Script
      const payload = {
        type: 'employee_onboarding',
        formData: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          dateOfBirth: formData.dateOfBirth,
          ssnLast4: formData.ssn ? formData.ssn.slice(-4) : '',
          // W-4 info
          filingStatus: formData.filingStatus,
          multipleJobs: formData.multipleJobs,
          qualifyingChildren: formData.qualifyingChildren,
          otherDependents: formData.otherDependents,
          otherIncome: formData.otherIncome,
          deductions: formData.deductions,
          extraWithholding: formData.extraWithholding,
          exempt: formData.exempt,
          // Direct Deposit
          bankName: formData.bankName,
          routingNumber: formData.routingNumber,
          accountLast4: formData.accountNumber ? formData.accountNumber.slice(-4) : '',
          accountType: formData.accountType,
          voidedCheckUploaded: !!formData.voidedCheck,
          // ID Verification
          idType: formData.idType,
          idUploaded: !!formData.idFile,
          // Emergency Contact
          emergencyName: formData.emergencyName,
          emergencyRelationship: formData.emergencyRelation,
          emergencyPhone: formData.emergencyPhone,
          emergencyEmail: formData.emergencyEmail,
          // Consents
          backgroundCheckConsent: formData.backgroundCheckConsent,
          drugTestConsent: formData.drugTestConsent,
        },
        documents: {
          w4: { 
            signed: !!formData.w4Signature, 
            signedAt: formData.w4Signature ? new Date().toISOString() : null 
          },
          safety: { 
            signed: !!formData.safetySignature, 
            signedAt: formData.safetySignature ? new Date().toISOString() : null 
          },
          directDeposit: {
            signed: !!(formData.bankName && formData.routingNumber),
            signedAt: formData.bankName ? new Date().toISOString() : null
          },
          backgroundCheck: {
            signed: !!formData.backgroundCheckSignature,
            signedAt: formData.backgroundCheckSignature ? new Date().toISOString() : null
          },
          drugTest: {
            signed: !!formData.drugTestSignature,
            signedAt: formData.drugTestSignature ? new Date().toISOString() : null
          }
        },
        voidedCheck: voidedCheckData,
        idFile: idFileData
      };

      console.log('Submitting employee onboarding:', payload);

      // Submit to Google Apps Script
      const response = await fetch(URLS.appsScript, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // Apps Script requires this for CORS
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Submission result:', result);

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Force light background for all form inputs to ensure text visibility
  // Using white background with dark text for maximum contrast in all modes
  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    boxSizing: 'border-box',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
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

      <SSNInput value={formData.ssn} onChange={handleSSNChange} darkMode={darkMode} />

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
            backgroundColor: showW4Pdf ? accentPrimary : 'transparent',
            border: `1px solid ${accentPrimary}`,
            borderRadius: '6px',
            color: showW4Pdf ? '#fff' : accentPrimary,
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
          <div style={{ padding: '12px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderTop: `1px solid ${darkMode ? '#374151' : '#ddd'}`, textAlign: 'center' }}>
            <a
              href={URLS.w4Pdf}
              download="W-4_Form.pdf"
              style={{ color: accentPrimary, fontSize: '0.85rem', textDecoration: 'none' }}
            >
              Download PDF
            </a>
          </div>
        </div>
      )}

      {/* Filing Status */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
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
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
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
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
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
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
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
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
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
        <SignaturePad onSignatureChange={handleW4SignatureChange} label="Employee Signature" darkMode={darkMode} />
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
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Direct Deposit Authorization</h3>
      
      <p style={{ color: darkMode ? '#d1d5db' : '#4b5563', marginBottom: '20px', lineHeight: '1.6' }}>
        Provide your banking details for payment via ACH direct deposit. A voided check is required for verification.
      </p>
      
      {/* Bank Information */}
      <div style={{ padding: '20px', backgroundColor: darkMode ? '#1f2937' : '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: accentPrimary }}>Bank Account Information</h4>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Bank Name *</label>
          <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Routing Number (ABA) *</label>
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
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: textColor }}>
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
      </div>

      {/* Voided Check Upload */}
      <div style={{ padding: '20px', backgroundColor: darkMode ? '#1f2937' : '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: accentPrimary }}>Voided Check *</h4>
        <p style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '0.9rem', marginBottom: '16px' }}>
          Please upload an image of a voided check for bank account verification.
        </p>
        <div style={{ 
          border: `2px dashed ${formData.voidedCheckName ? colors.green : (darkMode ? '#374151' : '#ddd')}`, 
          borderRadius: '8px', 
          padding: '24px', 
          textAlign: 'center',
          backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#fff'
        }}>
          {formData.voidedCheckName ? (
            <div>
              <p style={{ color: colors.green, fontWeight: '500', marginBottom: '8px' }}>✓ {formData.voidedCheckName}</p>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, voidedCheck: null, voidedCheckName: '' })}
                style={{ padding: '8px 16px', backgroundColor: accentError, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                id="voidedCheck"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setFormData({ ...formData, voidedCheck: file, voidedCheckName: file.name });
                  }
                }}
                style={{ display: 'none' }}
              />
              <label htmlFor="voidedCheck" style={{ cursor: 'pointer' }}>
                <div style={{ marginBottom: '8px' }}>
                  <Upload size={32} color={accentPrimary} />
                </div>
                <p style={{ color: accentPrimary, fontWeight: '500' }}>Click to upload voided check</p>
                <p style={{ fontSize: '0.8rem', color: colors.gray }}>PDF, JPG, or PNG (max 5MB)</p>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Direct Deposit Authorization Agreement */}
      <div style={{ padding: '20px', backgroundColor: darkMode ? '#111827' : '#fffbeb', borderRadius: '8px', marginBottom: '24px', border: `1px solid ${darkMode ? '#374151' : '#fcd34d'}` }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: darkMode ? '#fcd34d' : '#92400e' }}>Direct Deposit Authorization Agreement</h4>
        
        <div style={{ color: darkMode ? '#d1d5db' : '#4b5563', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '16px' }}>
          <p style={{ marginBottom: '12px' }}>
            I hereby authorize {LYT_INFO.name} to initiate credit entries (deposits) to my account at the financial 
            institution named above. I also authorize the financial institution to accept and credit any such entries.
          </p>
          <p style={{ marginBottom: '12px' }}>
            This authorization will remain in effect until I notify {LYT_INFO.name} in writing to discontinue 
            these payments, allowing reasonable time to act on my request.
          </p>
          <p>
            I understand that if erroneous deposits are made to my account, {LYT_INFO.name} is authorized to 
            debit my account for an amount not to exceed the original amount of the erroneous credit.
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '16px' }}>
          <input
            type="checkbox"
            name="directDepositAgreed"
            checked={formData.directDepositAgreed}
            onChange={handleChange}
            style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: accentPrimary }}
          />
          <span style={{ color: textColor, lineHeight: '1.5' }}>
            I have read and agree to the Direct Deposit Authorization terms above. I certify that the bank 
            account information provided is accurate.
          </span>
        </label>

        {formData.directDepositAgreed && (
          <>
            <SignaturePad
              onSignatureChange={(sig) => setFormData({ ...formData, directDepositSignature: sig })}
              label="Direct Deposit Authorization Signature"
              darkMode={darkMode}
            />
            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle}>Date *</label>
              <input 
                type="date" 
                name="directDepositDate" 
                value={formData.directDepositDate} 
                onChange={handleChange} 
                required
                style={{ ...inputStyle, maxWidth: '200px' }} 
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderIdVerification = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>ID Verification</h3>
      <p style={{ color: colors.gray, marginBottom: '24px' }}>
        Please upload a valid government-issued photo ID for identity verification.
      </p>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>ID Type *</label>
        <select
          name="idType"
          value={formData.idType}
          onChange={handleChange}
          style={selectStyle}
        >
          <option value="drivers-license">Driver's License</option>
          <option value="state-id">State ID</option>
          <option value="passport">Passport</option>
          <option value="passport-card">Passport Card</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Upload ID *</label>
        <div style={{ 
          border: `2px dashed ${darkMode ? '#374151' : '#ddd'}`, 
          borderRadius: '8px', 
          padding: '24px', 
          textAlign: 'center',
          backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#f9fafb'
        }}>
          {formData.idFileName ? (
            <div>
              <p style={{ color: accentSecondary, fontWeight: '500', marginBottom: '8px' }}>✓ {formData.idFileName}</p>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, idFile: null, idFileName: '' })}
                style={{ padding: '8px 16px', backgroundColor: accentError, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                id="idFile"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setFormData({ ...formData, idFile: file, idFileName: file.name });
                  }
                }}
                style={{ display: 'none' }}
              />
              <label htmlFor="idFile" style={{ cursor: 'pointer' }}>
                <div style={{ marginBottom: '8px' }}>
                  <Upload size={32} color={accentPrimary} />
                </div>
                <p style={{ color: accentPrimary, fontWeight: '500' }}>Click to upload your ID</p>
                <p style={{ fontSize: '0.8rem', color: colors.gray }}>PDF, JPG, or PNG (max 5MB)</p>
              </label>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', backgroundColor: `${accentPrimary}10`, borderRadius: '8px', marginTop: '24px' }}>
        <p style={{ fontSize: '0.9rem', color: colors.gray }}>
          <strong>Privacy Note:</strong> Your ID is securely stored and only used for employment verification purposes.
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

  const renderConsents = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Employment Consents</h3>
      
      {/* Background Check Consent */}
      <div style={{ padding: '24px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px', marginBottom: '24px', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
        <h4 style={{ fontWeight: '600', marginBottom: '16px', color: accentPrimary }}>Background Check Authorization</h4>
        <div style={{ color: colors.gray, lineHeight: '1.7', marginBottom: '16px', fontSize: '0.95rem' }}>
          <p style={{ marginBottom: '12px' }}>
            I hereby authorize {LYT_INFO.name} and its designated agents to conduct a comprehensive background investigation as part of my employment application. I understand this investigation may include, but is not limited to:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li>Criminal history records check</li>
            <li>Employment verification</li>
            <li>Education verification</li>
            <li>Professional license verification</li>
            <li>Driving record check (if applicable to the position)</li>
            <li>Reference checks</li>
          </ul>
          <p style={{ marginBottom: '12px' }}>
            I understand that I am entitled to receive a copy of any consumer report obtained and a summary of my rights under the Fair Credit Reporting Act upon request.
          </p>
          <p>
            I release {LYT_INFO.name} and all persons, agencies, and entities providing information from any liability arising from requesting, obtaining, or using this information.
          </p>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="backgroundCheckConsent"
              checked={formData.backgroundCheckConsent}
              onChange={handleChange}
              style={{ width: '20px', height: '20px', marginTop: '2px' }}
            />
            <span style={{ lineHeight: '1.5' }}>
              I have read, understand, and consent to the background check investigation described above. I certify that all information I have provided is true and complete.
            </span>
          </label>
        </div>

        {formData.backgroundCheckConsent && (
          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Electronic Signature *</label>
            <SignaturePad
              signature={formData.backgroundCheckSignature}
              onSignatureChange={(sig) => setFormData({ ...formData, backgroundCheckSignature: sig })}
              darkMode={darkMode}
            />
          </div>
        )}
      </div>

      {/* Drug Test Consent */}
      <div style={{ padding: '24px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
        <h4 style={{ fontWeight: '600', marginBottom: '16px', color: accentPrimary }}>Drug & Alcohol Testing Consent</h4>
        <div style={{ color: colors.gray, lineHeight: '1.7', marginBottom: '16px', fontSize: '0.95rem' }}>
          <p style={{ marginBottom: '12px' }}>
            As a condition of employment with {LYT_INFO.name}, I understand and agree to the following drug and alcohol testing policy:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li><strong>Pre-Employment Testing:</strong> I consent to a drug and/or alcohol test as part of the hiring process</li>
            <li><strong>Random Testing:</strong> I consent to unannounced random drug and/or alcohol testing during employment</li>
            <li><strong>Reasonable Suspicion:</strong> I consent to testing when there is reasonable suspicion of impairment</li>
            <li><strong>Post-Accident Testing:</strong> I consent to testing following workplace accidents or injuries</li>
            <li><strong>Return-to-Duty Testing:</strong> I consent to testing after any violation of the substance abuse policy</li>
          </ul>
          <p style={{ marginBottom: '12px' }}>
            I understand that a positive test result or refusal to submit to testing may result in withdrawal of a job offer, disciplinary action, or termination of employment.
          </p>
          <p>
            I authorize the release of test results to {LYT_INFO.name} and understand that results will be kept confidential in accordance with applicable laws.
          </p>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="drugTestConsent"
              checked={formData.drugTestConsent}
              onChange={handleChange}
              style={{ width: '20px', height: '20px', marginTop: '2px' }}
            />
            <span style={{ lineHeight: '1.5' }}>
              I have read, understand, and consent to the drug and alcohol testing policy described above. I agree to comply with all testing requirements as a condition of my employment.
            </span>
          </label>
        </div>

        {formData.drugTestConsent && (
          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Electronic Signature *</label>
            <SignaturePad
              signature={formData.drugTestSignature}
              onSignatureChange={(sig) => setFormData({ ...formData, drugTestSignature: sig })}
              darkMode={darkMode}
            />
          </div>
        )}
      </div>

      <div style={{ padding: '16px', backgroundColor: `${accentPrimary}10`, borderRadius: '8px', marginTop: '24px' }}>
        <p style={{ fontSize: '0.9rem', color: colors.gray }}>
          <strong>Note:</strong> Both consents are required to proceed with your employment application. Your signatures confirm that you understand and agree to these policies.
        </p>
      </div>
    </div>
  );

  const renderSafetyTraining = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Safety Training Acknowledgment</h3>
      
      {/* HSE Manual Download */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: darkMode ? '#0a2540' : '#dbeafe', 
        borderRadius: '8px', 
        marginBottom: '24px',
        border: `2px solid ${accentPrimary}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <FileText size={24} style={{ color: accentPrimary }} />
          <h4 style={{ fontWeight: '600', color: accentPrimary, margin: 0 }}>Required Reading: LYT HSE Safety Manual</h4>
        </div>
        <p style={{ color: darkMode ? '#94a3b8' : '#475569', marginBottom: '16px', lineHeight: '1.6' }}>
          Before signing below, you must download and read the complete LYT Communications Health, Safety & Environment (HSE) Manual. 
          This manual covers PPE requirements, trenching safety, HDD operations, aerial work, emergency procedures, and more.
        </p>
        <a 
          href="/LYT_HSE_Manual_v2.3.pdf" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: accentPrimary,
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}
        >
          <FileText size={18} />
          Download HSE Manual v2.3 (PDF)
        </a>
      </div>

      <div style={{ padding: '24px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
        <h4 style={{ fontWeight: '600', marginBottom: '16px' }}>Safety Commitment</h4>
        <p style={{ color: colors.gray, lineHeight: '1.7', marginBottom: '16px' }}>
          As an employee of {LYT_INFO.name}, I understand and agree to the following:
        </p>
        <ul style={{ color: colors.gray, lineHeight: '1.8', paddingLeft: '20px' }}>
          <li>I have read and understand the LYT HSE Manual v2.3</li>
          <li>I will follow all safety procedures and protocols at all times</li>
          <li>I will wear required Personal Protective Equipment (PPE) on job sites</li>
          <li>I will report any unsafe conditions or incidents immediately</li>
          <li>I will attend all required safety training sessions</li>
          <li>I have Stop Work Authority and will use it when conditions are unsafe</li>
          <li>I will call 811 before any ground disturbance</li>
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
            I have read the LYT HSE Manual v2.3 and agree to comply with all {LYT_INFO.name} safety policies and procedures. 
            I understand that failure to follow these policies may result in disciplinary action up to and including termination.
          </span>
        </label>
      </div>

      <SignaturePad onSignatureChange={handleSafetySignatureChange} label="Signature" darkMode={darkMode} />
      
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
      case 3: return renderIdVerification();
      case 4: return renderEmergencyContact();
      case 5: return renderConsents();
      case 6: return renderSafetyTraining();
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
        return formData.idFile;
      case 4:
        return formData.emergencyName && formData.emergencyRelation && formData.emergencyPhone;
      case 5:
        return formData.backgroundCheckConsent && formData.backgroundCheckSignature && formData.drugTestConsent && formData.drugTestSignature;
      case 6:
        return formData.safetyAcknowledged && formData.safetySignature;
      default:
        return false;
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <CheckCircle size={80} color={accentSecondary} style={{ marginBottom: '24px' }} />
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
              backgroundColor: accentPrimary,
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
          <span style={{ color: accentPrimary }}>Employee</span> Onboarding
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
                  backgroundColor: idx <= currentStep ? accentPrimary : (darkMode ? colors.dark : '#e5e7eb'),
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
              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: `${accentError}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: accentError }}>
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
                    backgroundColor: canProceed() ? accentPrimary : '#ccc',
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
                    backgroundColor: canProceed() ? accentSecondary : '#ccc',
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
