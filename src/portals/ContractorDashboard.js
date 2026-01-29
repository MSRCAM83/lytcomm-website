// ContractorDashboard.js v2.1 - Connected to Real Backend
// Submits production logs, equipment checks, time entries to Google Sheets
import React, { useState, useEffect } from 'react';
import { LogOut, Briefcase, FileText, DollarSign, Upload, Users, Wrench, Settings, ChevronRight, Plus, Download, CheckCircle, Clock, AlertCircle, Activity, Truck, Camera, Zap, Phone, Eye, AlertTriangle, Shield, ShieldAlert, Award, MapPin, Shovel, User, Loader } from 'lucide-react';
import { colors, LYT_INFO, URLS } from '../config/constants';

// API URLs
const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec';
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const OPERATIONS_SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc';

// Helper to handle GAS redirects
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
  } catch (err) {
    console.error('Fetch error:', err);
    throw err;
  }
};

// Submit data to Google Sheet
const submitToSheet = async (sheetName, rowData) => {
  try {
    const text = await fetchWithRedirect(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: GATEWAY_SECRET,
        action: 'sheetsAppend',
        params: {
          spreadsheetId: OPERATIONS_SHEET_ID,
          range: `${sheetName}!A:Z`,
          values: [rowData]
        }
      })
    });
    const result = JSON.parse(text);
    return result.success;
  } catch (err) {
    console.error('Submit error:', err);
    return false;
  }
};

const ContractorDashboard = ({ setCurrentPage, loggedInUser, setLoggedInUser, darkMode }) => {
  // Dynamic colors based on theme
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';

  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ show: false, success: false, message: '' });
  const [showVersion, setShowVersion] = useState(false);

  // Production log form state
  const [productionForm, setProductionForm] = useState({
    project: '',
    fiberFootage: '',
    splices: '',
    drops: '',
    poles: '',
    hddFootage: '',
    notes: ''
  });

  // Equipment check form state
  const [equipmentForm, setEquipmentForm] = useState({
    vehicleId: '',
    mileage: '',
    issues: '',
    safetyItems: []
  });

  // Incident form state
  const [incidentForm, setIncidentForm] = useState({
    type: '',
    project: '',
    description: '',
    injuries: false
  });

  const showNotification = (success, message) => {
    setSubmitStatus({ show: true, success, message });
    setTimeout(() => setSubmitStatus({ show: false, success: false, message: '' }), 3000);
  };

  const handleProductionSubmit = async () => {
    if (!productionForm.project) {
      showNotification(false, 'Please select a project');
      return;
    }
    setLoading(true);
    const success = await submitToSheet('Contractor Production', [
      new Date().toISOString(),
      loggedInUser?.email || '',
      loggedInUser?.name || '',
      productionForm.project,
      productionForm.fiberFootage || '0',
      productionForm.splices || '0',
      productionForm.drops || '0',
      productionForm.poles || '0',
      productionForm.hddFootage || '0',
      productionForm.notes,
      'Submitted'
    ]);
    setLoading(false);
    if (success) {
      showNotification(true, 'Production log submitted successfully!');
      setProductionForm({ project: '', fiberFootage: '', splices: '', drops: '', poles: '', hddFootage: '', notes: '' });
    } else {
      showNotification(false, 'Failed to submit. Please try again.');
    }
  };

  const handleEquipmentSubmit = async () => {
    if (!equipmentForm.vehicleId) {
      showNotification(false, 'Please enter vehicle ID');
      return;
    }
    setLoading(true);
    const success = await submitToSheet('Contractor Equipment', [
      new Date().toISOString(),
      loggedInUser?.email || '',
      loggedInUser?.name || '',
      equipmentForm.vehicleId,
      equipmentForm.mileage || '',
      equipmentForm.safetyItems.join(', '),
      equipmentForm.issues || 'None',
      'Submitted'
    ]);
    setLoading(false);
    if (success) {
      showNotification(true, 'Equipment check submitted!');
      setEquipmentForm({ vehicleId: '', mileage: '', issues: '', safetyItems: [] });
    } else {
      showNotification(false, 'Failed to submit. Please try again.');
    }
  };

  const handleIncidentSubmit = async () => {
    if (!incidentForm.type || !incidentForm.description) {
      showNotification(false, 'Please fill in type and description');
      return;
    }
    setLoading(true);
    const success = await submitToSheet('Contractor Incidents', [
      new Date().toISOString(),
      loggedInUser?.email || '',
      loggedInUser?.name || '',
      incidentForm.type,
      incidentForm.project,
      incidentForm.description,
      incidentForm.injuries ? 'Yes' : 'No',
      'Pending Review'
    ]);
    setLoading(false);
    if (success) {
      showNotification(true, 'Incident report submitted! Supervisor notified.');
      setIncidentForm({ type: '', project: '', description: '', injuries: false });
    } else {
      showNotification(false, 'Failed to submit. Please try again.');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentPage('portal-login');
  };

  const formInputStyle = {
    width: '100%',
    padding: '10px',
    border: `1px solid ${darkMode ? '#374151' : '#ddd'}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
  };

  const formSelectStyle = { ...formInputStyle, cursor: 'pointer' };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
    { id: 'profile', label: 'My Profile', icon: User, external: 'profile' },
    { id: 'work-map', label: 'Work Map', icon: MapPin, external: 'work-map' },
    { id: 'potholes', label: 'Pothole Docs', icon: Shovel, external: 'potholes' },
    { id: 'production', label: 'Daily Production', icon: Activity },
    { id: 'equipment', label: 'Equipment Check', icon: Truck },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'incidents', label: 'Incident Reports', icon: ShieldAlert },
    { id: 'invoices', label: 'Invoices', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
            params: { spreadsheetId: OPERATIONS_SHEET_ID, range: 'Projects!A2:A50' }
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

  const renderDashboard = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>
          Welcome, {loggedInUser?.name?.split(' ')[0] || 'Contractor'}!
        </h2>
        <p style={{ color: mutedColor }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'This Month', value: '$0', subtext: 'Pending invoices', icon: DollarSign, color: accentPrimary },
          { label: 'Active Jobs', value: '0', subtext: 'Assigned to you', icon: Briefcase, color: accentSecondary },
          { label: 'Compliance', value: '100%', subtext: 'Documents current', icon: Shield, color: accentSecondary },
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={20} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>{stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: mutedColor }}>{stat.label}</div>
            <div style={{ fontSize: '0.75rem', color: mutedColor }}>{stat.subtext}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Log Production', icon: Activity, color: accentPrimary, tab: 'production' },
          { label: 'Equipment Check', icon: Truck, color: accentSecondary, tab: 'equipment' },
          { label: 'Submit Invoice', icon: DollarSign, color: '#f59e0b', tab: 'invoices' },
          { label: 'Report Incident', icon: ShieldAlert, color: accentError, tab: 'incidents' },
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(action.tab)}
            style={{
              backgroundColor: cardBg,
              borderRadius: '12px',
              padding: '20px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${action.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <action.icon size={22} color={action.color} />
              </div>
              <span style={{ fontWeight: '500', color: textColor }}>{action.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderProduction = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Daily Production Log</h2>
        <p style={{ color: mutedColor }}>Record your crew's daily work progress</p>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', maxWidth: '600px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Project *</label>
          <select value={productionForm.project} onChange={(e) => setProductionForm({...productionForm, project: e.target.value})} style={formSelectStyle}>
            <option value="">Select Project</option>
            {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Fiber Footage</label>
            <input type="number" value={productionForm.fiberFootage} onChange={(e) => setProductionForm({...productionForm, fiberFootage: e.target.value})} placeholder="0" style={formInputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Splices</label>
            <input type="number" value={productionForm.splices} onChange={(e) => setProductionForm({...productionForm, splices: e.target.value})} placeholder="0" style={formInputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Drops</label>
            <input type="number" value={productionForm.drops} onChange={(e) => setProductionForm({...productionForm, drops: e.target.value})} placeholder="0" style={formInputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Poles</label>
            <input type="number" value={productionForm.poles} onChange={(e) => setProductionForm({...productionForm, poles: e.target.value})} placeholder="0" style={formInputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>HDD Footage</label>
            <input type="number" value={productionForm.hddFootage} onChange={(e) => setProductionForm({...productionForm, hddFootage: e.target.value})} placeholder="0" style={formInputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Notes</label>
          <textarea value={productionForm.notes} onChange={(e) => setProductionForm({...productionForm, notes: e.target.value})} rows={3} placeholder="Any delays, issues, or additional notes..." style={{ ...formInputStyle, resize: 'vertical' }} />
        </div>

        <button onClick={handleProductionSubmit} disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: accentPrimary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {loading ? <Loader size={18} /> : <CheckCircle size={18} />}
          {loading ? 'Submitting...' : 'Submit Production Log'}
        </button>
      </div>
    </div>
  );

  const renderEquipment = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Equipment Inspection</h2>
        <p style={{ color: mutedColor }}>Pre-use vehicle and equipment check</p>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', maxWidth: '600px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Vehicle/Equipment ID *</label>
            <input type="text" value={equipmentForm.vehicleId} onChange={(e) => setEquipmentForm({...equipmentForm, vehicleId: e.target.value})} placeholder="e.g., T-101" style={formInputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Mileage/Hours</label>
            <input type="text" value={equipmentForm.mileage} onChange={(e) => setEquipmentForm({...equipmentForm, mileage: e.target.value})} placeholder="Current reading" style={formInputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Safety Checklist</label>
          {['Lights & Signals', 'Tires & Brakes', 'Fluid Levels', 'Safety Equipment', 'Clean Interior'].map((item) => (
            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: textColor, cursor: 'pointer' }}>
              <input type="checkbox" checked={equipmentForm.safetyItems.includes(item)} onChange={(e) => {
                if (e.target.checked) {
                  setEquipmentForm({...equipmentForm, safetyItems: [...equipmentForm.safetyItems, item]});
                } else {
                  setEquipmentForm({...equipmentForm, safetyItems: equipmentForm.safetyItems.filter(i => i !== item)});
                }
              }} />
              {item}
            </label>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Issues Found</label>
          <textarea value={equipmentForm.issues} onChange={(e) => setEquipmentForm({...equipmentForm, issues: e.target.value})} rows={3} placeholder="Describe any issues found..." style={{ ...formInputStyle, resize: 'vertical' }} />
        </div>

        <button onClick={handleEquipmentSubmit} disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {loading ? <Loader size={18} /> : <CheckCircle size={18} />}
          {loading ? 'Submitting...' : 'Submit Inspection'}
        </button>
      </div>
    </div>
  );

  const renderIncidents = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Incident Report</h2>
        <p style={{ color: mutedColor }}>Report safety incidents, near-misses, or property damage</p>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', maxWidth: '600px' }}>
        <div style={{ backgroundColor: `${accentError}15`, padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color={accentError} />
          <span style={{ color: accentError, fontSize: '0.9rem' }}>For emergencies, call 911 first!</span>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Incident Type *</label>
          <select value={incidentForm.type} onChange={(e) => setIncidentForm({...incidentForm, type: e.target.value})} style={formSelectStyle}>
            <option value="">Select Type</option>
            <option value="Near Miss">Near Miss</option>
            <option value="Property Damage">Property Damage</option>
            <option value="Vehicle Accident">Vehicle Accident</option>
            <option value="Injury">Injury</option>
            <option value="Utility Strike">Utility Strike</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Project/Location</label>
          <select value={incidentForm.project} onChange={(e) => setIncidentForm({...incidentForm, project: e.target.value})} style={formSelectStyle}>
            <option value="">Select Project</option>
            {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Description *</label>
          <textarea value={incidentForm.description} onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})} rows={4} placeholder="Describe what happened..." style={{ ...formInputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor, cursor: 'pointer' }}>
            <input type="checkbox" checked={incidentForm.injuries} onChange={(e) => setIncidentForm({...incidentForm, injuries: e.target.checked})} />
            Were there any injuries?
          </label>
        </div>

        <button onClick={handleIncidentSubmit} disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: accentError, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {loading ? <Loader size={18} /> : <ShieldAlert size={18} />}
          {loading ? 'Submitting...' : 'Submit Incident Report'}
        </button>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Compliance Status</h2>
        <p style={{ color: mutedColor }}>Track your insurance, certifications, and required documents</p>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Certificate of Insurance (COI)', status: 'Current', expires: '2026-06-15', color: accentSecondary },
            { label: 'Workers Comp', status: 'Current', expires: '2026-06-15', color: accentSecondary },
            { label: 'General Liability', status: 'Current', expires: '2026-06-15', color: accentSecondary },
            { label: 'Auto Insurance', status: 'Current', expires: '2026-06-15', color: accentSecondary },
            { label: 'W-9', status: 'On File', expires: 'N/A', color: accentSecondary },
            { label: 'Master Subcontractor Agreement', status: 'Signed', expires: 'N/A', color: accentSecondary },
          ].map((doc, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: darkMode ? '#1e293b' : '#f8fafc', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: '500', color: textColor }}>{doc.label}</div>
                <div style={{ fontSize: '0.8rem', color: mutedColor }}>Expires: {doc.expires}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', backgroundColor: `${doc.color}20`, color: doc.color }}>{doc.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Invoices</h2>
        <p style={{ color: mutedColor }}>Submit and track your invoices</p>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
        <DollarSign size={48} color={mutedColor} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3 style={{ color: textColor, marginBottom: '8px' }}>Invoice Submission</h3>
        <p style={{ color: mutedColor, marginBottom: '24px' }}>Submit your invoices using the Metronet-format daily work sheets</p>
        <button onClick={() => setCurrentPage('daily-worksheet')} style={{ padding: '12px 24px', backgroundColor: accentPrimary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
          Generate Daily Work Sheet
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'production': return renderProduction();
      case 'equipment': return renderEquipment();
      case 'compliance': return renderCompliance();
      case 'incidents': return renderIncidents();
      case 'invoices': return renderInvoices();
      default: return renderDashboard();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex' }} onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>
      {/* Notification */}
      {submitStatus.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', backgroundColor: submitStatus.success ? accentSecondary : accentError, color: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {submitStatus.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {submitStatus.message}
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: cardBg, borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            <span style={{ color: darkMode ? '#e6c4d9' : '#0a3a7d' }}>ly</span>
            <span style={{ color: darkMode ? '#e6c4d9' : '#2ec7c0' }}>t</span>
            <span style={{ color: mutedColor, fontSize: '0.9rem', marginLeft: '8px' }}>Contractor</span>
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: `${accentSecondary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentSecondary, fontWeight: '600' }}>
              {loggedInUser?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div style={{ fontWeight: '500', color: textColor }}>{loggedInUser?.name || 'Contractor'}</div>
              <div style={{ fontSize: '0.75rem', color: mutedColor }}>{loggedInUser?.email}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => item.external ? setCurrentPage(item.external) : setActiveTab(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', marginBottom: '4px', backgroundColor: activeTab === item.id ? `${accentPrimary}15` : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: activeTab === item.id ? accentPrimary : textColor, textAlign: 'left' }}>
              <item.icon size={18} />
              <span style={{ flex: 1, fontSize: '0.9rem' }}>{item.label}</span>
              {item.external && <ChevronRight size={14} color={mutedColor} />}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: 'transparent', border: `1px solid ${accentError}`, borderRadius: '8px', color: accentError, cursor: 'pointer', fontSize: '0.9rem' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: '260px', padding: '32px' }}>{renderContent()}</div>

      {showVersion && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px' }}>
          ContractorDashboard v2.1
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;
