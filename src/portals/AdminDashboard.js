// AdminDashboard.js v3.1 - Connected to Real Backend Data
// Fetches users, onboarding submissions from Google Sheets via Portal Backend
import React, { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Users, Briefcase, Clock, DollarSign, FileText, Settings, ChevronRight, CheckCircle, XCircle, AlertCircle, Plus, Search, Filter, UserPlus, Shield, Building2, Eye, MapPin, UserCog, Target, Shovel, BarChart3, History, User, RefreshCw, Loader } from 'lucide-react';
import { colors } from '../config/constants';

// API URLs
const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec';
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const ONBOARDING_SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc';

// Helper to handle GAS redirects
const fetchWithRedirect = async (url, options = {}) => {
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
};

const AdminDashboard = ({ setCurrentPage, loggedInUser, setLoggedInUser, darkMode }) => {
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

  // Fetch real data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch users from Portal Backend
      const usersText = await fetchWithRedirect(PORTAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listUsers' })
      });
      
      const usersResult = JSON.parse(usersText);
      if (usersResult.success) {
        setUsers(usersResult.users || []);
      }

      // Fetch onboarding submissions from Gateway
      const onboardingText = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsRead',
          params: {
            spreadsheetId: ONBOARDING_SHEET_ID,
            range: 'A1:Z200'
          }
        })
      });

      const onboardingResult = JSON.parse(onboardingText);
      if (onboardingResult.success && onboardingResult.data?.data) {
        const rows = onboardingResult.data.data;
        const headers = rows[0];
        const submissions = rows.slice(1)
          .filter(row => row[0]) // Has timestamp
          .map((row, idx) => ({
            id: idx + 1,
            timestamp: row[0] || '',
            type: row[1] || '',
            name: row[2] || '',
            email: row[3] || '',
            phone: row[4] || '',
            status: row[14] || 'Pending',
            folderLink: row[12] || ''
          }))
          .filter(s => s.name && !s.name.includes('Unknown')); // Filter out empty/unknown
        
        setOnboardingSubmissions(submissions);
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
    { id: 'work-map', label: 'Work Map', icon: MapPin, external: 'work-map' },
    { id: 'potholes', label: 'Pothole Approvals', icon: Shovel, external: 'potholes' },
    { id: 'daily-worksheet', label: 'Daily Work Sheets', icon: FileText, external: 'daily-worksheet' },
    { id: 'invoice-gen', label: 'Invoice Generator', icon: DollarSign, external: 'invoices' },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'contractors', label: 'Contractors', icon: Briefcase },
    { id: 'user-management', label: 'User Management', icon: UserCog, external: 'admin-users' },
    { id: 'admins', label: 'Admin Users', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'onboarding': return renderOnboarding();
      case 'employees': return renderEmployees();
      case 'contractors': return renderContractors();
      case 'admins': return renderAdmins();
      default: return renderDashboard();
    }
  };

  return (
    <div 
      style={{ minHeight: '100vh', backgroundColor: bgColor, display: 'flex' }}
      onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}
    >
      {/* Sidebar */}
      <div style={{ 
        width: '260px', 
        backgroundColor: cardBg, 
        borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            <span style={{ color: darkMode ? '#e6c4d9' : '#0a3a7d' }}>ly</span>
            <span style={{ color: darkMode ? '#e6c4d9' : '#2ec7c0' }}>t</span>
            <span style={{ color: mutedColor, fontSize: '0.9rem', marginLeft: '8px' }}>Admin</span>
          </div>
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
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.external ? setCurrentPage(item.external) : setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                marginBottom: '4px',
                backgroundColor: activeTab === item.id ? `${accentPrimary}15` : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: activeTab === item.id ? accentPrimary : textColor,
                textAlign: 'left',
                transition: 'all 0.2s'
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
              padding: '12px',
              backgroundColor: 'transparent',
              border: `1px solid ${accentError}`,
              borderRadius: '8px',
              color: accentError,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: '260px', padding: '32px' }}>
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
          borderRadius: '4px'
        }}>
          AdminDashboard v3.1
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
