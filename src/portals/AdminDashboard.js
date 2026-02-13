// AdminDashboard.js v3.7 - NotificationBell + Project Map System navigation
// Fetches users directly from Google Sheets CSV export
import React, { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Users, Briefcase, DollarSign, FileText, Settings, ChevronRight, CheckCircle, XCircle, Search, Building2, Eye, MapPin, UserCog, Target, Shovel, BarChart3, History, User, RefreshCw, Loader, Menu, X, Sun, Moon, Map, Upload, FolderOpen, UserPlus, Shield, FlaskConical, Clipboard } from 'lucide-react';
import { colors } from '../config/constants';
import { submitTestContractor, submitTestEmployee } from '../services/testSubmissions';
import NotificationBell from '../components/NotificationBell';

// Direct Google Sheets CSV URLs (for reading data)
const USERS_SHEET_CSV = 'https://docs.google.com/spreadsheets/d/1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw/gviz/tq?tqx=out:csv';
const ONBOARDING_SHEET_CSV = 'https://docs.google.com/spreadsheets/d/1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc/gviz/tq?tqx=out:csv';

// Gateway URL for write operations (approve/reject)
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyz_BihP2CsJf37P0RCDZoTDTH1FkH3D9zY_x0V-Dy1_QzjPQLmtppTbNiybAfev4ehtw/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const ONBOARDING_SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc';

// Helper to handle GAS redirects (for write operations)
const fetchWithRedirect = async (url, options = {}) => {
  try {
    const response = await fetch(url, { ...options, redirect: 'follow', mode: 'cors' });
    const text = await response.text();
    if (text.trim().startsWith('<') || text.includes('HREF=')) {
      const match = text.match(/HREF="([^"]+)"/i) || text.match(/href="([^"]+)"/i);
      if (match) {
        const redirectUrl = match[1].replace(/&amp;/g, '&');
        const redirectResponse = await fetch(redirectUrl, { mode: 'cors' });
        return redirectResponse.text();
      }
    }
    return text;
  } catch (err) {
    console.error('fetchWithRedirect error:', err);
    throw err;
  }
};

// Parse CSV text into array of objects
const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Parse header row (handle quoted values)
  const parseRow = (row) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };
  
  const headers = parseRow(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] || '';
    });
    data.push(obj);
  }
  
  return data;
};

const AdminDashboard = ({ setCurrentPage, loggedInUser, setLoggedInUser, darkMode, setDarkMode }) => {
  // Dynamic colors based on theme
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';

  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';

  // State for real data
  const [users, setUsers] = useState([]);
  const [onboardingSubmissions, setOnboardingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showVersion, setShowVersion] = useState(false);
  
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false); // Close sidebar when switching to desktop
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch real data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch users directly from Google Sheets CSV export
      const usersResponse = await fetch(USERS_SHEET_CSV);
      const usersCSV = await usersResponse.text();
      const usersData = parseCSV(usersCSV);
      
      // Filter out empty rows and map to expected format
      const validUsers = usersData
        .filter(u => u.email && u.email.includes('@'))
        .map(u => ({
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status || 'active',
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
          invitedBy: u.invitedBy
        }));
      
      setUsers(validUsers);

      // Try to fetch onboarding data (may fail if sheet is private)
      try {
        const onboardingResponse = await fetch(ONBOARDING_SHEET_CSV);
        const onboardingCSV = await onboardingResponse.text();
        
        // Check if we got HTML (login page) instead of CSV
        if (!onboardingCSV.includes('<!DOCTYPE') && !onboardingCSV.includes('<html')) {
          const onboardingData = parseCSV(onboardingCSV);
          const submissions = onboardingData
            .filter(row => row.Timestamp || row.timestamp)
            .map((row, idx) => ({
              id: idx + 1,
              timestamp: row.Timestamp || row.timestamp || '',
              type: row.Type || row.type || '',
              name: row.Name || row.name || row['Company'] || '',
              email: row.Email || row.email || '',
              phone: row.Phone || row.phone || '',
              status: row.Status || row.status || 'Pending',
              folderLink: row['Folder Link'] || row.folderLink || ''
            }))
            .filter(s => s.name && !s.name.includes('Unknown'));
          
          setOnboardingSubmissions(submissions);
        }
      } catch (onboardingErr) {
        console.log('Onboarding sheet not accessible:', onboardingErr);
        // Onboarding data unavailable - that's ok, just show users
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data. Please refresh.');
    }
    
    setLoading(false);
  };


  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentPage('portal-login');
  };

  // Computed values from real data
  const employees = users.filter(u => u.role === 'employee');
  const contractors = users.filter(u => u.role === 'contractor');
  const admins = users.filter(u => u.role === 'admin');
  const pendingOnboarding = onboardingSubmissions.filter(s => s.status !== 'Approved' && s.status !== 'Rejected');
  const recentSubmissions = onboardingSubmissions.slice(0, 10);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User, external: 'profile' },
    { id: 'metrics', label: 'Metrics Dashboard', icon: BarChart3, external: 'metrics' },
    { id: 'activity-log', label: 'Activity Log', icon: History, external: 'activity-log' },
    { id: 'onboarding', label: 'Pending Onboarding', icon: UserPlus, badge: pendingOnboarding.length },
    { id: 'recruiting', label: 'Recruiting Pipeline', icon: Target, external: 'recruiting' },
    { id: 'divider-maps', label: '── Project Maps ──', divider: true },
    { id: 'project-map', label: 'Interactive Map', icon: Map, external: 'project-map' },
    { id: 'admin-projects', label: 'Projects Overview', icon: FolderOpen, external: 'admin-projects' },
    { id: 'job-import', label: 'Import Work Orders', icon: Upload, external: 'job-import' },
    { id: 'json-import', label: 'Import JSON Data', icon: Clipboard, external: 'json-import' },
    { id: 'daily-report', label: 'Daily Report', icon: FileText, external: 'daily-report' },
    { id: 'divider-field', label: '── Field Operations ──', divider: true },
    { id: 'work-map', label: 'Work Map', icon: MapPin, external: 'work-map' },
    { id: 'potholes', label: 'Pothole Approvals', icon: Shovel, external: 'potholes' },
    { id: 'street-sheet', label: 'Street Sheets', icon: MapPin, external: 'street-sheet' },
    { id: 'daily-worksheet', label: 'Daily Work Sheets', icon: FileText, external: 'daily-worksheet' },
    { id: 'invoice-gen', label: 'Invoice Generator', icon: DollarSign, external: 'invoices' },
    { id: 'divider-mgmt', label: '── Management ──', divider: true },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'contractors', label: 'Contractors', icon: Briefcase },
    { id: 'user-management', label: 'User Management', icon: UserCog, external: 'admin-users' },
    { id: 'admins', label: 'Admin Users', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'testing', label: 'Test Submissions', icon: FlaskConical },
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active':
      case 'completed':
        return accentSecondary;
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return accentError;
      default:
        return mutedColor;
    }
  };

  const handleApproveOnboarding = async (submission) => {
    try {
      // Update the sheet - find the row and update status column
      const rowNumber = submission.id + 1; // +1 for header row
      await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsUpdate',
          params: {
            spreadsheetId: ONBOARDING_SHEET_ID,
            range: `O${rowNumber}`,
            values: [['Approved']]
          }
        })
      });
      setOnboardingSubmissions(prev => 
        prev.map(s => s.id === submission.id ? { ...s, status: 'Approved' } : s)
      );
      alert(`Approved: ${submission.name}`);
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('Failed to update status');
    }
  };

  const handleRejectOnboarding = async (submission) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      const rowNumber = submission.id + 1;
      await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsUpdate',
          params: {
            spreadsheetId: ONBOARDING_SHEET_ID,
            range: `O${rowNumber}:P${rowNumber}`,
            values: [['Rejected', reason || '']]
          }
        })
      });
      setOnboardingSubmissions(prev => 
        prev.map(s => s.id === submission.id ? { ...s, status: 'Rejected' } : s)
      );
      alert(`Rejected: ${submission.name}`);
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('Failed to update status');
    }
  };

  const renderDashboard = () => (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Admin Dashboard</h2>
          <p style={{ color: mutedColor }}>
            Overview of operations and pending approvals
            {lastRefresh && <span style={{ marginLeft: '16px', fontSize: '0.8rem' }}>Last updated: {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: accentPrimary,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? <Loader size={18} className="spin" /> : <RefreshCw size={18} />}
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: `${accentError}20`, borderRadius: '8px', marginBottom: '24px', color: accentError }}>
          {error}
        </div>
      )}

      {/* Stats Grid - Real Data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: accentPrimary },
          { label: 'Employees', value: employees.length, icon: Users, color: accentPrimary },
          { label: 'Contractors', value: contractors.length, icon: Briefcase, color: accentPrimary },
          { label: 'Admins', value: admins.length, icon: Shield, color: accentSecondary },
          { label: 'Pending Onboarding', value: pendingOnboarding.length, icon: UserPlus, color: accentError, onClick: () => setActiveTab('onboarding') },
        ].map((stat, idx) => (
          <div 
            key={idx} 
            onClick={stat.onClick}
            style={{ 
              backgroundColor: cardBg, 
              borderRadius: '12px', 
              padding: '20px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              cursor: stat.onClick ? 'pointer' : 'default',
              transition: 'transform 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={20} color={stat.color} />
              </div>
              {stat.onClick && <ChevronRight size={16} color={mutedColor} />}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>{loading ? '...' : stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: mutedColor }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Onboarding Submissions */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor }}>Recent Onboarding Submissions</h3>
          <button 
            onClick={() => setActiveTab('onboarding')}
            style={{ color: accentPrimary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            View All →
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: mutedColor }}>Loading...</div>
        ) : recentSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: mutedColor }}>No submissions yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                  <th style={{ textAlign: 'left', padding: '12px', color: mutedColor, fontWeight: '500', fontSize: '0.85rem' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: mutedColor, fontWeight: '500', fontSize: '0.85rem' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: mutedColor, fontWeight: '500', fontSize: '0.85rem' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: mutedColor, fontWeight: '500', fontSize: '0.85rem' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: mutedColor, fontWeight: '500', fontSize: '0.85rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.slice(0, 5).map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                    <td style={{ padding: '12px', color: textColor }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        backgroundColor: sub.type === 'Employee' ? `${accentPrimary}20` : `${accentSecondary}20`,
                        color: sub.type === 'Employee' ? accentPrimary : accentSecondary
                      }}>
                        {sub.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: textColor, fontWeight: '500' }}>{sub.name}</td>
                    <td style={{ padding: '12px', color: mutedColor }}>{sub.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        backgroundColor: `${getStatusColor(sub.status)}20`,
                        color: getStatusColor(sub.status)
                      }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: mutedColor, fontSize: '0.85rem' }}>
                      {new Date(sub.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users Overview */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor }}>Portal Users</h3>
          <button 
            onClick={() => setCurrentPage('admin-users')}
            style={{ color: accentPrimary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Manage Users →
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: mutedColor }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {users.slice(0, 6).map((user) => (
              <div key={user.email} style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  backgroundColor: `${accentPrimary}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: accentPrimary,
                  fontWeight: '600'
                }}>
                  {user.name?.charAt(0) || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '500', color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: mutedColor }}>{user.role}</div>
                </div>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: user.status === 'active' ? accentSecondary : mutedColor 
                }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderOnboarding = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Pending Onboarding</h2>
        <p style={{ color: mutedColor }}>Review and approve new employee and contractor submissions</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: mutedColor }}>
          <Loader size={32} style={{ marginBottom: '16px' }} />
          <div>Loading submissions...</div>
        </div>
      ) : onboardingSubmissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: cardBg, borderRadius: '12px', color: mutedColor }}>
          <UserPlus size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <div>No onboarding submissions yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {onboardingSubmissions.map((sub) => (
            <div key={sub.id} style={{ 
              backgroundColor: cardBg, 
              borderRadius: '12px', 
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    backgroundColor: sub.type === 'Employee' ? `${accentPrimary}20` : `${accentSecondary}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {sub.type === 'Employee' ? <User size={24} color={accentPrimary} /> : <Building2 size={24} color={accentSecondary} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', color: textColor }}>{sub.name}</div>
                    <div style={{ color: mutedColor, fontSize: '0.9rem' }}>{sub.email}</div>
                  </div>
                </div>
                <span style={{ 
                  padding: '6px 12px', 
                  borderRadius: '6px', 
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  backgroundColor: `${getStatusColor(sub.status)}20`,
                  color: getStatusColor(sub.status)
                }}>
                  {sub.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: mutedColor, marginBottom: '4px' }}>Type</div>
                  <div style={{ color: textColor }}>{sub.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: mutedColor, marginBottom: '4px' }}>Phone</div>
                  <div style={{ color: textColor }}>{sub.phone || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: mutedColor, marginBottom: '4px' }}>Submitted</div>
                  <div style={{ color: textColor }}>{new Date(sub.timestamp).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {sub.folderLink && (
                  <a 
                    href={sub.folderLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: '6px', 
                      border: `1px solid ${accentPrimary}`,
                      color: accentPrimary,
                      backgroundColor: 'transparent',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <Eye size={16} /> View Documents
                  </a>
                )}
                {sub.status !== 'Approved' && sub.status !== 'Rejected' && (
                  <>
                    <button 
                      onClick={() => handleRejectOnboarding(sub)}
                      style={{ 
                        padding: '8px 16px', 
                        borderRadius: '6px', 
                        border: `1px solid ${accentError}`,
                        color: accentError,
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => handleApproveOnboarding(sub)}
                      style={{ 
                        padding: '8px 16px', 
                        borderRadius: '6px', 
                        border: 'none',
                        color: '#fff',
                        backgroundColor: accentSecondary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEmployees = () => (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Employees</h2>
          <p style={{ color: mutedColor }}>{employees.length} registered employees</p>
        </div>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: mutedColor }} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                backgroundColor: darkMode ? '#1e293b' : '#fff',
                color: textColor,
                outline: 'none'
              }}
            />
          </div>
        </div>

        {employees
          .filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || e.email?.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((employee, idx) => (
          <div key={employee.email} style={{ 
            padding: '16px 20px', 
            borderBottom: idx < employees.length - 1 ? `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '50%', 
              backgroundColor: `${accentPrimary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentPrimary,
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              {employee.name?.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', color: textColor }}>{employee.name}</div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>{employee.email}</div>
            </div>
            <div style={{ 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.75rem',
              backgroundColor: employee.status === 'active' ? `${accentSecondary}20` : `${mutedColor}20`,
              color: employee.status === 'active' ? accentSecondary : mutedColor
            }}>
              {employee.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContractors = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Contractors</h2>
        <p style={{ color: mutedColor }}>{contractors.length} registered contractors</p>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden' }}>
        {contractors.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
            <Briefcase size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div>No contractors registered yet</div>
          </div>
        ) : contractors.map((contractor, idx) => (
          <div key={contractor.email} style={{ 
            padding: '16px 20px', 
            borderBottom: idx < contractors.length - 1 ? `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '8px', 
              backgroundColor: `${accentSecondary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={22} color={accentSecondary} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', color: textColor }}>{contractor.name}</div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>{contractor.email}</div>
            </div>
            <div style={{ 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.75rem',
              backgroundColor: contractor.status === 'active' ? `${accentSecondary}20` : `${mutedColor}20`,
              color: contractor.status === 'active' ? accentSecondary : mutedColor
            }}>
              {contractor.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdmins = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Admin Users</h2>
        <p style={{ color: mutedColor }}>{admins.length} administrators with full access</p>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden' }}>
        {admins.map((admin, idx) => (
          <div key={admin.email} style={{ 
            padding: '16px 20px', 
            borderBottom: idx < admins.length - 1 ? `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '50%', 
              backgroundColor: `${accentError}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={22} color={accentError} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', color: textColor }}>{admin.name}</div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>{admin.email}</div>
            </div>
            <div style={{ fontSize: '0.8rem', color: mutedColor }}>
              Last login: {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ===== TEST SUBMISSIONS =====
  const [testStatus, setTestStatus] = useState({ contractor: null, employee: null });
  const [testLogs, setTestLogs] = useState({ contractor: [], employee: [] });
  const [testRunning, setTestRunning] = useState({ contractor: false, employee: false });

  const handleTestContractor = async () => {
    setTestRunning(prev => ({ ...prev, contractor: true }));
    setTestLogs(prev => ({ ...prev, contractor: [] }));
    setTestStatus(prev => ({ ...prev, contractor: null }));
    try {
      const result = await submitTestContractor((msg) => {
        setTestLogs(prev => ({ ...prev, contractor: [...prev.contractor, msg] }));
      });
      setTestStatus(prev => ({ ...prev, contractor: result.success ? 'success' : 'error' }));
    } catch (err) {
      setTestStatus(prev => ({ ...prev, contractor: 'error' }));
    }
    setTestRunning(prev => ({ ...prev, contractor: false }));
  };

  const handleTestEmployee = async () => {
    setTestRunning(prev => ({ ...prev, employee: true }));
    setTestLogs(prev => ({ ...prev, employee: [] }));
    setTestStatus(prev => ({ ...prev, employee: null }));
    try {
      const result = await submitTestEmployee((msg) => {
        setTestLogs(prev => ({ ...prev, employee: [...prev.employee, msg] }));
      });
      setTestStatus(prev => ({ ...prev, employee: result.success ? 'success' : 'error' }));
    } catch (err) {
      setTestStatus(prev => ({ ...prev, employee: 'error' }));
    }
    setTestRunning(prev => ({ ...prev, employee: false }));
  };

  const renderTesting = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: textColor }}>Test Submissions</h2>
      <p style={{ color: colors.gray, marginBottom: '24px' }}>Generate fully-filled test contractor and employee submissions with all PDFs and signatures.</p>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
        {/* Contractor Test */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Building2 size={24} color={accentPrimary} />
            <h3 style={{ margin: 0, color: textColor, fontSize: '1.1rem' }}>Test Contractor</h3>
          </div>
          <p style={{ color: colors.gray, fontSize: '0.9rem', marginBottom: '16px' }}>
            Submits "Test Contractor LLC" with W-9, MSA, Rate Card, Insurance, Fleet, Skills, Direct Deposit, and Safety PDFs.
          </p>
          <button
            onClick={handleTestContractor}
            disabled={testRunning.contractor}
            style={{
              padding: '10px 20px',
              backgroundColor: testRunning.contractor ? '#9ca3af' : accentPrimary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: testRunning.contractor ? 'wait' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {testRunning.contractor ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDFs...</> : 'Run Contractor Test'}
          </button>
          {testLogs.contractor.length > 0 && (
            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: darkMode ? '#1a1a2e' : '#f1f5f9', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {testLogs.contractor.map((log, i) => (
                <div key={i} style={{ color: log.includes('ERROR') || log.includes('FAILED') ? '#ef4444' : log.includes('SUCCESS') ? '#22c55e' : (darkMode ? '#d1d5db' : '#475569'), marginBottom: '2px' }}>{log}</div>
              ))}
            </div>
          )}
          {testStatus.contractor === 'success' && <div style={{ marginTop: '10px', color: '#22c55e', fontWeight: '600' }}>Submitted - check Google Drive + email</div>}
          {testStatus.contractor === 'error' && <div style={{ marginTop: '10px', color: '#ef4444', fontWeight: '600' }}>Failed - check console for details</div>}
        </div>

        {/* Employee Test */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <User size={24} color={accentSecondary} />
            <h3 style={{ margin: 0, color: textColor, fontSize: '1.1rem' }}>Test Employee</h3>
          </div>
          <p style={{ color: colors.gray, fontSize: '0.9rem', marginBottom: '16px' }}>
            Submits "Jane TestEmployee" with W-4, Direct Deposit, Emergency Contact, Background Check, Drug Test, and Safety PDFs.
          </p>
          <button
            onClick={handleTestEmployee}
            disabled={testRunning.employee}
            style={{
              padding: '10px 20px',
              backgroundColor: testRunning.employee ? '#9ca3af' : accentSecondary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: testRunning.employee ? 'wait' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {testRunning.employee ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDFs...</> : 'Run Employee Test'}
          </button>
          {testLogs.employee.length > 0 && (
            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: darkMode ? '#1a1a2e' : '#f1f5f9', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {testLogs.employee.map((log, i) => (
                <div key={i} style={{ color: log.includes('ERROR') || log.includes('FAILED') ? '#ef4444' : log.includes('SUCCESS') ? '#22c55e' : (darkMode ? '#d1d5db' : '#475569'), marginBottom: '2px' }}>{log}</div>
              ))}
            </div>
          )}
          {testStatus.employee === 'success' && <div style={{ marginTop: '10px', color: '#22c55e', fontWeight: '600' }}>Submitted - check Google Drive + email</div>}
          {testStatus.employee === 'error' && <div style={{ marginTop: '10px', color: '#ef4444', fontWeight: '600' }}>Failed - check console for details</div>}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'onboarding': return renderOnboarding();
      case 'employees': return renderEmployees();
      case 'contractors': return renderContractors();
      case 'admins': return renderAdmins();
      case 'testing': return renderTesting();
      default: return renderDashboard();
    }
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        backgroundColor: bgColor, 
        display: 'flex',
        // Mobile touch scrolling fix
        WebkitOverflowScrolling: 'touch',
        overflowX: 'hidden'
      }}
      onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}
    >
      {/* Mobile Header - Only shows on mobile */}
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
            style={{
              background: 'none',
              border: 'none',
              color: textColor,
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            <span style={{ color: darkMode ? '#e6c4d9' : '#0a3a7d' }}>ly</span>
            <span style={{ color: darkMode ? '#e6c4d9' : '#2ec7c0' }}>t</span>
            <span style={{ color: mutedColor, fontSize: '0.85rem', marginLeft: '6px' }}>Admin</span>
          </div>
          {/* Dark Mode Toggle + Notifications */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NotificationBell darkMode={darkMode} user={loggedInUser} setCurrentPage={setCurrentPage} />
            {setDarkMode && (
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: 'none',
                border: 'none',
                color: textColor,
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          )}
          </div>
        </div>
      )}

      {/* Mobile Overlay - closes sidebar when clicking outside */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1001
          }}
        />
      )}

      {/* Sidebar - Fixed on desktop, slide-in overlay on mobile */}
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
        // Mobile: slide in from left
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
            <span style={{ color: mutedColor, fontSize: '0.9rem', marginLeft: '8px' }}>Admin</span>
          </div>
          {/* Close button on mobile */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: mutedColor,
                cursor: 'pointer',
                padding: '8px',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* User Info */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `${accentPrimary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentPrimary, fontWeight: '600' }}>
              {loggedInUser?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div style={{ fontWeight: '500', color: textColor }}>{loggedInUser?.name || 'Admin'}</div>
              <div style={{ fontSize: '0.75rem', color: mutedColor }}>{loggedInUser?.email}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {navItems.map((item) => (
            item.divider ? (
              <div key={item.id} style={{ padding: '8px 16px 4px', fontSize: '0.7rem', fontWeight: '600', color: mutedColor, letterSpacing: '0.5px', textTransform: 'uppercase', userSelect: 'none' }}>
                {item.label.replace(/─/g, '').trim()}
              </div>
            ) : (
            <button
              key={item.id}
              onClick={() => {
                if (item.external) {
                  setCurrentPage(item.external);
                } else {
                  setActiveTab(item.id);
                }
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
              {item.badge > 0 && (
                <span style={{ 
                  backgroundColor: accentError, 
                  color: '#fff', 
                  fontSize: '0.7rem', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontWeight: '600'
                }}>
                  {item.badge}
                </span>
              )}
              {item.external && <ChevronRight size={14} color={mutedColor} />}
            </button>
            )
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: isMobile ? '14px' : '12px',
              backgroundColor: 'transparent',
              border: `1px solid ${accentError}`,
              borderRadius: '8px',
              color: accentError,
              cursor: 'pointer',
              fontSize: '0.9rem',
              minHeight: isMobile ? '48px' : 'auto'
            }}
          >
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
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          fontSize: '0.7rem', 
          opacity: 0.5,
          color: textColor,
          backgroundColor: cardBg,
          padding: '4px 8px',
          borderRadius: '4px',
          zIndex: 9999
        }}>
          AdminDashboard v3.6
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
