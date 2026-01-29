// RecruitingTracker.js v2.0 - Connected to Real Backend
// Donnie's Pipeline Management - Tracks contractor/employee leads
import React, { useState, useEffect } from 'react';
import { 
  Users, Truck, Phone, Mail, Calendar, Clock, AlertTriangle, 
  CheckCircle, XCircle, Plus, Search, Filter, ChevronDown, 
  ChevronRight, Edit2, Trash2, Send, UserPlus, Building,
  AlertOctagon, Star, Bell, MapPin, DollarSign, ArrowLeft,
  RefreshCw, Loader, X
} from 'lucide-react';
import { colors } from '../config/constants';

// API URLs
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbwv_5HDf9EhFPi0HhW0zqah5TzR1G3o4Hqo8ytdnq-G2xMuIl9_CbHPVcWCU2T2pgvK/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const RECRUITING_SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc';

const fetchWithRedirect = async (url, options = {}) => {
  try {
    // Use text/plain to avoid CORS preflight - GAS still parses JSON body
    const modifiedOptions = {
      ...options,
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' }
    };
    const response = await fetch(url, modifiedOptions);
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

const RecruitingTracker = ({ darkMode, setCurrentPage }) => {
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const accentWarning = '#f59e0b';
  const accentError = darkMode ? '#ff6b6b' : '#ef4444';
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showVersion, setShowVersion] = useState(false);
  const [message, setMessage] = useState(null);

  const [newLead, setNewLead] = useState({
    name: '', company: '', type: 'contractor', phone: '', email: '',
    drills: '', location: '', status: 'new', notes: '', source: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const text = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsRead',
          params: { spreadsheetId: RECRUITING_SHEET_ID, range: 'Recruiting!A1:L100' }
        })
      });
      const result = JSON.parse(text);
      if (result.success && result.data?.data) {
        const rows = result.data.data;
        const parsedLeads = rows.slice(1).filter(r => r[0]).map((row, idx) => ({
          id: idx + 1,
          timestamp: row[0] || '',
          name: row[1] || '',
          company: row[2] || '',
          type: row[3] || 'contractor',
          phone: row[4] || '',
          email: row[5] || '',
          drills: row[6] || '0',
          location: row[7] || '',
          status: row[8] || 'new',
          notes: row[9] || '',
          source: row[10] || '',
          lastContact: row[11] || ''
        }));
        setLeads(parsedLeads);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
    setLoading(false);
  };

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.phone) {
      setMessage({ type: 'error', text: 'Name and phone are required' });
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
            spreadsheetId: RECRUITING_SHEET_ID,
            range: 'Recruiting!A:L',
            values: [[
              new Date().toISOString(),
              newLead.name, newLead.company, newLead.type, newLead.phone,
              newLead.email, newLead.drills, newLead.location, newLead.status,
              newLead.notes, newLead.source, new Date().toISOString()
            ]]
          }
        })
      });
      const result = JSON.parse(text);
      console.log('Add lead response:', result);
      if (result.success) {
        setMessage({ type: 'success', text: 'Lead added successfully!' });
        setShowAddModal(false);
        setNewLead({ name: '', company: '', type: 'contractor', phone: '', email: '', drills: '', location: '', status: 'new', notes: '', source: '' });
        fetchLeads();
      } else {
        setMessage({ type: 'error', text: result.error || result.message || 'Server returned failure' });
      }
    } catch (err) {
      console.error('Add lead error:', err);
      setMessage({ type: 'error', text: 'Failed to add lead: ' + err.message });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteLead = async (lead) => {
    if (!deleteConfirm || deleteConfirm.id !== lead.id) {
      setDeleteConfirm(lead);
      return;
    }
    setLoading(true);
    try {
      // Row index is lead.id + 1 (for header) + 1 (1-indexed)
      const rowIndex = lead.id + 1;
      const text = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsDeleteRow',
          params: {
            spreadsheetId: RECRUITING_SHEET_ID,
            sheetName: 'Recruiting',
            rowIndex: rowIndex
          }
        })
      });
      const result = JSON.parse(text);
      console.log('Delete response:', result);
      if (result.success) {
        setMessage({ type: 'success', text: 'Lead deleted' });
        setDeleteConfirm(null);
        fetchLeads();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setMessage({ type: 'error', text: 'Failed to delete: ' + err.message });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return accentPrimary;
      case 'contacted': return accentWarning;
      case 'committed': return accentSecondary;
      case 'onboarding': return '#8b5cf6';
      case 'active': return '#10b981';
      case 'declined': return accentError;
      default: return mutedColor;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesType = filterType === 'all' || lead.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    committed: leads.filter(l => l.status === 'committed').length,
    contractors: leads.filter(l => l.type === 'contractor').length,
    employees: leads.filter(l => l.type === 'employee').length,
    totalDrills: leads.reduce((sum, l) => sum + (parseInt(l.drills) || 0), 0)
  };

  const inputStyle = {
    width: '100%', padding: '10px', border: `1px solid ${borderColor}`,
    borderRadius: '8px', backgroundColor: '#ffffff', color: '#1e293b'
  };

  const renderDashboard = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Leads', value: stats.total, color: accentPrimary, icon: Users },
          { label: 'New', value: stats.new, color: accentPrimary, icon: UserPlus },
          { label: 'Contacted', value: stats.contacted, color: accentWarning, icon: Phone },
          { label: 'Committed', value: stats.committed, color: accentSecondary, icon: CheckCircle },
          { label: 'Contractors', value: stats.contractors, color: '#3b82f6', icon: Truck },
          { label: 'Total Drills', value: stats.totalDrills, color: '#8b5cf6', icon: Building },
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <stat.icon size={18} color={stat.color} />
              <span style={{ fontSize: '0.85rem', color: mutedColor }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: stat.color }}>{loading ? '...' : stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor, marginBottom: '16px' }}>Recent Leads</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: mutedColor }}><Loader size={24} /></div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: mutedColor }}>No leads yet. Add your first lead!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leads.slice(0, 5).map(lead => (
              <div key={lead.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: darkMode ? '#1a2633' : '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: `${getStatusColor(lead.status)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {lead.type === 'contractor' ? <Truck size={18} color={getStatusColor(lead.status)} /> : <Users size={18} color={getStatusColor(lead.status)} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', color: textColor }}>{lead.name}</div>
                    <div style={{ fontSize: '0.8rem', color: mutedColor }}>{lead.company || lead.location}</div>
                  </div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', backgroundColor: `${getStatusColor(lead.status)}20`, color: getStatusColor(lead.status), textTransform: 'capitalize' }}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLeadList = () => (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: mutedColor }} />
          <input type="text" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: '40px', backgroundColor: cardBg, color: textColor }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', backgroundColor: cardBg, color: textColor }}>
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="committed">Committed</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="declined">Declined</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...inputStyle, width: 'auto', backgroundColor: cardBg, color: textColor }}>
          <option value="all">All Types</option>
          <option value="contractor">Contractors</option>
          <option value="employee">Employees</option>
        </select>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}><Loader size={32} /></div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>No leads found</div>
        ) : (
          filteredLeads.map((lead, idx) => (
            <div key={lead.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: idx < filteredLeads.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${getStatusColor(lead.status)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {lead.type === 'contractor' ? <Truck size={20} color={getStatusColor(lead.status)} /> : <Users size={20} color={getStatusColor(lead.status)} />}
                </div>
                <div>
                  <div style={{ fontWeight: '500', color: textColor }}>{lead.name}</div>
                  <div style={{ fontSize: '0.85rem', color: mutedColor }}>{lead.company} • {lead.location}</div>
                  <div style={{ fontSize: '0.8rem', color: mutedColor, marginTop: '2px' }}>
                    {lead.phone} {lead.drills ? `• ${lead.drills} drills` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', backgroundColor: `${getStatusColor(lead.status)}20`, color: getStatusColor(lead.status), textTransform: 'capitalize' }}>
                    {lead.status}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: mutedColor, marginTop: '4px' }}>{lead.source}</div>
                </div>
                <button 
                  onClick={() => handleDeleteLead(lead)} 
                  style={{ 
                    padding: '8px', 
                    backgroundColor: deleteConfirm?.id === lead.id ? accentError : 'transparent', 
                    border: `1px solid ${deleteConfirm?.id === lead.id ? accentError : borderColor}`, 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    color: deleteConfirm?.id === lead.id ? '#fff' : mutedColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={deleteConfirm?.id === lead.id ? 'Click again to confirm delete' : 'Delete lead'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '32px' }} onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>
      {message && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', backgroundColor: message.type === 'success' ? accentSecondary : accentError, color: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000 }}>
          {message.text}
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: textColor }}>Add New Lead</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor }}><X size={24} /></button>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Name *</label>
                <input type="text" value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})} style={inputStyle} placeholder="Contact name" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Company</label>
                <input type="text" value={newLead.company} onChange={(e) => setNewLead({...newLead, company: e.target.value})} style={inputStyle} placeholder="Company name" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Type</label>
                  <select value={newLead.type} onChange={(e) => setNewLead({...newLead, type: e.target.value})} style={inputStyle}>
                    <option value="contractor">Contractor</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Drills</label>
                  <input type="number" value={newLead.drills} onChange={(e) => setNewLead({...newLead, drills: e.target.value})} style={inputStyle} placeholder="0" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Phone *</label>
                  <input type="tel" value={newLead.phone} onChange={(e) => setNewLead({...newLead, phone: e.target.value})} style={inputStyle} placeholder="(xxx) xxx-xxxx" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Email</label>
                  <input type="email" value={newLead.email} onChange={(e) => setNewLead({...newLead, email: e.target.value})} style={inputStyle} placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Location</label>
                <input type="text" value={newLead.location} onChange={(e) => setNewLead({...newLead, location: e.target.value})} style={inputStyle} placeholder="City, State" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Source</label>
                <input type="text" value={newLead.source} onChange={(e) => setNewLead({...newLead, source: e.target.value})} style={inputStyle} placeholder="Referral, LinkedIn, etc." />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Notes</label>
                <textarea value={newLead.notes} onChange={(e) => setNewLead({...newLead, notes: e.target.value})} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Additional notes..." />
              </div>
              <button onClick={handleAddLead} disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
                {loading ? 'Adding...' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={() => setCurrentPage('admin-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, cursor: 'pointer' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>Recruiting Pipeline</h1>
            <p style={{ color: mutedColor }}>Track leads, contractors, and employees</p>
          </div>
          <button onClick={fetchLeads} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, cursor: 'pointer' }}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <Plus size={18} /> Add Lead
          </button>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${borderColor}` }}>
          {[{ id: 'dashboard', label: 'Dashboard' }, { id: 'leads', label: 'All Leads' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '12px 24px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === tab.id ? `3px solid ${accentPrimary}` : '3px solid transparent', color: activeTab === tab.id ? accentPrimary : mutedColor, cursor: 'pointer', fontWeight: activeTab === tab.id ? '600' : '400' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'leads' && renderLeadList()}
      </div>

      {showVersion && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px' }}>
          RecruitingTracker v2.5
        </div>
      )}
    </div>
  );
};

export default RecruitingTracker;
