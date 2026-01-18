import React, { useState } from 'react';
import { LogOut, Briefcase, FileText, DollarSign, Upload, Users, Wrench, Settings, ChevronRight, Plus, Download, CheckCircle, Clock, AlertCircle, Activity, Truck, Camera, Zap, Phone, Eye, AlertTriangle, Shield, ShieldAlert, Award } from 'lucide-react';
import { colors, LYT_INFO, URLS, mockProjects, mockInvoices, mockFiles } from '../config/constants';

const ContractorDashboard = ({ setCurrentPage, loggedInUser, setLoggedInUser, darkMode }) => {
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;

  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentPage('portal-login');
  };

  const contractorInvoices = mockInvoices.filter((i) => i.contractorId === loggedInUser?.id);
  const assignedJobs = mockProjects.filter((p) => p.status === 'active');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
    { id: 'production', label: 'Daily Production', icon: Activity },
    { id: 'otdr', label: 'OTDR Results', icon: Zap },
    { id: 'tickets', label: '811 Tickets', icon: Phone },
    { id: 'equipment', label: 'Equipment Check', icon: Truck },
    { id: 'compliance', label: 'COI / Compliance', icon: Shield },
    { id: 'incidents', label: 'Incident Reports', icon: ShieldAlert },
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

  // Field Operations - Daily Production Log
  const [productionLog, setProductionLog] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
    fiberFootage: '',
    splicesCompleted: '',
    polesSet: '',
    hddBoreLength: '',
    conduitInstalled: '',
    notes: '',
    photos: [],
  });

  const renderProduction = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Daily Production Log</h2>
          <p style={{ color: colors.gray }}>Record your crew's daily work progress</p>
        </div>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Date *</label>
            <input
              type="date"
              value={productionLog.date}
              onChange={(e) => setProductionLog({ ...productionLog, date: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Project / SOW *</label>
            <select
              value={productionLog.project}
              onChange={(e) => setProductionLog({ ...productionLog, project: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            >
              <option value="">Select project...</option>
              {mockProjects.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: colors.teal }}>Production Quantities</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Fiber Installed (ft)</label>
            <input
              type="number"
              value={productionLog.fiberFootage}
              onChange={(e) => setProductionLog({ ...productionLog, fiberFootage: e.target.value })}
              placeholder="0"
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Splices Completed</label>
            <input
              type="number"
              value={productionLog.splicesCompleted}
              onChange={(e) => setProductionLog({ ...productionLog, splicesCompleted: e.target.value })}
              placeholder="0"
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Poles Set</label>
            <input
              type="number"
              value={productionLog.polesSet}
              onChange={(e) => setProductionLog({ ...productionLog, polesSet: e.target.value })}
              placeholder="0"
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>HDD Bore (ft)</label>
            <input
              type="number"
              value={productionLog.hddBoreLength}
              onChange={(e) => setProductionLog({ ...productionLog, hddBoreLength: e.target.value })}
              placeholder="0"
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Conduit (ft)</label>
            <input
              type="number"
              value={productionLog.conduitInstalled}
              onChange={(e) => setProductionLog({ ...productionLog, conduitInstalled: e.target.value })}
              placeholder="0"
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Notes / Comments</label>
          <textarea
            value={productionLog.notes}
            onChange={(e) => setProductionLog({ ...productionLog, notes: e.target.value })}
            placeholder="Any delays, issues, or additional notes..."
            rows={3}
            style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor, resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>
            <Camera size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Photo Documentation
          </label>
          <div style={{ border: `2px dashed ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
            <Camera size={32} color={colors.gray} style={{ marginBottom: '8px' }} />
            <p style={{ color: colors.gray, marginBottom: '8px' }}>Drag photos here or click to upload</p>
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} id="contractor-photo-upload" />
            <label htmlFor="contractor-photo-upload" style={{ padding: '8px 16px', backgroundColor: colors.teal, color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
              Select Photos
            </label>
          </div>
        </div>

        <button
          onClick={() => alert('Production log submitted!')}
          style={{ width: '100%', padding: '14px', backgroundColor: colors.green, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
        >
          Submit Production Log
        </button>
      </div>
    </div>
  );

  // Field Operations - Equipment Pre-Use Inspection
  const [equipmentCheck, setEquipmentCheck] = useState({
    date: new Date().toISOString().split('T')[0],
    equipmentType: '',
    equipmentId: '',
    mileage: '',
    items: {
      tires: null,
      brakes: null,
      lights: null,
      fluids: null,
      safetyEquipment: null,
      fireExtinguisher: null,
      firstAidKit: null,
      triangles: null,
    },
    issues: '',
  });

  const equipmentTypes = [
    'Pickup Truck',
    'Service Van',
    'Bucket Truck',
    'Trailer',
    'HDD Drill Rig',
    'Mini Excavator',
    'Fusion Splicer',
    'OTDR',
  ];

  const inspectionItems = [
    { key: 'tires', label: 'Tires / Wheels' },
    { key: 'brakes', label: 'Brakes' },
    { key: 'lights', label: 'Lights / Signals' },
    { key: 'fluids', label: 'Fluids (Oil, Coolant)' },
    { key: 'safetyEquipment', label: 'Safety Equipment' },
    { key: 'fireExtinguisher', label: 'Fire Extinguisher' },
    { key: 'firstAidKit', label: 'First Aid Kit' },
    { key: 'triangles', label: 'Warning Triangles' },
  ];

  const renderEquipment = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Equipment Pre-Use Inspection</h2>
          <p style={{ color: colors.gray }}>Complete before operating any equipment</p>
        </div>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Date *</label>
            <input
              type="date"
              value={equipmentCheck.date}
              onChange={(e) => setEquipmentCheck({ ...equipmentCheck, date: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Equipment Type *</label>
            <select
              value={equipmentCheck.equipmentType}
              onChange={(e) => setEquipmentCheck({ ...equipmentCheck, equipmentType: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            >
              <option value="">Select type...</option>
              {equipmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Unit # / ID *</label>
            <input
              type="text"
              value={equipmentCheck.equipmentId}
              onChange={(e) => setEquipmentCheck({ ...equipmentCheck, equipmentId: e.target.value })}
              placeholder="e.g., T-101"
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Mileage / Hours</label>
            <input
              type="text"
              value={equipmentCheck.mileage}
              onChange={(e) => setEquipmentCheck({ ...equipmentCheck, mileage: e.target.value })}
              placeholder="Current reading"
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
        </div>

        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: colors.teal }}>Inspection Checklist</h4>
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          {inspectionItems.map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px' }}>
              <span>{item.label}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEquipmentCheck({ ...equipmentCheck, items: { ...equipmentCheck.items, [item.key]: 'pass' } })}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: equipmentCheck.items[item.key] === 'pass' ? colors.green : 'transparent',
                    border: `1px solid ${colors.green}`,
                    borderRadius: '6px',
                    color: equipmentCheck.items[item.key] === 'pass' ? '#fff' : colors.green,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Pass
                </button>
                <button
                  onClick={() => setEquipmentCheck({ ...equipmentCheck, items: { ...equipmentCheck.items, [item.key]: 'fail' } })}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: equipmentCheck.items[item.key] === 'fail' ? colors.coral : 'transparent',
                    border: `1px solid ${colors.coral}`,
                    borderRadius: '6px',
                    color: equipmentCheck.items[item.key] === 'fail' ? '#fff' : colors.coral,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Fail
                </button>
                <button
                  onClick={() => setEquipmentCheck({ ...equipmentCheck, items: { ...equipmentCheck.items, [item.key]: 'na' } })}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: equipmentCheck.items[item.key] === 'na' ? colors.gray : 'transparent',
                    border: `1px solid ${colors.gray}`,
                    borderRadius: '6px',
                    color: equipmentCheck.items[item.key] === 'na' ? '#fff' : colors.gray,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  N/A
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Issues / Deficiencies Found
          </label>
          <textarea
            value={equipmentCheck.issues}
            onChange={(e) => setEquipmentCheck({ ...equipmentCheck, issues: e.target.value })}
            placeholder="Describe any issues found..."
            rows={3}
            style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor, resize: 'vertical' }}
          />
        </div>

        <button
          onClick={() => alert('Equipment inspection submitted!')}
          style={{ width: '100%', padding: '14px', backgroundColor: colors.green, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
        >
          Submit Inspection
        </button>
      </div>
    </div>
  );

  // OTDR Test Results
  const [otdrTests, setOtdrTests] = useState([
    { id: 1, date: '2025-01-16', project: 'Metro Fiber Ring', segment: 'Span A1-A5', result: 'pass', loss: '0.18 dB/km', file: 'otdr_a1a5.sor' },
    { id: 2, date: '2025-01-15', project: 'Metro Fiber Ring', segment: 'Span A5-A10', result: 'pass', loss: '0.21 dB/km', file: 'otdr_a5a10.sor' },
  ]);

  const [newOtdr, setNewOtdr] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
    segment: '',
    result: 'pass',
    loss: '',
  });

  const renderOtdr = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>OTDR Test Results</h2>
          <p style={{ color: colors.gray }}>Upload and track fiber test results</p>
        </div>
      </div>

      {/* Upload New Test */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Upload New Test Result</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Date *</label>
            <input
              type="date"
              value={newOtdr.date}
              onChange={(e) => setNewOtdr({ ...newOtdr, date: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Project *</label>
            <select
              value={newOtdr.project}
              onChange={(e) => setNewOtdr({ ...newOtdr, project: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            >
              <option value="">Select project...</option>
              {mockProjects.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Fiber Segment *</label>
            <input
              type="text"
              value={newOtdr.segment}
              onChange={(e) => setNewOtdr({ ...newOtdr, segment: e.target.value })}
              placeholder="e.g., Span A1-A5"
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Loss (dB/km)</label>
            <input
              type="text"
              value={newOtdr.loss}
              onChange={(e) => setNewOtdr({ ...newOtdr, loss: e.target.value })}
              placeholder="e.g., 0.18"
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Result *</label>
            <select
              value={newOtdr.result}
              onChange={(e) => setNewOtdr({ ...newOtdr, result: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail - Needs Resplice</option>
              <option value="marginal">Marginal</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>
            <Upload size={16} style={{ display: 'inline', marginRight: '6px' }} />
            OTDR Trace File (.sor, .trc)
          </label>
          <div style={{ border: `2px dashed ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <input type="file" accept=".sor,.trc,.pdf" style={{ display: 'none' }} id="contractor-otdr-upload" />
            <label htmlFor="contractor-otdr-upload" style={{ padding: '8px 16px', backgroundColor: colors.teal, color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
              Select File
            </label>
          </div>
        </div>

        <button
          onClick={() => {
            if (newOtdr.project && newOtdr.segment) {
              const newTest = {
                id: otdrTests.length + 1,
                date: newOtdr.date,
                project: newOtdr.project,
                segment: newOtdr.segment,
                result: newOtdr.result,
                loss: newOtdr.loss || 'N/A',
                file: 'uploaded.sor'
              };
              setOtdrTests([newTest, ...otdrTests]);
              setNewOtdr({ date: new Date().toISOString().split('T')[0], project: '', segment: '', result: 'pass', loss: '' });
              alert('OTDR test uploaded successfully!');
            } else {
              alert('Please fill in Project and Fiber Segment fields.');
            }
          }}
          style={{ padding: '12px 24px', backgroundColor: colors.green, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}
        >
          Upload Test Result
        </button>
      </div>

      {/* Recent Tests */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Recent Test Results</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? colors.dark : '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Project</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Segment</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Loss</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Result</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {otdrTests.map(test => (
                <tr key={test.id} style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                  <td style={{ padding: '12px' }}>{test.date}</td>
                  <td style={{ padding: '12px' }}>{test.project}</td>
                  <td style={{ padding: '12px' }}>{test.segment}</td>
                  <td style={{ padding: '12px' }}>{test.loss}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      backgroundColor: test.result === 'pass' ? `${colors.green}20` : `${colors.coral}20`,
                      color: test.result === 'pass' ? colors.green : colors.coral,
                      textTransform: 'capitalize',
                    }}>
                      {test.result}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Eye size={18} color={colors.teal} />
                    </button>
                    <button style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Download size={18} color={colors.gray} />
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

  // 811 Ticket Tracking
  const [tickets, setTickets] = useState([
    { id: 1, ticketNumber: '2501160001', status: 'active', address: '123 Main St', expires: '2025-01-23', created: '2025-01-16' },
    { id: 2, ticketNumber: '2501140002', status: 'active', address: '456 Oak Ave', expires: '2025-01-21', created: '2025-01-14' },
  ]);

  const [newTicket, setNewTicket] = useState({
    ticketNumber: '',
    address: '',
    expires: '',
  });

  const renderTickets = () => {
    const expiringSoon = tickets.filter(t => {
      const daysUntil = Math.ceil((new Date(t.expires) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3 && daysUntil > 0;
    });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>811 Ticket Tracking</h2>
            <p style={{ color: colors.gray }}>Track underground utility locate tickets</p>
          </div>
        </div>

        {expiringSoon.length > 0 && (
          <div style={{ backgroundColor: `${colors.coral}15`, border: `1px solid ${colors.coral}`, borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color={colors.coral} />
            <div>
              <p style={{ fontWeight: '600', color: colors.coral }}>{expiringSoon.length} ticket(s) expiring within 3 days!</p>
              <p style={{ fontSize: '0.9rem', color: colors.gray }}>Renew tickets before starting work.</p>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Add New Ticket</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Ticket Number *</label>
              <input
                type="text"
                value={newTicket.ticketNumber}
                onChange={(e) => setNewTicket({ ...newTicket, ticketNumber: e.target.value })}
                placeholder="e.g., 2501160001"
                style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Work Address *</label>
              <input
                type="text"
                value={newTicket.address}
                onChange={(e) => setNewTicket({ ...newTicket, address: e.target.value })}
                placeholder="Street address"
                style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Expiration Date *</label>
              <input
                type="date"
                value={newTicket.expires}
                onChange={(e) => setNewTicket({ ...newTicket, expires: e.target.value })}
                style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              if (newTicket.ticketNumber && newTicket.address && newTicket.expires) {
                const ticket = {
                  id: tickets.length + 1,
                  ticketNumber: newTicket.ticketNumber,
                  status: 'active',
                  address: newTicket.address,
                  expires: newTicket.expires,
                  created: new Date().toISOString().split('T')[0]
                };
                setTickets([ticket, ...tickets]);
                setNewTicket({ ticketNumber: '', address: '', expires: '' });
                alert('Ticket added successfully!');
              } else {
                alert('Please fill in all required fields.');
              }
            }}
            style={{ padding: '10px 20px', backgroundColor: colors.green, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}
          >
            Add Ticket
          </button>
        </div>

        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>All Tickets</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {tickets.map(ticket => {
              const daysUntil = Math.ceil((new Date(ticket.expires) - new Date()) / (1000 * 60 * 60 * 24));
              const isExpired = daysUntil < 0;
              const isExpiringSoon = daysUntil <= 3 && daysUntil >= 0;

              return (
                <div
                  key={ticket.id}
                  style={{
                    padding: '16px',
                    backgroundColor: darkMode ? colors.dark : '#f8fafc',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${isExpired ? colors.coral : isExpiringSoon ? colors.orange : colors.green}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Phone size={16} color={colors.teal} />
                        <span style={{ fontWeight: '600' }}>#{ticket.ticketNumber}</span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          backgroundColor: isExpired ? `${colors.coral}20` : `${colors.green}20`,
                          color: isExpired ? colors.coral : colors.green,
                        }}>
                          {isExpired ? 'EXPIRED' : 'Active'}
                        </span>
                      </div>
                      <p style={{ color: colors.gray, fontSize: '0.9rem' }}>{ticket.address}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.85rem', color: isExpiringSoon ? colors.orange : colors.gray }}>
                        Expires: {ticket.expires}
                      </p>
                      {isExpiringSoon && !isExpired && (
                        <p style={{ fontSize: '0.8rem', color: colors.orange, fontWeight: '500' }}>⚠️ {daysUntil} day(s)</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // COI / Compliance Tracking
  // eslint-disable-next-line no-unused-vars
  const [compliance, setCompliance] = useState({
    coi: { expiry: '2025-04-15', carrier: 'Hartford Insurance', policyNumber: 'GL-12345678', liability: '$1,000,000', workersComp: '$500,000' },
    vehicleInsurance: { expiry: '2025-06-01', carrier: 'Progressive', policyNumber: 'AUTO-87654321' },
    businessLicense: { expiry: '2025-12-31', number: 'TX-BL-2024-5678' },
  });

  const renderCompliance = () => {
    const today = new Date();
    const coiExpiry = new Date(compliance.coi.expiry);
    const coiDaysUntil = Math.ceil((coiExpiry - today) / (1000 * 60 * 60 * 24));
    const coiExpired = coiDaysUntil < 0;
    const coiExpiringSoon = coiDaysUntil <= 30 && coiDaysUntil > 0;

    const vehicleExpiry = new Date(compliance.vehicleInsurance.expiry);
    const vehicleDaysUntil = Math.ceil((vehicleExpiry - today) / (1000 * 60 * 60 * 24));
    const vehicleExpiringSoon = vehicleDaysUntil <= 30 && vehicleDaysUntil > 0;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>COI / Compliance</h2>
            <p style={{ color: colors.gray }}>Track insurance certificates and compliance documents</p>
          </div>
        </div>

        {/* COI Alert */}
        {(coiExpired || coiExpiringSoon) && (
          <div style={{ backgroundColor: coiExpired ? `${colors.coral}15` : `${colors.orange}15`, border: `1px solid ${coiExpired ? colors.coral : colors.orange}`, borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color={coiExpired ? colors.coral : colors.orange} />
            <div>
              <p style={{ fontWeight: '600', color: coiExpired ? colors.coral : colors.orange }}>
                {coiExpired ? 'Certificate of Insurance EXPIRED!' : `COI expires in ${coiDaysUntil} days`}
              </p>
              <p style={{ fontSize: '0.9rem', color: colors.gray }}>
                {coiExpired ? 'Upload new COI immediately to continue work.' : 'Contact your insurance carrier for renewal.'}
              </p>
            </div>
          </div>
        )}

        {/* General Liability COI */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={24} color={colors.teal} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Certificate of Insurance (COI)</h3>
                <p style={{ color: colors.gray, fontSize: '0.9rem' }}>{compliance.coi.carrier}</p>
              </div>
            </div>
            <span style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '500',
              backgroundColor: coiExpired ? `${colors.coral}20` : coiExpiringSoon ? `${colors.orange}20` : `${colors.green}20`,
              color: coiExpired ? colors.coral : coiExpiringSoon ? colors.orange : colors.green,
            }}>
              {coiExpired ? 'EXPIRED' : coiExpiringSoon ? 'EXPIRING SOON' : 'Active'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: colors.gray, marginBottom: '4px' }}>Policy Number</label>
              <p style={{ fontWeight: '500' }}>{compliance.coi.policyNumber}</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: colors.gray, marginBottom: '4px' }}>General Liability</label>
              <p style={{ fontWeight: '500' }}>{compliance.coi.liability}</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: colors.gray, marginBottom: '4px' }}>Workers Comp</label>
              <p style={{ fontWeight: '500' }}>{compliance.coi.workersComp}</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: colors.gray, marginBottom: '4px' }}>Expiration</label>
              <p style={{ fontWeight: '500', color: coiExpired ? colors.coral : coiExpiringSoon ? colors.orange : textColor }}>
                {compliance.coi.expiry}
                {coiExpiringSoon && <span style={{ display: 'block', fontSize: '0.8rem', color: colors.orange }}>({coiDaysUntil} days)</span>}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ padding: '10px 20px', backgroundColor: colors.teal, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} /> Upload New COI
            </button>
            <button style={{ padding: '10px 20px', backgroundColor: 'transparent', border: `1px solid ${colors.teal}`, borderRadius: '8px', color: colors.teal, cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> Download Current
            </button>
          </div>
        </div>

        {/* Vehicle Insurance */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Truck size={24} color={colors.teal} />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Vehicle Insurance</h3>
                <p style={{ color: colors.gray, fontSize: '0.85rem' }}>{compliance.vehicleInsurance.carrier} • {compliance.vehicleInsurance.policyNumber}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '500', color: vehicleExpiringSoon ? colors.orange : textColor }}>Expires: {compliance.vehicleInsurance.expiry}</p>
              {vehicleExpiringSoon && <p style={{ fontSize: '0.8rem', color: colors.orange }}>⚠️ {vehicleDaysUntil} days</p>}
            </div>
          </div>
        </div>

        {/* Business License */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Award size={24} color={colors.teal} />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Business License</h3>
                <p style={{ color: colors.gray, fontSize: '0.85rem' }}>{compliance.businessLicense.number}</p>
              </div>
            </div>
            <p style={{ fontWeight: '500' }}>Expires: {compliance.businessLicense.expiry}</p>
          </div>
        </div>
      </div>
    );
  };

  // Incident Reports
  const [incidents, setIncidents] = useState([
    { id: 1, date: '2025-01-08', type: 'Property Damage', description: 'Minor scratch on customer fence during cable installation', project: 'Metro Fiber Ring', status: 'closed' },
  ]);

  const [newIncident, setNewIncident] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    type: '',
    project: '',
    location: '',
    description: '',
    injuries: 'no',
    injuryDescription: '',
    immediateActions: '',
  });

  const incidentTypes = [
    'Near Miss',
    'First Aid Injury',
    'Recordable Injury',
    'Property Damage',
    'Vehicle Incident',
    'Environmental Spill',
    'Utility Strike',
    'Third Party Incident',
  ];

  const renderIncidents = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Incident Reports</h2>
          <p style={{ color: colors.gray }}>Report and track safety incidents for your crew</p>
        </div>
      </div>

      {/* Report New Incident */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: colors.coral }}>
          <ShieldAlert size={20} style={{ display: 'inline', marginRight: '8px' }} />
          Report New Incident
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Date *</label>
            <input
              type="date"
              value={newIncident.date}
              onChange={(e) => setNewIncident({ ...newIncident, date: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Time *</label>
            <input
              type="time"
              value={newIncident.time}
              onChange={(e) => setNewIncident({ ...newIncident, time: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Incident Type *</label>
            <select
              value={newIncident.type}
              onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            >
              <option value="">Select type...</option>
              {incidentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Project *</label>
            <select
              value={newIncident.project}
              onChange={(e) => setNewIncident({ ...newIncident, project: e.target.value })}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
            >
              <option value="">Select project...</option>
              {mockProjects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Location *</label>
          <input
            type="text"
            value={newIncident.location}
            onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
            placeholder="Specific location"
            style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Description *</label>
          <textarea
            value={newIncident.description}
            onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
            placeholder="Describe what happened..."
            rows={3}
            style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? colors.dark : '#fff', color: textColor, resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '10px' }}>Were there any injuries?</label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="contractor-injuries" value="no" checked={newIncident.injuries === 'no'} onChange={(e) => setNewIncident({ ...newIncident, injuries: e.target.value })} />
              No
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="contractor-injuries" value="yes" checked={newIncident.injuries === 'yes'} onChange={(e) => setNewIncident({ ...newIncident, injuries: e.target.value })} />
              Yes
            </label>
          </div>
        </div>

        <button
          onClick={() => {
            if (newIncident.type && newIncident.project && newIncident.description) {
              const incident = {
                id: incidents.length + 1,
                date: newIncident.date,
                type: newIncident.type,
                description: newIncident.description,
                project: newIncident.project,
                status: 'open'
              };
              setIncidents([incident, ...incidents]);
              setNewIncident({
                date: new Date().toISOString().split('T')[0],
                time: '',
                type: '',
                project: '',
                location: '',
                description: '',
                injuries: 'no',
                injuryDescription: '',
                immediateActions: '',
              });
              alert('Incident report submitted! Supervisor will be notified.');
            } else {
              alert('Please fill in Type, Project, and Description fields.');
            }
          }}
          style={{ width: '100%', padding: '14px', backgroundColor: colors.coral, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
        >
          Submit Incident Report
        </button>
      </div>

      {/* Previous Incidents */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Previous Reports</h3>
        {incidents.map(incident => (
          <div key={incident.id} style={{ padding: '16px', backgroundColor: darkMode ? colors.dark : '#f8fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{incident.type}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    backgroundColor: incident.status === 'closed' ? `${colors.green}20` : `${colors.orange}20`,
                    color: incident.status === 'closed' ? colors.green : colors.orange,
                  }}>
                    {incident.status}
                  </span>
                </div>
                <p style={{ color: colors.gray, fontSize: '0.9rem' }}>{incident.description}</p>
                <p style={{ color: colors.gray, fontSize: '0.85rem' }}>{incident.project} • {incident.date}</p>
              </div>
              <button style={{ padding: '6px 12px', backgroundColor: 'transparent', border: `1px solid ${colors.teal}`, borderRadius: '6px', color: colors.teal, cursor: 'pointer', fontSize: '0.85rem' }}>
                View
              </button>
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
      case 'production': return renderProduction();
      case 'otdr': return renderOtdr();
      case 'tickets': return renderTickets();
      case 'equipment': return renderEquipment();
      case 'compliance': return renderCompliance();
      case 'incidents': return renderIncidents();
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
