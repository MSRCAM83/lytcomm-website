// UserProfile.js v2.0 - Connected to Real Backend
// Self-service profile management for employees and contractors
import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Building, Shield, Bell, Lock, 
  Camera, Save, Eye, EyeOff, CheckCircle, AlertCircle, 
  FileText, Award, Calendar, Clock, ChevronRight, Edit2,
  Smartphone, Globe, Moon, Sun, LogOut, Loader, ArrowLeft
} from 'lucide-react';
import { colors } from '../config/constants';

// API URLs
const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg/exec';

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

const UserProfile = ({ darkMode, setDarkMode, user, setCurrentPage, loggedInUser }) => {
  // Use loggedInUser if user is not provided
  const currentUser = user || loggedInUser;
  
  // Theme colors
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showVersion, setShowVersion] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile data from backend
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    createdAt: '',
    lastLogin: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    certExpiry: true,
    newAssignments: true,
    weeklyDigest: false,
  });

  // Fetch user data on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!currentUser?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const text = await fetchWithRedirect(PORTAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getUser', email: currentUser.email })
      });

      const result = JSON.parse(text);
      if (result.success && result.user) {
        const u = result.user;
        const nameParts = (u.name || '').split(' ');
        setProfileData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: u.email || '',
          phone: u.phone || '',
          role: u.role || '',
          status: u.status || '',
          createdAt: u.createdAt || '',
          lastLogin: u.lastLogin || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    }
    setLoading(false);
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const text = await fetchWithRedirect(PORTAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateUser',
          email: profileData.email,
          updates: {
            name: `${profileData.firstName} ${profileData.lastName}`.trim(),
            phone: profileData.phone
          }
        })
      });

      const result = JSON.parse(text);
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setEditing(false);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save profile' });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters!' });
      return;
    }
    
    setSaving(true);
    try {
      const text = await fetchWithRedirect(PORTAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setPassword',
          email: profileData.email,
          password: passwordData.newPassword,
          token: 'profile-change' // Special token for profile password change
        })
      });

      const result = JSON.parse(text);
      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to change password' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to change password' });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: `1px solid ${borderColor}`,
    borderRadius: '8px',
    backgroundColor: editing ? '#ffffff' : (darkMode ? '#374151' : '#f3f4f6'),
    color: editing ? '#1e293b' : textColor,
    fontSize: '0.95rem',
    outline: 'none',
  };

  const goBack = () => {
    const role = currentUser?.role || 'employee';
    if (role === 'admin') setCurrentPage('admin-dashboard');
    else if (role === 'contractor') setCurrentPage('contractor-dashboard');
    else setCurrentPage('employee-dashboard');
  };

  const renderProfile = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: textColor }}>Personal Information</h3>
        {!editing ? (
          <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${accentPrimary}`, borderRadius: '8px', color: accentPrimary, cursor: 'pointer' }}>
            <Edit2 size={16} /> Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${mutedColor}`, borderRadius: '8px', color: mutedColor, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSaveProfile} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: accentSecondary, border: 'none', borderRadius: '8px', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader size={16} /> : <Save size={16} />} Save
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>First Name</label>
          <input type="text" value={profileData.firstName} onChange={(e) => handleProfileChange('firstName', e.target.value)} disabled={!editing} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Last Name</label>
          <input type="text" value={profileData.lastName} onChange={(e) => handleProfileChange('lastName', e.target.value)} disabled={!editing} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Email</label>
          <input type="email" value={profileData.email} disabled style={{ ...inputStyle, backgroundColor: darkMode ? '#374151' : '#f3f4f6' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Phone</label>
          <input type="tel" value={profileData.phone} onChange={(e) => handleProfileChange('phone', e.target.value)} disabled={!editing} placeholder="(xxx) xxx-xxxx" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: darkMode ? '#1a2633' : '#f8fafc', borderRadius: '12px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: textColor, marginBottom: '16px' }}>Account Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <span style={{ color: mutedColor, fontSize: '0.85rem' }}>Role</span>
            <p style={{ color: textColor, fontWeight: '500', textTransform: 'capitalize' }}>{profileData.role || 'N/A'}</p>
          </div>
          <div>
            <span style={{ color: mutedColor, fontSize: '0.85rem' }}>Status</span>
            <p style={{ color: profileData.status === 'active' ? accentSecondary : mutedColor, fontWeight: '500', textTransform: 'capitalize' }}>{profileData.status || 'N/A'}</p>
          </div>
          <div>
            <span style={{ color: mutedColor, fontSize: '0.85rem' }}>Member Since</span>
            <p style={{ color: textColor }}>{profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <span style={{ color: mutedColor, fontSize: '0.85rem' }}>Last Login</span>
            <p style={{ color: textColor }}>{profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleString() : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: textColor, marginBottom: '24px' }}>Change Password</h3>
      
      <div style={{ maxWidth: '400px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Current Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showCurrentPassword ? 'text' : 'password'} value={passwordData.currentPassword} onChange={(e) => handlePasswordChange('currentPassword', e.target.value)} style={{ ...inputStyle, backgroundColor: '#ffffff', color: '#1e293b', paddingRight: '40px' }} />
            <button onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: mutedColor }}>
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showNewPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e) => handlePasswordChange('newPassword', e.target.value)} style={{ ...inputStyle, backgroundColor: '#ffffff', color: '#1e293b', paddingRight: '40px' }} />
            <button onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: mutedColor }}>
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: mutedColor, fontSize: '0.9rem' }}>Confirm New Password</label>
          <input type="password" value={passwordData.confirmPassword} onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)} style={{ ...inputStyle, backgroundColor: '#ffffff', color: '#1e293b' }} />
        </div>

        <button onClick={handleChangePassword} disabled={saving || !passwordData.newPassword} style={{ width: '100%', padding: '14px', backgroundColor: accentPrimary, color: '#fff', border: 'none', borderRadius: '8px', cursor: (saving || !passwordData.newPassword) ? 'not-allowed' : 'pointer', opacity: (saving || !passwordData.newPassword) ? 0.7 : 1, fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {saving ? <Loader size={18} /> : <Lock size={18} />}
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: textColor, marginBottom: '24px' }}>Notification Preferences</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important notifications via email' },
          { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive urgent notifications via text' },
          { key: 'certExpiry', label: 'Certification Expiry', desc: 'Notify when certifications are expiring' },
          { key: 'newAssignments', label: 'New Assignments', desc: 'Notify when assigned to new projects' },
          { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive weekly summary of activities' },
        ].map((item) => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: darkMode ? '#1a2633' : '#f8fafc', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: '500', color: textColor }}>{item.label}</div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>{item.desc}</div>
            </div>
            <button onClick={() => handleNotificationChange(item.key)} style={{ width: '50px', height: '28px', borderRadius: '14px', backgroundColor: notifications[item.key] ? accentSecondary : mutedColor, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: notifications[item.key] ? '25px' : '3px', transition: 'left 0.2s' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: textColor, marginBottom: '24px' }}>Appearance</h3>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <button onClick={() => setDarkMode && setDarkMode(false)} style={{ flex: 1, padding: '24px', borderRadius: '12px', border: `2px solid ${!darkMode ? accentPrimary : borderColor}`, backgroundColor: '#ffffff', cursor: 'pointer', textAlign: 'center' }}>
          <Sun size={32} color={!darkMode ? accentPrimary : '#6b7280'} style={{ marginBottom: '12px' }} />
          <div style={{ fontWeight: '500', color: '#1e293b' }}>Light Mode</div>
        </button>
        <button onClick={() => setDarkMode && setDarkMode(true)} style={{ flex: 1, padding: '24px', borderRadius: '12px', border: `2px solid ${darkMode ? accentPrimary : borderColor}`, backgroundColor: '#1e293b', cursor: 'pointer', textAlign: 'center' }}>
          <Moon size={32} color={darkMode ? accentPrimary : '#9ca3af'} style={{ marginBottom: '12px' }} />
          <div style={{ fontWeight: '500', color: '#ffffff' }}>Dark Mode</div>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: mutedColor }}>
          <Loader size={32} style={{ marginBottom: '16px' }} />
          <div>Loading profile...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile': return renderProfile();
      case 'security': return renderSecurity();
      case 'notifications': return renderNotifications();
      case 'appearance': return renderAppearance();
      default: return renderProfile();
    }
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '32px' }} onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>
      {/* Message Toast */}
      {message && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', backgroundColor: message.type === 'success' ? accentSecondary : '#ef4444', color: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, cursor: 'pointer' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>My Profile</h1>
            <p style={{ color: mutedColor }}>Manage your account settings</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* Sidebar Nav */}
          <div style={{ width: '200px', flexShrink: 0 }}>
            <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '12px' }}>
              {navItems.map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '4px', backgroundColor: activeTab === item.id ? `${accentPrimary}15` : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: activeTab === item.id ? accentPrimary : textColor, textAlign: 'left' }}>
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, backgroundColor: cardBg, borderRadius: '12px', padding: '24px', minWidth: '300px' }}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Version */}
      {showVersion && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px' }}>
          UserProfile v2.0
        </div>
      )}
    </div>
  );
};

export default UserProfile;
