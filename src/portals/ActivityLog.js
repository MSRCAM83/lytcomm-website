// ActivityLog.js v1.0 - Activity Log / Audit Trail
// Complete visibility into system actions
import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Calendar, User, FileText, Settings,
  CheckCircle, AlertCircle, Clock, Download, ChevronDown,
  UserPlus, UserMinus, Edit, Trash2, Eye, LogIn, LogOut,
  Upload, Mail, Shield, MapPin, Truck, DollarSign, RefreshCw
} from 'lucide-react';

const ActivityLog = ({ darkMode, user }) => {
  // Theme colors
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [loading, setLoading] = useState(false);

  // Activity types with icons and colors
  const activityTypes = {
    login: { icon: LogIn, color: '#10b981', label: 'Login' },
    logout: { icon: LogOut, color: '#6b7280', label: 'Logout' },
    user_created: { icon: UserPlus, color: '#3b82f6', label: 'User Created' },
    user_updated: { icon: Edit, color: '#f59e0b', label: 'User Updated' },
    user_deactivated: { icon: UserMinus, color: '#ef4444', label: 'User Deactivated' },
    password_reset: { icon: Shield, color: '#8b5cf6', label: 'Password Reset' },
    onboarding_submitted: { icon: FileText, color: '#10b981', label: 'Onboarding Submitted' },
    onboarding_approved: { icon: CheckCircle, color: '#10b981', label: 'Onboarding Approved' },
    onboarding_rejected: { icon: AlertCircle, color: '#ef4444', label: 'Onboarding Rejected' },
    document_uploaded: { icon: Upload, color: '#3b82f6', label: 'Document Uploaded' },
    document_viewed: { icon: Eye, color: '#6b7280', label: 'Document Viewed' },
    invoice_generated: { icon: DollarSign, color: '#10b981', label: 'Invoice Generated' },
    invoice_sent: { icon: Mail, color: '#3b82f6', label: 'Invoice Sent' },
    production_logged: { icon: MapPin, color: '#8b5cf6', label: 'Production Logged' },
    equipment_inspected: { icon: Truck, color: '#10b981', label: 'Equipment Inspected' },
    pothole_submitted: { icon: MapPin, color: '#f59e0b', label: 'Pothole Submitted' },
    pothole_approved: { icon: CheckCircle, color: '#10b981', label: 'Pothole Approved' },
    settings_changed: { icon: Settings, color: '#6b7280', label: 'Settings Changed' },
  };

  // Mock activity log data
  const mockActivities = [
    { id: 1, type: 'login', user: 'Matt Roy', email: 'matt@lytcomm.com', role: 'admin', timestamp: '2026-01-23T16:45:00Z', ip: '192.168.1.100', details: 'Logged in from Chrome on Windows' },
    { id: 2, type: 'pothole_approved', user: 'Matt Roy', email: 'matt@lytcomm.com', role: 'admin', timestamp: '2026-01-23T16:30:00Z', target: 'Pothole #PH-2026-0042', details: 'Section 007 - Approved for drilling' },
    { id: 3, type: 'invoice_generated', user: 'Matt Roy', email: 'matt@lytcomm.com', role: 'admin', timestamp: '2026-01-23T16:15:00Z', target: 'INV-20260123-SLPH01', details: 'Generated invoice for $38,250.00' },
    { id: 4, type: 'production_logged', user: 'Mike Torres', email: 'mike@gulfcoastboring.com', role: 'contractor', timestamp: '2026-01-23T15:30:00Z', target: 'Section 006', details: '450 ft bore completed, 4 potholes' },
    { id: 5, type: 'user_created', user: 'Matt Roy', email: 'matt@lytcomm.com', role: 'admin', timestamp: '2026-01-23T14:00:00Z', target: 'john.smith@email.com', details: 'Created new employee account' },
    { id: 6, type: 'onboarding_submitted', user: 'John Smith', email: 'john.smith@email.com', role: 'employee', timestamp: '2026-01-23T13:45:00Z', details: 'Completed employee onboarding forms' },
    { id: 7, type: 'document_uploaded', user: 'Maria Garcia', email: 'maria@fastfiber.com', role: 'contractor', timestamp: '2026-01-23T13:30:00Z', target: 'COI_FastFiber_2026.pdf', details: 'Uploaded Certificate of Insurance' },
    { id: 8, type: 'equipment_inspected', user: 'James Wilson', email: 'james@xyzdrill.com', role: 'contractor', timestamp: '2026-01-23T12:00:00Z', target: 'Drill #3', details: 'Pre-use inspection completed - All items passed' },
    { id: 9, type: 'pothole_submitted', user: 'Mike Torres', email: 'mike@gulfcoastboring.com', role: 'contractor', timestamp: '2026-01-23T11:30:00Z', target: 'Section 008', details: 'Submitted 3 pothole photos for approval' },
    { id: 10, type: 'login', user: 'Donnie Wells', email: 'donnie@lytcomm.com', role: 'admin', timestamp: '2026-01-23T11:00:00Z', ip: '192.168.1.101', details: 'Logged in from Safari on MacOS' },
    { id: 11, type: 'onboarding_approved', user: 'Donnie Wells', email: 'donnie@lytcomm.com', role: 'admin', timestamp: '2026-01-23T10:45:00Z', target: 'FastFiber Solutions', details: 'Approved contractor onboarding' },
    { id: 12, type: 'password_reset', user: 'System', email: 'system@lytcomm.com', role: 'system', timestamp: '2026-01-23T10:30:00Z', target: 'sarah.j@email.com', details: 'Password reset email sent' },
    { id: 13, type: 'settings_changed', user: 'Matt Roy', email: 'matt@lytcomm.com', role: 'admin', timestamp: '2026-01-23T09:00:00Z', details: 'Updated rate card pricing' },
    { id: 14, type: 'logout', user: 'Mike Torres', email: 'mike@gulfcoastboring.com', role: 'contractor', timestamp: '2026-01-22T18:00:00Z', details: 'Session ended' },
    { id: 15, type: 'invoice_sent', user: 'Matt Roy', email: 'matt@lytcomm.com', role: 'admin', timestamp: '2026-01-22T17:30:00Z', target: 'INV-20260122-LAKE01', details: 'Invoice emailed to accounting@metronet.com' },
  ];

  // Filter activities
  const filteredActivities = mockActivities.filter(activity => {
    const matchesSearch = 
      activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.target && activity.target.toLowerCase().includes(searchTerm.toLowerCase())) ||
      activity.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesUser = filterUser === 'all' || activity.role === filterUser;
    
    return matchesSearch && matchesType && matchesUser;
  });

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatFullTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' };
      case 'supervisor': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
      case 'employee': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' };
      case 'contractor': return { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6' };
      case 'system': return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
    }
  };

  const inputStyle = {
    padding: '10px 16px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: '0.9rem',
    outline: 'none',
  };

  return (
    <div style={{ padding: '24px', backgroundColor: bgColor, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <History size={28} color={accentPrimary} />
              Activity Log
            </h1>
            <p style={{ color: mutedColor }}>Complete audit trail of all system actions</p>
          </div>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: accentPrimary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            <Download size={18} /> Export Log
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '16px', 
        padding: '20px',
        border: `1px solid ${borderColor}`,
        marginBottom: '24px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {/* Search */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: mutedColor }} />
            <input
              type="text"
              placeholder="Search activities, users, targets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, width: '100%', paddingLeft: '40px' }}
            />
          </div>

          {/* Activity Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="all">All Activities</option>
            <option value="login">Logins</option>
            <option value="user_created">User Created</option>
            <option value="onboarding_submitted">Onboarding</option>
            <option value="document_uploaded">Documents</option>
            <option value="invoice_generated">Invoices</option>
            <option value="production_logged">Production</option>
            <option value="pothole_submitted">Potholes</option>
          </select>

          {/* User Type Filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="supervisor">Supervisors</option>
            <option value="employee">Employees</option>
            <option value="contractor">Contractors</option>
            <option value="system">System</option>
          </select>

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Activity Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '12px', 
        marginBottom: '24px' 
      }}>
        {[
          { label: 'Total Activities', value: mockActivities.length, color: accentPrimary },
          { label: 'Logins Today', value: mockActivities.filter(a => a.type === 'login').length, color: '#10b981' },
          { label: 'Documents', value: mockActivities.filter(a => a.type.includes('document')).length, color: '#3b82f6' },
          { label: 'Approvals', value: mockActivities.filter(a => a.type.includes('approved')).length, color: '#f59e0b' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: cardBg,
              borderRadius: '10px',
              padding: '16px',
              border: `1px solid ${borderColor}`,
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: mutedColor }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Activity List */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '16px',
        border: `1px solid ${borderColor}`,
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ color: textColor, fontWeight: '600', margin: 0 }}>
            Recent Activity ({filteredActivities.length})
          </h3>
          <button
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 500); }}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {filteredActivities.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
              <History size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>No activities match your filters</p>
            </div>
          ) : (
            filteredActivities.map((activity, idx) => {
              const activityConfig = activityTypes[activity.type] || { icon: Clock, color: mutedColor, label: activity.type };
              const ActivityIcon = activityConfig.icon;
              const roleColors = getRoleBadgeColor(activity.role);

              return (
                <div
                  key={activity.id}
                  style={{
                    padding: '16px 24px',
                    borderBottom: idx < filteredActivities.length - 1 ? `1px solid ${borderColor}` : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#111827' : '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: `${activityConfig.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ActivityIcon size={20} color={activityConfig.color} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', color: textColor }}>{activity.user}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        backgroundColor: roleColors.bg,
                        color: roleColors.text,
                        textTransform: 'capitalize'
                      }}>
                        {activity.role}
                      </span>
                      <span style={{ color: activityConfig.color, fontSize: '0.85rem' }}>
                        {activityConfig.label}
                      </span>
                    </div>
                    <div style={{ color: textColor, fontSize: '0.9rem', marginBottom: '4px' }}>
                      {activity.details}
                    </div>
                    {activity.target && (
                      <div style={{ color: mutedColor, fontSize: '0.85rem' }}>
                        Target: <span style={{ color: accentSecondary }}>{activity.target}</span>
                      </div>
                    )}
                    {activity.ip && (
                      <div style={{ color: mutedColor, fontSize: '0.8rem' }}>
                        IP: {activity.ip}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: textColor, fontWeight: '500', fontSize: '0.85rem' }}>
                      {formatTime(activity.timestamp)}
                    </div>
                    <div style={{ color: mutedColor, fontSize: '0.75rem' }}>
                      {formatFullTime(activity.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default ActivityLog;
