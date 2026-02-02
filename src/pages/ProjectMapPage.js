/**
 * LYT Communications - Project Map Page
 * Version: 1.0.0
 * Created: 2026-02-02
 * Route: #project-map
 * 
 * Interactive map-based project management view.
 * Displays construction segments with color-coded status,
 * handhole markers, crew positions, and segment details.
 * 
 * Phase 1: Static demo with segment list view
 * Phase 3: Full Google Maps integration with polylines
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Map, List, Search, AlertCircle, MapPin, Ruler, Users, Zap } from 'lucide-react';
import { STATUS_COLORS } from '../config/mapConfig';

// Demo project data (Phase 2 will load from Google Sheets)
const DEMO_SEGMENTS = [
  { segment_id: 'VXS-SLPH01-006-A-A01', contractor_id: 'A→A01', section: 'A', from_handhole: 'A (17x30x18)', to_handhole: 'A01 (15x20x12)', footage: 148, street: 'W Parish Rd', boring_status: 'QC Approved', pulling_status: 'Complete', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #2' },
  { segment_id: 'VXS-SLPH01-006-A-A02', contractor_id: 'A01→A02', section: 'A', from_handhole: 'A01 (15x20x12)', to_handhole: 'A02 (15x20x12)', footage: 132, street: 'W Parish Rd', boring_status: 'QC Approved', pulling_status: 'In Progress', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #2' },
  { segment_id: 'VXS-SLPH01-006-A-A03', contractor_id: 'A02→A03', section: 'A', from_handhole: 'A02 (15x20x12)', to_handhole: 'A03 (15x20x12)', footage: 156, street: 'Beglis Pkwy', boring_status: 'Complete', pulling_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-A-A04', contractor_id: 'A03→A04', section: 'A', from_handhole: 'A03 (15x20x12)', to_handhole: 'A04 (15x20x12)', footage: 198, street: 'Beglis Pkwy', boring_status: 'In Progress', pulling_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-A-A05', contractor_id: 'A04→A05', section: 'A', from_handhole: 'A04 (15x20x12)', to_handhole: 'A05 (15x20x12)', footage: 175, street: 'Elm St', boring_status: 'Not Started', pulling_status: 'Not Started', boring_assigned_to: '', pulling_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-B-B01', contractor_id: 'B→B01', section: 'B', from_handhole: 'B (17x30x18)', to_handhole: 'B01 (15x20x12)', footage: 210, street: 'S Cities Service Hwy', boring_status: 'QC Approved', pulling_status: 'QC Approved', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #1' },
  { segment_id: 'VXS-SLPH01-006-B-B02', contractor_id: 'B01→B02', section: 'B', from_handhole: 'B01 (15x20x12)', to_handhole: 'B02 (15x20x12)', footage: 185, street: 'S Cities Service Hwy', boring_status: 'QC Approved', pulling_status: 'In Progress', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #1' },
  { segment_id: 'VXS-SLPH01-006-B-B03', contractor_id: 'B02→B03', section: 'B', from_handhole: 'B02 (15x20x12)', to_handhole: 'B03 (15x20x12)', footage: 162, street: 'Oak Ave', boring_status: 'Issue', pulling_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-C-C01', contractor_id: 'C→C01', section: 'C', from_handhole: 'C (30x48x24)', to_handhole: 'C01 (15x20x12)', footage: 220, street: 'N Main St', boring_status: 'Not Started', pulling_status: 'Not Started', boring_assigned_to: '', pulling_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-C-C02', contractor_id: 'C01→C02', section: 'C', from_handhole: 'C01 (15x20x12)', to_handhole: 'C02 (15x20x12)', footage: 195, street: 'N Main St', boring_status: 'Not Started', pulling_status: 'Not Started', boring_assigned_to: '', pulling_assigned_to: '' },
];

const DEMO_PROJECT = {
  project_id: 'VXS-SLPH01-006',
  customer: 'Vexus Fiber',
  project_name: 'Sulphur LA City Build',
  po_number: '3160880',
  total_value: 421712.30,
};

function ProjectMapPage({ darkMode, setDarkMode, user, setCurrentPage }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [filterSection, setFilterSection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPhase, setFilterPhase] = useState('boring');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [showFilters, setShowFilters] = useState(false);

  const bg = darkMode ? '#0d1b2a' : '#ffffff';
  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  // Filter segments
  const filteredSegments = useMemo(() => {
    return DEMO_SEGMENTS.filter(seg => {
      if (filterSection !== 'all' && seg.section !== filterSection) return false;
      if (filterStatus !== 'all') {
        const status = filterPhase === 'boring' ? seg.boring_status : seg.pulling_status;
        if (status !== filterStatus) return false;
      }
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          seg.contractor_id.toLowerCase().includes(search) ||
          seg.street.toLowerCase().includes(search) ||
          seg.segment_id.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [filterSection, filterStatus, filterPhase, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalFootage = DEMO_SEGMENTS.reduce((sum, s) => sum + s.footage, 0);
    const boringDone = DEMO_SEGMENTS.filter(s => s.boring_status === 'QC Approved').length;
    const pullingDone = DEMO_SEGMENTS.filter(s => s.pulling_status === 'QC Approved').length;
    const issues = DEMO_SEGMENTS.filter(s => s.boring_status === 'Issue' || s.pulling_status === 'Issue').length;
    return { totalFootage, boringDone, pullingDone, issues, total: DEMO_SEGMENTS.length };
  }, []);

  const sections = [...new Set(DEMO_SEGMENTS.map(s => s.section))].sort();

  const getStatusColor = (status) => {
    const map = {
      'Not Started': STATUS_COLORS.NOT_STARTED,
      'In Progress': STATUS_COLORS.IN_PROGRESS,
      'Complete': STATUS_COLORS.COMPLETE,
      'QC Approved': STATUS_COLORS.QC_APPROVED,
      'Issue': STATUS_COLORS.ISSUE,
      'Blocked': STATUS_COLORS.BLOCKED,
    };
    return map[status] || '#999';
  };

  const StatusBadge = ({ status }) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: `${getStatusColor(status)}22`,
      color: getStatusColor(status),
      border: `1px solid ${getStatusColor(status)}44`,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getStatusColor(status) }} />
      {status}
    </span>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, color: text }}>
      {/* Header */}
      <div style={{
        backgroundColor: darkMode ? '#112240' : '#f1f5f9',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${borderColor}`,
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setCurrentPage && setCurrentPage('admin-dashboard')} style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={20} /> Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem' }}>
              {DEMO_PROJECT.project_name}
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: textMuted }}>
              {DEMO_PROJECT.project_id} • PO #{DEMO_PROJECT.po_number}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              backgroundColor: viewMode === 'list' ? accent : 'transparent',
              color: viewMode === 'list' ? '#fff' : textMuted,
              border: `1px solid ${viewMode === 'list' ? accent : borderColor}`,
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.85rem',
            }}
          >
            <List size={16} /> List
          </button>
          <button
            onClick={() => setViewMode('map')}
            style={{
              backgroundColor: viewMode === 'map' ? accent : 'transparent',
              color: viewMode === 'map' ? '#fff' : textMuted,
              border: `1px solid ${viewMode === 'map' ? accent : borderColor}`,
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.85rem',
            }}
          >
            <Map size={16} /> Map
          </button>
          <button onClick={() => setDarkMode && setDarkMode(!darkMode)} style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '1.2rem' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '16px 24px',
        overflowX: 'auto',
        borderBottom: `1px solid ${borderColor}`,
      }}>
        {[
          { icon: <Ruler size={16} />, label: 'Total Footage', value: `${stats.totalFootage.toLocaleString()} LF` },
          { icon: <Zap size={16} />, label: 'Boring Done', value: `${stats.boringDone}/${stats.total}`, color: '#4CAF50' },
          { icon: <Users size={16} />, label: 'Pulling Done', value: `${stats.pullingDone}/${stats.total}`, color: '#2196F3' },
          { icon: <AlertCircle size={16} />, label: 'Issues', value: stats.issues, color: stats.issues > 0 ? '#FF9800' : '#4CAF50' },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: cardBg,
            borderRadius: '8px',
            padding: '12px 16px',
            minWidth: '140px',
            border: `1px solid ${borderColor}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: textMuted, fontSize: '0.75rem', marginBottom: '4px' }}>
              {s.icon} {s.label}
            </div>
            <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: s.color || text }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: '12px 24px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search segments, streets..."
              style={{
                width: '100%',
                padding: '8px 8px 8px 34px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                backgroundColor: darkMode ? '#0d1b2a' : '#fff',
                color: text,
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: darkMode ? '#0d1b2a' : '#fff', color: text, fontSize: '0.85rem' }}>
            <option value="all">All Sections</option>
            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <select value={filterPhase} onChange={(e) => setFilterPhase(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: darkMode ? '#0d1b2a' : '#fff', color: text, fontSize: '0.85rem' }}>
            <option value="boring">Boring Phase</option>
            <option value="pulling">Pulling Phase</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: darkMode ? '#0d1b2a' : '#fff', color: text, fontSize: '0.85rem' }}>
            <option value="all">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Complete">Complete</option>
            <option value="QC Approved">QC Approved</option>
            <option value="Issue">Issue</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {viewMode === 'map' ? (
          /* Map View - Placeholder for Phase 3 Google Maps integration */
          <div style={{
            backgroundColor: cardBg,
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            height: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <Map size={64} color={textMuted} />
            <h3 style={{ margin: 0, color: textMuted }}>Interactive Map Coming in Phase 3</h3>
            <p style={{ margin: 0, color: textMuted, fontSize: '0.85rem' }}>
              Google Maps integration with segment polylines, handhole markers, and crew GPS tracking.
            </p>
            <button
              onClick={() => setViewMode('list')}
              style={{
                backgroundColor: accent,
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Switch to List View
            </button>
          </div>
        ) : (
          /* List View */
          <div>
            <p style={{ color: textMuted, fontSize: '0.85rem', marginBottom: '16px' }}>
              Showing {filteredSegments.length} of {DEMO_SEGMENTS.length} segments
            </p>
            {filteredSegments.map(seg => (
              <div
                key={seg.segment_id}
                onClick={() => setSelectedSegment(selectedSegment === seg.segment_id ? null : seg.segment_id)}
                style={{
                  backgroundColor: selectedSegment === seg.segment_id ? (darkMode ? '#1a2f4a' : '#f0f9ff') : cardBg,
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '10px',
                  border: `1px solid ${selectedSegment === seg.segment_id ? accent : borderColor}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{
                        backgroundColor: `${getStatusColor(filterPhase === 'boring' ? seg.boring_status : seg.pulling_status)}22`,
                        color: getStatusColor(filterPhase === 'boring' ? seg.boring_status : seg.pulling_status),
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        display: 'inline-block',
                        boxShadow: `0 0 6px ${getStatusColor(filterPhase === 'boring' ? seg.boring_status : seg.pulling_status)}`,
                      }} />
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{seg.contractor_id}</span>
                      <span style={{ color: textMuted, fontSize: '0.8rem' }}>Section {seg.section}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {seg.street}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Ruler size={14} /> {seg.footage} LF
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <StatusBadge status={seg.boring_status} />
                    <StatusBadge status={seg.pulling_status} />
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedSegment === seg.segment_id && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${borderColor}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div>
                        <p style={{ color: textMuted, fontSize: '0.75rem', margin: '0 0 2px' }}>From</p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{seg.from_handhole}</p>
                      </div>
                      <div>
                        <p style={{ color: textMuted, fontSize: '0.75rem', margin: '0 0 2px' }}>To</p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{seg.to_handhole}</p>
                      </div>
                      <div>
                        <p style={{ color: textMuted, fontSize: '0.75rem', margin: '0 0 2px' }}>Boring Crew</p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{seg.boring_assigned_to || '—'}</p>
                      </div>
                      <div>
                        <p style={{ color: textMuted, fontSize: '0.75rem', margin: '0 0 2px' }}>Pulling Crew</p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{seg.pulling_assigned_to || '—'}</p>
                      </div>
                      <div>
                        <p style={{ color: textMuted, fontSize: '0.75rem', margin: '0 0 2px' }}>Internal ID</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', color: textMuted }}>{seg.segment_id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version */}
      <div style={{ position: 'fixed', bottom: '4px', right: '8px', fontSize: '0.6rem', color: 'transparent', userSelect: 'none' }}
        onDoubleClick={(e) => { e.target.style.color = textMuted; }}
      >
        ProjectMapPage v1.0.0
      </div>
    </div>
  );
}

export default ProjectMapPage;
