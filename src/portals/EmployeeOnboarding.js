import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, User, FileText, CreditCard, Heart, Shield, AlertCircle, Upload, ChevronDown, Sun, Moon } from 'lucide-react';
import { colors, LYT_INFO, URLS } from '../config/constants';
import SignaturePad from '../components/SignaturePad';
import SSNInput from '../components/SSNInput';
import { fillW4, createFormPdf } from '../services/pdfService';

const EmployeeOnboarding = ({ setCurrentPage, darkMode, setDarkMode }) => {
  // Onboarding section accent colors (orange/green)
  const accentPrimary = darkMode ? '#ff6b35' : '#28a745';       // Orange vs Green
  const accentSecondary = darkMode ? '#c850c0' : '#00b4d8';     // Pink vs Teal
  const accentGradient = darkMode 
    ? 'linear-gradient(135deg, #ff6b35 0%, #c850c0 100%)'
    : 'linear-gradient(135deg, #28a745 0%, #00b4d8 100%)';
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';
  
  // Logo text colors
  const logoLY = darkMode ? '#e6c4d9' : '#0a3a7d';
  const logoT = darkMode ? '#e6c4d9' : '#2ec7c0';
  const logoComm = darkMode ? '#ffffff' : '#1e293b';

  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [showW4Pdf, setShowW4Pdf] = useState(false);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showStepDropdown, setShowStepDropdown] = useState(false);
  
  // Hidden skip feature - triple tap counter
  const [skipTapCount, setSkipTapCount] = useState(0);
  const [skipTapTimer, setSkipTapTimer] = useState(null);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Hidden skip: triple-tap on header title to skip to next step
  const handleHeaderTap = () => {
    if (skipTapTimer) clearTimeout(skipTapTimer);
    
    const newCount = skipTapCount + 1;
    setSkipTapCount(newCount);
    
    if (newCount >= 3) {
      // Triple tap detected - skip to next step (or cycle back)
      setCurrentStep((prev) => (prev + 1) % steps.length);
      setSkipTapCount(0);
    } else {
      // Reset counter after 500ms of no taps
      const timer = setTimeout(() => setSkipTapCount(0), 500);
      setSkipTapTimer(timer);
    }
  };

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
    // W-4 Page 3 Worksheet (Step 2b - Multiple Jobs)
    worksheet: {
      step2b_line1: '',
      step2b_line2a: '',
      step2b_line2b: '',
      step2b_line2c: '',
      step2b_line3: '',
      step2b_line4: '',
    },
    // W-4 Page 4 Worksheet (Step 4b - Deductions)
    deductionsWorksheet: {
      line1a: '',
      line1b: '',
      line1c: '',
      line1d: '',
      line3a: '',
      line3b: '',
      line3c: '',
      line5: '',
      line6a: '',
      line6b: '',
      line6c: '',
      line6d: '',
      line6e: '',
      line7: '',
      line8a: '',
      line8b: '',
      line9: '',
      line10: '',
      line11: '',
      line12: '',
      line13: '',
      line14: '',
      line15: '',
    },
    showWorksheets: false,
    showAdvanced: false,
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
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // ========== CAPTURE IP ADDRESS FOR ESIGN COMPLIANCE ==========
      let ipAddress = 'Unable to capture';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (ipErr) {
        console.log('IP capture failed:', ipErr);
      }
      const signatureTimestamp = new Date().toISOString();
      
      // ========== GENERATE FILLED PDFs ==========
      console.log('Generating filled PDFs...');
      
      // 0. Personal Information PDF (captures all Step 1 data)
      let personalInfoPdf = null;
      try {
        personalInfoPdf = await createFormPdf(
          'Employee Personal Information',
          [
            { title: 'PERSONAL DETAILS', fields: [
              { label: 'Full Name', value: fullName },
              { label: 'Email', value: formData.email },
              { label: 'Phone', value: formData.phone },
              { label: 'Date of Birth', value: formData.dateOfBirth },
              { label: 'SSN', value: formData.ssn ? `***-**-${formData.ssn.slice(-4)}` : '' },
            ]},
            { title: 'ADDRESS', fields: [
              { label: 'Street', value: formData.address },
              { label: 'City', value: formData.city },
              { label: 'State', value: formData.state },
              { label: 'ZIP', value: formData.zip },
            ]},
            { title: 'ELECTRONIC RECORD', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
              { label: 'Submitted', value: new Date().toLocaleString() },
            ]}
          ],
          null,
          { timestamp: new Date().toLocaleString(), ip: ipAddress }
        );
        console.log('Personal Info PDF created');
      } catch (e) {
        console.error('Personal Info error:', e);
      }
      
      // 1. Fill actual IRS W-4 form
      let w4Pdf = null;
      const signatureInfo = {
        timestamp: new Date().toLocaleString(),
        ip: ipAddress
      };
      try {
        w4Pdf = await fillW4({
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          ssn: formData.ssn,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          filingStatus: formData.filingStatus,
          multipleJobs: formData.multipleJobs,
          qualifyingChildren: formData.qualifyingChildren,
          otherDependents: formData.otherDependents,
          otherIncome: formData.otherIncome,
          deductions: formData.deductions,
          extraWithholding: formData.extraWithholding,
          worksheet: formData.worksheet,
          deductionsWorksheet: formData.deductionsWorksheet,
        }, formData.w4Signature, signatureInfo);
        console.log('W-4 PDF filled successfully');
      } catch (e) {
        console.error('W-4 error:', e);
      }
      
      // 2. Direct Deposit Authorization (with embedded voided check)
      let directDepositPdf = null;
      let voidedCheckImage = null;
      
      // Read voided check image if available
      if (formData.voidedCheck) {
        try {
          const reader = new FileReader();
          voidedCheckImage = await new Promise((resolve, reject) => {
            reader.onload = () => resolve({
              data: reader.result,
              mimeType: formData.voidedCheck.type
            });
            reader.onerror = reject;
            reader.readAsDataURL(formData.voidedCheck);
          });
        } catch (e) {
          console.error('Error reading voided check:', e);
        }
      }
      
      try {
        directDepositPdf = await createFormPdf(
          'Direct Deposit Authorization',
          [
            { title: 'EMPLOYEE', fields: [
              { label: 'Name', value: fullName },
              { label: 'Email', value: formData.email },
              { label: 'Phone', value: formData.phone },
            ]},
            { title: 'BANK INFORMATION', fields: [
              { label: 'Bank Name', value: formData.bankName },
              { label: 'Routing Number', value: formData.routingNumber },
              { label: 'Account Number', value: formData.accountNumber || '' },
              { label: 'Account Type', value: formData.accountType },
            ]},
            { title: 'AUTHORIZATION', paragraphs: [
              'I authorize LYT Communications, LLC to initiate credit entries to my account.',
              'This authorization remains in effect until I provide written notice to discontinue.',
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          formData.directDepositSignature,
          signatureInfo,
          voidedCheckImage
        );
        console.log('Direct Deposit PDF created');
      } catch (e) {
        console.error('Direct Deposit error:', e);
      }
      
      // 3. Emergency Contact
      let emergencyContactPdf = null;
      try {
        emergencyContactPdf = await createFormPdf(
          'Emergency Contact Information',
          [
            { title: 'EMPLOYEE', fields: [
              { label: 'Name', value: fullName },
              { label: 'Phone', value: formData.phone },
            ]},
            { title: 'EMERGENCY CONTACT', fields: [
              { label: 'Name', value: formData.emergencyName },
              { label: 'Relationship', value: formData.emergencyRelation },
              { label: 'Phone', value: formData.emergencyPhone },
              { label: 'Email', value: formData.emergencyEmail },
            ]}
          ],
          null,
          signatureInfo
        );
        console.log('Emergency Contact PDF created');
      } catch (e) {
        console.error('Emergency Contact error:', e);
      }
      
      // 4. Background Check Consent
      let backgroundCheckPdf = null;
      try {
        backgroundCheckPdf = await createFormPdf(
          'Background Check Authorization',
          [
            { title: 'APPLICANT', fields: [
              { label: 'Name', value: fullName },
              { label: 'DOB', value: formData.dateOfBirth },
              { label: 'SSN', value: formData.ssn || '' },
            ]},
            { title: 'AUTHORIZATION', paragraphs: [
              'I authorize LYT Communications, LLC to conduct a background investigation including criminal records, employment verification, education verification, and reference checks.',
            ], checkboxes: [
              { label: 'I authorize this background check', checked: formData.backgroundCheckConsent }
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          formData.backgroundCheckSignature,
          signatureInfo
        );
        console.log('Background Check PDF created');
      } catch (e) {
        console.error('Background Check error:', e);
      }
      
      // 5. Drug Test Consent
      let drugTestPdf = null;
      try {
        drugTestPdf = await createFormPdf(
          'Drug and Alcohol Testing Consent',
          [
            { title: 'EMPLOYEE', fields: [{ label: 'Name', value: fullName }]},
            { title: 'CONSENT', paragraphs: [
              'I consent to drug and alcohol testing as required by company policy.',
            ], checkboxes: [
              { label: 'Pre-employment testing required', checked: true },
              { label: 'Random testing may be conducted', checked: true },
              { label: 'Post-accident testing may be required', checked: true },
              { label: 'I consent to testing', checked: formData.drugTestConsent }
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          formData.drugTestSignature,
          signatureInfo
        );
        console.log('Drug Test PDF created');
      } catch (e) {
        console.error('Drug Test error:', e);
      }
      
      // 6. Safety Acknowledgment
      let safetyPdf = null;
      try {
        safetyPdf = await createFormPdf(
          'HSE Safety Acknowledgment',
          [
            { title: 'EMPLOYEE', fields: [{ label: 'Name', value: fullName }]},
            { title: 'ACKNOWLEDGMENT', paragraphs: [
              'I have received, read, and understand the LYT Communications HSE Manual.',
            ], checkboxes: [
              { label: 'Follow all safety procedures', checked: true },
              { label: 'Use required PPE', checked: true },
              { label: 'Report injuries immediately', checked: true },
              { label: 'Participate in safety training', checked: true },
              { label: 'I acknowledge the HSE Manual', checked: formData.safetyAcknowledged }
            ]},
            { title: 'ELECTRONIC SIGNATURE VERIFICATION', fields: [
              { label: 'IP Address', value: ipAddress },
              { label: 'Timestamp', value: signatureTimestamp },
            ]}
          ],
          formData.safetySignature,
          signatureInfo
        );
        console.log('Safety PDF created');
      } catch (e) {
        console.error('Safety error:', e);
      }

      // Prepare file uploads
      let voidedCheckData = null;
      if (formData.voidedCheck) {
        const reader = new FileReader();
        voidedCheckData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve({
            name: formData.voidedCheckName,
            data: reader.result.split(',')[1],
            mimeType: formData.voidedCheck.type
          });
          reader.onerror = reject;
          reader.readAsDataURL(formData.voidedCheck);
        });
      }

      let idFileData = null;
      if (formData.idFile) {
        const reader = new FileReader();
        idFileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve({
            name: formData.idFileName,
            data: reader.result.split(',')[1],
            mimeType: formData.idFile.type
          });
          reader.onerror = reject;
          reader.readAsDataURL(formData.idFile);
        });
      }

      // Build payload with filled PDFs
      // IMPORTANT: Use 'action' field (not 'type') with exact action name expected by Apps Script
      const payload = {
        action: 'submitEmployeeOnboarding',
        formData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          ssn: formData.ssn,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          bankName: formData.bankName,
          routingNumber: formData.routingNumber,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
          emergencyName: formData.emergencyName,
          emergencyPhone: formData.emergencyPhone,
          emergencyRelation: formData.emergencyRelation,
        },
        // ESIGN compliance
        signatureVerification: {
          ipAddress: ipAddress,
          timestamp: signatureTimestamp,
          userAgent: navigator.userAgent,
        },
        // PRE-FILLED PDFs (base64)
        filledPdfs: {
          personalInfo: personalInfoPdf,
          w4: w4Pdf,
          directDeposit: directDepositPdf,
          emergencyContact: emergencyContactPdf,
          backgroundCheck: backgroundCheckPdf,
          drugTest: drugTestPdf,
          safety: safetyPdf,
        },
        voidedCheck: voidedCheckData,
        idFile: idFileData,
        submittedAt: new Date().toISOString(),
      };

      console.log('Submitting with filled PDFs...');

      // Submit to Google Apps Script
      // Note: GAS returns a 302 redirect which can cause issues reading the response
      // The data IS processed even if we can't read the response
      let result = { success: false, error: 'Unknown error' };
      
      try {
        const response = await fetch(URLS.appsScript, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        });

        const text = await response.text();
        console.log('Response text:', text.substring(0, 500));
        
        // Try to parse as JSON
        try {
          result = JSON.parse(text);
        } catch (parseErr) {
          // Check if this looks like a Google redirect/error page
          if (text.includes('Moved Temporarily')) {
            // GAS processed the request but redirected
            // The data was submitted - we just can't confirm
            result = { 
              success: true, 
              message: 'Submitted successfully',
              note: 'Check Google Drive for confirmation'
            };
          } else if (text.includes('Page Not Found') || text.includes('unable to open')) {
            result = { success: false, error: 'Server error - please try again' };
          } else {
            result = { success: false, error: 'Unexpected response from server' };
          }
        }
      } catch (fetchErr) {
        console.error('Fetch error:', fetchErr);
        result = { success: false, error: 'Network error: ' + fetchErr.message };
      }
      
      console.log('Result:', result);

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Submission failed.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit: ' + err.message);
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

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: '16px' }}>
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

  const renderW4Form = () => {
    // Auto-calculate totals
    const childCredit = (parseInt(formData.qualifyingChildren) || 0) * 2000;
    const otherDependentCredit = (parseInt(formData.otherDependents) || 0) * 500;
    const totalDependentCredit = childCredit + otherDependentCredit;

    const helpTextStyle = {
      fontSize: '0.85rem',
      color: darkMode ? '#9ca3af' : '#6b7280',
      marginTop: '8px',
      lineHeight: '1.5',
    };

    const tipBoxStyle = {
      backgroundColor: darkMode ? '#1e3a5f' : '#eff6ff',
      border: `1px solid ${darkMode ? '#2563eb' : '#bfdbfe'}`,
      borderRadius: '8px',
      padding: '12px 16px',
      marginTop: '12px',
      fontSize: '0.85rem',
      color: darkMode ? '#93c5fd' : '#1e40af',
    };

    const sectionStyle = {
      marginBottom: '24px',
      padding: '20px',
      backgroundColor: darkMode ? '#111827' : '#f8fafc',
      borderRadius: '8px',
    };

    return (
      <div>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>Tax Withholding Setup</h3>
          <p style={helpTextStyle}>
            This form tells us how much federal tax to take out of each paycheck. Don't worry - we'll walk you through it step by step. Most people only need to answer 2-3 simple questions.
          </p>
        </div>

        {/* View PDF Button */}
        <div style={{ marginBottom: '24px' }}>
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
            {showW4Pdf ? 'Hide Official Form' : 'View Official IRS Form'}
          </button>
        </div>

        {showW4Pdf && (
          <div style={{ marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${darkMode ? '#374151' : '#ddd'}` }}>
            <iframe
              src={`${URLS.w4Pdf}#toolbar=0&navpanes=0&scrollbar=1`}
              style={{ width: '100%', height: isMobile ? '350px' : '600px', border: 'none', backgroundColor: '#fff' }}
              title="W-4 Form"
            />
          </div>
        )}

        {/* QUESTION 1: Filing Status */}
        <div style={sectionStyle}>
          <label style={{ ...labelStyle, marginBottom: '4px', fontSize: '1.1rem' }}>
            What's your tax filing status? *
          </label>
          <p style={helpTextStyle}>This is how you file (or plan to file) your federal tax return.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {/* Single */}
            <label style={{ 
              display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', 
              backgroundColor: formData.filingStatus === 'single' ? (darkMode ? '#1e3a5f' : '#eff6ff') : 'transparent', 
              borderRadius: '8px', border: `2px solid ${formData.filingStatus === 'single' ? accentPrimary : (darkMode ? '#374151' : '#e5e7eb')}` 
            }}>
              <input
                type="radio"
                name="filingStatus"
                value="single"
                checked={formData.filingStatus === 'single'}
                onChange={handleChange}
                style={{ width: '20px', height: '20px', marginTop: '2px' }}
              />
              <div>
                <span style={{ fontWeight: '500' }}>Single</span>
                <p style={{ ...helpTextStyle, marginTop: '4px' }}>
                  Choose this if you're not married. Also choose this if you're legally married but filing a separate return from your spouse.
                </p>
              </div>
            </label>

            {/* Married */}
            <label style={{ 
              display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', 
              backgroundColor: formData.filingStatus === 'married' ? (darkMode ? '#1e3a5f' : '#eff6ff') : 'transparent', 
              borderRadius: '8px', border: `2px solid ${formData.filingStatus === 'married' ? accentPrimary : (darkMode ? '#374151' : '#e5e7eb')}` 
            }}>
              <input
                type="radio"
                name="filingStatus"
                value="married"
                checked={formData.filingStatus === 'married'}
                onChange={handleChange}
                style={{ width: '20px', height: '20px', marginTop: '2px' }}
              />
              <div>
                <span style={{ fontWeight: '500' }}>Married Filing Jointly</span>
                <p style={{ ...helpTextStyle, marginTop: '4px' }}>
                  Choose this if you're legally married and you and your spouse file one tax return together. This usually gives the best tax benefits.
                </p>
              </div>
            </label>

            {/* Head of Household */}
            <label style={{ 
              display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', 
              backgroundColor: formData.filingStatus === 'head' ? (darkMode ? '#1e3a5f' : '#eff6ff') : 'transparent', 
              borderRadius: '8px', border: `2px solid ${formData.filingStatus === 'head' ? accentPrimary : (darkMode ? '#374151' : '#e5e7eb')}` 
            }}>
              <input
                type="radio"
                name="filingStatus"
                value="head"
                checked={formData.filingStatus === 'head'}
                onChange={handleChange}
                style={{ width: '20px', height: '20px', marginTop: '2px' }}
              />
              <div>
                <span style={{ fontWeight: '500' }}>Head of Household</span>
                <p style={{ ...helpTextStyle, marginTop: '4px' }}>
                  Choose this if you're unmarried AND you pay more than half the cost of keeping up a home for yourself and a qualifying person (like a child or parent who lives with you).
                </p>
              </div>
            </label>
          </div>

          {/* What counts as married explanation */}
          <div style={{ ...tipBoxStyle, marginTop: '16px' }}>
            <strong>💍 What counts as "married"?</strong>
            <p style={{ marginTop: '6px' }}>
              You're considered married if you were legally married on the last day of the tax year. This includes:
            </p>
            <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
              <li>Traditional marriage recognized by your state</li>
              <li>Common-law marriage (if your state recognizes it)</li>
              <li>Same-sex marriage</li>
            </ul>
            <p style={{ marginTop: '8px' }}>
              You're considered unmarried if you're legally separated under a divorce or separate maintenance decree, or if your spouse didn't live in your home for the last 6 months of the year.
            </p>
          </div>
        </div>

        {/* QUESTION 2: Spouse Works (only if married) */}
        {formData.filingStatus === 'married' && (
          <div style={sectionStyle}>
            <label style={{ ...labelStyle, marginBottom: '4px', fontSize: '1.1rem' }}>
              Does your spouse also work?
            </label>
            <p style={helpTextStyle}>
              If both you and your spouse have jobs, we need to adjust your withholding so you don't end up owing taxes at the end of the year.
            </p>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '16px' }}>
              <input
                type="checkbox"
                name="multipleJobs"
                checked={formData.multipleJobs}
                onChange={handleChange}
                style={{ width: '20px', height: '20px' }}
              />
              <span>Yes, my spouse works (or I have more than one job myself)</span>
            </label>
            
            {formData.multipleJobs && (
              <div style={tipBoxStyle}>
                <strong>💡 Tip:</strong> When both spouses work, the IRS recommends checking this box on BOTH of your W-4 forms (yours and your spouse's) to avoid owing taxes when you file your return.
              </div>
            )}
          </div>
        )}

        {/* QUESTION 3: Kids / Dependents */}
        <div style={sectionStyle}>
          <label style={{ ...labelStyle, marginBottom: '4px', fontSize: '1.1rem' }}>
            Do you have any dependents?
          </label>
          <p style={helpTextStyle}>
            Claiming dependents reduces how much tax is taken from your paycheck. If you don't have any dependents, just leave these at 0.
          </p>

          {/* Detailed explanation of dependents */}
          <div style={{ ...tipBoxStyle, marginTop: '12px', marginBottom: '20px' }}>
            <strong>👨‍👩‍👧‍👦 Who counts as a dependent?</strong>
            
            <div style={{ marginTop: '12px' }}>
              <strong>Qualifying Child (each = $2,000 credit):</strong>
              <p style={{ marginTop: '4px' }}>Your child, stepchild, foster child, sibling, or their descendant who meets ALL of these:</p>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li>Under age 17 at the end of the year</li>
                <li>Lived with you for more than half the year</li>
                <li>Didn't pay for more than half of their own living expenses</li>
                <li>Is a U.S. citizen, national, or resident</li>
                <li>You're the only one claiming them</li>
              </ul>
            </div>

            <div style={{ marginTop: '16px' }}>
              <strong>Other Dependent (each = $500 credit):</strong>
              <p style={{ marginTop: '4px' }}>Someone who doesn't qualify as a "child" but meets these requirements:</p>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li>Is a relative (parent, grandparent, aunt, uncle, in-law, etc.) OR lived with you all year</li>
                <li>Earned less than $4,700 in 2024</li>
                <li>You provided more than half of their financial support</li>
                <li>Is a U.S. citizen, national, or resident</li>
              </ul>
            </div>

            <div style={{ marginTop: '16px', padding: '10px', backgroundColor: darkMode ? '#1e3a5f' : '#dbeafe', borderRadius: '6px' }}>
              <strong>⚠️ Important:</strong> Your spouse is NEVER a dependent - they're handled by your filing status above, not here.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.95rem' }}>Children under 17</label>
              <p style={{ ...helpTextStyle, marginBottom: '8px', marginTop: '4px' }}>$2,000 tax credit each</p>
              <input
                type="number"
                name="qualifyingChildren"
                value={formData.qualifyingChildren}
                onChange={handleChange}
                min={0}
                max={20}
                style={inputStyle}
                placeholder="0"
              />
              {formData.qualifyingChildren > 0 && (
                <p style={{ color: colors.green, marginTop: '8px', fontWeight: '600' }}>
                  = ${childCredit.toLocaleString()} credit
                </p>
              )}
            </div>
            
            <div>
              <label style={{ ...labelStyle, fontSize: '0.95rem' }}>Other dependents</label>
              <p style={{ ...helpTextStyle, marginBottom: '8px', marginTop: '4px' }}>$500 tax credit each</p>
              <input
                type="number"
                name="otherDependents"
                value={formData.otherDependents}
                onChange={handleChange}
                min={0}
                max={20}
                style={inputStyle}
                placeholder="0"
              />
              {formData.otherDependents > 0 && (
                <p style={{ color: colors.green, marginTop: '8px', fontWeight: '600' }}>
                  = ${otherDependentCredit.toLocaleString()} credit
                </p>
              )}
            </div>
          </div>

          {totalDependentCredit > 0 && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: darkMode ? '#064e3b' : '#d1fae5', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: '600', color: darkMode ? '#6ee7b7' : '#065f46' }}>
                🎉 Total Dependent Tax Credit: ${totalDependentCredit.toLocaleString()}
              </span>
              <p style={{ fontSize: '0.85rem', color: darkMode ? '#a7f3d0' : '#047857', marginTop: '4px' }}>
                This amount will reduce your tax bill!
              </p>
            </div>
          )}
        </div>

        {/* QUESTION 4: Extra Withholding */}
        <div style={sectionStyle}>
          <label style={{ ...labelStyle, marginBottom: '4px', fontSize: '1.1rem' }}>
            Want extra tax withheld? (Optional)
          </label>
          <p style={helpTextStyle}>
            Most people skip this section. But if you've owed money when filing taxes before, you can have us take out a little extra from each paycheck to avoid that surprise.
          </p>
          
          <div style={{ marginTop: '16px' }}>
            <label style={{ ...labelStyle, fontSize: '0.95rem' }}>Extra amount per paycheck</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>$</span>
              <input
                type="number"
                name="extraWithholding"
                value={formData.extraWithholding}
                onChange={handleChange}
                min={0}
                style={{ ...inputStyle, maxWidth: '150px' }}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Advanced Options (hidden by default) */}
        <div style={sectionStyle}>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: textColor,
            }}
          >
            <span style={{ fontWeight: '500' }}>⚙️ Advanced Options (most people skip this)</span>
            <span style={{ fontSize: '1.2rem' }}>{formData.showAdvanced ? '−' : '+'}</span>
          </button>
          
          {formData.showAdvanced && (
            <div style={{ marginTop: '16px' }}>
              <p style={helpTextStyle}>These options are for special situations. If you're not sure what they mean, leave them blank.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '0.9rem' }}>Other income (not from jobs)</label>
                  <p style={{ ...helpTextStyle, fontSize: '0.8rem', marginBottom: '6px' }}>Interest, dividends, retirement distributions, etc.</p>
                  <input
                    type="number"
                    name="otherIncome"
                    value={formData.otherIncome}
                    onChange={handleChange}
                    placeholder="$0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '0.9rem' }}>Itemized deductions</label>
                  <p style={{ ...helpTextStyle, fontSize: '0.8rem', marginBottom: '6px' }}>Only if greater than standard deduction (~$14,600)</p>
                  <input
                    type="number"
                    name="deductions"
                    value={formData.deductions}
                    onChange={handleChange}
                    placeholder="$0"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Exempt checkbox */}
              <div style={{ marginTop: '20px', padding: '12px', backgroundColor: darkMode ? '#7f1d1d' : '#fef2f2', borderRadius: '8px', border: `1px solid ${darkMode ? '#dc2626' : '#fecaca'}` }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="exempt"
                    checked={formData.exempt}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', marginTop: '2px' }}
                  />
                  <div>
                    <span style={{ fontWeight: '500', color: darkMode ? '#fca5a5' : '#b91c1c' }}>I claim EXEMPT from withholding</span>
                    <p style={{ ...helpTextStyle, color: darkMode ? '#fca5a5' : '#991b1b', marginTop: '4px' }}>
                      ⚠️ Only check this if BOTH are true: (1) Last year you got a full refund of ALL federal income tax withheld, AND (2) This year you expect the same. This is rare - most people should NOT check this.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Signature Section */}
        <div style={sectionStyle}>
          <label style={{ ...labelStyle, marginBottom: '4px', fontSize: '1.1rem' }}>
            Sign to Complete *
          </label>
          <p style={helpTextStyle}>
            By signing below, you certify that the information you've provided is true and correct to the best of your knowledge.
          </p>
          
          <div style={{ marginTop: '16px' }}>
            <SignaturePad onSignatureChange={handleW4SignatureChange} label="Your Signature" darkMode={darkMode} />
          </div>

          {/* Auto-filled info display */}
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: darkMode ? '#1f2937' : '#f3f4f6', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '12px' }}>✅ These fields are auto-filled from your information:</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
              <div><strong>Name:</strong> {formData.firstName} {formData.middleName} {formData.lastName}</div>
              <div><strong>SSN:</strong> ***-**-{(formData.ssn || '').slice(-4)}</div>
              <div><strong>Address:</strong> {formData.address}</div>
              <div><strong>City/State/ZIP:</strong> {formData.city}, {formData.state} {formData.zip}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>Employer:</strong> LYT Communications, LLC</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      {/* Top Bar with Sun/Moon Toggle */}
      <div style={{ backgroundColor: darkMode ? '#112240' : '#f1f5f9', padding: '6px 20px', display: 'flex', justifyContent: 'flex-end' }}>
        {setDarkMode && (
          <button onClick={() => setDarkMode(!darkMode)} style={{ backgroundColor: 'transparent', border: 'none', color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '4px 8px', borderRadius: '6px', transition: 'all 0.2s ease' }}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span className="hide-mobile-toggle">{darkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
        )}
      </div>
      
      {/* Header - Triple tap title to skip steps (hidden feature) */}
      <header style={{ padding: isMobile ? '12px 16px' : '16px 20px', backgroundColor: darkMode ? '#0d1b2a' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
        <button
          onClick={() => setCurrentPage('onboarding')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: 'none', color: darkMode ? 'rgba(255,255,255,0.8)' : '#64748b', fontSize: isMobile ? '0.9rem' : '1rem', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'all 0.2s ease' }}
        >
          <ArrowLeft size={isMobile ? 18 : 20} /> {!isMobile && 'Back'}
        </button>
        <div 
          onClick={handleHeaderTap}
          style={{ fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '700', color: textColor, cursor: 'default', userSelect: 'none' }}
        >
          <span style={{ color: accentPrimary }}>Employee</span> Onboarding
        </div>
        <button
          onClick={() => setCurrentPage('home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
        >
          <div style={{ fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '700' }}>
            <span style={{ color: logoLY }}>ly</span><span style={{ color: logoT }}>t</span>
          </div>
        </button>
      </header>

      {/* Progress Steps - Mobile: Dropdown, Desktop: Full bar */}
      {isMobile ? (
        <div style={{ padding: '12px 16px', backgroundColor: cardBg, borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
          <button
            onClick={() => setShowStepDropdown(!showStepDropdown)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: darkMode ? colors.dark : '#f1f5f9',
              border: `1px solid ${darkMode ? '#374151' : '#e2e8f0'}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: textColor,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: accentPrimary,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '0.9rem',
              }}>
                {currentStep + 1}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{steps[currentStep].title}</div>
                <div style={{ fontSize: '0.75rem', color: colors.gray }}>Step {currentStep + 1} of {steps.length}</div>
              </div>
            </div>
            <ChevronDown size={20} style={{ transform: showStepDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          {showStepDropdown && (
            <div style={{
              marginTop: '8px',
              backgroundColor: darkMode ? colors.dark : '#fff',
              border: `1px solid ${darkMode ? '#374151' : '#e2e8f0'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  onClick={() => { setShowStepDropdown(false); }}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: idx === currentStep ? (darkMode ? '#374151' : '#f1f5f9') : 'transparent',
                    borderBottom: idx < steps.length - 1 ? `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` : 'none',
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: idx < currentStep ? accentSecondary : idx === currentStep ? accentPrimary : (darkMode ? '#4b5563' : '#e5e7eb'),
                    color: idx <= currentStep ? '#fff' : colors.gray,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}>
                    {idx < currentStep ? <CheckCircle size={16} /> : idx + 1}
                  </div>
                  <span style={{ color: idx <= currentStep ? textColor : colors.gray, fontSize: '0.9rem' }}>{step.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
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
      )}

      {/* Form Content */}
      <main style={{ padding: isMobile ? '20px 12px' : '40px 20px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ backgroundColor: cardBg, borderRadius: isMobile ? '12px' : '16px', padding: isMobile ? '16px' : '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            {renderStepContent()}

            {error && (
              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: `${accentError}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: accentError }}>
                <AlertCircle size={20} /> {error}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: isMobile ? '24px' : '32px', paddingTop: isMobile ? '16px' : '24px', borderTop: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, gap: '12px' }}>
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                style={{
                  padding: isMobile ? '10px 16px' : '12px 24px',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  backgroundColor: 'transparent',
                  border: `1px solid ${currentStep === 0 ? '#ccc' : colors.gray}`,
                  color: currentStep === 0 ? '#ccc' : textColor,
                  borderRadius: '8px',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flex: isMobile ? 1 : 'none',
                  justifyContent: 'center',
                }}
              >
                <ArrowLeft size={isMobile ? 16 : 18} /> {isMobile ? 'Back' : 'Previous'}
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  style={{
                    padding: isMobile ? '10px 16px' : '12px 24px',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    backgroundColor: canProceed() ? accentPrimary : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: canProceed() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: isMobile ? 1 : 'none',
                    justifyContent: 'center',
                  }}
                >
                  Next <ArrowRight size={isMobile ? 16 : 18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  style={{
                    padding: isMobile ? '10px 16px' : '12px 24px',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    backgroundColor: canProceed() ? accentSecondary : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: canProceed() && !submitting ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: isMobile ? 1 : 'none',
                    justifyContent: 'center',
                  }}
                >
                  {submitting ? 'Submitting...' : (isMobile ? 'Complete' : 'Complete Onboarding')}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile-toggle { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default EmployeeOnboarding;
