// DailyWorkSheet.js v2.1 - Connected to Real Backend
// Auto Daily Work Sheet Generator (Metronet Format)
import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Download, Calendar, MapPin, Clock, User, Truck,
  Plus, Trash2, ChevronDown, CheckCircle, AlertCircle, RefreshCw,
  Building, Phone, Settings, Eye, Filter, Search, ArrowLeft, Loader
} from 'lucide-react';
import { colors } from '../config/constants';

const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc';

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

const DailyWorkSheet = ({ darkMode, user, setCurrentPage, loggedInUser }) => {
  const currentUser = user || loggedInUser;
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [project, setProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [message, setMessage] = useState(null);
  const [savedSheets, setSavedSheets] = useState([]);

  const [lineItems, setLineItems] = useState([
    { id: 1, description: '', quantity: '', unit: 'FT', rate: '', total: '' }
  ]);

  const [crewMembers, setCrewMembers] = useState([
    { id: 1, name: '', hours: '', rate: '' }
  ]);

  const [projectOptions, setProjectOptions] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const text = await fetchWithRedirect(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'sheetsRead',
            params: { spreadsheetId: SHEET_ID, range: 'Projects!A2:A50' }
          })
        });
        const result = JSON.parse(text);
        if (result.success && result.data?.data) {
          setProjectOptions(result.data.data.flat().filter(p => p));
        }
      } catch (err) {
        setProjectOptions(['Metronet - Webster Phase 3', 'Metronet - League City', 'Vexus - Lafayette']);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchSavedSheets();
  }, []);

  const fetchSavedSheets = async () => {
    try {
      const text = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsRead',
          params: { spreadsheetId: SHEET_ID, range: 'Work Sheets!A1:J50' }
        })
      });
      const result = JSON.parse(text);
      if (result.success && result.data?.data) {
        const rows = result.data.data;
        const sheets = rows.slice(1).filter(r => r[0]).map((row, idx) => ({
          id: idx + 1,
          date: row[0] || '',
          project: row[1] || '',
          submittedBy: row[2] || '',
          totalAmount: row[3] || '0',
          status: row[4] || 'draft',
          lineItems: row[5] || '',
          crew: row[6] || ''
        }));
        setSavedSheets(sheets);
      }
    } catch (err) {
      console.error('Failed to fetch sheets:', err);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), description: '', quantity: '', unit: 'FT', rate: '', total: '' }]);
  };

  const removeLineItem = (id) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id, field, value) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          const qty = parseFloat(updated.quantity) || 0;
          const rate = parseFloat(updated.rate) || 0;
          updated.total = (qty * rate).toFixed(2);
        }
        return updated;
      }
      return item;
    }));
  };

  const addCrewMember = () => {
    setCrewMembers([...crewMembers, { id: Date.now(), name: '', hours: '', rate: '' }]);
  };

  const removeCrewMember = (id) => {
    setCrewMembers(crewMembers.filter(m => m.id !== id));
  };

  const updateCrewMember = (id, field, value) => {
    setCrewMembers(crewMembers.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const calculateTotals = () => {
    const lineTotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const laborTotal = crewMembers.reduce((sum, m) => sum + ((parseFloat(m.hours) || 0) * (parseFloat(m.rate) || 0)), 0);
    return { lineTotal, laborTotal, grandTotal: lineTotal + laborTotal };
  };

  const handleSave = async () => {
    if (!project || !workDate) {
      setMessage({ type: 'error', text: 'Please select project and date' });
      return;
    }
    setLoading(true);
    const totals = calculateTotals();
    try {
      const text = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsAppend',
          params: {
            spreadsheetId: SHEET_ID,
            range: 'Work Sheets!A:J',
            values: [[
              workDate,
              project,
              currentUser?.name || currentUser?.email || '',
              totals.grandTotal.toFixed(2),
              'draft',
              JSON.stringify(lineItems),
              JSON.stringify(crewMembers),
              new Date().toISOString(),
              totals.lineTotal.toFixed(2),
              totals.laborTotal.toFixed(2)
            ]]
          }
        })
      });
      const result = JSON.parse(text);
      if (result.success) {
        setMessage({ type: 'success', text: 'Work sheet saved!' });
        fetchSavedSheets();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save' });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const inputStyle = {
    width: '100%', padding: '10px', border: `1px solid ${borderColor}`,
    borderRadius: '8px', backgroundColor: '#ffffff', color: '#1e293b'
  };

  const goBack = () => {
    const role = currentUser?.role || 'contractor';
    if (role === 'admin') setCurrentPage('admin-dashboard');
    else if (role === 'contractor') setCurrentPage('contractor-dashboard');
    else setCurrentPage('employee-dashboard');
  };

  const totals = calculateTotals();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '32px' }} onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>
      {message && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', backgroundColor: message.type === 'success' ? accentSecondary : '#ef4444', color: '#fff', borderRadius: '8px', zIndex: 1000 }}>
          {message.text}
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, cursor: 'pointer' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>Daily Work Sheet</h1>
            <p style={{ color: mutedColor }}>Metronet format billing</p>
          </div>
        </div>

        {/* Header Info */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Date *</label>
              <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Project *</label>
              <select value={project} onChange={(e) => setProject(e.target.value)} style={inputStyle}>
                <option value="">Select Project</option>
                {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Submitted By</label>
              <input type="text" value={currentUser?.name || ''} disabled style={{ ...inputStyle, backgroundColor: '#f3f4f6' }} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor }}>Line Items</h3>
            <button onClick={addLineItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: accentPrimary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              <Plus size={16} /> Add Item
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: mutedColor, fontWeight: '500' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: mutedColor, fontWeight: '500', width: '100px' }}>Qty</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: mutedColor, fontWeight: '500', width: '80px' }}>Unit</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: mutedColor, fontWeight: '500', width: '100px' }}>Rate</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: mutedColor, fontWeight: '500', width: '100px' }}>Total</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map(item => (
                  <tr key={item.id}>
                    <td style={{ padding: '8px' }}><input type="text" value={item.description} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)} placeholder="Work description" style={{ ...inputStyle, padding: '8px' }} /></td>
                    <td style={{ padding: '8px' }}><input type="number" value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)} style={{ ...inputStyle, padding: '8px', textAlign: 'center' }} /></td>
                    <td style={{ padding: '8px' }}>
                      <select value={item.unit} onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)} style={{ ...inputStyle, padding: '8px' }}>
                        <option>FT</option><option>EA</option><option>HR</option><option>LF</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}><input type="number" value={item.rate} onChange={(e) => updateLineItem(item.id, 'rate', e.target.value)} placeholder="$" style={{ ...inputStyle, padding: '8px', textAlign: 'center' }} /></td>
                    <td style={{ padding: '8px', textAlign: 'right', color: textColor, fontWeight: '500' }}>${item.total || '0.00'}</td>
                    <td style={{ padding: '8px' }}><button onClick={() => removeLineItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'right', marginTop: '16px', fontSize: '1.1rem', color: textColor }}>
            Line Items Total: <strong>${totals.lineTotal.toFixed(2)}</strong>
          </div>
        </div>

        {/* Crew */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor }}>Crew</h3>
            <button onClick={addCrewMember} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              <Plus size={16} /> Add Member
            </button>
          </div>
          
          {crewMembers.map(member => (
            <div key={member.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
              <input type="text" value={member.name} onChange={(e) => updateCrewMember(member.id, 'name', e.target.value)} placeholder="Name" style={{ ...inputStyle, padding: '8px' }} />
              <input type="number" value={member.hours} onChange={(e) => updateCrewMember(member.id, 'hours', e.target.value)} placeholder="Hours" style={{ ...inputStyle, padding: '8px' }} />
              <input type="number" value={member.rate} onChange={(e) => updateCrewMember(member.id, 'rate', e.target.value)} placeholder="$/hr" style={{ ...inputStyle, padding: '8px' }} />
              <button onClick={() => removeCrewMember(member.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: '16px', fontSize: '1.1rem', color: textColor }}>
            Labor Total: <strong>${totals.laborTotal.toFixed(2)}</strong>
          </div>
        </div>

        {/* Grand Total & Save */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: mutedColor }}>Grand Total</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: accentSecondary }}>${totals.grandTotal.toFixed(2)}</div>
          </div>
          <button onClick={handleSave} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 32px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '500' }}>
            {loading ? <Loader size={18} /> : <CheckCircle size={18} />}
            {loading ? 'Saving...' : 'Save Work Sheet'}
          </button>
        </div>
      </div>

      {showVersion && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px' }}>
          DailyWorkSheet v2.1
        </div>
      )}
    </div>
  );
};

export default DailyWorkSheet;
