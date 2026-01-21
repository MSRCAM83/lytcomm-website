import React, { useState, useRef, useEffect } from 'react';
import { FileText, Shield, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { colors, LYT_INFO, URLS } from '../config/constants';

const NDASignPage = ({ setCurrentPage, darkMode = true }) => {
  const [step, setStep] = useState('form'); // form, sign, complete (skip verify - handled by InviteCodePage)
  const [formData, setFormData] = useState({
    fullName: '',
    title: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  const [signature, setSignature] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Signature pad refs
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#e5e7eb' : '#1e293b';
  const mutedColor = darkMode ? '#9ca3af' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';
  const accentColor = darkMode ? '#ff6b35' : '#0077B6';

  // Initialize canvas
  useEffect(() => {
    if (step === 'sign' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [step]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setStep('sign');
  };

  // Signature pad functions
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setHasSignature(true);
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      setSignature(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignature(null);
  };

  const handleFinalSubmit = async () => {
    if (!signature || !agreedToTerms) {
      setSubmitError('Please sign the document and agree to the terms.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        action: 'submitNDA',
        data: {
          ...formData,
          signature: signature,
          signedDate: new Date().toISOString(),
          ipAddress: 'captured-server-side',
          userAgent: navigator.userAgent,
        }
      };

      // eslint-disable-next-line no-unused-vars
      const response = await fetch(URLS.appsScript, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // no-cors doesn't give us response, assume success
      setSubmitSuccess(true);
      setStep('complete');
    } catch (error) {
      console.error('NDA submission error:', error);
      setSubmitError('Failed to submit. Please try again or contact info@lytcomm.com');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    border: `1px solid ${borderColor}`,
    borderRadius: '8px',
    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
    color: textColor,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    color: textColor,
    fontSize: '0.9rem',
  };

  // NDA Text Content
  const NDAContent = () => (
    <div style={{ 
      maxHeight: '400px', 
      overflowY: 'auto', 
      padding: '20px', 
      backgroundColor: darkMode ? '#0f172a' : '#f9fafb',
      borderRadius: '8px',
      border: `1px solid ${borderColor}`,
      fontSize: '0.9rem',
      lineHeight: '1.7',
      color: textColor,
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: accentColor }}>
        NON-DISCLOSURE AGREEMENT
      </h2>
      
      <p style={{ marginBottom: '16px' }}>
        <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <p style={{ marginBottom: '16px' }}>
        This Non-Disclosure Agreement ("Agreement") is entered into by and between:
      </p>

      <p style={{ marginBottom: '16px', paddingLeft: '20px' }}>
        <strong>Disclosing Party:</strong> {LYT_INFO.name}, a Texas limited liability company ("LYT" or "Company")
      </p>

      <p style={{ marginBottom: '16px', paddingLeft: '20px' }}>
        <strong>Receiving Party:</strong> {formData.companyName || '[Company Name]'}, represented by {formData.fullName || '[Individual Name]'} ("Recipient")
      </p>

      <p style={{ marginBottom: '16px' }}>
        Collectively referred to as the "Parties."
      </p>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>1. PURPOSE</h3>
      <p style={{ marginBottom: '16px' }}>
        The Parties wish to explore a potential business relationship regarding fiber optic construction, telecommunications infrastructure, and related services. In connection with this opportunity, LYT may disclose certain confidential and proprietary information to Recipient.
      </p>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>2. DEFINITION OF CONFIDENTIAL INFORMATION</h3>
      <p style={{ marginBottom: '16px' }}>
        "Confidential Information" means any and all non-public information disclosed by LYT to Recipient, whether orally, in writing, or by any other means, including but not limited to:
      </p>
      <ul style={{ marginBottom: '16px', paddingLeft: '30px' }}>
        <li>Project specifications, scope of work documents, and bid packages</li>
        <li>Customer and client lists, contact information, and business relationships</li>
        <li>Pricing structures, rate cards, cost estimates, and financial data</li>
        <li>Technical drawings, site plans, as-built documentation, and engineering data</li>
        <li>Business strategies, operational methods, and competitive analysis</li>
        <li>Employee and contractor information</li>
        <li>Trade secrets, proprietary processes, and specialized techniques</li>
        <li>Any information marked as "Confidential" or that a reasonable person would understand to be confidential</li>
      </ul>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>3. OBLIGATIONS OF RECIPIENT</h3>
      <p style={{ marginBottom: '16px' }}>Recipient agrees to:</p>
      <ul style={{ marginBottom: '16px', paddingLeft: '30px' }}>
        <li>Hold all Confidential Information in strict confidence</li>
        <li>Not disclose Confidential Information to any third party without LYT's prior written consent</li>
        <li>Use Confidential Information solely for evaluating and engaging in business with LYT</li>
        <li>Limit access to Confidential Information to employees and agents with a need to know</li>
        <li>Protect Confidential Information using at least the same degree of care used to protect its own confidential information, but no less than reasonable care</li>
        <li>Promptly notify LYT of any unauthorized use or disclosure</li>
      </ul>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>4. EXCLUSIONS</h3>
      <p style={{ marginBottom: '16px' }}>
        Confidential Information does not include information that:
      </p>
      <ul style={{ marginBottom: '16px', paddingLeft: '30px' }}>
        <li>Is or becomes publicly available through no fault of Recipient</li>
        <li>Was rightfully in Recipient's possession before disclosure by LYT</li>
        <li>Is independently developed by Recipient without use of Confidential Information</li>
        <li>Is rightfully obtained from a third party without restriction</li>
        <li>Is required to be disclosed by law, provided Recipient gives LYT prompt notice</li>
      </ul>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>5. TERM AND TERMINATION</h3>
      <p style={{ marginBottom: '16px' }}>
        This Agreement shall remain in effect for a period of three (3) years from the Effective Date. The confidentiality obligations shall survive termination and continue for a period of five (5) years following any disclosure of Confidential Information.
      </p>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>6. RETURN OF MATERIALS</h3>
      <p style={{ marginBottom: '16px' }}>
        Upon LYT's request or termination of discussions, Recipient shall promptly return or destroy all Confidential Information and any copies thereof, and certify such destruction in writing if requested.
      </p>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>7. NO LICENSE OR WARRANTY</h3>
      <p style={{ marginBottom: '16px' }}>
        Nothing in this Agreement grants Recipient any rights to LYT's intellectual property. All Confidential Information is provided "AS IS" without warranty of any kind.
      </p>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>8. REMEDIES</h3>
      <p style={{ marginBottom: '16px' }}>
        Recipient acknowledges that any breach of this Agreement may cause irreparable harm to LYT for which monetary damages would be inadequate. LYT shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.
      </p>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>9. GOVERNING LAW</h3>
      <p style={{ marginBottom: '16px' }}>
        This Agreement shall be governed by and construed in accordance with the laws of the State of Texas, without regard to conflicts of law principles. Any disputes arising under this Agreement shall be resolved in the state or federal courts located in Harris County, Texas.
      </p>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>10. ENTIRE AGREEMENT</h3>
      <p style={{ marginBottom: '16px' }}>
        This Agreement constitutes the entire agreement between the Parties concerning confidentiality and supersedes all prior agreements and understandings. This Agreement may only be modified in writing signed by both Parties.
      </p>

      <h3 style={{ marginTop: '24px', marginBottom: '12px', color: accentColor }}>11. ELECTRONIC SIGNATURE</h3>
      <p style={{ marginBottom: '16px' }}>
        The Parties agree that this Agreement may be executed electronically and that electronic signatures shall have the same legal effect as original signatures under the Electronic Signatures in Global and National Commerce Act (ESIGN Act) and the Uniform Electronic Transactions Act (UETA).
      </p>

      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: darkMode ? '#1e293b' : '#f0f9ff', borderRadius: '8px' }}>
        <p style={{ fontWeight: '600', marginBottom: '8px' }}>DISCLOSING PARTY:</p>
        <p>{LYT_INFO.name}</p>
        <p style={{ fontStyle: 'italic', color: mutedColor, marginTop: '8px' }}>
          [Authorized signature on file]
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '20px' }}>
      {/* Header */}
      <div style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '32px' }}>
        <button
          onClick={() => setCurrentPage('onboarding')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: accentColor,
            cursor: 'pointer',
            fontSize: '0.95rem',
            padding: '8px 0',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={18} />
          Back to Onboarding
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <Shield size={40} color={accentColor} />
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, margin: 0 }}>
              Non-Disclosure Agreement
            </h1>
            <p style={{ color: mutedColor, margin: '4px 0 0' }}>
              {LYT_INFO.name} Confidentiality Agreement
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ maxWidth: '800px', margin: '0 auto 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {['Information', 'Review & Sign', 'Complete'].map((label, idx) => {
            const stepMap = ['form', 'sign', 'complete'];
            const currentIdx = stepMap.indexOf(step);
            const isActive = idx <= currentIdx;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? accentColor : (darkMode ? '#374151' : '#e5e7eb'),
                  color: isActive ? '#fff' : mutedColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                }}>
                  {idx < currentIdx ? '✓' : idx + 1}
                </div>
                <span style={{ 
                  marginLeft: '8px', 
                  color: isActive ? textColor : mutedColor,
                  fontSize: '0.85rem',
                }}>
                  {label}
                </span>
                {idx < 2 && (
                  <div style={{
                    width: '40px',
                    height: '2px',
                    backgroundColor: idx < currentIdx ? accentColor : (darkMode ? '#374151' : '#e5e7eb'),
                    margin: '0 8px',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: cardBg,
          borderRadius: '16px',
          padding: '32px',
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          
          {/* Step 1: Form */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <FileText size={48} color={accentColor} style={{ marginBottom: '16px' }} />
                <h2 style={{ color: textColor, marginBottom: '8px' }}>Your Information</h2>
                <p style={{ color: mutedColor }}>
                  Please provide your details for the NDA
                </p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Full Legal Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Title/Position *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Business Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street Address"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                  >
                    <option value="">Select State</option>
                    <option value="TX">Texas</option>
                    <option value="LA">Louisiana</option>
                    <option value="AL">Alabama</option>
                    <option value="FL">Florida</option>
                    <option value="MS">Mississippi</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>ZIP Code *</label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage('onboarding')}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: 'transparent',
                    color: textColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: accentColor,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Continue to Review
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Review & Sign */}
          {step === 'sign' && (
            <div>
              <h2 style={{ color: textColor, marginBottom: '8px' }}>Review & Sign</h2>
              <p style={{ color: mutedColor, marginBottom: '24px' }}>
                Please review the agreement carefully, then sign below.
              </p>

              <NDAContent />

              {/* Signature Section */}
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ color: textColor, marginBottom: '16px' }}>
                  Recipient Signature
                </h3>
                
                <div style={{ 
                  backgroundColor: darkMode ? '#0f172a' : '#f9fafb', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: mutedColor }}>Name:</span>
                      <p style={{ color: textColor, fontWeight: '500', margin: '4px 0 0' }}>{formData.fullName}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: mutedColor }}>Title:</span>
                      <p style={{ color: textColor, fontWeight: '500', margin: '4px 0 0' }}>{formData.title}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: mutedColor }}>Company:</span>
                      <p style={{ color: textColor, fontWeight: '500', margin: '4px 0 0' }}>{formData.companyName}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: mutedColor }}>Date:</span>
                      <p style={{ color: textColor, fontWeight: '500', margin: '4px 0 0' }}>
                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <label style={{ ...labelStyle, marginBottom: '8px' }}>
                    Draw Your Signature Below *
                  </label>
                  <div style={{
                    border: `2px solid ${hasSignature ? colors.green : borderColor}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                  }}>
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={150}
                      style={{
                        width: '100%',
                        height: '150px',
                        cursor: 'crosshair',
                        touchAction: 'none',
                      }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: hasSignature ? colors.green : mutedColor }}>
                      {hasSignature ? '✓ Signature captured' : 'Draw your signature above'}
                    </span>
                    <button
                      type="button"
                      onClick={clearSignature}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.85rem',
                        backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: textColor,
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Agreement Checkbox */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginTop: '24px',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: '4px', width: '18px', height: '18px' }}
                  />
                  <span style={{ color: textColor, fontSize: '0.95rem', lineHeight: '1.5' }}>
                    I have read and understand this Non-Disclosure Agreement. I agree to be bound by its terms and conditions. I confirm that I have the authority to sign this agreement on behalf of {formData.companyName || 'my company'}.
                  </span>
                </label>

                {submitError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: colors.coral,
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: darkMode ? 'rgba(232,90,79,0.1)' : 'rgba(232,90,79,0.05)',
                    borderRadius: '8px',
                  }}>
                    <AlertCircle size={18} />
                    {submitError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: 'transparent',
                    color: textColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={!hasSignature || !agreedToTerms || submitting}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: (hasSignature && agreedToTerms && !submitting) ? accentColor : (darkMode ? '#374151' : '#d1d5db'),
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: (hasSignature && agreedToTerms && !submitting) ? 'pointer' : 'not-allowed',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Sign & Submit NDA'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CheckCircle size={64} color={colors.green} style={{ marginBottom: '24px' }} />
              <h2 style={{ color: textColor, marginBottom: '12px' }}>NDA Signed Successfully!</h2>
              <p style={{ color: mutedColor, marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
                Thank you for signing the Non-Disclosure Agreement. A copy has been sent to {formData.email} and our records have been updated.
              </p>

              <div style={{
                backgroundColor: darkMode ? '#0f172a' : '#f0f9ff',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '32px',
                textAlign: 'left',
              }}>
                <h4 style={{ color: textColor, marginBottom: '12px' }}>Agreement Details</h4>
                <p style={{ color: mutedColor, fontSize: '0.9rem', marginBottom: '8px' }}>
                  <strong>Signed By:</strong> {formData.fullName}
                </p>
                <p style={{ color: mutedColor, fontSize: '0.9rem', marginBottom: '8px' }}>
                  <strong>Company:</strong> {formData.companyName}
                </p>
                <p style={{ color: mutedColor, fontSize: '0.9rem', marginBottom: '8px' }}>
                  <strong>Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p style={{ color: mutedColor, fontSize: '0.9rem' }}>
                  <strong>Reference:</strong> NDA-{Date.now().toString(36).toUpperCase()}
                </p>
              </div>

              <p style={{ color: mutedColor, fontSize: '0.9rem', marginBottom: '24px' }}>
                Our team will be in touch shortly with the project materials. If you have any questions, please contact us at {LYT_INFO.email}.
              </p>

              <button
                onClick={() => setCurrentPage('home')}
                style={{
                  padding: '14px 32px',
                  backgroundColor: accentColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Return to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NDASignPage;
