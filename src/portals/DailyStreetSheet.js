// DailyStreetSheet.js v1.1.0 - Contractor Daily Street Sheet
// Contractors enter company info, crew count, and per-crew location details
// Access via code (no login required) or auto-unlocked when logged in
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, CheckCircle, Loader, Users, MapPin,
  ClipboardList, Building, ChevronDown, ChevronUp, Send, Lock
} from 'lucide-react';
import { colors } from '../config/constants';

const ACCESS_CODE = 'lyt';

const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const PROJECTS_SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc';
const STREET_SHEET_ID = '1-5MGXlNlLNzuNjVB4XWL8vlWokrmZjMsXg-JfTu_bsI';

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

const WORK_TYPES = [
  'Boring', 'Pulling', 'Splicing', 'Aerial', 'Trenching',
  'Potholing', 'Restoration', 'Locate/Survey', 'Other'
];

const DailyStreetSheet = ({ darkMode, user, setCurrentPage, loggedInUser }) => {
  const currentUser = user || loggedInUser;
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  // Access code gate — skip if already logged in
  const [unlocked, setUnlocked] = useState(!!currentUser);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (codeInput.trim().toLowerCase() === ACCESS_CODE) {
      setUnlocked(true);
      setCodeError('');
    } else {
      setCodeError('Invalid access code');
    }
  };

  const [sheetDate, setSheetDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyName, setCompanyName] = useState(currentUser?.company || '');
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState('');
  const [project, setProject] = useState('');
  const [projectOptions, setProjectOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showVersion, setShowVersion] = useState(false);

  // Crews array — each crew has its own section
  const [crews, setCrews] = useState([
    createNewCrew(1)
  ]);

  function createNewCrew(num) {
    return {
      id: Date.now() + num,
      crewNumber: num,
      crewLead: '',
      crewSize: '',
      endedYesterday: '',
      workType: '',
      streets: [{ id: Date.now(), name: '', crossStreet: '', notes: '' }],
      expanded: true,
    };
  }

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const text = await fetchWithRedirect(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'sheetsRead',
            params: { spreadsheetId: PROJECTS_SHEET_ID, range: 'Projects!A2:A50' }
          })
        });
        const result = JSON.parse(text);
        if (result.success && result.data?.data) {
          setProjectOptions(result.data.data.flat().filter(p => p));
        }
      } catch (err) {
        setProjectOptions(['Vexus - Sulphur LA', 'Vexus - Lafayette', 'Metronet - Webster']);
      }
    };
    fetchProjects();
  }, []);

  // --- Crew management ---
  const addCrew = () => {
    setCrews([...crews, createNewCrew(crews.length + 1)]);
  };

  const removeCrew = (crewId) => {
    if (crews.length <= 1) return;
    setCrews(crews.filter(c => c.id !== crewId).map((c, i) => ({ ...c, crewNumber: i + 1 })));
  };

  const updateCrew = (crewId, field, value) => {
    setCrews(crews.map(c => c.id === crewId ? { ...c, [field]: value } : c));
  };

  const toggleCrewExpand = (crewId) => {
    setCrews(crews.map(c => c.id === crewId ? { ...c, expanded: !c.expanded } : c));
  };

  // --- Street management within a crew ---
  const addStreet = (crewId) => {
    setCrews(crews.map(c => {
      if (c.id !== crewId) return c;
      return { ...c, streets: [...c.streets, { id: Date.now(), name: '', crossStreet: '', notes: '' }] };
    }));
  };

  const removeStreet = (crewId, streetId) => {
    setCrews(crews.map(c => {
      if (c.id !== crewId) return c;
      if (c.streets.length <= 1) return c;
      return { ...c, streets: c.streets.filter(s => s.id !== streetId) };
    }));
  };

  const updateStreet = (crewId, streetId, field, value) => {
    setCrews(crews.map(c => {
      if (c.id !== crewId) return c;
      return {
        ...c,
        streets: c.streets.map(s => s.id === streetId ? { ...s, [field]: value } : s)
      };
    }));
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!companyName.trim()) {
      setMessage({ type: 'error', text: 'Please enter your company name' });
      return;
    }
    if (!project) {
      setMessage({ type: 'error', text: 'Please select a project' });
      return;
    }

    // Validate at least one crew has a street
    const hasStreet = crews.some(c => c.streets.some(s => s.name.trim()));
    if (!hasStreet) {
      setMessage({ type: 'error', text: 'Please enter at least one street location' });
      return;
    }

    setLoading(true);
    try {
      // Submit one row per crew
      const rows = crews.map(crew => [
        sheetDate,
        companyName.trim(),
        contactName.trim(),
        contactPhone.trim(),
        project,
        `Crew ${crew.crewNumber}`,
        crew.crewLead.trim(),
        crew.crewSize || '',
        crew.workType || '',
        crew.endedYesterday.trim(),
        crew.streets.map(s => [s.name, s.crossStreet, s.notes].filter(Boolean).join(' / ')).join(' | '),
        crew.streets.length.toString(),
        new Date().toISOString(),
        currentUser?.email || '',
      ]);

      const text = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsAppend',
          params: {
            spreadsheetId: STREET_SHEET_ID,
            range: 'Sheet1!A:N',
            values: rows
          }
        })
      });
      const result = JSON.parse(text);
      if (result.success) {
        setMessage({ type: 'success', text: `Street sheet submitted for ${crews.length} crew${crews.length > 1 ? 's' : ''}!` });
        // Reset crews after successful submit
        setCrews([createNewCrew(1)]);
      } else {
        setMessage({ type: 'error', text: 'Failed to submit — please try again' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error — check your internet and try again' });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 4000);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: `1px solid ${borderColor}`,
    borderRadius: '8px',
    backgroundColor: darkMode ? '#1a2332' : '#ffffff',
    color: darkMode ? '#ffffff' : '#1e293b',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'auto',
  };

  const goBack = () => {
    const role = currentUser?.role || 'contractor';
    if (role === 'admin') setCurrentPage('admin-dashboard');
    else if (role === 'contractor') setCurrentPage('contractor-dashboard');
    else setCurrentPage('employee-dashboard');
  };

  // --- Access Code Screen ---
  if (!unlocked) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{
          backgroundColor: cardBg, borderRadius: '16px', padding: '40px',
          border: `1px solid ${borderColor}`, maxWidth: '400px', width: '100%',
          textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}>
          <Lock size={40} style={{ color: accentPrimary, marginBottom: '16px' }} />
          <h2 style={{ color: textColor, fontSize: '1.3rem', fontWeight: '700', margin: '0 0 8px' }}>
            Daily Street Sheet
          </h2>
          <p style={{ color: mutedColor, fontSize: '0.9rem', margin: '0 0 24px' }}>
            Enter your access code to continue
          </p>
          <form onSubmit={handleCodeSubmit}>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value); setCodeError(''); }}
              placeholder="Access code"
              autoFocus
              style={{
                width: '100%', padding: '14px', border: `1px solid ${codeError ? '#ef4444' : borderColor}`,
                borderRadius: '10px', backgroundColor: darkMode ? '#1a2332' : '#ffffff',
                color: darkMode ? '#ffffff' : '#1e293b', fontSize: '1.1rem', textAlign: 'center',
                letterSpacing: '2px', outline: 'none', marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
            {codeError && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 12px' }}>{codeError}</p>}
            <button type="submit" style={{
              width: '100%', padding: '14px', backgroundColor: accentPrimary, color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '600',
              cursor: 'pointer',
            }}>
              Enter
            </button>
          </form>
          <p style={{ color: mutedColor, fontSize: '0.75rem', marginTop: '20px' }}>
            Contact your LYT project manager if you don't have a code
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '24px 16px' }}
      onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}
    >
      {/* Toast */}
      {message && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          padding: '14px 28px', backgroundColor: message.type === 'success' ? accentSecondary : '#ef4444',
          color: '#fff', borderRadius: '10px', zIndex: 1000, fontSize: '0.95rem', fontWeight: '500',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: '90vw', textAlign: 'center',
        }}>
          {message.text}
        </div>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button onClick={goBack} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            backgroundColor: 'transparent', border: `1px solid ${borderColor}`,
            borderRadius: '8px', color: textColor, cursor: 'pointer', fontSize: '0.9rem',
          }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: textColor, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ClipboardList size={24} style={{ color: accentPrimary }} />
              Daily Street Sheet
            </h1>
            <p style={{ color: mutedColor, margin: '4px 0 0', fontSize: '0.85rem' }}>
              Tell us where your crews are working today
            </p>
          </div>
        </div>

        {/* Company Info Card */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '20px', border: `1px solid ${borderColor}` }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: textColor, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={18} style={{ color: accentPrimary }} />
            Company Info
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.85rem', fontWeight: '500' }}>Date</label>
              <input type="date" value={sheetDate} onChange={(e) => setSheetDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.85rem', fontWeight: '500' }}>Company Name *</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.85rem', fontWeight: '500' }}>Contact Name</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.85rem', fontWeight: '500' }}>Contact Phone</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(555) 555-5555" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.85rem', fontWeight: '500' }}>Project *</label>
              <select value={project} onChange={(e) => setProject(e.target.value)} style={selectStyle}>
                <option value="">Select Project</option>
                {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Crews */}
        {crews.map((crew) => (
          <div key={crew.id} style={{
            backgroundColor: cardBg, borderRadius: '12px', marginBottom: '16px',
            border: `1px solid ${borderColor}`, overflow: 'hidden',
          }}>
            {/* Crew Header — always visible, click to expand/collapse */}
            <div
              onClick={() => toggleCrewExpand(crew.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', cursor: 'pointer',
                backgroundColor: darkMode ? '#131f30' : '#f0f4f8',
                borderBottom: crew.expanded ? `1px solid ${borderColor}` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} style={{ color: accentPrimary }} />
                <span style={{ fontWeight: '600', color: textColor, fontSize: '1rem' }}>
                  Crew {crew.crewNumber}
                </span>
                {crew.crewLead && (
                  <span style={{ color: mutedColor, fontSize: '0.85rem' }}>— {crew.crewLead}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {crews.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCrew(crew.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                    title="Remove crew"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {crew.expanded ? <ChevronUp size={18} color={mutedColor} /> : <ChevronDown size={18} color={mutedColor} />}
              </div>
            </div>

            {/* Crew Body */}
            {crew.expanded && (
              <div style={{ padding: '20px' }}>
                {/* Crew details row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.85rem', fontWeight: '500' }}>Crew Lead</label>
                    <input
                      type="text" value={crew.crewLead}
                      onChange={(e) => updateCrew(crew.id, 'crewLead', e.target.value)}
                      placeholder="Foreman / lead name"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.85rem', fontWeight: '500' }}>Crew Size</label>
                    <input
                      type="number" value={crew.crewSize} min="1" max="50"
                      onChange={(e) => updateCrew(crew.id, 'crewSize', e.target.value)}
                      placeholder="# of workers"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.85rem', fontWeight: '500' }}>Work Type</label>
                    <select value={crew.workType} onChange={(e) => updateCrew(crew.id, 'workType', e.target.value)} style={selectStyle}>
                      <option value="">Select type</option>
                      {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Where ended yesterday */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: mutedColor, fontSize: '0.85rem', fontWeight: '500' }}>
                    <MapPin size={14} /> Where did this crew end yesterday?
                  </label>
                  <input
                    type="text" value={crew.endedYesterday}
                    onChange={(e) => updateCrew(crew.id, 'endedYesterday', e.target.value)}
                    placeholder="Street name, cross street, or address where work stopped"
                    style={inputStyle}
                  />
                </div>

                {/* Today's streets */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ color: textColor, fontSize: '0.9rem', fontWeight: '600' }}>
                      Today's Street(s)
                    </label>
                    <button
                      onClick={() => addStreet(crew.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', backgroundColor: accentPrimary, color: '#fff',
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
                      }}
                    >
                      <Plus size={14} /> Add Street
                    </button>
                  </div>

                  {crew.streets.map((street, idx) => (
                    <div key={street.id} style={{
                      display: 'grid',
                      gridTemplateColumns: crew.streets.length > 1 ? '1fr 1fr 1fr auto' : '1fr 1fr 1fr',
                      gap: '10px', marginBottom: '10px', alignItems: 'end',
                    }}>
                      <div>
                        {idx === 0 && <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.8rem' }}>Street Name *</label>}
                        <input
                          type="text" value={street.name}
                          onChange={(e) => updateStreet(crew.id, street.id, 'name', e.target.value)}
                          placeholder="e.g. Main St"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        {idx === 0 && <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.8rem' }}>Cross Street / Area</label>}
                        <input
                          type="text" value={street.crossStreet}
                          onChange={(e) => updateStreet(crew.id, street.id, 'crossStreet', e.target.value)}
                          placeholder="e.g. between Oak & Elm"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        {idx === 0 && <label style={{ display: 'block', marginBottom: '6px', color: mutedColor, fontSize: '0.8rem' }}>Notes</label>}
                        <input
                          type="text" value={street.notes}
                          onChange={(e) => updateStreet(crew.id, street.id, 'notes', e.target.value)}
                          placeholder="Optional notes"
                          style={inputStyle}
                        />
                      </div>
                      {crew.streets.length > 1 && (
                        <button
                          onClick={() => removeStreet(crew.id, street.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444',
                            padding: '12px 4px', marginBottom: idx === 0 ? '0' : '0',
                          }}
                          title="Remove street"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Crew Button */}
        <button
          onClick={addCrew}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '14px', marginBottom: '24px',
            backgroundColor: 'transparent', border: `2px dashed ${borderColor}`,
            borderRadius: '12px', color: mutedColor, cursor: 'pointer', fontSize: '0.95rem',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentPrimary; e.currentTarget.style.color = accentPrimary; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.color = mutedColor; }}
        >
          <Plus size={18} /> Add Another Crew
        </button>

        {/* Summary & Submit */}
        <div style={{
          backgroundColor: cardBg, borderRadius: '12px', padding: '24px',
          border: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: mutedColor }}>Summary</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor, marginTop: '4px' }}>
              {crews.length} crew{crews.length > 1 ? 's' : ''} &bull; {crews.reduce((sum, c) => sum + c.streets.length, 0)} street{crews.reduce((sum, c) => sum + c.streets.length, 0) !== 1 ? 's' : ''}
            </div>
            {companyName && <div style={{ fontSize: '0.85rem', color: mutedColor, marginTop: '2px' }}>{companyName}</div>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', backgroundColor: accentSecondary, color: '#fff',
              border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem', fontWeight: '600', opacity: loading ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {loading ? <Loader size={18} className="spin" /> : <Send size={18} />}
            {loading ? 'Submitting...' : 'Submit Street Sheet'}
          </button>
        </div>
      </div>

      {/* Version (triple-click) */}
      {showVersion && (
        <div style={{
          position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5,
          color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px',
        }}>
          DailyStreetSheet v1.1.0
        </div>
      )}

      {/* Spinner animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @media (max-width: 600px) {
          div[style*="gridTemplateColumns: repeat(auto-fit"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyStreetSheet;
