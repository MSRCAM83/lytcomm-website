// InvoiceGenerator.js v2.1 - Connected to Real Backend
import React, { useState, useEffect } from 'react';
import { Receipt, Download, Calendar, DollarSign, FileText, Plus, Trash2, CheckCircle, RefreshCw, ArrowLeft, Loader, Send } from 'lucide-react';
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
      if (match) { return (await fetch(match[1].replace(/&amp;/g, '&'))).text(); }
    }
    return text;
  } catch (err) { throw err; }
};

const InvoiceGenerator = ({ darkMode, user, setCurrentPage, loggedInUser }) => {
  const currentUser = user || loggedInUser;
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVersion, setShowVersion] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [newInvoice, setNewInvoice] = useState({
    project: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '',
    lineItems: [{ description: '', quantity: '', rate: '', total: '0' }]
  });

  const projectOptions = ['Metronet - Webster Phase 3', 'Metronet - League City', 'Metronet - Pearland', 'Vexus - Lafayette'];

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const text = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: GATEWAY_SECRET, action: 'sheetsRead', params: { spreadsheetId: SHEET_ID, range: 'Invoices!A1:J100' } })
      });
      const result = JSON.parse(text);
      if (result.success && result.data?.data) {
        const rows = result.data.data;
        setInvoices(rows.slice(1).filter(r => r[0]).map((row, idx) => ({
          id: idx + 1, invoiceNum: row[0] || `INV-${1000 + idx}`, project: row[1] || '', submittedBy: row[2] || '',
          invoiceDate: row[3] || '', dueDate: row[4] || '', amount: row[5] || '0', status: row[6] || 'draft'
        })));
      }
    } catch (err) { console.error('Failed:', err); }
    setLoading(false);
  };

  const addLineItem = () => setNewInvoice({ ...newInvoice, lineItems: [...newInvoice.lineItems, { description: '', quantity: '', rate: '', total: '0' }] });
  
  const updateLineItem = (idx, field, value) => {
    const items = [...newInvoice.lineItems];
    items[idx][field] = value;
    if (field === 'quantity' || field === 'rate') {
      items[idx].total = ((parseFloat(items[idx].quantity) || 0) * (parseFloat(items[idx].rate) || 0)).toFixed(2);
    }
    setNewInvoice({ ...newInvoice, lineItems: items });
  };

  const removeLineItem = (idx) => setNewInvoice({ ...newInvoice, lineItems: newInvoice.lineItems.filter((_, i) => i !== idx) });
  const getTotal = () => newInvoice.lineItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  const handleSubmit = async () => {
    if (!newInvoice.project) { setMessage({ type: 'error', text: 'Select a project' }); return; }
    setLoading(true);
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    try {
      await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET, action: 'sheetsAppend',
          params: { spreadsheetId: SHEET_ID, range: 'Invoices!A:J',
            values: [[invoiceNum, newInvoice.project, currentUser?.name || '', newInvoice.invoiceDate, newInvoice.dueDate, getTotal().toFixed(2), 'submitted', new Date().toISOString(), JSON.stringify(newInvoice.lineItems), '']]
          }
        })
      });
      setMessage({ type: 'success', text: `Invoice ${invoiceNum} created!` });
      setNewInvoice({ project: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', lineItems: [{ description: '', quantity: '', rate: '', total: '0' }] });
      setActiveTab('list');
      fetchInvoices();
    } catch (err) { setMessage({ type: 'error', text: 'Failed to create invoice' }); }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const getStatusColor = (status) => ({ draft: mutedColor, submitted: accentPrimary, approved: accentSecondary, paid: '#10b981', rejected: '#ef4444' }[status] || mutedColor);
  const inputStyle = { width: '100%', padding: '10px', border: `1px solid ${borderColor}`, borderRadius: '8px', backgroundColor: '#ffffff', color: '#1e293b' };
  const goBack = () => setCurrentPage(currentUser?.role === 'admin' ? 'admin-dashboard' : 'contractor-dashboard');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '32px' }} onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>
      {message && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', backgroundColor: message.type === 'success' ? accentSecondary : '#ef4444', color: '#fff', borderRadius: '8px', zIndex: 1000 }}>{message.text}</div>}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, cursor: 'pointer' }}><ArrowLeft size={18} /> Back</button>
          <div style={{ flex: 1 }}><h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>Invoices</h1><p style={{ color: mutedColor }}>Create and manage invoices</p></div>
          <button onClick={fetchInvoices} style={{ padding: '10px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', cursor: 'pointer' }}><RefreshCw size={18} color={textColor} /></button>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${borderColor}` }}>
          {[{ id: 'list', label: 'All Invoices' }, { id: 'new', label: 'New Invoice' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '12px 24px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === tab.id ? `3px solid ${accentPrimary}` : '3px solid transparent', color: activeTab === tab.id ? accentPrimary : mutedColor, cursor: 'pointer', fontWeight: activeTab === tab.id ? '600' : '400' }}>{tab.label}</button>
          ))}
        </div>

        {activeTab === 'list' && (
          <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden' }}>
            {loading ? <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}><Loader size={32} /></div> : invoices.length === 0 ? <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>No invoices yet</div> : invoices.map((inv, idx) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: idx < invoices.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${getStatusColor(inv.status)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={20} color={getStatusColor(inv.status)} /></div>
                  <div><div style={{ fontWeight: '500', color: textColor }}>{inv.invoiceNum}</div><div style={{ fontSize: '0.85rem', color: mutedColor }}>{inv.project}</div></div>
                </div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '1.1rem', fontWeight: '600', color: accentSecondary }}>${parseFloat(inv.amount).toFixed(2)}</div><span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', backgroundColor: `${getStatusColor(inv.status)}20`, color: getStatusColor(inv.status), textTransform: 'capitalize' }}>{inv.status}</span></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'new' && (
          <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div><label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Project *</label><select value={newInvoice.project} onChange={(e) => setNewInvoice({ ...newInvoice, project: e.target.value })} style={inputStyle}><option value="">Select Project</option>{projectOptions.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              <div><label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Invoice Date</label><input type="date" value={newInvoice.invoiceDate} onChange={(e) => setNewInvoice({ ...newInvoice, invoiceDate: e.target.value })} style={inputStyle} /></div>
              <div><label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Due Date</label><input type="date" value={newInvoice.dueDate} onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} style={inputStyle} /></div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor }}>Line Items</h3><button onClick={addLineItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: accentPrimary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Plus size={16} /> Add</button></div>
              {newInvoice.lineItems.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                  <input type="text" value={item.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)} placeholder="Description" style={{ ...inputStyle, padding: '8px' }} />
                  <input type="number" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} placeholder="Qty" style={{ ...inputStyle, padding: '8px' }} />
                  <input type="number" value={item.rate} onChange={(e) => updateLineItem(idx, 'rate', e.target.value)} placeholder="Rate" style={{ ...inputStyle, padding: '8px' }} />
                  <div style={{ fontWeight: '500', color: textColor, textAlign: 'right' }}>${item.total}</div>
                  <button onClick={() => removeLineItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: `1px solid ${borderColor}` }}>
              <div><div style={{ fontSize: '0.9rem', color: mutedColor }}>Total</div><div style={{ fontSize: '2rem', fontWeight: '700', color: accentSecondary }}>${getTotal().toFixed(2)}</div></div>
              <button onClick={handleSubmit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 32px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '500' }}>{loading ? <Loader size={18} /> : <Send size={18} />}{loading ? 'Submitting...' : 'Submit Invoice'}</button>
            </div>
          </div>
        )}
      </div>

      {showVersion && <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px' }}>InvoiceGenerator v2.1</div>}
    </div>
  );
};

export default InvoiceGenerator;
