// UserProfile.js v1.0 - User Profile & Settings
// Self-service profile management for employees and contractors
import React, { useState } from 'react';
import { 
  User, Mail, Phone, MapPin, Building, Shield, Bell, Lock, 
  Camera, Save, Eye, EyeOff, CheckCircle, AlertCircle, 
  FileText, Award, Calendar, Clock, ChevronRight, Edit2,
  Smartphone, Globe, Moon, Sun, LogOut
} from 'lucide-react';

const UserProfile = ({ darkMode, setDarkMode, user, setCurrentPage }) => {
  // Theme colors
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Mock user data (would come from props/API)
  const [profileData, setProfileData] = useState({
    firstName: user?.name?.split(' ')[0] || 'John',
    lastName: user?.name?.split(' ')[1] || 'Smith',
    email: user?.email || 'john.smith@email.com',
    phone: '(832) 555-1234',
    address: '123 Main St',
    city: 'Webster',
    state: 'TX',
    zip: '77598',
    emergencyContact: 'Jane Smith',
    emergencyPhone: '(832) 555-5678',
    role: user?.role || 'employee',
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
    coiExpiry: true,
    newAssignments: true,
    weeklyDigest: false,
    safetyUpdates: true,
  });

  // Mock certifications
  const certifications = [
    { name: 'OSHA 10-Hour', expires: '2026-06-15', status: 'valid' },
    { name: 'Flagger Certification', expires: '2026-02-28', status: 'expiring' },
    { name: 'First Aid/CPR', expires: '2026-08-20', status: 'valid' },
    { name: 'Confined Space Entry', expires: '2025-12-01', status: 'expired' },
  ];

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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setEditing(false);
    setMessage({ type: 'success', text: 'Profile updated successfully!' });
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMessage({ type: 'success', text: 'Password changed successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setMessage({ type: 'success', text: 'Notification preferences saved!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const getCertStatusColor = (status) => {
    switch (status) {
      case 'valid': return '#10b981';
      case 'expiring': return '#f59e0b';
      case 'expired': return '#ef4444';
      default: return mutedColor;
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: '0.95rem',
    outline: 'none',
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'certifications', label: 'Certifications', icon: Award },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: bgColor, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <User size={28} color={accentPrimary} />
          My Profile
        </h1>
        <p style={{ color: mutedColor }}>Manage your account settings and preferences</p>
      </div>

      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          borderRadius: '10px',
          backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Profile Card Header */}
      <div style={{
        backgroundColor: cardBg,
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${borderColor}`,
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Avatar */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${accentPrimary}, ${accentSecondary})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#fff',
          position: 'relative'
        }}>
          {profileData.firstName[0]}{profileData.lastName[0]}
          <button style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: cardBg,
            border: `2px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <Camera size={14} color={accentPrimary} />
          </button>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginBottom: '4px' }}>
            {profileData.firstName} {profileData.lastName}
          </h2>
          <p style={{ color: mutedColor, marginBottom: '8px' }}>{profileData.email}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              backgroundColor: profileData.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 
                             profileData.role === 'contractor' ? 'rgba(139, 92, 246, 0.1)' : 
                             'rgba(59, 130, 246, 0.1)',
              color: profileData.role === 'admin' ? '#ef4444' : 
                     profileData.role === 'contractor' ? '#8b5cf6' : '#3b82f6',
              textTransform: 'capitalize'
            }}>
              {profileData.role}
            </span>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981'
            }}>
              Active
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: '10px',
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {darkMode ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#6b7280" />}
          </button>
          <button
            onClick={() => setCurrentPage && setCurrentPage('portal-login')}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: activeTab === tab.id ? 'none' : `1px solid ${borderColor}`,
              backgroundColor: activeTab === tab.id ? accentPrimary : 'transparent',
              color: activeTab === tab.id ? '#fff' : textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: cardBg,
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${borderColor}`
      }}>
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: textColor, fontWeight: '600', margin: 0 }}>Personal Information</h3>
              <button
                onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: editing ? '#10b981' : accentPrimary,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '500'
                }}
              >
                {saving ? 'Saving...' : editing ? <><Save size={16} /> Save Changes</> : <><Edit2 size={16} /> Edit</>}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => handleProfileChange('firstName', e.target.value)}
                  disabled={!editing}
                  style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => handleProfileChange('lastName', e.target.value)}
                  disabled={!editing}
                  style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>Email (read-only)</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>Phone</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  disabled={!editing}
                  style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>Address</label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                  disabled={!editing}
                  style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>City</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => handleProfileChange('city', e.target.value)}
                  disabled={!editing}
                  style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>State</label>
                <input
                  type="text"
                  value={profileData.state}
                  onChange={(e) => handleProfileChange('state', e.target.value)}
                  disabled={!editing}
                  style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>ZIP Code</label>
                <input
                  type="text"
                  value={profileData.zip}
                  onChange={(e) => handleProfileChange('zip', e.target.value)}
                  disabled={!editing}
                  style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                />
              </div>
            </div>

            <h4 style={{ color: textColor, fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>Emergency Contact</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>Contact Name</label>
                <input
                  type="text"
                  value={profileData.emergencyContact}
                  onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
                  disabled={!editing}
                  style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>Contact Phone</label>
                <input
                  type="tel"
                  value={profileData.emergencyPhone}
                  onChange={(e) => handleProfileChange('emergencyPhone', e.target.value)}
                  disabled={!editing}
                  style={{ ...inputStyle, opacity: editing ? 1 : 0.7 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div>
            <h3 style={{ color: textColor, fontWeight: '600', marginBottom: '24px' }}>Change Password</h3>
            <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>Current Password</label>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  style={{ ...inputStyle, paddingRight: '50px' }}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{ position: 'absolute', right: '12px', top: '36px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showCurrentPassword ? <EyeOff size={18} color={mutedColor} /> : <Eye size={18} color={mutedColor} />}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  style={{ ...inputStyle, paddingRight: '50px' }}
                  placeholder="Enter new password (min 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', right: '12px', top: '36px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showNewPassword ? <EyeOff size={18} color={mutedColor} /> : <Eye size={18} color={mutedColor} />}
                </button>
              </div>
              <div>
                <label style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '6px' }}>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  style={inputStyle}
                  placeholder="Confirm new password"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: accentPrimary,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '500',
                  opacity: (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) ? 0.5 : 1,
                  marginTop: '8px'
                }}
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            <h3 style={{ color: textColor, fontWeight: '600', marginBottom: '24px' }}>Notification Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              {[
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive notifications via email' },
                { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive text message notifications' },
                { key: 'certExpiry', label: 'Certification Expiry', desc: 'Alerts when certifications are expiring' },
                { key: 'coiExpiry', label: 'COI Expiry', desc: 'Alerts when insurance certificates are expiring' },
                { key: 'newAssignments', label: 'New Assignments', desc: 'Notifications for new work assignments' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of activity each week' },
                { key: 'safetyUpdates', label: 'Safety Updates', desc: 'Important safety announcements' },
              ].map(item => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: darkMode ? '#111827' : '#f8fafc',
                    borderRadius: '10px'
                  }}
                >
                  <div>
                    <div style={{ color: textColor, fontWeight: '500' }}>{item.label}</div>
                    <div style={{ color: mutedColor, fontSize: '0.85rem' }}>{item.desc}</div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange(item.key)}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      backgroundColor: notifications[item.key] ? '#10b981' : '#d1d5db',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      position: 'absolute',
                      top: '3px',
                      left: notifications[item.key] ? '25px' : '3px',
                      transition: 'left 0.2s'
                    }} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleSaveNotifications}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: accentPrimary,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '500',
                  marginTop: '8px',
                  alignSelf: 'flex-start'
                }}
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div>
            <h3 style={{ color: textColor, fontWeight: '600', marginBottom: '24px' }}>My Certifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {certifications.map((cert, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    backgroundColor: darkMode ? '#111827' : '#f8fafc',
                    borderRadius: '10px',
                    borderLeft: `4px solid ${getCertStatusColor(cert.status)}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Award size={24} color={getCertStatusColor(cert.status)} />
                    <div>
                      <div style={{ color: textColor, fontWeight: '500' }}>{cert.name}</div>
                      <div style={{ color: mutedColor, fontSize: '0.85rem' }}>
                        Expires: {new Date(cert.expires).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    backgroundColor: `${getCertStatusColor(cert.status)}15`,
                    color: getCertStatusColor(cert.status),
                    textTransform: 'capitalize'
                  }}>
                    {cert.status}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ color: mutedColor, fontSize: '0.9rem', marginTop: '20px' }}>
              Contact admin to update certifications or upload new certificates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
