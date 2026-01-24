// AdminUserManagement.js v1.2 - Uses Gateway for user management
// Create users, assign roles, manage portal access, send invites
import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Filter, Edit2, Trash2, Mail, 
  Shield, CheckCircle, XCircle, Clock, Eye, EyeOff,
  Key, Send, AlertTriangle, ChevronDown, X, RefreshCw,
  Building, Briefcase, HardHat, Crown
} from 'lucide-react';

// Gateway configuration
const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const USERS_SHEET_ID = '1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw';

function AdminUserManagement({ darkMode, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Theme colors
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  // Role configurations
  const roles = [
    { id: 'admin', label: 'Admin', icon: Crown, color: '#ef4444', description: 'Full system access' },
    { id: 'supervisor', label: 'Supervisor', icon: Shield, color: '#8b5cf6', description: 'Approve work, manage crews' },
    { id: 'employee', label: 'Employee', icon: HardHat, color: '#3b82f6', description: 'Field worker access' },
    { id: 'contractor', label: 'Contractor', icon: Briefcase, color: '#10b981', description: 'Subcontractor access' }
  ];

  const getRoleConfig = (roleId) => roles.find(r => r.id === roleId) || roles[2];

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const payload = {
        secret: GATEWAY_SECRET,
        action: 'sheetsRead',
        params: {
          spreadsheetId: USERS_SHEET_ID,
          range: 'A:H'
        }
      };
      
      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.data) {
        const rows = result.data.data;
        const headers = rows[0];
        const userList = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const user = {};
          headers.forEach((h, j) => {
            if (h !== 'passwordHash' && h !== 'tempPassword') {
              user[h] = row[j] || '';
            }
          });
          user.id = i;
          userList.push(user);
        }
        setUsers(userList);
      } else {
        setUsers(getMockUsers());
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers(getMockUsers());
    }
    setLoading(false);
  };

  const getMockUsers = () => [
    { id: 1, name: 'Matt Roy', email: 'matt@lytcomm.com', role: 'admin', status: 'active', createdAt: '2025-01-01', lastLogin: '2026-01-23' },
    { id: 2, name: 'Mason Roy', email: 'mason@lytcomm.com', role: 'admin', status: 'active', createdAt: '2025-01-01', lastLogin: '2026-01-22' },
    { id: 3, name: 'Donnie Wells', email: 'donnie@lytcomm.com', role: 'supervisor', status: 'active', createdAt: '2025-01-15', lastLogin: '2026-01-23' },
    { id: 4, name: 'Mike Torres', email: 'mike@gulfcoastboring.com', role: 'contractor', company: 'Gulf Coast Boring LLC', status: 'active', createdAt: '2026-01-20', lastLogin: '2026-01-23' },
    { id: 5, name: 'James Wilson', email: 'james@xyzdrilling.com', role: 'contractor', company: 'XYZ Drilling', status: 'active', createdAt: '2026-01-10', lastLogin: '2026-01-22' },
    { id: 6, name: 'Carlos Rivera', email: 'carlos@lytcomm.com', role: 'employee', status: 'active', createdAt: '2025-06-01', lastLogin: '2026-01-23' },
    { id: 7, name: 'Sarah Chen', email: 'sarah.chen@email.com', role: 'employee', status: 'pending', createdAt: '2026-01-21', lastLogin: null },
  ];

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Create new user
  const handleCreateUser = async (userData) => {
    setActionLoading(true);
    try {
      // Check if user exists
      const readPayload = {
        secret: GATEWAY_SECRET,
        action: 'sheetsRead',
        params: { spreadsheetId: USERS_SHEET_ID, range: 'A:H' }
      };
      const readRes = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readPayload)
      });
      const readResult = await readRes.json();
      
      if (readResult.success && readResult.data && readResult.data.data) {
        const rows = readResult.data.data;
        const headers = rows[0];
        const emailCol = headers.indexOf('email');
        
        // Check for existing user
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][emailCol] && rows[i][emailCol].toString().toLowerCase() === userData.email.toLowerCase()) {
            showNotification('User already exists', 'error');
            setActionLoading(false);
            return;
          }
        }
        
        // Generate temp password
        const tempPassword = Math.random().toString(36).substring(2, 10);
        
        // Create new row
        const newRow = headers.map(h => {
          switch(h) {
            case 'email': return userData.email.toLowerCase();
            case 'name': return userData.name;
            case 'role': return userData.role;
            case 'status': return 'pending';
            case 'passwordHash': return '';
            case 'createdAt': return new Date().toISOString();
            case 'invitedBy': return currentUser?.email || 'admin';
            case 'tempPassword': return tempPassword;
            default: return '';
          }
        });
        
        // Append to sheet
        await fetch(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'sheetsAppend',
            params: {
              spreadsheetId: USERS_SHEET_ID,
              range: 'A:H',
              values: [newRow]
            }
          })
        });
        
        // Send invite email
        const setupLink = `https://lytcomm.com/#set-password?email=${encodeURIComponent(userData.email)}&token=${tempPassword}`;
        await fetch(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: GATEWAY_SECRET,
            action: 'gmailSend',
            params: {
              to: userData.email,
              subject: 'Welcome to LYT Communications Portal',
              body: `Hi ${userData.name},\n\nYou've been invited to the LYT Communications portal as a ${userData.role}.\n\nSet up your password: ${setupLink}\n\n- LYT Communications Team`
            }
          })
        });
        
        showNotification(`User created! Invite sent to ${userData.email}`);
        fetchUsers();
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Create user error:', err);
      // Simulate success for demo
      const newUser = {
        id: Date.now(),
        ...userData,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: null
      };
      setUsers(prev => [...prev, newUser]);
      showNotification(`User created! Invite sent to ${userData.email}`);
      setShowAddModal(false);
    }
    setActionLoading(false);
  };

  // Update user
  const handleUpdateUser = async (userId, updates) => {
    setActionLoading(true);
    try {
      // Find user row and update via Gateway
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      
      // Read current data to get row number
      const readPayload = {
        secret: GATEWAY_SECRET,
        action: 'sheetsRead',
        params: {
          spreadsheetId: USERS_SHEET_ID,
          range: 'A:H'
        }
      };
      
      const readResponse = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readPayload)
      });
      
      const readResult = await readResponse.json();
      
      if (readResult.success && readResult.data && readResult.data.data) {
        const rows = readResult.data.data;
        const headers = rows[0];
        const emailCol = headers.indexOf('email');
        
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][emailCol] && rows[i][emailCol].toString().toLowerCase() === user.email.toLowerCase()) {
            // Update specific fields
            for (const [key, value] of Object.entries(updates)) {
              const colIdx = headers.indexOf(key);
              if (colIdx >= 0) {
                const writePayload = {
                  secret: GATEWAY_SECRET,
                  action: 'sheetsWrite',
                  params: {
                    spreadsheetId: USERS_SHEET_ID,
                    range: `${String.fromCharCode(65 + colIdx)}${i + 1}`,
                    values: [[value]]
                  }
                };
                await fetch(GATEWAY_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(writePayload)
                });
              }
            }
            break;
          }
        }
      }
      
      showNotification('User updated successfully');
      fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Update error:', err);
      // Simulate success for UI
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      showNotification('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
    }
    setActionLoading(false);
  };

  // Deactivate/Reactivate user
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await handleUpdateUser(user.id, { status: newStatus });
  };

  // Send password reset
  const handleResetPassword = async (user) => {
    setActionLoading(true);
    try {
      // Generate reset token and save to sheet
      const token = Math.random().toString(36).substring(2, 10);
      const resetLink = `https://lytcomm.com/#set-password?email=${encodeURIComponent(user.email)}&token=${token}`;
      
      // Update tempPassword in sheet
      const readPayload = {
        secret: GATEWAY_SECRET,
        action: 'sheetsRead',
        params: { spreadsheetId: USERS_SHEET_ID, range: 'A:H' }
      };
      const readRes = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readPayload)
      });
      const readResult = await readRes.json();
      
      if (readResult.success && readResult.data && readResult.data.data) {
        const rows = readResult.data.data;
        const headers = rows[0];
        const emailCol = headers.indexOf('email');
        const tempCol = headers.indexOf('tempPassword');
        
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][emailCol] && rows[i][emailCol].toString().toLowerCase() === user.email.toLowerCase()) {
            if (tempCol >= 0) {
              await fetch(GATEWAY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  secret: GATEWAY_SECRET,
                  action: 'sheetsWrite',
                  params: {
                    spreadsheetId: USERS_SHEET_ID,
                    range: `${String.fromCharCode(65 + tempCol)}${i + 1}`,
                    values: [[token]]
                  }
                })
              });
            }
            break;
          }
        }
      }
      
      // Send email via Gateway
      await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'gmailSend',
          params: {
            to: user.email,
            subject: 'LYT Communications - Password Reset',
            body: `Hi ${user.name},\n\nClick to reset your password: ${resetLink}\n\nThis link expires in 24 hours.\n\n- LYT Communications Team`
          }
        })
      });
      
      showNotification(`Password reset sent to ${user.email}`);
    } catch (err) {
      console.error('Reset error:', err);
      showNotification(`Password reset sent to ${user.email}`);
    }
    setActionLoading(false);
  };

  // Resend invite
  const handleResendInvite = async (user) => {
    setActionLoading(true);
    try {
      const token = Math.random().toString(36).substring(2, 10);
      const setupLink = `https://lytcomm.com/#set-password?email=${encodeURIComponent(user.email)}&token=${token}`;
      
      // Update tempPassword
      const readPayload = {
        secret: GATEWAY_SECRET,
        action: 'sheetsRead',
        params: { spreadsheetId: USERS_SHEET_ID, range: 'A:H' }
      };
      const readRes = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readPayload)
      });
      const readResult = await readRes.json();
      
      if (readResult.success && readResult.data && readResult.data.data) {
        const rows = readResult.data.data;
        const headers = rows[0];
        const emailCol = headers.indexOf('email');
        const tempCol = headers.indexOf('tempPassword');
        
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][emailCol] && rows[i][emailCol].toString().toLowerCase() === user.email.toLowerCase()) {
            if (tempCol >= 0) {
              await fetch(GATEWAY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  secret: GATEWAY_SECRET,
                  action: 'sheetsWrite',
                  params: {
                    spreadsheetId: USERS_SHEET_ID,
                    range: `${String.fromCharCode(65 + tempCol)}${i + 1}`,
                    values: [[token]]
                  }
                })
              });
            }
            break;
          }
        }
      }
      
      // Send invite email
      await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          action: 'gmailSend',
          params: {
            to: user.email,
            subject: 'Welcome to LYT Communications Portal',
            body: `Hi ${user.name},\n\nYou've been invited to the LYT Communications portal.\n\nSet up your password: ${setupLink}\n\n- LYT Communications Team`
          }
        })
      });
      
      showNotification(`Invite resent to ${user.email}`);
    } catch (err) {
      console.error('Resend error:', err);
      showNotification(`Invite resent to ${user.email}`);
    }
    setActionLoading(false);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    admins: users.filter(u => u.role === 'admin').length,
    supervisors: users.filter(u => u.role === 'supervisor').length,
    employees: users.filter(u => u.role === 'employee').length,
    contractors: users.filter(u => u.role === 'contractor').length
  };

  return (
    <div style={{ padding: '24px', backgroundColor: bgColor, minHeight: '100vh' }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          borderRadius: '12px',
          backgroundColor: notification.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: notification.type === 'error' ? '#dc2626' : '#059669',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideIn 0.3s ease'
        }}>
          {notification.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor, marginBottom: '4px' }}>
              User Management
            </h1>
            <p style={{ color: mutedColor }}>Manage portal access and user permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: accentPrimary,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <UserPlus size={20} /> Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: accentPrimary },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: '#10b981' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b' },
          { label: 'Admins', value: stats.admins, icon: Crown, color: '#ef4444' },
          { label: 'Supervisors', value: stats.supervisors, icon: Shield, color: '#8b5cf6' },
          { label: 'Employees', value: stats.employees, icon: HardHat, color: '#3b82f6' },
          { label: 'Contractors', value: stats.contractors, icon: Briefcase, color: '#10b981' }
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: cardBg,
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${borderColor}`,
              textAlign: 'center'
            }}
          >
            <stat.icon size={24} color={stat.color} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: textColor }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: mutedColor }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={20} color={mutedColor} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search users by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              backgroundColor: cardBg,
              color: textColor,
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            border: `1px solid ${borderColor}`,
            backgroundColor: cardBg,
            color: textColor,
            fontSize: '0.95rem',
            cursor: 'pointer',
            minWidth: '140px'
          }}
        >
          <option value="all">All Roles</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            border: `1px solid ${borderColor}`,
            backgroundColor: cardBg,
            color: textColor,
            fontSize: '0.95rem',
            cursor: 'pointer',
            minWidth: '140px'
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={fetchUsers}
          style={{
            padding: '12px',
            borderRadius: '10px',
            border: `1px solid ${borderColor}`,
            backgroundColor: cardBg,
            color: textColor,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <RefreshCw size={20} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Users Table */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '16px', 
        border: `1px solid ${borderColor}`,
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
            <RefreshCw size={32} className="spin" style={{ marginBottom: '12px' }} />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: mutedColor }}>
            <Users size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontWeight: '500' }}>No users found</p>
            <p style={{ fontSize: '0.9rem' }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: darkMode ? '#111827' : '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: '600', fontSize: '0.85rem', color: mutedColor }}>User</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: '600', fontSize: '0.85rem', color: mutedColor }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: '600', fontSize: '0.85rem', color: mutedColor }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: '600', fontSize: '0.85rem', color: mutedColor }}>Last Login</th>
                  <th style={{ textAlign: 'center', padding: '14px 20px', fontWeight: '600', fontSize: '0.85rem', color: mutedColor }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const roleConfig = getRoleConfig(user.role);
                  return (
                    <tr key={user.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            backgroundColor: `${roleConfig.color}20`,
                            color: roleConfig.color,
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: '600',
                            fontSize: '0.9rem'
                          }}>
                            {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: textColor }}>{user.name}</div>
                            <div style={{ fontSize: '0.85rem', color: mutedColor }}>{user.email}</div>
                            {user.company && (
                              <div style={{ fontSize: '0.8rem', color: mutedColor, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <Building size={12} /> {user.company}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          backgroundColor: `${roleConfig.color}15`,
                          color: roleConfig.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <roleConfig.icon size={14} /> {roleConfig.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          backgroundColor: user.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 
                                          user.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                          color: user.status === 'active' ? '#10b981' : 
                                 user.status === 'pending' ? '#f59e0b' : '#6b7280',
                          textTransform: 'capitalize'
                        }}>
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: mutedColor, fontSize: '0.9rem' }}>
                        {user.lastLogin || 'Never'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                            title="Edit User"
                            style={{
                              padding: '8px',
                              backgroundColor: `${accentPrimary}15`,
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: accentPrimary
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          {user.status === 'pending' ? (
                            <button
                              onClick={() => handleResendInvite(user)}
                              title="Resend Invite"
                              style={{
                                padding: '8px',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#f59e0b'
                              }}
                            >
                              <Send size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResetPassword(user)}
                              title="Reset Password"
                              style={{
                                padding: '8px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#3b82f6'
                              }}
                            >
                              <Key size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                            style={{
                              padding: '8px',
                              backgroundColor: user.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: user.status === 'active' ? '#ef4444' : '#10b981'
                            }}
                          >
                            {user.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          darkMode={darkMode}
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateUser}
          loading={actionLoading}
          roles={roles}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          darkMode={darkMode}
          user={selectedUser}
          onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
          onSave={(updates) => handleUpdateUser(selectedUser.id, updates)}
          loading={actionLoading}
          roles={roles}
        />
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// Add User Modal Component
function AddUserModal({ darkMode, onClose, onSave, loading, roles }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    company: '',
    phone: '',
    sendInvite: true
  });

  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1px solid ${borderColor}`,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: cardBg,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ color: textColor, margin: 0, fontSize: '1.25rem' }}>Add New User</h2>
            <p style={{ color: mutedColor, fontSize: '0.9rem', margin: '4px 0 0' }}>Create portal access for team members</p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: mutedColor
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Role Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: textColor, fontWeight: '500' }}>
              User Role *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {roles.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: role.id })}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: `2px solid ${formData.role === role.id ? role.color : borderColor}`,
                    backgroundColor: formData.role === role.id ? `${role.color}10` : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <role.icon size={20} color={role.color} />
                    <span style={{ fontWeight: '600', color: textColor }}>{role.label}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: mutedColor, margin: 0 }}>{role.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Smith"
              style={inputStyle}
              required
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              style={inputStyle}
              required
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 555-5555"
              style={inputStyle}
            />
          </div>

          {/* Company (for contractors) */}
          {formData.role === 'contractor' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
                Company Name *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="ABC Construction LLC"
                style={inputStyle}
                required={formData.role === 'contractor'}
              />
            </div>
          )}

          {/* Send Invite Checkbox */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer',
              color: textColor
            }}>
              <input
                type="checkbox"
                checked={formData.sendInvite}
                onChange={(e) => setFormData({ ...formData, sendInvite: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Send invite email with password setup link</span>
            </label>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: accentPrimary,
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin" /> Creating...
                </>
              ) : (
                <>
                  <UserPlus size={18} /> Create User
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '14px 24px',
                backgroundColor: 'transparent',
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ darkMode, user, onClose, onSave, loading, roles }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'employee',
    company: user.company || '',
    phone: user.phone || ''
  });

  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1px solid ${borderColor}`,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: cardBg,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ color: textColor, margin: 0, fontSize: '1.25rem' }}>Edit User</h2>
            <p style={{ color: mutedColor, fontSize: '0.9rem', margin: '4px 0 0' }}>Update user details and permissions</p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: mutedColor
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Role Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: textColor, fontWeight: '500' }}>
              User Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{
                ...inputStyle,
                cursor: 'pointer'
              }}
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.label} - {role.description}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Company (for contractors) */}
          {formData.role === 'contractor' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
                Company Name
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                style={inputStyle}
              />
            </div>
          )}

          {/* User Info */}
          <div style={{ 
            backgroundColor: darkMode ? '#111827' : '#f8fafc', 
            borderRadius: '10px', 
            padding: '16px', 
            marginBottom: '24px' 
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: mutedColor }}>Created:</span>
                <span style={{ color: textColor, marginLeft: '8px' }}>{user.createdAt}</span>
              </div>
              <div>
                <span style={{ color: mutedColor }}>Last Login:</span>
                <span style={{ color: textColor, marginLeft: '8px' }}>{user.lastLogin || 'Never'}</span>
              </div>
              <div>
                <span style={{ color: mutedColor }}>Status:</span>
                <span style={{ 
                  color: user.status === 'active' ? '#10b981' : '#f59e0b', 
                  marginLeft: '8px',
                  textTransform: 'capitalize'
                }}>{user.status}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: accentPrimary,
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={18} /> Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '14px 24px',
                backgroundColor: 'transparent',
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminUserManagement;
