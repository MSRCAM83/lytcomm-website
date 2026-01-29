// PotholeVerification.js v2.1 - Connected to Real Backend
// Pothole documentation and approval workflow
import React, { useState, useEffect } from 'react';
import { 
  Camera, CheckCircle, XCircle, Clock, MapPin, Upload, 
  Eye, AlertTriangle, Image, Trash2, Send, ChevronDown,
  ArrowLeft, RefreshCw, Loader, Plus
} from 'lucide-react';
import { colors } from '../config/constants';

const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbwv_5HDf9EhFPi0HhW0zqah5TzR1G3o4Hqo8ytdnq-G2xMuIl9_CbHPVcWCU2T2pgvK/exec';
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

function PotholeVerification({ darkMode, user, userType, setCurrentPage, loggedInUser }) {
  const currentUser = user || loggedInUser;
  const isSupervisor = userType === 'supervisor' || currentUser?.role === 'admin';
  
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const accentWarning = '#f59e0b';
  const accentError = '#ef4444';
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [activeTab, setActiveTab] = useState(isSupervisor ? 'pending' : 'my-potholes');
  const [potholes, setPotholes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [showVersion, setShowVersion] = useState(false);

  const [newPothole, setNewPothole] = useState({
    project: '', address: '', size: 'small', type: 'asphalt', notes: ''
  });

  useEffect(() => {
    fetchPotholes();
  }, []);

  const fetchPotholes = async () => {
    setLoading(true);
    try {
      const text = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsRead',
          params: { spreadsheetId: SHEET_ID, range: 'Potholes!A1:K100' }
        })
      });
      const result = JSON.parse(text);
      if (result.success && result.data?.data) {
        const rows = result.data.data;
        const parsedPotholes = rows.slice(1).filter(r => r[0]).map((row, idx) => ({
          id: idx + 1,
          timestamp: row[0] || '',
          submittedBy: row[1] || '',
          project: row[2] || '',
          address: row[3] || '',
          size: row[4] || 'small',
          type: row[5] || 'asphalt',
          notes: row[6] || '',
          status: row[7] || 'pending',
          reviewedBy: row[8] || '',
          reviewDate: row[9] || '',
          photoUrl: row[10] || ''
        }));
        setPotholes(parsedPotholes);
      }
    } catch (err) {
      console.error('Failed to fetch potholes:', err);
    }
    setLoading(false);
  };

  const handleAddPothole = async () => {
    if (!newPothole.project || !newPothole.address) {
      setMessage({ type: 'error', text: 'Project and address are required' });
      return;
    }
    setLoading(true);
    try {
      const text = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsAppend',
          params: {
            spreadsheetId: SHEET_ID,
            range: 'Potholes!A:K',
            values: [[
              new Date().toISOString(),
              currentUser?.name || currentUser?.email || '',
              newPothole.project,
              newPothole.address,
              newPothole.size,
              newPothole.type,
              newPothole.notes,
              'pending', '', '', ''
            ]]
          }
        })
      });
      const result = JSON.parse(text);
      if (result.success) {
        setMessage({ type: 'success', text: 'Pothole submitted!' });
        setShowAddModal(false);
        setNewPothole({ project: '', address: '', size: 'small', type: 'asphalt', notes: '' });
        fetchPotholes();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to submit' });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return accentSecondary;
      case 'rejected': return accentError;
      case 'pending': return accentWarning;
      default: return mutedColor;
    }
  };

  const myPotholes = potholes.filter(p => p.submittedBy === (currentUser?.name || currentUser?.email));
  const pendingPotholes = potholes.filter(p => p.status === 'pending');

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

  const inputStyle = {
    width: '100%', padding: '10px', border: `1px solid ${borderColor}`,
    borderRadius: '8px', backgroundColor: '#ffffff', color: '#1e293b'
  };

  const goBack = () => {
    const role = currentUser?.role || userType || 'employee';
    if (role === 'admin') setCurrentPage('admin-dashboard');
    else if (role === 'contractor') setCurrentPage('contractor-dashboard');
    else setCurrentPage('employee-dashboard');
  };

  const renderList = (items, emptyMessage) => (
    <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden' }}>
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}><Loader size={32} /></div>
      ) : items.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>{emptyMessage}</div>
      ) : (
        items.map((pothole, idx) => (
          <div key={pothole.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: idx < items.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${getStatusColor(pothole.status)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={20} color={getStatusColor(pothole.status)} />
              </div>
              <div>
                <div style={{ fontWeight: '500', color: textColor }}>{pothole.address}</div>
                <div style={{ fontSize: '0.85rem', color: mutedColor }}>{pothole.project}</div>
                <div style={{ fontSize: '0.8rem', color: mutedColor }}>{pothole.size} • {pothole.type}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', backgroundColor: `${getStatusColor(pothole.status)}20`, color: getStatusColor(pothole.status), textTransform: 'capitalize' }}>
                {pothole.status}
              </span>
              <div style={{ fontSize: '0.75rem', color: mutedColor, marginTop: '4px' }}>
                {new Date(pothole.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '32px' }} onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>
      {message && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', backgroundColor: message.type === 'success' ? accentSecondary : accentError, color: '#fff', borderRadius: '8px', zIndex: 1000 }}>
          {message.text}
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: textColor, marginBottom: '24px' }}>New Pothole Report</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Project *</label>
                <select value={newPothole.project} onChange={(e) => setNewPothole({...newPothole, project: e.target.value})} style={inputStyle}>
                  <option value="">Select Project</option>
                  {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Address *</label>
                <input type="text" value={newPothole.address} onChange={(e) => setNewPothole({...newPothole, address: e.target.value})} style={inputStyle} placeholder="Street address" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Size</label>
                  <select value={newPothole.size} onChange={(e) => setNewPothole({...newPothole, size: e.target.value})} style={inputStyle}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Surface Type</label>
                  <select value={newPothole.type} onChange={(e) => setNewPothole({...newPothole, type: e.target.value})} style={inputStyle}>
                    <option value="asphalt">Asphalt</option>
                    <option value="concrete">Concrete</option>
                    <option value="gravel">Gravel</option>
                    <option value="dirt">Dirt</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Notes</label>
                <textarea value={newPothole.notes} onChange={(e) => setNewPothole({...newPothole, notes: e.target.value})} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Additional details..." />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAddPothole} disabled={loading} style={{ flex: 1, padding: '12px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, cursor: 'pointer' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>Pothole Documentation</h1>
            <p style={{ color: mutedColor }}>Track and verify pothole repairs</p>
          </div>
          <button onClick={fetchPotholes} style={{ padding: '10px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', cursor: 'pointer' }}>
            <RefreshCw size={18} color={textColor} />
          </button>
          <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <Plus size={18} /> New Report
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total', value: potholes.length, color: accentPrimary },
            { label: 'Pending', value: pendingPotholes.length, color: accentWarning },
            { label: 'Approved', value: potholes.filter(p => p.status === 'approved').length, color: accentSecondary },
            { label: 'Rejected', value: potholes.filter(p => p.status === 'rejected').length, color: accentError },
          ].map((stat, idx) => (
            <div key={idx} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color }}>{loading ? '...' : stat.value}</div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${borderColor}` }}>
          {[
            { id: 'my-potholes', label: 'My Reports' },
            ...(isSupervisor ? [{ id: 'pending', label: 'Pending Review' }] : []),
            { id: 'all', label: 'All Reports' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '12px 24px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === tab.id ? `3px solid ${accentPrimary}` : '3px solid transparent', color: activeTab === tab.id ? accentPrimary : mutedColor, cursor: 'pointer', fontWeight: activeTab === tab.id ? '600' : '400' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'my-potholes' && renderList(myPotholes, 'No reports submitted yet')}
        {activeTab === 'pending' && renderList(pendingPotholes, 'No pending reports')}
        {activeTab === 'all' && renderList(potholes, 'No reports found')}
      </div>

      {showVersion && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px' }}>
          PotholeVerification v1.2
        </div>
      )}
    </div>
  );
}

export default PotholeVerification;
