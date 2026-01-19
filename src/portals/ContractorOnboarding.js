import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Building, FileText, FileCheck, Shield, Users, Wrench, DollarSign, CreditCard, AlertCircle, Upload } from 'lucide-react';
import { colors, LYT_INFO, URLS, skillOptions } from '../config/constants';
import SignaturePad from '../components/SignaturePad';
import EINInput from '../components/EINInput';
import SSNInput from '../components/SSNInput';

const ContractorOnboarding = ({ setCurrentPage, darkMode }) => {
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
  const [showMsaPdf, setShowMsaPdf] = useState(false);
  const [showW9Pdf, setShowW9Pdf] = useState(false);

  const [formData, setFormData] = useState({
    // Company Info
    companyName: '',
    dba: '',
    entityType: '',
    contactName: '',
    contactTitle: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    // MSA
    msaSignature: null,
    msaDate: new Date().toISOString().split('T')[0],
    witnessName: '',
    witnessDate: '',
    // W-9
    taxIdType: 'ein',
    ein: '',
    ssn: '',
    taxClassification: '',
    exemptPayeeCode: '',
    fatcaCode: '',
    w9Signature: null,
    w9Date: new Date().toISOString().split('T')[0],
    // Insurance
    coiFile: null,
    coiFileName: '',
    coiExpiration: '',
    liabilityAmount: '',
    workersCompAmount: '',
    // Fleet & Personnel
    fleet: [{ type: '', count: '', description: '' }],
    personnel: [{ name: '', role: '', certifications: '' }],
    // Skills
    skills: [],
    otherSkills: '',
    // Rate Card
    rateCardAccepted: false,
    // Banking
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
  });

  const steps = [
    { id: 'company', title: 'Company Info', icon: Building },
    { id: 'msa', title: 'MSA Agreement', icon: FileText },
    { id: 'w9', title: 'W-9 Tax Form', icon: FileCheck },
    { id: 'insurance', title: 'Insurance', icon: Shield },
    { id: 'fleet', title: 'Fleet & Personnel', icon: Users },
    { id: 'skills', title: 'Skills', icon: Wrench },
    { id: 'rates', title: 'Rate Card', icon: DollarSign },
    { id: 'banking', title: 'Banking', icon: CreditCard },
  ];

  const entityTypes = [
    { value: 'sole', label: 'Sole Proprietor' },
    { value: 'llc-c', label: 'LLC (taxed as C-Corp)' },
    { value: 'llc-s', label: 'LLC (taxed as S-Corp)' },
    { value: 'llc-p', label: 'LLC (taxed as Partnership)' },
    { value: 'c-corp', label: 'C Corporation' },
    { value: 's-corp', label: 'S Corporation' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'trust', label: 'Trust/Estate' },
    { value: 'other', label: 'Other' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSkillToggle = (skill) => {
    const newSkills = formData.skills.includes(skill)
      ? formData.skills.filter((s) => s !== skill)
      : [...formData.skills, skill];
    setFormData({ ...formData, skills: newSkills });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        coiFile: file,
        coiFileName: file.name,
      });
    }
  };

  const addFleetItem = () => {
    setFormData({
      ...formData,
      fleet: [...formData.fleet, { type: '', count: '', description: '' }],
    });
  };

  const updateFleetItem = (index, field, value) => {
    const newFleet = [...formData.fleet];
    newFleet[index][field] = value;
    setFormData({ ...formData, fleet: newFleet });
  };

  const removeFleetItem = (index) => {
    if (formData.fleet.length > 1) {
      setFormData({ ...formData, fleet: formData.fleet.filter((_, i) => i !== index) });
    }
  };

  const addPersonnelItem = () => {
    setFormData({
      ...formData,
      personnel: [...formData.personnel, { name: '', role: '', certifications: '' }],
    });
  };

  const updatePersonnelItem = (index, field, value) => {
    const newPersonnel = [...formData.personnel];
    newPersonnel[index][field] = value;
    setFormData({ ...formData, personnel: newPersonnel });
  };

  const removePersonnelItem = (index) => {
    if (formData.personnel.length > 1) {
      setFormData({ ...formData, personnel: formData.personnel.filter((_, i) => i !== index) });
    }
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
      // Prepare COI file as base64 if uploaded
      let coiFileData = null;
      if (formData.coiFile) {
        const reader = new FileReader();
        coiFileData = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({
              name: formData.coiFileName,
              data: base64,
              mimeType: formData.coiFile.type
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(formData.coiFile);
        });
      }

      // Prepare data for Google Apps Script
      const payload = {
        type: 'contractor',
        formData: {
          companyName: formData.companyName,
          dba: formData.dba,
          entityType: formData.entityType,
          contactName: formData.contactName,
          contactTitle: formData.contactTitle,
          contactEmail: formData.email,
          contactPhone: formData.phone,
          companyAddress: formData.address,
          companyCity: formData.city,
          companyState: formData.state,
          companyZip: formData.zip,
          // Tax ID
          ein: formData.taxIdType === 'ein' ? formData.ein : '',
          ssn: formData.taxIdType === 'ssn' ? formData.ssn : '',
          taxClassification: formData.taxClassification,
          // Insurance
          insuranceExpiration: formData.coiExpiration,
          liabilityAmount: formData.liabilityAmount,
          workersCompAmount: formData.workersCompAmount,
          coiUploaded: !!formData.coiFile,
          // Fleet & Personnel
          fleet: formData.fleet.filter(f => f.type || f.description),
          personnel: formData.personnel.filter(p => p.name || p.role),
          // Skills
          skills: formData.skills,
          otherSkills: formData.otherSkills,
          // Banking
          bankName: formData.bankName,
          routingNumber: formData.routingNumber,
          accountLast4: formData.accountNumber ? formData.accountNumber.slice(-4) : '',
          accountType: formData.accountType,
        },
        documents: {
          msa: { 
            signed: !!formData.msaSignature, 
            signedAt: formData.msaSignature ? new Date().toISOString() : null 
          },
          w9: { 
            signed: !!formData.w9Signature, 
            signedAt: formData.w9Signature ? new Date().toISOString() : null 
          },
          rateCard: {
            signed: formData.rateCardAccepted,
            signedAt: formData.rateCardAccepted ? new Date().toISOString() : null
          }
        },
        coiFile: coiFileData
      };

      console.log('Submitting contractor onboarding:', payload);

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

  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
    borderRadius: '8px',
    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    color: darkMode ? '#f9fafb' : '#1f2937',
    boxSizing: 'border-box',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  // Note: option styling is limited in browsers, but we set background on select
  const optionStyle = {
    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    color: darkMode ? '#f9fafb' : '#1f2937',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    fontSize: '0.9rem',
    color: textColor,
  };

  // Step renderers
  const renderCompanyInfo = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Company Information</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Company Name *</label>
          <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>DBA (if applicable)</label>
          <input type="text" name="dba" value={formData.dba} onChange={handleChange} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Entity Type *</label>
        <select name="entityType" value={formData.entityType} onChange={handleChange} required style={selectStyle}>
          <option value="" style={optionStyle}>Select entity type...</option>
          {entityTypes.map((type) => (
            <option key={type.value} value={type.value} style={optionStyle}>{type.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Contact Name *</label>
          <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Title *</label>
          <input type="text" name="contactTitle" value={formData.contactTitle} onChange={handleChange} required style={inputStyle} placeholder="e.g., Owner, President" />
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
      </div>

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

  const renderMSA = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Master Subcontractor Agreement</h3>
        <button
          onClick={() => setShowMsaPdf(!showMsaPdf)}
          style={{ 
            padding: '8px 16px',
            backgroundColor: showMsaPdf ? accentPrimary : 'transparent',
            border: `1px solid ${accentPrimary}`,
            borderRadius: '6px',
            color: showMsaPdf ? '#fff' : accentPrimary,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {showMsaPdf ? 'Hide Agreement' : 'View Full Agreement (PDF)'}
        </button>
      </div>

      {/* Embedded PDF Viewer */}
      {showMsaPdf && (
        <div style={{ marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${darkMode ? '#374151' : '#ddd'}` }}>
          <iframe
            src={`${URLS.msaPdf}#toolbar=0&navpanes=0&scrollbar=1`}
            style={{
              width: '100%',
              height: '500px',
              border: 'none',
              backgroundColor: '#fff',
            }}
            title="Master Subcontractor Agreement"
          />
          <div style={{ padding: '12px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderTop: `1px solid ${darkMode ? '#374151' : '#ddd'}`, textAlign: 'center' }}>
            <a
              href={URLS.msaPdf}
              download="LYT_MSA.pdf"
              style={{ color: accentPrimary, fontSize: '0.85rem', textDecoration: 'none' }}
            >
              Download PDF
            </a>
          </div>
        </div>
      )}

      <div style={{ padding: '24px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px', marginBottom: '24px', maxHeight: '300px', overflow: 'auto' }}>
        <h4 style={{ fontWeight: '600', marginBottom: '12px' }}>Agreement Summary</h4>
        <p style={{ color: colors.gray, lineHeight: '1.7', marginBottom: '12px' }}>
          This Master Subcontractor Agreement ("Agreement") is entered into between {LYT_INFO.name} ("Company") 
          and the Subcontractor identified below.
        </p>
        <p style={{ color: colors.gray, lineHeight: '1.7', marginBottom: '12px' }}>
          By signing below, Subcontractor agrees to:
        </p>
        <ul style={{ color: colors.gray, lineHeight: '1.8', paddingLeft: '20px', marginBottom: '12px' }}>
          <li>Perform services in accordance with all applicable laws and regulations</li>
          <li>Maintain required insurance coverage throughout the term</li>
          <li>Comply with all safety requirements and Company policies</li>
          <li>Submit accurate and timely invoices per the agreed rate schedule</li>
          <li>Maintain confidentiality of all proprietary information</li>
          <li>Indemnify Company against claims arising from Subcontractor's work</li>
        </ul>
        <p style={{ color: colors.gray, lineHeight: '1.7', fontSize: '0.9rem' }}>
          <strong>Please review the full PDF agreement before signing.</strong>
        </p>
      </div>

      <SignaturePad
        onSignatureChange={(sig) => setFormData({ ...formData, msaSignature: sig })}
        label="Authorized Signature"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" name="msaDate" value={formData.msaDate} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Witness Name (if required)</label>
          <input type="text" name="witnessName" value={formData.witnessName} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Witness Date</label>
          <input type="date" name="witnessDate" value={formData.witnessDate} onChange={handleChange} style={inputStyle} />
        </div>
      </div>
    </div>
  );

  const renderW9 = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>W-9 Request for Taxpayer Identification</h3>
        <button
          onClick={() => setShowW9Pdf(!showW9Pdf)}
          style={{ 
            padding: '8px 16px',
            backgroundColor: showW9Pdf ? accentPrimary : 'transparent',
            border: `1px solid ${accentPrimary}`,
            borderRadius: '6px',
            color: showW9Pdf ? '#fff' : accentPrimary,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {showW9Pdf ? 'Hide PDF' : 'View PDF Form'}
        </button>
      </div>

      {/* Embedded PDF Viewer */}
      {showW9Pdf && (
        <div style={{ marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${darkMode ? '#374151' : '#ddd'}` }}>
          <iframe
            src={`${URLS.w9Pdf}#toolbar=0&navpanes=0&scrollbar=1`}
            style={{
              width: '100%',
              height: '600px',
              border: 'none',
              backgroundColor: '#fff',
            }}
            title="W-9 Form"
          />
          <div style={{ padding: '12px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderTop: `1px solid ${darkMode ? '#374151' : '#ddd'}`, textAlign: 'center' }}>
            <a
              href={URLS.w9Pdf}
              download="W-9_Form.pdf"
              style={{ color: accentPrimary, fontSize: '0.85rem', textDecoration: 'none' }}
            >
              Download PDF
            </a>
          </div>
        </div>
      )}

      {/* Tax ID Type */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '12px' }}>Tax Identification Type *</label>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
          {[
            { value: 'ein', label: 'EIN (Employer Identification Number)' },
            { value: 'ssn', label: 'SSN (Social Security Number)' },
          ].map((option) => (
            <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="taxIdType"
                value={option.value}
                checked={formData.taxIdType === option.value}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        
        {formData.taxIdType === 'ein' ? (
          <EINInput value={formData.ein} onChange={(val) => setFormData({ ...formData, ein: val })} />
        ) : (
          <SSNInput value={formData.ssn} onChange={(val) => setFormData({ ...formData, ssn: val })} />
        )}
      </div>

      {/* Tax Classification */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '12px' }}>Federal Tax Classification *</label>
        <select
          name="taxClassification"
          value={formData.taxClassification}
          onChange={handleChange}
          required
          style={selectStyle}
        >
          <option value="" style={optionStyle}>Select classification...</option>
          <option value="individual" style={optionStyle}>Individual/Sole Proprietor</option>
          <option value="c-corp" style={optionStyle}>C Corporation</option>
          <option value="s-corp" style={optionStyle}>S Corporation</option>
          <option value="partnership" style={optionStyle}>Partnership</option>
          <option value="trust" style={optionStyle}>Trust/Estate</option>
          <option value="llc-c" style={optionStyle}>LLC - C Corporation</option>
          <option value="llc-s" style={optionStyle}>LLC - S Corporation</option>
          <option value="llc-p" style={optionStyle}>LLC - Partnership</option>
          <option value="other" style={optionStyle}>Other</option>
        </select>
      </div>

      {/* Exemptions */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '12px' }}>Exemptions (if applicable)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>Exempt Payee Code</label>
            <input type="text" name="exemptPayeeCode" value={formData.exemptPayeeCode} onChange={handleChange} style={inputStyle} placeholder="Leave blank if none" />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.85rem' }}>FATCA Exemption Code</label>
            <input type="text" name="fatcaCode" value={formData.fatcaCode} onChange={handleChange} style={inputStyle} placeholder="Leave blank if none" />
          </div>
        </div>
      </div>

      {/* Certification */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: `${accentPrimary}10`, borderRadius: '8px' }}>
        <p style={{ fontSize: '0.9rem', color: colors.gray, lineHeight: '1.6' }}>
          <strong>Certification:</strong> Under penalties of perjury, I certify that the number shown on this form is my correct taxpayer 
          identification number, I am not subject to backup withholding, and I am a U.S. citizen or other U.S. person.
        </p>
      </div>

      <SignaturePad
        onSignatureChange={(sig) => setFormData({ ...formData, w9Signature: sig })}
        label="Signature"
      />

      <div style={{ marginTop: '16px' }}>
        <label style={labelStyle}>Date</label>
        <input type="date" name="w9Date" value={formData.w9Date} onChange={handleChange} style={{ ...inputStyle, maxWidth: '200px' }} />
      </div>
    </div>
  );

  const renderInsurance = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Insurance Certificate</h3>
      
      {/* File Upload */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Upload Certificate of Insurance (COI) *</label>
        <div
          style={{
            border: `2px dashed ${formData.coiFile ? accentSecondary : colors.gray}`,
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            backgroundColor: darkMode ? '#111827' : '#f8fafc',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('coi-upload').click()}
        >
          <input
            type="file"
            id="coi-upload"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Upload size={40} color={formData.coiFile ? accentSecondary : colors.gray} style={{ marginBottom: '12px' }} />
          {formData.coiFileName ? (
            <p style={{ color: accentSecondary, fontWeight: '500' }}>✓ {formData.coiFileName}</p>
          ) : (
            <>
              <p style={{ color: colors.gray, marginBottom: '8px' }}>Click to upload or drag and drop</p>
              <p style={{ color: colors.gray, fontSize: '0.85rem' }}>PDF, JPG, or PNG (max 10MB)</p>
            </>
          )}
        </div>
      </div>

      {/* Insurance Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label style={labelStyle}>COI Expiration Date *</label>
          <input type="date" name="coiExpiration" value={formData.coiExpiration} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>General Liability Amount *</label>
          <input type="text" name="liabilityAmount" value={formData.liabilityAmount} onChange={handleChange} required style={inputStyle} placeholder="e.g., $1,000,000" />
        </div>
        <div>
          <label style={labelStyle}>Workers' Comp Amount *</label>
          <input type="text" name="workersCompAmount" value={formData.workersCompAmount} onChange={handleChange} required style={inputStyle} placeholder="e.g., $500,000" />
        </div>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: `${accentPrimary}10`, borderRadius: '8px' }}>
        <p style={{ fontSize: '0.9rem', color: colors.gray }}>
          <strong>Requirements:</strong> Minimum $1M general liability, current workers' compensation coverage, 
          and {LYT_INFO.name} must be listed as additionally insured.
        </p>
      </div>
    </div>
  );

  const renderFleetPersonnel = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Fleet & Personnel</h3>
      
      {/* Fleet */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ fontWeight: '600', marginBottom: '16px' }}>Equipment/Fleet</h4>
        {formData.fleet.map((item, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 2fr auto', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Type</label>
              <input
                type="text"
                value={item.type}
                onChange={(e) => updateFleetItem(idx, 'type', e.target.value)}
                style={inputStyle}
                placeholder="e.g., Bucket Truck"
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Count</label>
              <input
                type="number"
                value={item.count}
                onChange={(e) => updateFleetItem(idx, 'count', e.target.value)}
                style={inputStyle}
                min={0}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Description</label>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateFleetItem(idx, 'description', e.target.value)}
                style={inputStyle}
                placeholder="Year, make, model, capacity"
              />
            </div>
            <button
              type="button"
              onClick={() => removeFleetItem(idx)}
              style={{
                padding: '12px',
                backgroundColor: accentError,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                opacity: formData.fleet.length === 1 ? 0.5 : 1,
              }}
              disabled={formData.fleet.length === 1}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addFleetItem}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: accentPrimary,
            border: `1px solid ${accentPrimary}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          + Add Equipment
        </button>
      </div>

      {/* Personnel */}
      <div>
        <h4 style={{ fontWeight: '600', marginBottom: '16px' }}>Key Personnel</h4>
        {formData.personnel.map((person, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Name</label>
              <input
                type="text"
                value={person.name}
                onChange={(e) => updatePersonnelItem(idx, 'name', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Role</label>
              <input
                type="text"
                value={person.role}
                onChange={(e) => updatePersonnelItem(idx, 'role', e.target.value)}
                style={inputStyle}
                placeholder="e.g., Lead Technician"
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Certifications</label>
              <input
                type="text"
                value={person.certifications}
                onChange={(e) => updatePersonnelItem(idx, 'certifications', e.target.value)}
                style={inputStyle}
                placeholder="e.g., OSHA 30, CDL"
              />
            </div>
            <button
              type="button"
              onClick={() => removePersonnelItem(idx)}
              style={{
                padding: '12px',
                backgroundColor: accentError,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                opacity: formData.personnel.length === 1 ? 0.5 : 1,
              }}
              disabled={formData.personnel.length === 1}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addPersonnelItem}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: accentPrimary,
            border: `1px solid ${accentPrimary}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          + Add Personnel
        </button>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Capabilities & Skills</h3>
      
      <p style={{ color: colors.gray, marginBottom: '20px' }}>Select all services your company can provide:</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {skillOptions.map((skill) => (
          <label
            key={skill}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              backgroundColor: formData.skills.includes(skill) ? `${accentPrimary}20` : (darkMode ? colors.dark : '#f8fafc'),
              border: `2px solid ${formData.skills.includes(skill) ? accentPrimary : 'transparent'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={formData.skills.includes(skill)}
              onChange={() => handleSkillToggle(skill)}
              style={{ width: '18px', height: '18px' }}
            />
            <span>{skill}</span>
          </label>
        ))}
      </div>

      <div>
        <label style={labelStyle}>Other Skills/Services</label>
        <textarea
          name="otherSkills"
          value={formData.otherSkills}
          onChange={handleChange}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="List any additional capabilities not shown above..."
        />
      </div>
    </div>
  );

  const renderRateCard = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Rate Card Acceptance</h3>
      
      <div style={{ padding: '24px', backgroundColor: darkMode ? '#1f2937' : '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
        <p style={{ color: darkMode ? '#9ca3af' : '#6b7280', lineHeight: '1.7', marginBottom: '16px' }}>
          {LYT_INFO.name} maintains a standard rate card for subcontractor services. Rates are negotiable on a per-project basis 
          and will be specified in individual Scope of Work (SOW) documents.
        </p>
        
        {/* Embedded Rate Card */}
        <div style={{ 
          border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, 
          borderRadius: '8px', 
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <iframe
            src={`https://docs.google.com/spreadsheets/d/${URLS.rateCardSheet}/pubhtml?widget=true&headers=false`}
            style={{
              width: '100%',
              height: '400px',
              border: 'none',
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            }}
            title="LYT Communications Rate Card"
          />
        </div>
        
        <a
          href={`https://docs.google.com/spreadsheets/d/${URLS.rateCardSheet}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: accentPrimary,
            border: `1px solid ${accentPrimary}`,
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '0.9rem',
          }}
        >
          Open in Google Sheets
        </a>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          name="rateCardAccepted"
          checked={formData.rateCardAccepted}
          onChange={handleChange}
          style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: accentPrimary }}
        />
        <span style={{ lineHeight: '1.5', color: textColor }}>
          I have reviewed the rate card and understand that specific rates will be agreed upon in individual 
          project SOWs. I agree to the general payment terms of Net 30 from invoice approval with 10% retainage 
          held until project completion and final acceptance.
        </span>
      </label>
    </div>
  );

  const renderBanking = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px' }}>Banking Information</h3>
      
      <p style={{ color: colors.gray, marginBottom: '20px' }}>
        Provide your banking details for payment via ACH direct deposit.
      </p>

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
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderCompanyInfo();
      case 1: return renderMSA();
      case 2: return renderW9();
      case 3: return renderInsurance();
      case 4: return renderFleetPersonnel();
      case 5: return renderSkills();
      case 6: return renderRateCard();
      case 7: return renderBanking();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.companyName && formData.entityType && formData.contactName && formData.email && formData.phone && formData.address && formData.city && formData.state && formData.zip;
      case 1: return formData.msaSignature;
      case 2: return (formData.taxIdType === 'ein' ? formData.ein : formData.ssn) && formData.taxClassification && formData.w9Signature;
      case 3: return formData.coiFile && formData.coiExpiration && formData.liabilityAmount && formData.workersCompAmount;
      case 4: return true;
      case 5: return formData.skills.length > 0;
      case 6: return formData.rateCardAccepted;
      case 7: return formData.bankName && formData.routingNumber && formData.accountNumber;
      default: return false;
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <CheckCircle size={80} color={accentSecondary} style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '16px', color: textColor }}>
            Registration Complete!
          </h2>
          <p style={{ color: colors.gray, fontSize: '1.1rem', marginBottom: '32px' }}>
            Thank you for registering with {LYT_INFO.name}. Our team will review your submission and 
            contact you within 2-3 business days.
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
          <span style={{ color: accentPrimary }}>Contractor</span> Registration
        </div>
        <div style={{ width: '120px' }} />
      </header>

      {/* Progress Steps */}
      <div style={{ padding: '20px', backgroundColor: cardBg, borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, overflowX: 'auto' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', minWidth: '700px' }}>
          {steps.map((step, idx) => (
            <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: idx <= currentStep ? accentPrimary : (darkMode ? colors.dark : '#e5e7eb'),
                  color: idx <= currentStep ? '#fff' : colors.gray,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  marginBottom: '6px',
                }}
              >
                {idx < currentStep ? <CheckCircle size={18} /> : idx + 1}
              </div>
              <span style={{ fontSize: '0.7rem', color: idx <= currentStep ? textColor : colors.gray, textAlign: 'center' }}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <main style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                  {submitting ? 'Submitting...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContractorOnboarding;
