import React, { useState } from 'react';
import { LogOut, Briefcase, FileText, DollarSign, Upload, Users, Wrench, Settings, ChevronRight, Plus, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { colors, LYT_INFO, URLS, mockProjects, mockInvoices, mockFiles } from '../config/constants';

const ContractorDashboard = ({ setCurrentPage, loggedInUser, setLoggedInUser, darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;

  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentPage('portal');
  };

  const contractorInvoices = mockInvoices.filter((i) => i.contractorId === loggedInUser?.id);
  const assignedJobs = mockProjects.filter((p) => p.status === 'active');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
    { id: 'jobs', label: 'Jobs/SOWs', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: Upload },
    { id: 'personnel', label: 'Personnel', icon: Users },
    { id: 'rates', label: 'Rate Card', icon: Wrench },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return colors.green;
      case 'pending': return colors.coral;
      case 'submitted': return colors.teal;
      default: return colors.gray;
    }
  };

  const renderDashboard = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>
          Welcome, {loggedInUser?.company || loggedInUser?.contact}!
        </h2>
        <p style={{ color: colors.gray }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Active Jobs', value: assignedJobs.length, icon: Briefcase, color: colors.teal },
          { label: 'Pending Invoices', value: contractorInvoices.filter((i) => i.status === 'pending').length, icon: Clock, color: colors.coral },
          { label: 'Total Outstanding', value: `$${contractorInvoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}`, icon: DollarSign, color: colors.blue },
          { label: 'Paid This Month', value: `$${contractorInvoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}`, icon: CheckCircle, color: colors.green },
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <stat.icon size={20} color={stat.color} />
              <span style={{ color: colors.gray, fontSize: '0.9rem' }}>{stat.label}</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: '700' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Active Jobs */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Active Jobs</h3>
          {assignedJobs.length === 0 ? (
            <p style={{ color: colors.gray }}>No active jobs</p>
          ) : (
            assignedJobs.slice(0, 3).map((job) => (
              <div key={job.id} style={{ padding: '12px 0', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500' }}>{job.name}</span>
                  <span style={{ fontSize: '0.8rem', color: colors.gray }}>{job.progress}%</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: colors.gray, marginBottom: '8px' }}>{job.client}</p>
                <div style={{ height: '6px', backgroundColor: darkMode ? colors.dark : '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${job.progress}%`, backgroundColor: colors.teal, borderRadius: '3px' }} />
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => setActiveTab('jobs')}
            style={{ marginTop: '16px', backgroundColor: 'transparent', border: 'none', color: colors.teal, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
          >
            View All Jobs <ChevronRight size={16} />
          </button>
        </div>

        {/* Recent Invoices */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Recent Invoices</h3>
          {contractorInvoices.length === 0 ? (
            <p style={{ color: colors.gray }}>No invoices</p>
          ) : (
            contractorInvoices.slice(0, 4).map((invoice) => (
              <div key={invoice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '2px' }}>{invoice.project}</p>
                  <p style={{ fontSize: '0.8rem', color: colors.gray }}>{invoice.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '600', marginBottom: '2px' }}>${invoice.amount.toLocaleString()}</p>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${getStatusColor(invoice.status)}20`, color: getStatusColor(invoice.status) }}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => setActiveTab('invoices')}
            style={{ marginTop: '16px', backgroundColor: 'transparent', border: 'none', color: colors.teal, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
          >
            View All Invoices <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '32px', backgroundColor: cardBg, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {[
            { label: 'Submit Invoice', icon: Plus, color: colors.green, action: () => setActiveTab('invoices') },
            { label: 'Upload COI', icon: Upload, color: colors.teal, action: () => setActiveTab('documents') },
            { label: 'View Rate Card', icon: DollarSign, color: colors.blue, action: () => setActiveTab('rates') },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              style={{
                padding: '12px 20px',
                backgroundColor: `${action.color}15`,
                border: `1px solid ${action.color}`,
                borderRadius: '8px',
                color: action.color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '500',
              }}
            >
              <action.icon size={18} /> {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Jobs & SOWs</h2>
      <div style={{ display: 'grid', gap: '16px' }}>
        {assignedJobs.map((job) => (
          <div key={job.id} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '4px' }}>{job.name}</h3>
                <p style={{ color: colors.gray }}>{job.client}</p>
              </div>
              <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', backgroundColor: `${colors.green}20`, color: colors.green }}>
                {job.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', color: colors.gray, fontSize: '0.9rem' }}>
              <span>Start: {job.startDate}</span>
              <span>End: {job.endDate}</span>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.9rem', color: colors.gray }}>Progress</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{job.progress}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: darkMode ? colors.dark : '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${job.progress}%`, backgroundColor: colors.teal, borderRadius: '4px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ padding: '8px 16px', backgroundColor: colors.teal, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                View SOW
              </button>
              <button style={{ padding: '8px 16px', backgroundColor: 'transparent', color: colors.teal, border: `1px solid ${colors.teal}`, borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                Submit Work Log
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Invoices</h2>
        <button style={{ padding: '10px 20px', backgroundColor: colors.green, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <Plus size={18} /> Submit Invoice
        </button>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? colors.dark : '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Invoice #</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Project</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Date</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Due Date</th>
                <th style={{ textAlign: 'right', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Amount</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: '600', fontSize: '0.85rem', color: colors.gray }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {contractorInvoices.map((invoice) => (
                <tr key={invoice.id} style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                  <td style={{ padding: '14px 16px', fontWeight: '500' }}>INV-{invoice.id.toString().padStart(4, '0')}</td>
                  <td style={{ padding: '14px 16px' }}>{invoice.project}</td>
                  <td style={{ padding: '14px 16px', color: colors.gray }}>{invoice.date}</td>
                  <td style={{ padding: '14px 16px', color: colors.gray }}>{invoice.dueDate}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600' }}>${invoice.amount.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', backgroundColor: `${getStatusColor(invoice.status)}20`, color: getStatusColor(invoice.status) }}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Documents</h2>
      
      {/* Upload COI */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Certificate of Insurance</h3>
        <div style={{ padding: '32px', border: `2px dashed ${colors.gray}`, borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
          <Upload size={40} color={colors.gray} style={{ marginBottom: '12px' }} />
          <p style={{ color: colors.gray, marginBottom: '8px' }}>Drop your COI here or click to upload</p>
          <p style={{ color: colors.gray, fontSize: '0.85rem' }}>PDF, JPG, or PNG (max 10MB)</p>
        </div>
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: `${colors.coral}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} color={colors.coral} />
          <span style={{ color: colors.coral, fontSize: '0.9rem' }}>Your COI expires on 2025-03-01. Please upload a renewed certificate.</span>
        </div>
      </div>

      {/* Document List */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>Your Documents</h3>
        {mockFiles.slice(0, 4).map((file, idx) => (
          <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: idx < 3 ? `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={20} color={colors.teal} />
              <div>
                <p style={{ fontWeight: '500', marginBottom: '2px' }}>{file.name}</p>
                <p style={{ fontSize: '0.8rem', color: colors.gray }}>{file.size} • {file.date}</p>
              </div>
            </div>
            <button style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: colors.teal }}>
              <Download size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPersonnel = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Personnel & Fleet</h2>
        <button style={{ padding: '10px 20px', backgroundColor: colors.teal, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <Plus size={18} /> Add Personnel
        </button>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <p style={{ color: colors.gray }}>Manage your team and equipment here. Add personnel with their certifications and update your fleet inventory.</p>
      </div>
    </div>
  );

  const renderRates = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Rate Card</h2>
      
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <p style={{ color: colors.gray, marginBottom: '20px' }}>
          View the current rate card for {LYT_INFO.name} projects. Specific rates are negotiated per SOW.
        </p>
        <a
          href={`https://docs.google.com/spreadsheets/d/${URLS.rateCardSheet}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: colors.teal,
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Open Rate Card (Google Sheets)
        </a>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Settings</h2>
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Company Information</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '4px' }}>Company</label>
            <p style={{ fontWeight: '500' }}>{loggedInUser?.company}</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '4px' }}>Contact</label>
            <p style={{ fontWeight: '500' }}>{loggedInUser?.contact}</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '4px' }}>Email</label>
            <p style={{ fontWeight: '500' }}>{loggedInUser?.email}</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '4px' }}>Status</label>
            <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: `${colors.green}20`, color: colors.green, textTransform: 'capitalize' }}>
              {loggedInUser?.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'jobs': return renderJobs();
      case 'invoices': return renderInvoices();
      case 'documents': return renderDocuments();
      case 'personnel': return renderPersonnel();
      case 'rates': return renderRates();
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
            <span style={{ color: colors.teal }}>LYT</span> Contractor
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
                backgroundColor: activeTab === item.id ? `${colors.teal}20` : 'transparent',
                border: 'none',
                borderLeft: activeTab === item.id ? `3px solid ${colors.teal}` : '3px solid transparent',
                color: activeTab === item.id ? colors.teal : '#9ca3af',
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
            <p style={{ color: '#fff', fontWeight: '500', fontSize: '0.9rem', marginBottom: '2px' }}>{loggedInUser?.company}</p>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{loggedInUser?.contact}</p>
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

export default ContractorDashboard;
