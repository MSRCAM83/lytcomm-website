// RecruitingTracker.js v1.0 - Donnie's Pipeline Management
// Tracks contractor/employee leads, commitments, onboarding status, capacity
import React, { useState, useEffect } from 'react';
import { 
  Users, Truck, Phone, Mail, Calendar, Clock, AlertTriangle, 
  CheckCircle, XCircle, Plus, Search, Filter, ChevronDown, 
  ChevronRight, Edit2, Trash2, Send, UserPlus, Building,
  AlertOctagon, Star, Bell, MapPin, DollarSign
} from 'lucide-react';

function RecruitingTracker({ darkMode, user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [approvedDrills] = useState(25); // Company's approved drill count

  // Theme colors
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const accentSecondary = darkMode ? '#ff6b35' : '#00b4d8';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  // Mock data - will be replaced with actual API calls
  useEffect(() => {
    setLeads([
      {
        id: 1,
        type: 'contractor',
        companyName: 'Gulf Coast Boring LLC',
        contactName: 'Mike Torres',
        phone: '337-555-1234',
        email: 'mike@gulfcoastboring.com',
        drillCount: 3,
        crewSize: 8,
        status: 'approved',
        onboardingStatus: 'complete',
        skills: ['boring', 'underground'],
        serviceArea: 'Lake Charles, LA',
        committedDate: '2026-01-25',
        assignedProject: 'SLPH.01.006',
        showedUp: null,
        noShowCount: 0,
        notes: [
          { date: '2026-01-20', text: 'Initial contact, has 3 drills available' },
          { date: '2026-01-21', text: 'Sent onboarding docs' },
          { date: '2026-01-22', text: 'Completed onboarding, ready to work' }
        ],
        followUpDate: '2026-01-24',
        addedDate: '2026-01-20',
        reliability: 100
      },
      {
        id: 2,
        type: 'contractor',
        companyName: 'ABC Underground',
        contactName: 'Robert Johnson',
        phone: '281-555-9999',
        email: 'robert@abcunderground.com',
        drillCount: 2,
        crewSize: 5,
        status: 'docs_sent',
        onboardingStatus: 'step_3',
        skills: ['boring', 'underground', 'splicing'],
        serviceArea: 'Houston, TX',
        committedDate: null,
        assignedProject: null,
        showedUp: null,
        noShowCount: 0,
        notes: [
          { date: '2026-01-19', text: 'Met at job site, interested in subbing' },
          { date: '2026-01-21', text: 'Called, sending docs today' }
        ],
        followUpDate: '2026-01-23',
        addedDate: '2026-01-19',
        reliability: null
      },
      {
        id: 3,
        type: 'contractor',
        companyName: 'XYZ Drilling',
        contactName: 'James Wilson',
        phone: '832-555-5678',
        email: 'james@xyzdrilling.com',
        drillCount: 5,
        crewSize: 12,
        status: 'approved',
        onboardingStatus: 'complete',
        committedDate: '2026-01-23',
        assignedProject: 'SLPH.01.007',
        showedUp: true,
        noShowCount: 0,
        notes: [
          { date: '2026-01-15', text: 'Solid contractor, worked with them before' }
        ],
        followUpDate: null,
        addedDate: '2026-01-10',
        reliability: 100
      },
      {
        id: 4,
        type: 'contractor',
        companyName: 'Flaky Boring Inc',
        contactName: 'Tony Garcia',
        phone: '337-555-0000',
        email: 'tony@flakyboring.com',
        drillCount: 2,
        crewSize: 4,
        status: 'blacklisted',
        onboardingStatus: 'complete',
        committedDate: '2026-01-20',
        assignedProject: 'SLPH.01.006',
        showedUp: false,
        noShowCount: 1,
        notes: [
          { date: '2026-01-20', text: 'NO SHOW - Did not show up for committed start date. BLACKLISTED.' }
        ],
        followUpDate: null,
        addedDate: '2026-01-10',
        reliability: 0
      },
      {
        id: 5,
        type: 'employee',
        contactName: 'David Martinez',
        phone: '832-555-4321',
        email: 'david.m@gmail.com',
        position: 'Drill Operator',
        experience: '5 years',
        certifications: ['CDL', 'OSHA 30'],
        status: 'interview',
        payExpectation: '$28/hr',
        notes: [
          { date: '2026-01-22', text: 'Phone screen went well, scheduling interview' }
        ],
        followUpDate: '2026-01-24',
        addedDate: '2026-01-22'
      },
      {
        id: 6,
        type: 'employee',
        contactName: 'Sarah Chen',
        phone: '281-555-8765',
        email: 'sarah.chen@email.com',
        position: 'Splicer',
        experience: '3 years',
        certifications: ['FOA CFOT'],
        status: 'offer',
        payExpectation: '$32/hr',
        notes: [
          { date: '2026-01-21', text: 'Excellent interview, making offer' }
        ],
        followUpDate: '2026-01-23',
        addedDate: '2026-01-18'
      }
    ]);
  }, []);

  // Calculate capacity stats
  const getCapacityStats = () => {
    const activeContractors = leads.filter(l => 
      l.type === 'contractor' && 
      l.status === 'approved' && 
      l.onboardingStatus === 'complete' &&
      l.committedDate
    );
    const activeDrills = activeContractors.reduce((sum, c) => sum + (c.drillCount || 0), 0);
    const pipelineDrills = leads
      .filter(l => l.type === 'contractor' && l.status !== 'blacklisted' && l.status !== 'approved')
      .reduce((sum, c) => sum + (c.drillCount || 0), 0);
    
    return {
      approved: approvedDrills,
      active: activeDrills,
      needed: approvedDrills - activeDrills,
      pipeline: pipelineDrills
    };
  };

  // Get follow-ups due
  const getFollowUpsDue = () => {
    const today = new Date().toISOString().split('T')[0];
    return leads.filter(l => {
      if (!l.followUpDate || l.status === 'blacklisted') return false;
      return l.followUpDate <= today;
    });
  };

  // Get contractors by status
  const getContractorsByStatus = (status) => {
    return leads.filter(l => l.type === 'contractor' && l.status === status);
  };

  // Status configurations
  const contractorStatuses = [
    { id: 'new', label: 'New Lead', color: '#6b7280' },
    { id: 'contacted', label: 'Contacted', color: '#3b82f6' },
    { id: 'meeting', label: 'Meeting', color: '#8b5cf6' },
    { id: 'docs_sent', label: 'Docs Sent', color: '#f59e0b' },
    { id: 'under_review', label: 'Under Review', color: '#f97316' },
    { id: 'approved', label: 'Approved', color: '#10b981' },
    { id: 'blacklisted', label: 'Blacklisted', color: '#ef4444' }
  ];

  const employeeStatuses = [
    { id: 'new', label: 'New Lead', color: '#6b7280' },
    { id: 'phone_screen', label: 'Phone Screen', color: '#3b82f6' },
    { id: 'interview', label: 'Interview', color: '#8b5cf6' },
    { id: 'offer', label: 'Offer', color: '#f59e0b' },
    { id: 'accepted', label: 'Accepted', color: '#10b981' },
    { id: 'hired', label: 'Hired', color: '#059669' }
  ];

  const getStatusConfig = (lead) => {
    const statuses = lead.type === 'contractor' ? contractorStatuses : employeeStatuses;
    return statuses.find(s => s.id === lead.status) || statuses[0];
  };

  const getOnboardingLabel = (status) => {
    if (status === 'complete') return '✅ Complete';
    if (status === 'not_started') return '❌ Not Started';
    if (status?.startsWith('step_')) {
      const step = status.replace('step_', '');
      return `🟡 Step ${step} of 8`;
    }
    return status;
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    if (filterType !== 'all' && lead.type !== filterType) return false;
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const searchFields = [
        lead.companyName,
        lead.contactName,
        lead.phone,
        lead.email,
        ...(lead.notes?.map(n => n.text) || [])
      ].filter(Boolean);
      return searchFields.some(f => f.toLowerCase().includes(search));
    }
    return true;
  });

  const capacity = getCapacityStats();
  const followUpsDue = getFollowUpsDue();

  // Render capacity dashboard
  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      {/* Capacity Bar */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px',
        border: `1px solid ${borderColor}`
      }}>
        <h3 style={{ color: textColor, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Truck size={20} color={accentPrimary} />
          Drill Capacity
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          marginBottom: '12px'
        }}>
          <div style={{ 
            flex: 1, 
            height: '32px', 
            backgroundColor: darkMode ? '#374151' : '#e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${(capacity.active / capacity.approved) * 100}%`,
              height: '100%',
              backgroundColor: capacity.active >= capacity.approved ? '#10b981' : 
                              capacity.active >= capacity.approved * 0.8 ? '#f59e0b' : '#ef4444',
              borderRadius: '8px',
              transition: 'width 0.3s ease'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontWeight: '600',
              color: textColor
            }}>
              {capacity.active} / {capacity.approved}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: mutedColor, fontSize: '0.85rem' }}>Active Today</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{capacity.active}</div>
          </div>
          <div>
            <span style={{ color: mutedColor, fontSize: '0.85rem' }}>Need to Fill</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: capacity.needed > 0 ? '#ef4444' : '#10b981' }}>
              {capacity.needed}
            </div>
          </div>
          <div>
            <span style={{ color: mutedColor, fontSize: '0.85rem' }}>In Pipeline</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>{capacity.pipeline}</div>
          </div>
        </div>
      </div>

      {/* Follow-ups Due */}
      {followUpsDue.length > 0 && (
        <div style={{ 
          backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <h3 style={{ color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} />
            Follow-ups Due ({followUpsDue.length})
          </h3>
          {followUpsDue.map(lead => (
            <div 
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              style={{ 
                backgroundColor: cardBg, 
                padding: '12px 16px', 
                borderRadius: '8px', 
                marginBottom: '8px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: '600', color: textColor }}>
                  {lead.companyName || lead.contactName}
                </div>
                <div style={{ fontSize: '0.85rem', color: mutedColor }}>
                  {lead.phone} • {lead.followUpDate}
                </div>
              </div>
              <Phone size={18} color={accentPrimary} />
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${borderColor}` }}>
          <div style={{ color: mutedColor, fontSize: '0.85rem', marginBottom: '4px' }}>Contractors</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: '700', color: textColor }}>
              {leads.filter(l => l.type === 'contractor' && l.status !== 'blacklisted').length}
            </span>
            <span style={{ color: '#10b981', fontSize: '0.9rem' }}>
              {getContractorsByStatus('approved').length} approved
            </span>
          </div>
        </div>
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${borderColor}` }}>
          <div style={{ color: mutedColor, fontSize: '0.85rem', marginBottom: '4px' }}>Employees</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: '700', color: textColor }}>
              {leads.filter(l => l.type === 'employee').length}
            </span>
            <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
              {leads.filter(l => l.type === 'employee' && l.status === 'offer').length} offers out
            </span>
          </div>
        </div>
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${borderColor}` }}>
          <div style={{ color: mutedColor, fontSize: '0.85rem', marginBottom: '4px' }}>Blacklisted</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
            {leads.filter(l => l.status === 'blacklisted').length}
          </div>
        </div>
      </div>
    </div>
  );

  // Render lead list
  const renderLeadList = () => (
    <div style={{ padding: '24px' }}>
      {/* Search and Filter Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: mutedColor }} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              backgroundColor: cardBg,
              color: textColor,
              fontSize: '0.95rem'
            }}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            backgroundColor: cardBg,
            color: textColor,
            cursor: 'pointer'
          }}
        >
          <option value="all">All Types</option>
          <option value="contractor">Contractors</option>
          <option value="employee">Employees</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            backgroundColor: cardBg,
            color: textColor,
            cursor: 'pointer'
          }}
        >
          <option value="all">All Statuses</option>
          {contractorStatuses.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 20px',
            backgroundColor: accentPrimary,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600'
          }}
        >
          <Plus size={18} /> Add Lead
        </button>
      </div>

      {/* Leads Table */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: darkMode ? '#112240' : '#f8fafc' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Name</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Phone</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Type</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Drills</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Follow Up</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map(lead => {
              const statusConfig = getStatusConfig(lead);
              const isOverdue = lead.followUpDate && lead.followUpDate <= new Date().toISOString().split('T')[0];
              
              return (
                <tr 
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  style={{ 
                    borderBottom: `1px solid ${borderColor}`,
                    cursor: 'pointer',
                    backgroundColor: lead.status === 'blacklisted' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: textColor }}>
                      {lead.companyName || lead.contactName}
                    </div>
                    {lead.companyName && (
                      <div style={{ fontSize: '0.85rem', color: mutedColor }}>{lead.contactName}</div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: textColor }}>{lead.phone}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      backgroundColor: lead.type === 'contractor' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                      color: lead.type === 'contractor' ? '#3b82f6' : '#8b5cf6'
                    }}>
                      {lead.type === 'contractor' ? 'Contractor' : 'Employee'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      backgroundColor: `${statusConfig.color}20`,
                      color: statusConfig.color
                    }}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: textColor }}>
                    {lead.type === 'contractor' ? (lead.drillCount || '-') : '-'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {lead.followUpDate ? (
                      <span style={{ 
                        color: isOverdue ? '#ef4444' : textColor,
                        fontWeight: isOverdue ? '600' : '400'
                      }}>
                        {isOverdue && '⚠️ '}{lead.followUpDate}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`tel:${lead.phone}`); }}
                        style={{ 
                          padding: '6px', 
                          backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer' 
                        }}
                      >
                        <Phone size={16} color="#10b981" />
                      </button>
                      {lead.status === 'approved' && lead.onboardingStatus !== 'complete' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); /* Send onboarding invite */ }}
                          style={{ 
                            padding: '6px', 
                            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: 'pointer' 
                          }}
                        >
                          <Send size={16} color="#3b82f6" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredLeads.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: mutedColor }}>
            No leads found
          </div>
        )}
      </div>
    </div>
  );

  // Render commitments view
  const renderCommitments = () => {
    const committed = leads.filter(l => 
      l.type === 'contractor' && 
      l.committedDate && 
      l.status !== 'blacklisted'
    ).sort((a, b) => new Date(a.committedDate) - new Date(b.committedDate));

    return (
      <div style={{ padding: '24px' }}>
        <h2 style={{ color: textColor, marginBottom: '24px' }}>Contractor Commitments</h2>
        
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? '#112240' : '#f8fafc' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Contractor</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Drills</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Crew Size</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Start Date</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Project</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Onboarding</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Showed Up</th>
              </tr>
            </thead>
            <tbody>
              {committed.map(lead => (
                <tr key={lead.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: textColor }}>{lead.companyName}</div>
                    <div style={{ fontSize: '0.85rem', color: mutedColor }}>{lead.contactName}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: textColor, fontWeight: '600' }}>{lead.drillCount}</td>
                  <td style={{ padding: '14px 16px', color: textColor }}>{lead.crewSize}</td>
                  <td style={{ padding: '14px 16px', color: textColor }}>{lead.committedDate}</td>
                  <td style={{ padding: '14px 16px', color: accentPrimary }}>{lead.assignedProject || '-'}</td>
                  <td style={{ padding: '14px 16px' }}>{getOnboardingLabel(lead.onboardingStatus)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {lead.showedUp === null ? (
                      <span style={{ color: mutedColor }}>⏳ Pending</span>
                    ) : lead.showedUp ? (
                      <span style={{ color: '#10b981' }}>✅ Yes</span>
                    ) : (
                      <span style={{ color: '#ef4444' }}>❌ No-Show</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render blacklist
  const renderBlacklist = () => {
    const blacklisted = leads.filter(l => l.status === 'blacklisted');

    return (
      <div style={{ padding: '24px' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertOctagon size={24} /> Blacklisted ({blacklisted.length})
        </h2>
        
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', overflow: 'hidden' }}>
          {blacklisted.map(lead => (
            <div key={lead.id} style={{ padding: '16px', borderBottom: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: '600', color: textColor }}>{lead.companyName || lead.contactName}</div>
                  <div style={{ fontSize: '0.9rem', color: mutedColor }}>{lead.phone}</div>
                </div>
                <span style={{ 
                  padding: '4px 10px', 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  color: '#ef4444',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  {lead.noShowCount} No-Show(s)
                </span>
              </div>
              {lead.notes && lead.notes.length > 0 && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: darkMode ? '#112240' : '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#ef4444' }}>
                    {lead.notes[lead.notes.length - 1].text}
                  </div>
                </div>
              )}
            </div>
          ))}
          {blacklisted.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: mutedColor }}>
              No blacklisted contractors
            </div>
          )}
        </div>
      </div>
    );
  };

  // Tab navigation
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Truck size={18} /> },
    { id: 'leads', label: 'All Leads', icon: <Users size={18} /> },
    { id: 'commitments', label: 'Commitments', icon: <Calendar size={18} /> },
    { id: 'blacklist', label: 'Blacklist', icon: <AlertOctagon size={18} /> }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor }}>
      {/* Tab Navigation */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        gap: '4px',
        padding: '0 24px',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${accentPrimary}` : '3px solid transparent',
              color: activeTab === tab.id ? accentPrimary : mutedColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon} {tab.label}
            {tab.id === 'blacklist' && leads.filter(l => l.status === 'blacklisted').length > 0 && (
              <span style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {leads.filter(l => l.status === 'blacklisted').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'leads' && renderLeadList()}
      {activeTab === 'commitments' && renderCommitments()}
      {activeTab === 'blacklist' && renderBlacklist()}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedLead(null)}
        >
          <div 
            style={{
              backgroundColor: cardBg,
              borderRadius: '16px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px', borderBottom: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h2 style={{ color: textColor, marginBottom: '4px' }}>
                    {selectedLead.companyName || selectedLead.contactName}
                  </h2>
                  {selectedLead.companyName && (
                    <p style={{ color: mutedColor }}>{selectedLead.contactName}</p>
                  )}
                </div>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  backgroundColor: `${getStatusConfig(selectedLead).color}20`,
                  color: getStatusConfig(selectedLead).color
                }}>
                  {getStatusConfig(selectedLead).label}
                </span>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Contact Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ color: mutedColor, fontSize: '0.85rem', marginBottom: '4px' }}>Phone</div>
                  <a href={`tel:${selectedLead.phone}`} style={{ color: accentPrimary, fontWeight: '500' }}>
                    {selectedLead.phone}
                  </a>
                </div>
                <div>
                  <div style={{ color: mutedColor, fontSize: '0.85rem', marginBottom: '4px' }}>Email</div>
                  <a href={`mailto:${selectedLead.email}`} style={{ color: accentPrimary, fontWeight: '500' }}>
                    {selectedLead.email}
                  </a>
                </div>
                {selectedLead.type === 'contractor' && (
                  <>
                    <div>
                      <div style={{ color: mutedColor, fontSize: '0.85rem', marginBottom: '4px' }}>Drills</div>
                      <div style={{ color: textColor, fontWeight: '600', fontSize: '1.25rem' }}>
                        {selectedLead.drillCount}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: mutedColor, fontSize: '0.85rem', marginBottom: '4px' }}>Crew Size</div>
                      <div style={{ color: textColor, fontWeight: '600', fontSize: '1.25rem' }}>
                        {selectedLead.crewSize}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: mutedColor, fontSize: '0.85rem', marginBottom: '4px' }}>Onboarding</div>
                      <div style={{ color: textColor }}>{getOnboardingLabel(selectedLead.onboardingStatus)}</div>
                    </div>
                    <div>
                      <div style={{ color: mutedColor, fontSize: '0.85rem', marginBottom: '4px' }}>Reliability</div>
                      <div style={{ 
                        color: selectedLead.reliability === 100 ? '#10b981' : 
                               selectedLead.reliability > 50 ? '#f59e0b' : '#ef4444',
                        fontWeight: '600'
                      }}>
                        {selectedLead.reliability !== null ? `${selectedLead.reliability}%` : 'N/A'}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Notes */}
              <div>
                <h4 style={{ color: textColor, marginBottom: '12px' }}>Notes</h4>
                <div style={{ 
                  backgroundColor: darkMode ? '#112240' : '#f8fafc', 
                  borderRadius: '8px', 
                  padding: '16px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {selectedLead.notes?.map((note, i) => (
                    <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: i < selectedLead.notes.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                      <div style={{ fontSize: '0.8rem', color: mutedColor, marginBottom: '4px' }}>{note.date}</div>
                      <div style={{ color: textColor }}>{note.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => window.open(`tel:${selectedLead.phone}`)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Phone size={18} /> Call
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'transparent',
                    color: textColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal 
          darkMode={darkMode}
          onClose={() => setShowAddModal(false)}
          onSave={(newLead) => {
            setLeads([...leads, { ...newLead, id: Date.now() }]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

// Add Lead Modal Component
function AddLeadModal({ darkMode, onClose, onSave }) {
  const [leadType, setLeadType] = useState('contractor');
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    drillCount: '',
    crewSize: '',
    position: '',
    notes: ''
  });

  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      type: leadType,
      ...formData,
      drillCount: formData.drillCount ? parseInt(formData.drillCount) : 0,
      crewSize: formData.crewSize ? parseInt(formData.crewSize) : 0,
      status: 'new',
      onboardingStatus: 'not_started',
      notes: formData.notes ? [{ date: new Date().toISOString().split('T')[0], text: formData.notes }] : [],
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      addedDate: new Date().toISOString().split('T')[0]
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: '0.95rem'
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '24px', borderBottom: `1px solid ${borderColor}` }}>
          <h2 style={{ color: textColor }}>Add New Lead</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Type Selection */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setLeadType('contractor')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: leadType === 'contractor' ? accentPrimary : 'transparent',
                color: leadType === 'contractor' ? '#fff' : textColor,
                border: `2px solid ${leadType === 'contractor' ? accentPrimary : borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Contractor
            </button>
            <button
              type="button"
              onClick={() => setLeadType('employee')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: leadType === 'employee' ? accentPrimary : 'transparent',
                color: leadType === 'employee' ? '#fff' : textColor,
                border: `2px solid ${leadType === 'employee' ? accentPrimary : borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Employee
            </button>
          </div>

          {leadType === 'contractor' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Contact Name
            </label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {leadType === 'contractor' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
                  # of Drills
                </label>
                <input
                  type="number"
                  value={formData.drillCount}
                  onChange={(e) => setFormData({ ...formData, drillCount: e.target.value })}
                  style={inputStyle}
                  min="0"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
                  Crew Size
                </label>
                <input
                  type="number"
                  value={formData.crewSize}
                  onChange={(e) => setFormData({ ...formData, crewSize: e.target.value })}
                  style={inputStyle}
                  min="0"
                />
              </div>
            </div>
          )}

          {leadType === 'employee' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select position...</option>
                <option value="Drill Operator">Drill Operator</option>
                <option value="Laborer">Laborer</option>
                <option value="Splicer">Splicer</option>
                <option value="Locator">Locator</option>
                <option value="Foreman">Foreman</option>
              </select>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: '500' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="Initial conversation notes..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: accentPrimary,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              Add Lead
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '14px 24px',
                backgroundColor: 'transparent',
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
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

export default RecruitingTracker;
