/**
 * LYT Communications - Daily Production Report
 * Version: 1.0.0
 * Created: 2026-02-03
 * Route: #daily-report
 *
 * Auto-generates daily production reports from Project Map segment data.
 * Shows work completed by contractor, section, and work type.
 * Includes billing totals from rate card matching.
 * Print-friendly layout for Metronet/Vexus submissions.
 */

import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { ArrowLeft, Printer, Download, Calendar, Filter, ChevronDown, Loader, FileText, DollarSign, Ruler, Users, MapPin, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { loadFullProject } from '../services/mapService';
import { calculateSegmentBilling, calculateSpliceBilling } from '../utils/rateCardMatcher';

function DailyProductionReport({ darkMode, user, setCurrentPage, projectId }) {
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState([]);
  const [splicePoints, setSplicePoints] = useState([]);
  const [project, setProject] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterContractor, setFilterContractor] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [showVersion, setShowVersion] = useState(false);

  const bg = darkMode ? '#0d1b2a' : '#ffffff';
  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const border = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const muted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  useEffect(() => {
    async function load() {
      if (!projectId) {
        setLoading(false);
        return;
      }
      try {
        const data = await loadFullProject(projectId);
        setSegments(data.segments || []);
        setSplicePoints(data.splicePoints || []);
        setProject(data.project || null);
      } catch (err) {
        console.error('Failed to load project data:', err);
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  // Get unique contractors and sections
  const contractors = useMemo(() => {
    const set = new Set();
    segments.forEach(s => {
      if (s.boring_assigned_to) set.add(s.boring_assigned_to);
      if (s.pulling_assigned_to) set.add(s.pulling_assigned_to);
    });
    return [...set].sort();
  }, [segments]);

  const sections = useMemo(() => [...new Set(segments.map(s => s.section))].sort(), [segments]);

  // Filter segments that had activity on the selected date
  const activeSegments = useMemo(() => {
    const dateStr = reportDate;
    return segments.filter(seg => {
      // Check if any work was started or completed on the report date
      const matchDate = (ts) => ts && ts.toString().slice(0, 10) === dateStr;
      const boringActive = matchDate(seg.boring_started) || matchDate(seg.boring_completed) || matchDate(seg.boring_qc_approved_date);
      const pullingActive = matchDate(seg.pulling_started) || matchDate(seg.pulling_completed) || matchDate(seg.pulling_qc_approved_date);
      // Also include segments currently "In Progress"
      const boringInProg = seg.boring_status === 'In Progress';
      const pullingInProg = seg.pulling_status === 'In Progress';

      const hasActivity = boringActive || pullingActive || boringInProg || pullingInProg;

      // Apply filters
      if (filterContractor !== 'all') {
        const match = (seg.boring_assigned_to || '').includes(filterContractor) || (seg.pulling_assigned_to || '').includes(filterContractor);
        if (!match) return false;
      }
      if (filterSection !== 'all' && seg.section !== filterSection) return false;

      return hasActivity;
    });
  }, [segments, reportDate, filterContractor, filterSection]);

  // Active splice points
  const activeSplices = useMemo(() => {
    const dateStr = reportDate;
    return splicePoints.filter(sp => {
      const matchDate = (ts) => ts && ts.toString().slice(0, 10) === dateStr;
      return matchDate(sp.started) || matchDate(sp.completed) || matchDate(sp.qc_approved_date) || sp.status === 'In Progress';
    });
  }, [splicePoints, reportDate]);

  // Summary stats
  const summary = useMemo(() => {
    let boringFootage = 0, pullingFootage = 0, boringSegments = 0, pullingSegments = 0;
    let boringValue = 0, pullingValue = 0, spliceValue = 0;

    activeSegments.forEach(seg => {
      const footage = parseFloat(seg.footage) || 0;
      if (seg.boring_status === 'Complete' || seg.boring_status === 'QC Approved' || seg.boring_status === 'In Progress') {
        boringFootage += parseFloat(seg.boring_actual_footage) || footage;
        boringSegments++;
        try {
          const billing = calculateSegmentBilling(seg, 'boring');
          boringValue += billing?.total || 0;
        } catch { /* skip */ }
      }
      if (seg.pulling_status === 'Complete' || seg.pulling_status === 'QC Approved' || seg.pulling_status === 'In Progress') {
        pullingFootage += footage;
        pullingSegments++;
        try {
          const billing = calculateSegmentBilling(seg, 'pulling');
          pullingValue += billing?.total || 0;
        } catch { /* skip */ }
      }
    });

    activeSplices.forEach(sp => {
      try {
        const billing = calculateSpliceBilling(sp);
        spliceValue += billing?.total || 0;
      } catch { /* skip */ }
    });

    return {
      boringFootage: Math.round(boringFootage),
      pullingFootage: Math.round(pullingFootage),
      boringSegments,
      pullingSegments,
      spliceCount: activeSplices.length,
      boringValue,
      pullingValue,
      spliceValue,
      totalValue: boringValue + pullingValue + spliceValue,
    };
  }, [activeSegments, activeSplices]);

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 300);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={32} color={accent} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text }}>
      {/* Header */}
      {!isPrintMode && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setCurrentPage('admin-projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Daily Production Report</h1>
              <div style={{ fontSize: 13, color: muted }}>{project?.project_name || 'Project'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: `${accent}15`, color: accent, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      {!isPrintMode && (
        <div style={{ display: 'flex', gap: 12, padding: '12px 20px', flexWrap: 'wrap', borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color={muted} />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${border}`, backgroundColor: cardBg, color: text, fontSize: 13 }}
            />
          </div>
          <select
            value={filterContractor}
            onChange={(e) => setFilterContractor(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${border}`, backgroundColor: cardBg, color: text, fontSize: 13 }}
          >
            <option value="all">All Contractors</option>
            {contractors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${border}`, backgroundColor: cardBg, color: text, fontSize: 13 }}
          >
            <option value="all">All Sections</option>
            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
      )}

      <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
        {/* Print Header */}
        {isPrintMode && (
          <div style={{ textAlign: 'center', marginBottom: 24, color: '#000' }}>
            <h1 style={{ margin: 0, fontSize: 20 }}>lyt Communications - Daily Production Report</h1>
            <p style={{ margin: '4px 0', fontSize: 14 }}>{project?.project_name || 'Project'} | PO: {project?.po_number || 'N/A'}</p>
            <p style={{ margin: '4px 0', fontSize: 14 }}>Date: {new Date(reportDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Boring', value: `${summary.boringFootage.toLocaleString()} LF`, sub: `${summary.boringSegments} segments`, icon: <Ruler size={18} />, color: '#FFB800' },
            { label: 'Pulling', value: `${summary.pullingFootage.toLocaleString()} LF`, sub: `${summary.pullingSegments} segments`, icon: <MapPin size={18} />, color: '#2196F3' },
            { label: 'Splicing', value: `${summary.spliceCount} points`, sub: `${activeSplices.filter(s => s.status === 'QC Approved').length} approved`, icon: <Users size={18} />, color: '#9C27B0' },
            { label: 'Daily Total', value: `$${summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: 'billable value', icon: <DollarSign size={18} />, color: '#4CAF50' },
          ].map((card, i) => (
            <div key={i} style={{ backgroundColor: isPrintMode ? '#f8f8f8' : cardBg, borderRadius: 10, padding: 16, border: `1px solid ${isPrintMode ? '#ddd' : border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ color: card.color }}>{card.icon}</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: isPrintMode ? '#666' : muted, textTransform: 'uppercase' }}>{card.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: isPrintMode ? '#000' : text }}>{card.value}</div>
              <div style={{ fontSize: 12, color: isPrintMode ? '#888' : muted, marginTop: 2 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Segment Detail Table */}
        {activeSegments.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: isPrintMode ? '#000' : text }}>Segment Activity</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: isPrintMode ? '#f0f0f0' : (darkMode ? '#1e3a5f' : '#f1f5f9') }}>
                    {['Segment', 'Section', 'Street', 'Footage', 'Boring', 'Pulling', 'Contractor'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: isPrintMode ? '#333' : text, borderBottom: `2px solid ${isPrintMode ? '#ccc' : border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeSegments.map(seg => (
                    <tr key={seg.segment_id} style={{ borderBottom: `1px solid ${isPrintMode ? '#eee' : border}` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: isPrintMode ? '#000' : accent }}>{seg.contractor_id}</td>
                      <td style={{ padding: '10px 12px', color: isPrintMode ? '#000' : text }}>{seg.section}</td>
                      <td style={{ padding: '10px 12px', color: isPrintMode ? '#666' : muted }}>{seg.street || '—'}</td>
                      <td style={{ padding: '10px 12px', color: isPrintMode ? '#000' : text }}>{seg.footage} LF</td>
                      <td style={{ padding: '10px 12px' }}>
                        <StatusBadge status={seg.boring_status} isPrint={isPrintMode} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <StatusBadge status={seg.pulling_status} isPrint={isPrintMode} />
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: isPrintMode ? '#666' : muted }}>{seg.boring_assigned_to || seg.pulling_assigned_to || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Splice Activity */}
        {activeSplices.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: isPrintMode ? '#000' : text }}>Splice Activity</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: isPrintMode ? '#f0f0f0' : (darkMode ? '#1e3a5f' : '#f1f5f9') }}>
                    {['Location', 'Type', 'Position', 'Status', 'Assigned'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: isPrintMode ? '#333' : text, borderBottom: `2px solid ${isPrintMode ? '#ccc' : border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeSplices.map(sp => (
                    <tr key={sp.splice_id} style={{ borderBottom: `1px solid ${isPrintMode ? '#eee' : border}` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: isPrintMode ? '#000' : accent }}>{sp.contractor_id || sp.location}</td>
                      <td style={{ padding: '10px 12px', color: isPrintMode ? '#000' : text }}>{sp.splice_type}</td>
                      <td style={{ padding: '10px 12px', color: isPrintMode ? '#666' : muted }}>{sp.position_type}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <StatusBadge status={sp.status} isPrint={isPrintMode} />
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: isPrintMode ? '#666' : muted }}>{sp.assigned_to || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Activity */}
        {activeSegments.length === 0 && activeSplices.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: muted }}>
            <FileText size={48} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No Activity Recorded</div>
            <div style={{ fontSize: 13 }}>No segments or splices had activity on {new Date(reportDate).toLocaleDateString()}</div>
          </div>
        )}

        {/* Print Footer */}
        {isPrintMode && (
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #ccc', fontSize: 11, color: '#888', textAlign: 'center' }}>
            Generated by LYT Communications Project Management System | {new Date().toLocaleString()}
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          * { color: black !important; }
        }
      `}</style>

      {/* Hidden version */}
      <div onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }} style={{ position: 'fixed', bottom: 4, right: 8, fontSize: 9, color: showVersion ? (darkMode ? '#fff' : '#333') : 'transparent', opacity: showVersion ? 0.5 : 1, userSelect: 'none', cursor: 'default' }}>DailyProductionReport v1.0.0</div>
    </div>
  );
}

// Status badge helper
function StatusBadge({ status, isPrint }) {
  const colors = {
    'QC Approved': { bg: '#4CAF5020', text: '#4CAF50', print: '✅' },
    'Complete': { bg: '#2196F320', text: '#2196F3', print: '✔' },
    'In Progress': { bg: '#FFB80020', text: '#FFB800', print: '🔄' },
    'Issue': { bg: '#FF980020', text: '#FF9800', print: '⚠' },
    'Not Started': { bg: '#9E9E9E20', text: '#9E9E9E', print: '—' },
  };
  const c = colors[status] || colors['Not Started'];

  if (isPrint) {
    return <span>{c.print} {status}</span>;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, backgroundColor: c.bg, color: c.text, fontSize: 12, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.text }} />
      {status}
    </span>
  );
}

export default DailyProductionReport;

// v1.0.0
