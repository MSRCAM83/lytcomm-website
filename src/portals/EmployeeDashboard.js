// EmployeeDashboard.js v2.3 - Project Map nav + Mobile Responsive with Collapsible Sidebar
// Submits production logs, equipment checks, time entries to Google Sheets
import React, { useState, useEffect } from 'react';
import { LogOut, Clock, Briefcase, FileText, Settings, Bell, Play, Square, Calendar, MapPin, ChevronRight, Download, Folder, Camera, HardHat, Activity, Plus, AlertTriangle, Truck, Zap, Phone, Award, Upload, Eye, ShieldAlert, Shovel, User, RefreshCw, Loader, CheckCircle, Menu, X } from 'lucide-react';
import { colors } from '../config/constants';

// API URLs
const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec';
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const OPERATIONS_SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc'; // Using onboarding sheet for now

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
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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

const EmployeeDashboard = ({ setCurrentPage, loggedInUser, setLoggedInUser, darkMode }) => {
  // Dynamic colors based on theme
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';

  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ show: false, success: false, message: '' });
  const [showVersion, setShowVersion] = useState(false);

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Toolbox talk form state
  const [toolboxForm, setToolboxForm] = useState({
    project: '',
    topic: '',
    notes: '',
    attendees: ''
  });

  // Incident form state
  const [incidentForm, setIncidentForm] = useState({
    type: '',
    project: '',
    description: '',
    injuries: false,
    photos: []
  });

  useEffect(() => {
    let interval;
    if (clockedIn && clockTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - clockTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockedIn, clockTime]);

  const formatElapsed = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const showNotification = (success, message) => {
    setSubmitStatus({ show: true, success, message });
    setTimeout(() => setSubmitStatus({ show: false, success: false, message: '' }), 3000);
  };

  const handleClockIn = async () => {
    setClockedIn(true);
    setClockTime(Date.now());
    setElapsedTime(0);
    
    // Log clock-in to sheet
    const success = await submitToSheet('Time Entries', [
      new Date().toISOString(),
      loggedInUser?.email || '',
      loggedInUser?.name || '',
      'CLOCK_IN',
      '',
      '',
      navigator.userAgent
    ]);
    
    if (success) {
      showNotification(true, 'Clocked in successfully');
    }
  };

  const handleClockOut = async () => {
    const hoursWorked = (elapsedTime / 3600).toFixed(2);
    setClockedIn(false);
    setClockTime(null);
    
    // Log clock-out to sheet
    const success = await submitToSheet('Time Entries', [
      new Date().toISOString(),
      loggedInUser?.email || '',
      loggedInUser?.name || '',
      'CLOCK_OUT',
      hoursWorked,
      formatElapsed(elapsedTime),
      navigator.userAgent
    ]);
    
    if (success) {
      showNotification(true, `Clocked out - ${hoursWorked} hours logged`);
    }
  };

  const handleProductionSubmit = async () => {
    if (!productionForm.project) {
      showNotification(false, 'Please select a project');
      return;
    }
    
    setLoading(true);
    const success = await submitToSheet('Production Logs', [
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
    const success = await submitToSheet('Equipment Checks', [
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

  const handleToolboxSubmit = async () => {
    if (!toolboxForm.project || !toolboxForm.topic) {
      showNotification(false, 'Please fill in project and topic');
      return;
    }
    
    setLoading(true);
    const success = await submitToSheet('Safety Talks', [
      new Date().toISOString(),
      loggedInUser?.email || '',
      loggedInUser?.name || '',
      toolboxForm.project,
      toolboxForm.topic,
      toolboxForm.notes,
      toolboxForm.attendees,
      'Completed'
    ]);
    
    setLoading(false);
    if (success) {
      showNotification(true, 'Toolbox talk signed!');
      setToolboxForm({ project: '', topic: '', notes: '', attendees: '' });
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
    const success = await submitToSheet('Incidents', [
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
      setIncidentForm({ type: '', project: '', description: '', injuries: false, photos: [] });
    } else {
      showNotification(false, 'Failed to submit. Please try again.');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentPage('portal-login');
  };

  // Form styles
  const formInputStyle = {
    width: '100%',
    padding: '10px',
    border: `1px solid ${darkMode ? '#374151' : '#ddd'}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
  };

  const formSelectStyle = {
    ...formInputStyle,
    cursor: 'pointer',
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Clock },
    { id: 'profile', label: 'My Profile', icon: User, external: 'profile' },
    { id: 'work-map', label: 'Work Map', icon: MapPin, external: 'work-map' },
    { id: 'project-map', label: 'Project Map', icon: MapPin, external: 'project-map' },
    { id: 'potholes', label: 'Pothole Docs', icon: Shovel, external: 'potholes' },
    { id: 'production', label: 'Daily Production', icon: Activity },
    { id: 'equipment', label: 'Equipment Check', icon: Truck },
    { id: 'safety', label: 'Safety / Toolbox', icon: HardHat },
    { id: 'incidents', label: 'Incident Reports', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Sample projects for dropdown (will be replaced with real data later)
  const [projectOptions, setProjectOptions] = useState([]);

  // Fetch projects from sheet
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const text = await fetchWithRedirect(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'sheetsRead',
            params: { spreadsheetId: OPERATIONS_SHEET_ID, range: 'Projects!A2:A50' }
          })
        });
        const result = JSON.parse(text);
        if (result.success && result.data?.data) {
          const projects = result.data.data.flat().filter(p => p);
          setProjectOptions(projects);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        // Fallback to default
        setProjectOptions(['Metronet - Webster Phase 3', 'Metronet - League City', 'Vexus - Lafayette']);
      }
    };
    fetchProjects();
  }, []);

  const renderDashboard = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {loggedInUser?.name?.split(' ')[0] || 'Team Member'}!
        </h2>
        <p style={{ color: mutedColor }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Time Clock Card */}
      <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: textColor }}>
              <Clock size={24} color={accentPrimary} /> Time Clock
            </h3>
            {clockedIn ? (
              <div>
                <p style={{ color: accentSecondary, fontWeight: '600', fontSize: '1.1rem' }}>● Clocked In</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'monospace', color: accentPrimary }}>{formatElapsed(elapsedTime)}</p>
              </div>
            ) : (
              <p style={{ color: mutedColor }}>You are not clocked in</p>
            )}
          </div>
          <div>
            {clockedIn ? (
              <button onClick={handleClockOut} style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: '600', backgroundColor: accentError, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Square size={20} /> Clock Out
              </button>
            ) : (
              <button onClick={handleClockIn} style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: '600', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={20} /> Clock In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Log Production', icon: Activity, color: accentPrimary, tab: 'production' },
          { label: 'Equipment Check', icon: Truck, color: accentSecondary, tab: 'equipment' },
          { label: 'Safety Talk', icon: HardHat, color: '#f59e0b', tab: 'safety' },
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
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s'
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
        <p style={{ color: mutedColor }}>Record your daily work progress</p>
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
              <input 
                type="checkbox" 
                checked={equipmentForm.safetyItems.includes(item)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEquipmentForm({...equipmentForm, safetyItems: [...equipmentForm.safetyItems, item]});
                  } else {
                    setEquipmentForm({...equipmentForm, safetyItems: equipmentForm.safetyItems.filter(i => i !== item)});
                  }
                }}
              />
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

  const renderSafety = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Toolbox Talk / Safety Meeting</h2>
        <p style={{ color: mutedColor }}>Document daily safety discussions</p>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', maxWidth: '600px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Project *</label>
          <select value={toolboxForm.project} onChange={(e) => setToolboxForm({...toolboxForm, project: e.target.value})} style={formSelectStyle}>
            <option value="">Select Project</option>
            {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Topic *</label>
          <input type="text" value={toolboxForm.topic} onChange={(e) => setToolboxForm({...toolboxForm, topic: e.target.value})} placeholder="e.g., Trench Safety, Heat Illness Prevention" style={formInputStyle} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Notes</label>
          <textarea value={toolboxForm.notes} onChange={(e) => setToolboxForm({...toolboxForm, notes: e.target.value})} rows={3} placeholder="Key points discussed, hazards identified..." style={{ ...formInputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: textColor }}>Attendees</label>
          <textarea value={toolboxForm.attendees} onChange={(e) => setToolboxForm({...toolboxForm, attendees: e.target.value})} rows={2} placeholder="Names of attendees..." style={{ ...formInputStyle, resize: 'vertical' }} />
        </div>

        <button onClick={handleToolboxSubmit} disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {loading ? <Loader size={18} /> : <CheckCircle size={18} />}
          {loading ? 'Submitting...' : 'Sign Toolbox Talk'}
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
          <textarea value={incidentForm.description} onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})} rows={4} placeholder="Describe what happened, contributing factors, and any immediate actions taken..." style={{ ...formInputStyle, resize: 'vertical' }} />
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'production': return renderProduction();
      case 'equipment': return renderEquipment();
      case 'safety': return renderSafety();
      case 'incidents': return renderIncidents();
      default: return renderDashboard();
    }
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        backgroundColor: bgColor, 
        display: 'flex',
        WebkitOverflowScrolling: 'touch',
        overflowX: 'hidden'
      }}
      onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}
    >
      {/* Notification */}
      {submitStatus.show && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '70px' : '20px',
          right: '20px',
          left: isMobile ? '20px' : 'auto',
          padding: '16px 24px',
          backgroundColor: submitStatus.success ? accentSecondary : accentError,
          color: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {submitStatus.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {submitStatus.message}
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          backgroundColor: cardBg,
          borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 1000
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', padding: '8px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            <span style={{ color: darkMode ? '#e6c4d9' : '#0a3a7d' }}>ly</span>
            <span style={{ color: darkMode ? '#e6c4d9' : '#2ec7c0' }}>t</span>
            <span style={{ color: mutedColor, fontSize: '0.85rem', marginLeft: '6px' }}>Field</span>
          </div>
          <div style={{ width: '44px' }} />
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1001 }} />
      )}

      {/* Sidebar */}
      <div style={{ 
        width: '260px', 
        backgroundColor: cardBg, 
        borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        zIndex: isMobile ? 1002 : 1,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transition: isMobile ? 'transform 0.3s ease' : 'none',
        top: 0,
        left: 0
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            <span style={{ color: darkMode ? '#e6c4d9' : '#0a3a7d' }}>ly</span>
            <span style={{ color: darkMode ? '#e6c4d9' : '#2ec7c0' }}>t</span>
            <span style={{ color: mutedColor, fontSize: '0.9rem', marginLeft: '8px' }}>Field</span>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: mutedColor, cursor: 'pointer', padding: '8px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* User Info */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `${accentPrimary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentPrimary, fontWeight: '600' }}>
              {loggedInUser?.name?.charAt(0) || 'E'}
            </div>
            <div>
              <div style={{ fontWeight: '500', color: textColor }}>{loggedInUser?.name || 'Employee'}</div>
              <div style={{ fontSize: '0.75rem', color: mutedColor }}>{loggedInUser?.email}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.external) setCurrentPage(item.external);
                else setActiveTab(item.id);
                if (isMobile) setSidebarOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isMobile ? '14px 16px' : '12px 16px',
                marginBottom: '4px',
                backgroundColor: activeTab === item.id ? `${accentPrimary}15` : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: activeTab === item.id ? accentPrimary : textColor,
                textAlign: 'left',
                transition: 'all 0.2s',
                minHeight: isMobile ? '48px' : 'auto'
              }}
            >
              <item.icon size={18} />
              <span style={{ flex: 1, fontSize: '0.9rem' }}>{item.label}</span>
              {item.external && <ChevronRight size={14} color={mutedColor} />}
            </button>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: isMobile ? '14px' : '12px', backgroundColor: 'transparent', border: `1px solid ${accentError}`, borderRadius: '8px', color: accentError, cursor: 'pointer', fontSize: '0.9rem', minHeight: isMobile ? '48px' : 'auto' }}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        marginLeft: isMobile ? 0 : '260px', 
        padding: isMobile ? '72px 16px 24px' : '32px',
        minHeight: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {renderContent()}
      </div>

      {/* Version Number - Triple Click to Show */}
      {showVersion && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px', zIndex: 9999 }}>
          EmployeeDashboard v2.3
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
