// ContractorReviewChecklist.js v1.0.0 - Sub-Contractor Document Review Checklist
// Admin reviews contractor onboarding docs, checks off items, sends package on completion
import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, CheckSquare, Square, Eye, Send, XCircle, Loader,
  ClipboardCheck, Shield, FileText, Car, Umbrella, Building, AlertTriangle
} from 'lucide-react';
import { colors } from '../config/constants';

const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const CHECKLIST_SHEET_ID = '190HrEUKFVh-qW9xoWBIyjQVvIkQX09gK_iul4JOGO5E';
const ONBOARDING_SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc';

const NOTIFY_EMAILS = ['matt@lytcomm.com', 'donnie@lytcomm.com', 'dayna@lytcomm.com'];

const fetchWithRedirect = async (url, options = {}) => {
  try {
    const response = await fetch(url, { ...options, redirect: 'follow' });
    const text = await response.text();
    if (text.trim().startsWith('<')) {
      const match = text.match(/HREF="([^"]+)"/i);
      if (match) {
        const redirectUrl = match[1].replace(/&amp;/g, '&');
        const redirectResponse = await fetch(redirectUrl);
        return redirectResponse.text();
      }
    }
    return text;
  } catch (err) { throw err; }
};

// All 17 checklist items organized by section
const CHECKLIST_ITEMS = [
  // Contract section
  { id: 'contract_name', section: 'contract', label: 'Name Completed' },
  { id: 'contract_signed_sub', section: 'contract', label: 'Signed by Sub-Contractor' },
  { id: 'contract_signed_lyt', section: 'contract', label: 'Signed by LYT Communications' },
  { id: 'contract_witnesses', section: 'contract', label: 'Witnesses' },
  // Insurance — Workers Comp
  { id: 'ins_wc_accident', section: 'insurance_wc', label: '$1,000,000 Each Accident' },
  { id: 'ins_wc_disease_emp', section: 'insurance_wc', label: '$1,000,000 Disease — Each Employee' },
  { id: 'ins_wc_disease_policy', section: 'insurance_wc', label: '$1,000,000 Disease — Policy Limit' },
  // Insurance — CGL
  { id: 'ins_cgl_iso', section: 'insurance_cgl', label: 'Written on ISO occurrence form CG 00 01 (edition date no earlier than 10/01)' },
  { id: 'ins_cgl_aggregate', section: 'insurance_cgl', label: 'Aggregate — $2,000,000' },
  { id: 'ins_cgl_products', section: 'insurance_cgl', label: 'Products Completed Operations Aggregate — $2,000,000' },
  { id: 'ins_cgl_personal', section: 'insurance_cgl', label: 'Personal Injury — $1M; Each Occurrence — $1M; Fire — $50K; Med Expense — $5K' },
  // Insurance — Auto
  { id: 'ins_auto', section: 'insurance_auto', label: '$1,000,000 combined single limit for each accident' },
  // Insurance — Umbrella
  { id: 'ins_umbrella', section: 'insurance_umbrella', label: 'Umbrella/Excess meets job-size threshold' },
  // Documents
  { id: 'doc_rate_card', section: 'documents', label: 'Rate Card with Rate Card Acceptance — Completed and Signed' },
  { id: 'doc_safety', section: 'documents', label: 'Safety Program Acknowledgement — Completed and Signed' },
  { id: 'doc_w9', section: 'documents', label: 'W-9 — Completed and Signed' },
  { id: 'doc_direct_deposit', section: 'documents', label: 'Direct Deposit Authorization — Completed and Signed' },
];

const TOTAL_ITEMS = CHECKLIST_ITEMS.length;

const ContractorReviewChecklist = ({ darkMode, user, setCurrentPage, contractor, loggedInUser }) => {
  const currentUser = user || loggedInUser;
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [checks, setChecks] = useState({});
  const [insuranceDate, setInsuranceDate] = useState('');
  const [insurancePerson, setInsurancePerson] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [showVersion, setShowVersion] = useState(false);
  const [existingRow, setExistingRow] = useState(null); // row number if already saved

  const checkedCount = Object.values(checks).filter(Boolean).length;
  const allChecked = checkedCount === TOTAL_ITEMS;
  const progressPct = Math.round((checkedCount / TOTAL_ITEMS) * 100);

  // Load existing checklist state for this contractor
  const loadChecklist = useCallback(async () => {
    if (!contractor?.name) { setLoading(false); return; }
    try {
      const text = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsRead',
          params: { spreadsheetId: CHECKLIST_SHEET_ID, range: 'Sheet1!A2:I100' }
        })
      });
      const result = JSON.parse(text);
      if (result.success && result.data?.data) {
        const rows = result.data.data;
        const idx = rows.findIndex(r => r[0] === contractor.name && r[1] === contractor.email);
        if (idx >= 0) {
          const row = rows[idx];
          setExistingRow(idx + 2); // +2 for header + 0-index
          try { setChecks(JSON.parse(row[3] || '{}')); } catch { setChecks({}); }
          setInsuranceDate(row[4] || '');
          setInsurancePerson(row[5] || '');
        }
      }
    } catch (err) {
      console.error('Failed to load checklist:', err);
    }
    setLoading(false);
  }, [contractor]);

  useEffect(() => { loadChecklist(); }, [loadChecklist]);

  // Save checklist state
  const saveChecklist = async (updatedChecks, updatedDate, updatedPerson) => {
    setSaving(true);
    const rowData = [
      contractor?.name || '',
      contractor?.email || '',
      contractor?.folderLink || '',
      JSON.stringify(updatedChecks || checks),
      updatedDate !== undefined ? updatedDate : insuranceDate,
      updatedPerson !== undefined ? updatedPerson : insurancePerson,
      currentUser?.email || currentUser?.name || '',
      allChecked ? 'Complete' : 'In Review',
      '',
    ];

    try {
      if (existingRow) {
        // Update existing row
        await fetchWithRedirect(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'sheetsWrite',
            params: {
              spreadsheetId: CHECKLIST_SHEET_ID,
              range: `Sheet1!A${existingRow}:I${existingRow}`,
              values: [rowData]
            }
          })
        });
      } else {
        // Append new row
        const text = await fetchWithRedirect(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'sheetsAppend',
            params: {
              spreadsheetId: CHECKLIST_SHEET_ID,
              range: 'Sheet1!A:I',
              values: [rowData]
            }
          })
        });
        const result = JSON.parse(text);
        if (result.success) {
          setExistingRow(result.data?.startRow || null);
        }
      }
    } catch (err) {
      console.error('Failed to save checklist:', err);
    }
    setSaving(false);
  };

  // Toggle a check item
  const toggleCheck = (itemId) => {
    const updated = { ...checks, [itemId]: !checks[itemId] };
    setChecks(updated);
    saveChecklist(updated);
  };

  // Handle insurance fields with debounced save
  const handleInsuranceDateChange = (val) => {
    setInsuranceDate(val);
    saveChecklist(undefined, val);
  };
  const handleInsurancePersonChange = (val) => {
    setInsurancePerson(val);
    saveChecklist(undefined, undefined, val);
  };

  // Complete onboarding & send package
  const handleComplete = async () => {
    if (!allChecked) return;
    setSending(true);
    setMessage({ type: 'info', text: 'Sending onboarding package...' });

    try {
      // 1. Try to get files from contractor's Drive folder and send as attachments
      let emailSent = false;

      if (contractor?.folderLink) {
        // Extract folder ID from the Drive link
        const folderMatch = contractor.folderLink.match(/folders\/([a-zA-Z0-9_-]+)/);
        const folderId = folderMatch ? folderMatch[1] : null;

        if (folderId) {
          // List files in the folder
          const listText = await fetchWithRedirect(GATEWAY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              secret: GATEWAY_SECRET,
              action: 'driveList',
              params: { folderId, maxResults: 30 }
            })
          });
          const listResult = JSON.parse(listText);

          if (listResult.success && listResult.data?.files?.length > 0) {
            const pdfFiles = listResult.data.files.filter(f =>
              f.mimeType === 'application/pdf' || f.name.endsWith('.pdf')
            );

            // Get content for each PDF
            const attachments = [];
            for (const file of pdfFiles) {
              try {
                const getText = await fetchWithRedirect(GATEWAY_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    secret: GATEWAY_SECRET,
                    action: 'driveGet',
                    params: { fileId: file.id, includeContent: true }
                  })
                });
                const getResult = JSON.parse(getText);
                if (getResult.success && getResult.data?.content) {
                  attachments.push({
                    fileName: file.name,
                    mimeType: 'application/pdf',
                    content: getResult.data.content
                  });
                }
              } catch { /* skip file if can't get content */ }
            }

            if (attachments.length > 0) {
              // Send email with attachments
              const emailText = await fetchWithRedirect(GATEWAY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  secret: GATEWAY_SECRET,
                  action: 'gmailSend',
                  params: {
                    to: contractor.email,
                    subject: `LYT Communications — Your Onboarding Package`,
                    body: `Congratulations and welcome to LYT Communications!\n\nYour onboarding has been reviewed and approved. Attached you will find copies of all your signed onboarding documents for your records.\n\nDocuments included:\n${attachments.map(a => `  - ${a.fileName}`).join('\n')}\n\nIf you have any questions, please contact us at info@lytcomm.com or (832) 850-3887.\n\nThank you,\nLYT Communications`,
                    attachments
                  }
                })
              });
              const emailResult = JSON.parse(emailText);
              emailSent = emailResult.success;
            }
          }
        }
      }

      // Fallback: send email with Drive folder link if attachments didn't work
      if (!emailSent && contractor?.email) {
        const folderUrl = contractor.folderLink || '';
        await fetchWithRedirect(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'gmailSend',
            params: {
              to: contractor.email,
              subject: 'LYT Communications — Your Onboarding Package',
              body: `Congratulations and welcome to LYT Communications!\n\nYour onboarding has been reviewed and approved. You can access all your signed onboarding documents here:\n\n${folderUrl}\n\nIf you have any questions, please contact us at info@lytcomm.com or (832) 850-3887.\n\nThank you,\nLYT Communications`
            }
          })
        });
        emailSent = true;
      }

      // 2. Notify admins
      NOTIFY_EMAILS.forEach(email => {
        fetchWithRedirect(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'gmailSend',
            params: {
              to: email,
              subject: `Contractor Onboarding Complete — ${contractor?.name}`,
              body: `${contractor?.name} has been fully onboarded.\n\nReviewed by: ${currentUser?.email || currentUser?.name || 'Admin'}\nDate: ${new Date().toLocaleDateString()}\nAll ${TOTAL_ITEMS} checklist items verified.\n\nOnboarding package has been sent to: ${contractor?.email}`
            }
          })
        }).catch(() => {});
      });

      // 3. Update onboarding sheet status to Approved
      if (contractor?.id) {
        const rowNumber = contractor.id + 1;
        await fetchWithRedirect(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'sheetsWrite',
            params: {
              spreadsheetId: ONBOARDING_SHEET_ID,
              range: `O${rowNumber}`,
              values: [['Approved']]
            }
          })
        });
      }

      // 4. Update checklist sheet with completion
      const completedRow = [
        contractor?.name || '',
        contractor?.email || '',
        contractor?.folderLink || '',
        JSON.stringify(checks),
        insuranceDate,
        insurancePerson,
        currentUser?.email || currentUser?.name || '',
        'Approved',
        new Date().toISOString(),
      ];
      if (existingRow) {
        await fetchWithRedirect(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'sheetsWrite',
            params: {
              spreadsheetId: CHECKLIST_SHEET_ID,
              range: `Sheet1!A${existingRow}:I${existingRow}`,
              values: [completedRow]
            }
          })
        });
      }

      setMessage({ type: 'success', text: `Onboarding complete! Package sent to ${contractor?.email}` });
    } catch (err) {
      console.error('Complete error:', err);
      setMessage({ type: 'error', text: 'Failed to complete onboarding — please try again' });
    }
    setSending(false);
    setTimeout(() => setMessage(null), 5000);
  };

  // Reject contractor
  const handleReject = async () => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      if (contractor?.id) {
        const rowNumber = contractor.id + 1;
        await fetchWithRedirect(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'sheetsWrite',
            params: {
              spreadsheetId: ONBOARDING_SHEET_ID,
              range: `O${rowNumber}:P${rowNumber}`,
              values: [['Rejected', reason || '']]
            }
          })
        });
      }
      setMessage({ type: 'error', text: `Rejected: ${contractor?.name}` });
      setTimeout(() => setCurrentPage('admin-dashboard'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reject' });
    }
  };

  if (!contractor) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: mutedColor }}>
          <AlertTriangle size={48} style={{ marginBottom: '16px' }} />
          <p>No contractor selected. Go back to the Admin Dashboard.</p>
          <button onClick={() => setCurrentPage('admin-dashboard')} style={{
            marginTop: '16px', padding: '10px 24px', backgroundColor: accentPrimary, color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
          }}>Go Back</button>
        </div>
      </div>
    );
  }

  const inputStyle = {
    padding: '10px', border: `1px solid ${borderColor}`, borderRadius: '8px',
    backgroundColor: darkMode ? '#1a2332' : '#ffffff', color: darkMode ? '#fff' : '#1e293b',
    fontSize: '0.9rem', outline: 'none',
  };

  const renderCheckItem = (item) => (
    <div
      key={item.id}
      onClick={() => toggleCheck(item.id)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 12px',
        cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.15s',
        backgroundColor: checks[item.id] ? (darkMode ? 'rgba(40,167,69,0.1)' : 'rgba(40,167,69,0.05)') : 'transparent',
      }}
      onMouseEnter={(e) => { if (!checks[item.id]) e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
      onMouseLeave={(e) => { if (!checks[item.id]) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {checks[item.id]
        ? <CheckSquare size={20} color={accentSecondary} style={{ flexShrink: 0, marginTop: '1px' }} />
        : <Square size={20} color={mutedColor} style={{ flexShrink: 0, marginTop: '1px' }} />
      }
      <span style={{
        color: checks[item.id] ? textColor : mutedColor,
        fontSize: '0.9rem', lineHeight: '1.4',
        textDecoration: checks[item.id] ? 'none' : 'none',
      }}>
        {item.label}
      </span>
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${borderColor}` }}>
      <Icon size={18} style={{ color: color || accentPrimary }} />
      <h3 style={{ fontSize: '1rem', fontWeight: '700', color: textColor, margin: 0 }}>{title}</h3>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '24px 16px' }}
      onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>

      {/* Toast */}
      {message && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          padding: '14px 28px', borderRadius: '10px', zIndex: 1000, fontSize: '0.95rem', fontWeight: '500',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: '90vw', textAlign: 'center', color: '#fff',
          backgroundColor: message.type === 'success' ? accentSecondary : message.type === 'error' ? '#ef4444' : accentPrimary,
        }}>
          {message.text}
        </div>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button onClick={() => setCurrentPage('admin-dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            backgroundColor: 'transparent', border: `1px solid ${borderColor}`,
            borderRadius: '8px', color: textColor, cursor: 'pointer', fontSize: '0.9rem',
          }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: '700', color: textColor, margin: 0 }}>
              Sub-Contractor Document Review
            </h1>
            <p style={{ color: mutedColor, margin: '4px 0 0', fontSize: '0.85rem' }}>
              CONTRACT: <strong style={{ color: textColor }}>{contractor.name}</strong>
            </p>
          </div>
          {contractor.folderLink && (
            <a href={contractor.folderLink} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              backgroundColor: accentPrimary, color: '#fff', border: 'none', borderRadius: '8px',
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500',
            }}>
              <Eye size={16} /> View Docs
            </a>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', border: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: textColor, fontWeight: '600', fontSize: '0.9rem' }}>
              {checkedCount} / {TOTAL_ITEMS} items verified
            </span>
            <span style={{ color: allChecked ? accentSecondary : mutedColor, fontWeight: '600', fontSize: '0.9rem' }}>
              {progressPct}%
            </span>
          </div>
          <div style={{ height: '8px', backgroundColor: darkMode ? '#1a2332' : '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`, borderRadius: '4px', transition: 'width 0.3s ease',
              backgroundColor: allChecked ? accentSecondary : accentPrimary,
            }} />
          </div>
          {saving && <div style={{ fontSize: '0.75rem', color: mutedColor, marginTop: '6px' }}>Saving...</div>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: mutedColor }}>
            <Loader size={32} style={{ marginBottom: '16px' }} />
            <div>Loading checklist...</div>
          </div>
        ) : (
          <>
            {/* CONTRACT section */}
            <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', marginBottom: '16px', border: `1px solid ${borderColor}` }}>
              <SectionHeader icon={FileText} title="CONTRACT" />
              {CHECKLIST_ITEMS.filter(i => i.section === 'contract').map(renderCheckItem)}
            </div>

            {/* INSURANCE section */}
            <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', marginBottom: '16px', border: `1px solid ${borderColor}` }}>
              <SectionHeader icon={Shield} title="INSURANCE" color="#f59e0b" />

              {/* Called to verify fields */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', padding: '0 12px' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: mutedColor, fontSize: '0.8rem' }}>
                    Called to verify insurance — Date
                  </label>
                  <input type="date" value={insuranceDate} onChange={(e) => handleInsuranceDateChange(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: mutedColor, fontSize: '0.8rem' }}>
                    Person contacted
                  </label>
                  <input type="text" value={insurancePerson} onChange={(e) => handleInsurancePersonChange(e.target.value)} placeholder="Name of person" style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>

              {/* Workers Comp */}
              <div style={{ marginBottom: '12px', padding: '0 12px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', color: textColor, marginBottom: '4px' }}>
                  Workers' Compensation Insurance and Employers Liability Insurance
                </div>
                <div style={{ fontSize: '0.8rem', color: mutedColor, marginBottom: '8px' }}>
                  Limit per accident/occurrence of:
                </div>
              </div>
              {CHECKLIST_ITEMS.filter(i => i.section === 'insurance_wc').map(renderCheckItem)}

              {/* CGL */}
              <div style={{ marginTop: '16px', marginBottom: '8px', padding: '0 12px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', color: textColor }}>
                  Commercial General Liability Insurance (CGL)
                </div>
                <div style={{ fontSize: '0.8rem', color: mutedColor }}>Coverage should be:</div>
              </div>
              {CHECKLIST_ITEMS.filter(i => i.section === 'insurance_cgl').map(renderCheckItem)}

              {/* Auto */}
              <div style={{ marginTop: '16px', marginBottom: '8px', padding: '0 12px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', color: textColor }}>
                  <Car size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Automobile Liability Insurance
                </div>
                <div style={{ fontSize: '0.8rem', color: mutedColor }}>
                  Covering all owned, non-owned and hired automobiles with minimum limits of:
                </div>
              </div>
              {CHECKLIST_ITEMS.filter(i => i.section === 'insurance_auto').map(renderCheckItem)}

              {/* Umbrella */}
              <div style={{ marginTop: '16px', marginBottom: '8px', padding: '0 12px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', color: textColor }}>
                  <Umbrella size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Umbrella or Excess Liability
                </div>
                <div style={{ fontSize: '0.8rem', color: mutedColor, lineHeight: '1.5' }}>
                  Jobs up to $250K → $1M min. Jobs $250K–$1M → $3M. Jobs $1M+ → $5M.
                </div>
              </div>
              {CHECKLIST_ITEMS.filter(i => i.section === 'insurance_umbrella').map(renderCheckItem)}
            </div>

            {/* DOCUMENTS section */}
            <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${borderColor}` }}>
              <SectionHeader icon={ClipboardCheck} title="DOCUMENTS" color={accentSecondary} />
              {CHECKLIST_ITEMS.filter(i => i.section === 'documents').map(renderCheckItem)}
            </div>

            {/* Action Buttons */}
            <div style={{
              backgroundColor: cardBg, borderRadius: '12px', padding: '24px', border: `1px solid ${borderColor}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
            }}>
              <button onClick={handleReject} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 20px',
                backgroundColor: 'transparent', border: `1px solid ${accentError}`, color: accentError,
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
              }}>
                <XCircle size={16} /> Reject
              </button>

              <button
                onClick={handleComplete}
                disabled={!allChecked || sending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px',
                  backgroundColor: allChecked ? accentSecondary : (darkMode ? '#1a2332' : '#e5e7eb'),
                  color: allChecked ? '#fff' : mutedColor,
                  border: 'none', borderRadius: '10px',
                  cursor: allChecked && !sending ? 'pointer' : 'not-allowed',
                  fontSize: '1rem', fontWeight: '600', opacity: sending ? 0.7 : 1,
                  boxShadow: allChecked ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {sending ? <Loader size={18} className="spin" /> : <Send size={18} />}
                {sending ? 'Sending Package...' : allChecked ? 'Complete & Send Package' : `${TOTAL_ITEMS - checkedCount} items remaining`}
              </button>
            </div>
          </>
        )}
      </div>

      {showVersion && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px' }}>
          ContractorReviewChecklist v1.0.0
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default ContractorReviewChecklist;
