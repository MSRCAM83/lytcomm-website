import React, { useState } from 'react';
import { LogOut, LayoutDashboard, Users, Briefcase, Clock, DollarSign, FileText, Settings, ChevronRight, CheckCircle, XCircle, AlertCircle, Plus, Search, Filter } from 'lucide-react';
import { colors, LYT_INFO, mockUsers, mockContractors, mockProjects, mockTimeEntries, mockInvoices } from '../config/constants';

const AdminDashboard = ({ setCurrentPage, loggedInUser, setLoggedInUser, darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentPage('portal');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'contractors', label: 'Contractors', icon: Briefcase },
    { id: 'time', label: 'Time Records', icon: Clock },
    { id: 'invoices', label: 'Invoices', icon: DollarSign },
    { id: 'projects', label: 'Projects', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const pendingTimeEntries = mockTimeEntries.filter((t) => t.status === 'pending');
  const pendingInvoices = mockInvoices.filter((i) => i.status === 'pending' || i.status === 'submitted');
  const activeProjects = mockProjects.filter((p) => p.status === 'active');

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'paid':
      case 'active':
        return colors.green;
      case 'pending':
      case 'submitted':
        return colors.coral;
      case 'completed':
        return colors.blue;
      default:
        return colors.gray;
    }
  };

  const renderDashboard = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Admin Dashboard</h2>
        <p style={{ color: colors.gray }}>Overview of operations and pending approvals</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Active Employees', value: mockUsers.length, icon: Users, color: colors.blue },
          { label: 'Active Contractors', value: mockContractors.filter((c) => c.status === 'active').length, icon: Briefcase, color: colors.teal },
          { label: 'Active Projects', value: activeProjects.length, icon: FileText, color: colors.green },
          { label: 'Pending Approvals', value: pendingTimeEntries.length + pendingInvoices.length, icon: AlertCircle, color: colors.coral },
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <stat.icon size={20} color={stat.color} />
              <span style={{ color: colors.gray, fontSize: '0.85rem' }}>{stat.label}</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: '700' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pending Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Pending Time Entries */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Pending Time Entries</h3>
            <span style={{ backgroundColor: `${colors.coral}20`, color: colors.coral, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500' }}>
              {pendingTimeEntries.length} pending
            </span>
          </div>
          {pendingTimeEntries.length === 0 ? (
            <p style={{ color: colors.gray }}>No pending time entries</p>
          ) : (
            pendingTimeEntries.slice(0, 3).map((entry) => {
              const user = mockUsers.find((u) => u.id === entry.userId);
              return (
                <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                  <div>
                    <p style={{ fontWeight: '500', marginBottom: '2px' }}>{user?.name}</p>
                    <p style={{ fontSize: '0.85rem', color: colors.gray }}>{entry.date} • {entry.project}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '6px', backgroundColor: `${colors.green}20`, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      <CheckCircle size={18} color={colors.green} />
                    </button>
                    <button style={{ padding: '6px', backgroundColor: `${colors.coral}20`, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      <XCircle size={18} color={colors.coral} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <button
            onClick={() => setActiveTab('time')}
            style={{ marginTop: '16px', backgroundColor: 'transparent', border: 'none', color: colors.teal, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
          >
            View All <ChevronRight size={16} />
          </button>
        </div>

        {/* Pending Invoices */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Pending Invoices</h3>
            <span style={{ backgroundColor: `${colors.coral}20`, color: colors.coral, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500' }}>
              {pendingInvoices.length} pending
            </span>
          </div>
          {pendingInvoices.length === 0 ? (
            <p style={{ color: colors.gray }}>No pending invoices</p>
          ) : (
            pendingInvoices.slice(0, 3).map((invoice) => {
              const contractor = mockContractors.find((c) => c.id === invoice.contractorId);
              return (
                <div key={invoice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                  <div>
                    <p style={{ fontWeight: '500', marginBottom: '2px' }}>{contractor?.company}</p>
                    <p style={{ fontSize: '0.85rem', color: colors.gray }}>{invoice.project} • ${invoice.amount.toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '6px', backgroundColor: `${colors.green}20`, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      <CheckCircle size={18} color={colors.green} />
                    </button>
                    <button style={{ padding: '6px', backgroundColor: `${colors.coral}20`, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      <XCircle size={18} color={colors.coral} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <button
            onClick={() => setActiveTab('invoices')}
            style={{ marginTop: '16px', backgroundColor: 'transparent', border: 'none', color: colors.teal, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
          >
            View All <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Project Overview */}
      <div style={{ marginTop: '32px', backgroundColor: cardBg, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Active Projects</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {activeProjects.map((project) => (
            <div key={project.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '500', marginBottom: '4px' }}>{project.name}</p>
                <p style={{ fontSize: '0.85rem', color: colors.gray }}>{project.client}</p>
              </div>
              <div style={{ flex: 1, padding: '0 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: colors.gray }}>Progress</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{project.progress}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: darkMode ? colors.darkLight : '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${project.progress}%`, backgroundColor: colors.teal, borderRadius: '3px' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.85rem', color: colors.gray }}>{project.crew.length} crew</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEmployees = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Employees</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color={colors.gray} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 12px 10px 40px',
                border: `1px solid ${darkMode ? '#374151' : '#ddd'}`,
                borderRadius: '8px',
                backgroundColor: darkMode ? colors.dark : '#fff',
                color: textColor,
                width: '250px',
              }}
            />
          </div>
          <button style={{ padding: '10px 20px', backgroundColor: colors.green, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? colors.dark : '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Employee</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Email</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Phone</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Role</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                <tr key={user.id} style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.85rem' }}>
                        {user.avatar}
                      </div>
                      <span style={{ fontWeight: '500' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: colors.gray }}>{user.email}</td>
                  <td style={{ padding: '14px 16px', color: colors.gray }}>{user.phone}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: `${colors.blue}20`, color: colors.blue, textTransform: 'capitalize' }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button style={{ padding: '6px 12px', backgroundColor: 'transparent', border: `1px solid ${colors.teal}`, borderRadius: '6px', color: colors.teal, cursor: 'pointer', fontSize: '0.85rem' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContractors = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Contractors</h2>
        <button style={{ padding: '10px 20px', backgroundColor: colors.teal, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <Plus size={18} /> Add Contractor
        </button>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {mockContractors.map((contractor) => (
          <div key={contractor.id} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>{contractor.company}</h3>
                <p style={{ color: colors.gray, fontSize: '0.9rem' }}>Contact: {contractor.contact}</p>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', backgroundColor: `${getStatusColor(contractor.status)}20`, color: getStatusColor(contractor.status), textTransform: 'capitalize' }}>
                {contractor.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', fontSize: '0.9rem', color: colors.gray }}>
              <span>{contractor.email}</span>
              <span>{contractor.phone}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {contractor.skills.map((skill, idx) => (
                <span key={idx} style={{ padding: '4px 10px', backgroundColor: darkMode ? colors.dark : '#f1f5f9', borderRadius: '4px', fontSize: '0.8rem', color: colors.gray }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTime = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Time Records</h2>
        <button style={{ padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${colors.gray}`, borderRadius: '8px', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} /> Filter
        </button>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? colors.dark : '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Employee</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Date</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Project</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Clock In</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Clock Out</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Hours</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Status</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockTimeEntries.map((entry) => {
                const user = mockUsers.find((u) => u.id === entry.userId);
                const hours = entry.clockOut ? ((new Date(`2000-01-01 ${entry.clockOut}`) - new Date(`2000-01-01 ${entry.clockIn}`)) / 3600000 - entry.breakTime / 60).toFixed(1) : '-';
                return (
                  <tr key={entry.id} style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>{user?.name}</td>
                    <td style={{ padding: '14px 16px' }}>{entry.date}</td>
                    <td style={{ padding: '14px 16px', color: colors.gray }}>{entry.project}</td>
                    <td style={{ padding: '14px 16px' }}>{entry.clockIn}</td>
                    <td style={{ padding: '14px 16px' }}>{entry.clockOut || '-'}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>{hours}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', backgroundColor: `${getStatusColor(entry.status)}20`, color: getStatusColor(entry.status) }}>
                        {entry.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {entry.status === 'pending' && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button style={{ padding: '4px', backgroundColor: `${colors.green}20`, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            <CheckCircle size={16} color={colors.green} />
                          </button>
                          <button style={{ padding: '4px', backgroundColor: `${colors.coral}20`, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            <XCircle size={16} color={colors.coral} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Invoices</h2>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? colors.dark : '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Invoice #</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Contractor</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Project</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Date</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Due Date</th>
                <th style={{ textAlign: 'right', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Amount</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Status</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((invoice) => {
                const contractor = mockContractors.find((c) => c.id === invoice.contractorId);
                return (
                  <tr key={invoice.id} style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>INV-{invoice.id.toString().padStart(4, '0')}</td>
                    <td style={{ padding: '14px 16px' }}>{contractor?.company}</td>
                    <td style={{ padding: '14px 16px', color: colors.gray }}>{invoice.project}</td>
                    <td style={{ padding: '14px 16px' }}>{invoice.date}</td>
                    <td style={{ padding: '14px 16px' }}>{invoice.dueDate}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600' }}>${invoice.amount.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', backgroundColor: `${getStatusColor(invoice.status)}20`, color: getStatusColor(invoice.status) }}>
                        {invoice.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {(invoice.status === 'pending' || invoice.status === 'submitted') && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button style={{ padding: '4px', backgroundColor: `${colors.green}20`, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            <CheckCircle size={16} color={colors.green} />
                          </button>
                          <button style={{ padding: '4px', backgroundColor: `${colors.coral}20`, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            <XCircle size={16} color={colors.coral} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Projects</h2>
        <button style={{ padding: '10px 20px', backgroundColor: colors.green, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <Plus size={18} /> New Project
        </button>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {mockProjects.map((project) => (
          <div key={project.id} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '4px' }}>{project.name}</h3>
                <p style={{ color: colors.gray }}>{project.client}</p>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', backgroundColor: `${getStatusColor(project.status)}20`, color: getStatusColor(project.status), textTransform: 'capitalize' }}>
                {project.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '32px', marginBottom: '16px', fontSize: '0.9rem', color: colors.gray }}>
              <span>Start: {project.startDate}</span>
              <span>End: {project.endDate}</span>
              <span>Crew: {project.crew.length} assigned</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.9rem', color: colors.gray }}>Progress</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{project.progress}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: darkMode ? colors.dark : '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${project.progress}%`, backgroundColor: colors.teal, borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Settings</h2>
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Admin Account</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '4px' }}>Name</label>
            <p style={{ fontWeight: '500' }}>{loggedInUser?.name}</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '4px' }}>Email</label>
            <p style={{ fontWeight: '500' }}>{loggedInUser?.email}</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '4px' }}>Role</label>
            <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: `${colors.coral}20`, color: colors.coral, textTransform: 'capitalize' }}>
              {loggedInUser?.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'employees': return renderEmployees();
      case 'contractors': return renderContractors();
      case 'time': return renderTime();
      case 'invoices': return renderInvoices();
      case 'projects': return renderProjects();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor, display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: colors.dark, padding: '24px 0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh' }}>
        <div style={{ padding: '0 24px', marginBottom: '32px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>
            <span style={{ color: colors.coral }}>LYT</span> Admin
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: activeTab === item.id ? `${colors.coral}20` : 'transparent',
                border: 'none',
                borderLeft: activeTab === item.id ? `3px solid ${colors.coral}` : '3px solid transparent',
                color: activeTab === item.id ? colors.coral : '#9ca3af',
                fontSize: '0.95rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '0 24px' }}>
          <div style={{ padding: '16px', backgroundColor: colors.darkLight, borderRadius: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.coral, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>
                {loggedInUser?.avatar || 'A'}
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: '500', fontSize: '0.9rem' }}>{loggedInUser?.name}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'capitalize' }}>{loggedInUser?.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.coral}`,
              color: colors.coral,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '32px' }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
