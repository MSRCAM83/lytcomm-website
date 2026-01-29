// ActivityLog.js v2.0 - Connected to Real Backend
// Shows real activity from Google Sheets - logins, submissions, changes
import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Calendar, User, FileText, Settings,
  CheckCircle, AlertCircle, Clock, Download, ChevronDown,
  UserPlus, UserMinus, Edit, Trash2, Eye, LogIn, LogOut,
  Upload, Mail, Shield, MapPin, Truck, DollarSign, RefreshCw,
  Loader, ArrowLeft, Activity
} from 'lucide-react';
import { colors } from '../config/constants';

// API URLs
const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec';
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const ONBOARDING_SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc';

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

const ActivityLog = ({ darkMode, setCurrentPage }) => {
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showVersion, setShowVersion] = useState(false);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    setLoading(true);
    const allActivities = [];

    try {
      // Fetch users (for login activity)
      const usersText = await fetchWithRedirect(PORTAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listUsers' })
      });
      const usersResult = JSON.parse(usersText);
      if (usersResult.success) {
        setUsers(usersResult.users || []);
        // Add login activities from users
        usersResult.users.forEach(u => {
          if (u.lastLogin) {
            allActivities.push({
              id: `login-${u.email}`,
              type: 'login',
              user: u.name || u.email,
              email: u.email,
              description: 'Logged into portal',
              timestamp: u.lastLogin,
              icon: LogIn
            });
          }
          if (u.createdAt) {
            allActivities.push({
              id: `created-${u.email}`,
              type: 'user_created',
              user: u.name || u.email,
              email: u.email,
              description: `Account created (${u.role})`,
              timestamp: u.createdAt,
              icon: UserPlus
            });
          }
        });
      }

      // Fetch onboarding submissions
      const onboardingText = await fetchWithRedirect(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'sheetsRead',
          params: {
            spreadsheetId: ONBOARDING_SHEET_ID,
            range: 'A1:Z100'
          }
        })
      });
      const onboardingResult = JSON.parse(onboardingText);
      if (onboardingResult.success && onboardingResult.data?.data) {
        const rows = onboardingResult.data.data;
        rows.slice(1).forEach((row, idx) => {
          if (row[0]) {
            allActivities.push({
              id: `onboarding-${idx}`,
              type: 'onboarding',
              user: row[2] || 'Unknown',
              email: row[3] || '',
              description: `${row[1] || 'Onboarding'} submission`,
              timestamp: row[0],
              icon: FileText
            });
          }
        });
      }

      // Sort by timestamp descending
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(allActivities);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    }
    setLoading(false);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return LogIn;
      case 'logout': return LogOut;
      case 'user_created': return UserPlus;
      case 'onboarding': return FileText;
      case 'production': return Activity;
      case 'equipment': return Truck;
      default: return History;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'login': return '#10b981';
      case 'logout': return '#6b7280';
      case 'user_created': return '#3b82f6';
      case 'onboarding': return '#8b5cf6';
      case 'production': return accentPrimary;
      case 'equipment': return '#f59e0b';
      default: return mutedColor;
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: activities.length,
    logins: activities.filter(a => a.type === 'login').length,
    users: activities.filter(a => a.type === 'user_created').length,
    onboarding: activities.filter(a => a.type === 'onboarding').length
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '32px' }} onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={() => setCurrentPage('admin-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, cursor: 'pointer' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>Activity Log</h1>
            <p style={{ color: mutedColor }}>System activity and audit trail</p>
          </div>
          <button onClick={fetchActivityData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: accentPrimary, color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader size={18} /> : <RefreshCw size={18} />}
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Activities', value: stats.total, color: accentPrimary },
            { label: 'Logins', value: stats.logins, color: '#10b981' },
            { label: 'New Users', value: stats.users, color: '#3b82f6' },
            { label: 'Onboarding', value: stats.onboarding, color: '#8b5cf6' },
          ].map((stat, idx) => (
            <div key={idx} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color }}>{loading ? '...' : stat.value}</div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: mutedColor }} />
            <input type="text" placeholder="Search activities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 40px', border: `1px solid ${borderColor}`, borderRadius: '8px', backgroundColor: cardBg, color: textColor }} />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, borderRadius: '8px', backgroundColor: cardBg, color: textColor, cursor: 'pointer' }}>
            <option value="all">All Types</option>
            <option value="login">Logins</option>
            <option value="user_created">New Users</option>
            <option value="onboarding">Onboarding</option>
          </select>
        </div>

        {/* Activity List */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
              <Loader size={32} style={{ marginBottom: '16px' }} />
              <div>Loading activity...</div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
              <History size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div>No activity found</div>
            </div>
          ) : (
            filteredActivities.map((activity, idx) => {
              const Icon = getActivityIcon(activity.type);
              const iconColor = getActivityColor(activity.type);
              return (
                <div key={activity.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: idx < filteredActivities.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${iconColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={iconColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', color: textColor }}>{activity.user}</div>
                    <div style={{ fontSize: '0.85rem', color: mutedColor }}>{activity.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: textColor }}>{new Date(activity.timestamp).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.75rem', color: mutedColor }}>{new Date(activity.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Version */}
      {showVersion && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px' }}>
          ActivityLog v2.0
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
