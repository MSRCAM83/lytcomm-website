/**
 * LYT Communications - Admin Project Dashboard
 * Version: 3.0.0
 * Updated: 2026-02-03
 * Route: #admin-projects
 * 
 * Multi-project dashboard with:
 * - Project selector (loads all projects from DB)
 * - Progress stats from real segment data
 * - Bulk assignment panel (select segments → assign contractor)
 * - Section breakdown with drill-down
 * - Open issues list
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Plus, Map, Users, AlertCircle, Upload, BarChart3, Loader,
  Sun, Moon, ChevronRight, Zap, AlertTriangle, UserPlus, Check, X,
  ChevronDown, RefreshCw, Clipboard, DollarSign, Download, Edit3
} from 'lucide-react';
import { loadProjects, loadFullProject, loadIssues, bulkAssignSegments, loadLineItems, updateLineItemRate } from '../services/mapService';
import { VEXUS_RATES } from '../config/mapConfig';

function AdminProjectDashboard({ darkMode, setDarkMode, user, setCurrentPage, selectedProjectId, setSelectedProjectId }) {
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [segments, setSegments] = useState([]);
  const [splicePoints, setSplicePoints] = useState([]);
  const [issues, setIssues] = useState([]);
  const [dataSource, setDataSource] = useState('loading');

  // Bulk assignment state
  const [assignMode, setAssignMode] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  const [assignWorkType, setAssignWorkType] = useState('boring');
  const [assignContractor, setAssignContractor] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState(null);

  const [showVersion, setShowVersion] = useState(false);

  // Billing tab state
  const [activeView, setActiveView] = useState('overview'); // 'overview' | 'billing'
  const [lineItems, setLineItems] = useState([]);
  const [lineItemsLoading, setLineItemsLoading] = useState(false);
  const [editingRate, setEditingRate] = useState(null); // line_item_id being edited
  const [editRateValue, setEditRateValue] = useState('');

  const bg = darkMode ? '#0d1b2a' : '#ffffff';
  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';
  const successGreen = '#28a745';
  const warningOrange = '#FF9800';

  const fetchProjectData = useCallback(async (projId) => {
    setLoading(true);
    try {
      const data = await loadFullProject(projId);
      const issueData = await loadIssues(projId);
      setProject(data.project);
      setSegments(data.segments || []);
      setSplicePoints(data.splicePoints || []);
      setIssues(Array.isArray(issueData) ? issueData : []);
      setDataSource(data.isDemo ? 'demo' : 'live');
    } catch (err) {
      console.error('[AdminProjects] Load failed:', err);
      setDataSource('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const projects = await loadProjects();
        if (!cancelled) {
          setAllProjects(projects);
          const pid = selectedProjectId || (projects[0]?.project_id) || null;
          if (setSelectedProjectId && pid !== selectedProjectId) setSelectedProjectId(pid);
          await fetchProjectData(pid);
        }
      } catch (err) {
        console.error('[AdminProjects] Init failed:', err);
        if (!cancelled) { setLoading(false); setDataSource('error'); }
      }
    }
    init();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProjectChange = async (newId) => {
    if (setSelectedProjectId) setSelectedProjectId(newId);
    setSelectedSegments(new Set());
    setAssignMode(false);
    setAssignResult(null);
    await fetchProjectData(newId);
  };

  const stats = useMemo(() => {
    if (!segments.length) return { boring: 0, pulling: 0, splicing: 0, totalFootage: 0, totalSegments: 0, totalSplices: 0, crews: 0, sections: [], unassignedBoring: 0, unassignedPulling: 0 };
    const total = segments.length;
    const boringDone = segments.filter(s => ['QC Approved', 'Complete'].includes(s.boring_status)).length;
    const pullingDone = segments.filter(s => ['QC Approved', 'Complete'].includes(s.pulling_status)).length;
    const splicingDone = splicePoints.filter(sp => ['QC Approved', 'Complete'].includes(sp.status)).length;
    const splicingTotal = splicePoints.length || 1;
    const totalFootage = segments.reduce((sum, s) => sum + (parseInt(s.footage) || 0), 0);
    const contractors = new Set();
    let unassignedBoring = 0;
    let unassignedPulling = 0;
    segments.forEach(seg => {
      if (seg.boring_assigned_to) contractors.add(seg.boring_assigned_to);
      else unassignedBoring++;
      if (seg.pulling_assigned_to) contractors.add(seg.pulling_assigned_to);
      else unassignedPulling++;
    });
    const sections = [...new Set(segments.map(s => s.section))].sort();
    return {
      boring: Math.round((boringDone / total) * 100),
      pulling: Math.round((pullingDone / total) * 100),
      splicing: Math.round((splicingDone / splicingTotal) * 100),
      totalFootage, totalSegments: total, totalSplices: splicePoints.length,
      crews: contractors.size, sections, unassignedBoring, unassignedPulling,
    };
  }, [segments, splicePoints]);

  const openIssues = issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed');

  const knownContractors = useMemo(() => {
    const set = new Set();
    segments.forEach(s => {
      if (s.boring_assigned_to) set.add(s.boring_assigned_to);
      if (s.pulling_assigned_to) set.add(s.pulling_assigned_to);
      if (s.splicing_assigned_to) set.add(s.splicing_assigned_to);
    });
    return [...set].sort();
  }, [segments]);

  const toggleSegment = (segId) => {
    setSelectedSegments(prev => {
      const next = new Set(prev);
      if (next.has(segId)) next.delete(segId);
      else next.add(segId);
      return next;
    });
  };

  const selectAllInSection = (section) => {
    const sectionSegs = segments.filter(s => s.section === section);
    setSelectedSegments(prev => {
      const next = new Set(prev);
      const allSelected = sectionSegs.every(s => next.has(s.segment_id));
      if (allSelected) sectionSegs.forEach(s => next.delete(s.segment_id));
      else sectionSegs.forEach(s => next.add(s.segment_id));
      return next;
    });
  };

  const selectUnassigned = (workType) => {
    const field = workType === 'boring' ? 'boring_assigned_to' : workType === 'pulling' ? 'pulling_assigned_to' : 'splicing_assigned_to';
    const unassigned = segments.filter(s => !s[field]);
    setSelectedSegments(new Set(unassigned.map(s => s.segment_id)));
  };

  const handleBulkAssign = async () => {
    if (selectedSegments.size === 0 || !assignContractor.trim()) return;
    setAssigning(true);
    setAssignResult(null);
    try {
      const segIds = [...selectedSegments];
      const result = await bulkAssignSegments(segIds, assignWorkType, assignContractor.trim(), selectedProjectId);
      setAssignResult(result);
      if (result.success || result.updated > 0) {
        await fetchProjectData(selectedProjectId);
        setSelectedSegments(new Set());
      }
    } catch (err) {
      setAssignResult({ success: false, error: err.message });
    } finally {
      setAssigning(false);
    }
  };

  const loadBillingData = async () => {
    if (!selectedProjectId) return;
    setLineItemsLoading(true);
    try {
      const items = await loadLineItems(selectedProjectId);
      setLineItems(items);
    } catch (err) {
      console.error('[AdminProjects] loadLineItems failed:', err);
    } finally {
      setLineItemsLoading(false);
    }
  };

  const handleSaveRate = async (lineItemId) => {
    const newRate = parseFloat(editRateValue);
    if (isNaN(newRate) || newRate < 0) return;
    const ok = await updateLineItemRate(selectedProjectId, lineItemId, newRate);
    if (ok) {
      setLineItems(prev => prev.map(li => {
        if (li.line_item_id === lineItemId) {
          const vRate = parseFloat(li.vexus_rate) || 0;
          return { ...li, contractor_rate: newRate, margin: vRate - newRate };
        }
        return li;
      }));
    }
    setEditingRate(null);
    setEditRateValue('');
  };

  const exportLineItemsCSV = () => {
    if (!lineItems.length) return;
    const headers = ['Code', 'Description', 'UOM', 'Qty', 'Vexus Rate', 'Contractor Rate', 'Margin', 'Vexus Total', 'Contractor Total'];
    const rows = lineItems.map(li => {
      const qty = parseFloat(li.quantity) || 0;
      const vRate = parseFloat(li.vexus_rate) || 0;
      const cRate = parseFloat(li.contractor_rate) || 0;
      return [li.code, li.description, li.uom, qty, vRate, cRate, (vRate - cRate).toFixed(2), (qty * vRate).toFixed(2), (qty * cRate).toFixed(2)];
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProjectId}_line_items.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ProgressBar = ({ percent, color, label }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.75rem', color: textMuted }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{percent}%</span>
      </div>
      <div style={{ height: 6, backgroundColor: darkMode ? '#0d1b2a' : '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, backgroundColor: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Loader size={32} color={accent} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: textMuted }}>Loading project data...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}
      style={{ minHeight: '100vh', backgroundColor: bg, color: text }}>
      {/* Header */}
      <div style={{ backgroundColor: darkMode ? '#112240' : '#f1f5f9', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${borderColor}`, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentPage && setCurrentPage('admin-dashboard')} style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
            <ArrowLeft size={20} /> Dashboard
          </button>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}><span style={{ color: accent }}>Project</span> Management</h1>
          {dataSource === 'demo' && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600, backgroundColor: '#FFB80022', color: '#FFB800', border: '1px solid #FFB80044' }}>DEMO</span>}
          {dataSource === 'live' && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600, backgroundColor: '#4CAF5022', color: '#4CAF50', border: '1px solid #4CAF5044' }}>LIVE</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setCurrentPage && setCurrentPage('job-import')} style={{ backgroundColor: accent, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
            <Plus size={16} /> Import Project
          </button>
          <button onClick={() => setDarkMode && setDarkMode(!darkMode)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {darkMode ? <Sun size={18} color="#FFB800" /> : <Moon size={18} color="#64748b" />}
          </button>
        </div>
      </div>

      {/* Project Selector */}
      {allProjects.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: textMuted, fontWeight: 500 }}>Project:</span>
          <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
            <select value={selectedProjectId || ''} onChange={(e) => handleProjectChange(e.target.value)}
              style={{ width: '100%', padding: '10px 36px 10px 14px', borderRadius: 8, border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: text, fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', appearance: 'none' }}>
              {allProjects.map(p => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_id} — {p.project_name || p.customer || 'Unnamed'}
                </option>
              ))}
            </select>
            <ChevronDown size={16} color={textMuted} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
          <button onClick={() => fetchProjectData(selectedProjectId)} style={{ background: 'none', border: `1px solid ${borderColor}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: textMuted, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <span style={{ fontSize: '0.75rem', color: textMuted }}>{allProjects.length} project{allProjects.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Quick Stats */}
      <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Segments', value: stats.totalSegments, icon: <Map size={18} />, color: accent },
          { label: 'Total Footage', value: `${stats.totalFootage.toLocaleString()} LF`, icon: <BarChart3 size={18} />, color: '#2196F3' },
          { label: 'Splice Points', value: stats.totalSplices, icon: <Zap size={18} />, color: '#4CAF50' },
          { label: 'Active Crews', value: stats.crews, icon: <Users size={18} />, color: '#FFB800' },
          { label: 'Open Issues', value: openIssues.length, icon: <AlertTriangle size={18} />, color: openIssues.length > 0 ? warningOrange : '#4CAF50' },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: stat.color }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: textMuted, marginBottom: 2 }}>{stat.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '0 24px 20px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { icon: <Upload size={18} />, label: 'Import Work Order', page: 'job-import', color: accent },
            { icon: <Map size={18} />, label: 'Interactive Map', page: 'project-map', color: '#4CAF50' },
            { icon: <BarChart3 size={18} />, label: 'Reports', page: 'metrics', color: '#2196F3' },
            { icon: <UserPlus size={18} />, label: assignMode ? 'Cancel Assign' : 'Bulk Assign', action: () => { setAssignMode(!assignMode); setSelectedSegments(new Set()); setAssignResult(null); }, color: '#FFB800' },
          ].map(action => (
            <button key={action.label} onClick={action.page ? () => setCurrentPage && setCurrentPage(action.page) : action.action}
              style={{
                backgroundColor: action.label.includes('Cancel') ? `${warningOrange}15` : cardBg,
                border: `1px solid ${action.label.includes('Cancel') ? warningOrange : borderColor}`,
                borderRadius: 10, padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: 10, color: text, fontSize: '0.9rem', fontWeight: 500, flex: 1, minWidth: 160, transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = action.color}
              onMouseOut={(e) => e.currentTarget.style.borderColor = action.label.includes('Cancel') ? warningOrange : borderColor}
            >
              <span style={{ color: action.color }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Assignment Panel */}
      {assignMode && (
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${borderColor}`, backgroundColor: darkMode ? '#0a1628' : '#fffbf0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#FFB800' }}>
            <UserPlus size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Bulk Assignment
          </h3>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
            <div style={{ minWidth: 160 }}>
              <label style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: 4 }}>Work Type</label>
              <select value={assignWorkType} onChange={(e) => setAssignWorkType(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: text, fontSize: '0.85rem' }}>
                <option value="boring">🚧 Boring</option>
                <option value="pulling">🚛 Fiber Pulling</option>
                <option value="splicing">⚡ Splicing</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: 4 }}>Contractor / Crew</label>
              <input type="text" value={assignContractor} onChange={(e) => setAssignContractor(e.target.value)}
                placeholder="e.g. Gulf Coast Boring LLC" list="contractor-list"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: text, fontSize: '0.85rem', boxSizing: 'border-box' }} />
              <datalist id="contractor-list">
                {knownContractors.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <button onClick={handleBulkAssign}
              disabled={selectedSegments.size === 0 || !assignContractor.trim() || assigning}
              style={{
                backgroundColor: (selectedSegments.size === 0 || !assignContractor.trim() || assigning) ? '#6c757d' : successGreen,
                color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8,
                cursor: (selectedSegments.size === 0 || !assignContractor.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
              }}>
              {assigning ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
              Assign {selectedSegments.size} Segment{selectedSegments.size !== 1 ? 's' : ''}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={() => selectUnassigned(assignWorkType)}
              style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${borderColor}`, background: cardBg, color: text, fontSize: '0.75rem', cursor: 'pointer' }}>
              <Clipboard size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Select Unassigned ({assignWorkType === 'boring' ? stats.unassignedBoring : stats.unassignedPulling})
            </button>
            <button onClick={() => setSelectedSegments(new Set(segments.map(s => s.segment_id)))}
              style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${borderColor}`, background: cardBg, color: text, fontSize: '0.75rem', cursor: 'pointer' }}>
              Select All ({segments.length})
            </button>
            <button onClick={() => setSelectedSegments(new Set())}
              style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${borderColor}`, background: cardBg, color: text, fontSize: '0.75rem', cursor: 'pointer' }}>
              <X size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Clear
            </button>
            {stats.sections.map(sec => (
              <button key={sec} onClick={() => selectAllInSection(sec)}
                style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${accent}44`, background: `${accent}11`, color: accent, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
                Section {sec}
              </button>
            ))}
          </div>

          {assignResult && (
            <div style={{
              padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8,
              backgroundColor: assignResult.success ? `${successGreen}15` : '#e85a4f15',
              border: `1px solid ${assignResult.success ? successGreen : '#e85a4f'}44`,
              color: assignResult.success ? successGreen : '#e85a4f',
            }}>
              {assignResult.success
                ? `✅ Assigned ${assignResult.updated} segments to ${assignContractor}`
                : `⚠️ ${assignResult.updated || 0}/${assignResult.total || 0} assigned. ${assignResult.error || ''}`}
            </div>
          )}

          <div style={{ maxHeight: 300, overflowY: 'auto', border: `1px solid ${borderColor}`, borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: darkMode ? '#0d1b2a' : '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', width: 36 }}>
                    <input type="checkbox"
                      checked={selectedSegments.size === segments.length && segments.length > 0}
                      onChange={() => {
                        if (selectedSegments.size === segments.length) setSelectedSegments(new Set());
                        else setSelectedSegments(new Set(segments.map(s => s.segment_id)));
                      }} />
                  </th>
                  {['Segment', 'Section', 'Footage', 'Boring Crew', 'Pulling Crew', 'Street'].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: 'left', color: textMuted, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {segments.map(seg => (
                  <tr key={seg.segment_id} onClick={() => toggleSegment(seg.segment_id)}
                    style={{
                      borderBottom: `1px solid ${borderColor}`, cursor: 'pointer',
                      backgroundColor: selectedSegments.has(seg.segment_id) ? (darkMode ? '#1a2f4a' : '#e0f2fe') : 'transparent',
                    }}>
                    <td style={{ padding: '6px 12px' }}>
                      <input type="checkbox" checked={selectedSegments.has(seg.segment_id)} readOnly />
                    </td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 600 }}>{seg.contractor_id}</td>
                    <td style={{ padding: '6px 8px' }}>{seg.section}</td>
                    <td style={{ padding: '6px 8px' }}>{seg.footage} LF</td>
                    <td style={{ padding: '6px 8px', fontSize: '0.75rem' }}>
                      <span style={{ color: seg.boring_assigned_to ? successGreen : textMuted }}>
                        {seg.boring_assigned_to || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', fontSize: '0.75rem' }}>
                      <span style={{ color: seg.pulling_assigned_to ? successGreen : textMuted }}>
                        {seg.pulling_assigned_to || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', color: textMuted }}>{seg.street}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div style={{ padding: '0 24px', borderBottom: `1px solid ${borderColor}`, display: 'flex', gap: 0 }}>
        {[
          { id: 'overview', label: 'Overview', icon: <Map size={16} /> },
          { id: 'billing', label: 'Billing / Line Items', icon: <DollarSign size={16} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveView(tab.id); if (tab.id === 'billing' && lineItems.length === 0) loadBillingData(); }}
            style={{
              padding: '12px 20px', border: 'none', cursor: 'pointer',
              backgroundColor: 'transparent', color: activeView === tab.id ? accent : textMuted,
              borderBottom: activeView === tab.id ? `2px solid ${accent}` : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: activeView === tab.id ? 600 : 400,
              transition: 'all 0.2s',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>{project?.project_name || 'Project Overview'}</h2>

        {activeView === 'billing' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Line Items — Billing Detail</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={loadBillingData}
                  style={{ background: 'none', border: `1px solid ${borderColor}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: textMuted, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                  <RefreshCw size={14} /> Refresh
                </button>
                <button onClick={exportLineItemsCSV}
                  disabled={lineItems.length === 0}
                  style={{ background: 'none', border: `1px solid ${borderColor}`, borderRadius: 8, padding: '6px 14px', cursor: lineItems.length ? 'pointer' : 'not-allowed', color: lineItems.length ? accent : textMuted, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {lineItemsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: textMuted }}>
                <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ marginTop: 8 }}>Loading line items...</div>
              </div>
            ) : lineItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: textMuted, backgroundColor: cardBg, borderRadius: 12 }}>
                <DollarSign size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>No line items for this project</div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Import a project via JSON Import to populate billing data</div>
              </div>
            ) : (
              <>
                {/* Billing summary */}
                {(() => {
                  const totals = lineItems.reduce((acc, li) => {
                    const qty = parseFloat(li.quantity) || 0;
                    const vRate = parseFloat(li.vexus_rate) || 0;
                    const cRate = parseFloat(li.contractor_rate) || 0;
                    acc.vexus += qty * vRate;
                    acc.contractor += qty * cRate;
                    return acc;
                  }, { vexus: 0, contractor: 0 });
                  totals.margin = totals.vexus - totals.contractor;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                      <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: '0.7rem', color: textMuted }}>Vexus Total</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#28a745' }}>${totals.vexus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: '0.7rem', color: textMuted }}>Contractor Cost</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>${totals.contractor.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: '0.7rem', color: textMuted }}>Margin</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: accent }}>${totals.margin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: '0.7rem', color: textMuted }}>Line Items</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{lineItems.length}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Line items table */}
                <div style={{ border: `1px solid ${borderColor}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: 800 }}>
                      <thead>
                        <tr style={{ backgroundColor: darkMode ? '#0d1b2a' : '#f1f5f9' }}>
                          {['Code', 'Description', 'UOM', 'Qty', 'Vexus Rate', 'Contractor Rate', 'Margin', 'Total (V)', ''].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: h === '' ? 'center' : 'left', color: textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map(li => {
                          const qty = parseFloat(li.quantity) || 0;
                          const vRate = parseFloat(li.vexus_rate) || 0;
                          const cRate = parseFloat(li.contractor_rate) || 0;
                          const margin = vRate - cRate;
                          const total = qty * vRate;
                          const isEditing = editingRate === li.line_item_id;
                          return (
                            <tr key={li.line_item_id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: accent }}>{li.code}</td>
                              <td style={{ padding: '8px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{li.description}</td>
                              <td style={{ padding: '8px 12px', color: textMuted }}>{li.uom}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{qty.toLocaleString()}</td>
                              <td style={{ padding: '8px 12px' }}>${vRate.toFixed(2)}</td>
                              <td style={{ padding: '8px 12px' }}>
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <input value={editRateValue} onChange={(e) => setEditRateValue(e.target.value)}
                                      type="number" step="0.01" min="0"
                                      style={{ width: 70, padding: '4px 6px', borderRadius: 4, border: `1px solid ${accent}`, backgroundColor: darkMode ? '#0d1b2a' : '#fff', color: text, fontSize: '0.8rem' }}
                                      autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRate(li.line_item_id); if (e.key === 'Escape') { setEditingRate(null); setEditRateValue(''); } }}
                                    />
                                    <button onClick={() => handleSaveRate(li.line_item_id)} style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>Save</button>
                                  </div>
                                ) : (
                                  <span>${cRate.toFixed(2)}</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', color: margin > 0 ? '#28a745' : margin < 0 ? '#e85a4f' : textMuted, fontWeight: 500 }}>
                                ${margin.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                {!isEditing && (
                                  <button onClick={() => { setEditingRate(li.line_item_id); setEditRateValue(String(cRate)); }}
                                    title="Adjust contractor rate"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4 }}>
                                    <Edit3 size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeView === 'overview' && project && (
          <div style={{ backgroundColor: cardBg, borderRadius: 12, padding: 20, marginBottom: 16, border: `1px solid ${borderColor}`, cursor: 'pointer', transition: 'border-color 0.2s' }}
            onClick={() => { if (setSelectedProjectId) setSelectedProjectId(selectedProjectId); setCurrentPage && setCurrentPage('project-map'); }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = accent}
            onMouseOut={(e) => e.currentTarget.style.borderColor = borderColor}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{project.project_name || 'Unnamed Project'}</h3>
                  <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#4CAF5022', color: '#4CAF50', border: '1px solid #4CAF5044' }}>{project.status || 'Active'}</span>
                </div>
                <p style={{ margin: 0, color: textMuted, fontSize: '0.85rem' }}>
                  {project.customer || 'Unknown'} &bull; {project.project_id} &bull; PO #{project.po_number || '---'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 2px', fontSize: '1.2rem', fontWeight: 700, color: accent }}>${(parseFloat(project.total_value) || 0).toLocaleString()}</p>
                <p style={{ margin: 0, color: textMuted, fontSize: '0.8rem' }}>{stats.totalSegments} segments &bull; {stats.crews} crews</p>
              </div>
            </div>
            <ProgressBar percent={stats.boring} color="#FFB800" label="Boring" />
            <ProgressBar percent={stats.pulling} color="#2196F3" label="Pulling" />
            <ProgressBar percent={stats.splicing} color="#4CAF50" label="Splicing" />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={(e) => { e.stopPropagation(); setCurrentPage && setCurrentPage('project-map'); }}
                style={{ backgroundColor: `${accent}15`, color: accent, border: `1px solid ${accent}33`, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 500 }}>
                <Map size={14} /> View Map
              </button>
              {(stats.unassignedBoring > 0 || stats.unassignedPulling > 0) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: warningOrange, fontSize: '0.8rem' }}>
                  <UserPlus size={14} /> {stats.unassignedBoring} boring / {stats.unassignedPulling} pulling unassigned
                </span>
              )}
              {openIssues.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: warningOrange, fontSize: '0.8rem', marginLeft: 'auto' }}>
                  <AlertCircle size={14} /> {openIssues.length} issues
                </span>
              )}
              <ChevronRight size={16} color={textMuted} style={{ marginLeft: 'auto' }} />
            </div>
          </div>
        )}

        )}

        {/* Section Breakdown */}
        {activeView === 'overview' && stats.sections.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Section Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {stats.sections.map(section => {
                const segs = segments.filter(s => s.section === section);
                const bDone = segs.filter(s => ['QC Approved', 'Complete'].includes(s.boring_status)).length;
                const pDone = segs.filter(s => ['QC Approved', 'Complete'].includes(s.pulling_status)).length;
                const ft = segs.reduce((sum, s) => sum + (parseInt(s.footage) || 0), 0);
                const hasIssue = segs.some(s => s.boring_status === 'Issue');
                const unassigned = segs.filter(s => !s.boring_assigned_to).length;
                return (
                  <div key={section} style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 16, cursor: 'pointer' }}
                    onClick={() => setCurrentPage && setCurrentPage('project-map')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: accent }}>Section {section}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {hasIssue && <AlertTriangle size={14} color={warningOrange} />}
                        {unassigned > 0 && <UserPlus size={14} color={textMuted} />}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: textMuted, marginBottom: 8 }}>{segs.length} segments &bull; {ft.toLocaleString()} LF</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem' }}>
                      <span style={{ color: '#FFB800' }}>Bore: {bDone}/{segs.length}</span>
                      <span style={{ color: '#2196F3' }}>Pull: {pDone}/{segs.length}</span>
                    </div>
                    {unassigned > 0 && <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: 4 }}>{unassigned} unassigned</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Open Issues */}
        {activeView === 'overview' && openIssues.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: warningOrange }}>
              <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Open Issues ({openIssues.length})
            </h3>
            {openIssues.map((issue, idx) => (
              <div key={idx} style={{ backgroundColor: cardBg, border: '1px solid #FF980044', borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertCircle size={16} color={warningOrange} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{issue.segment_id}</div>
                  <div style={{ fontSize: '0.8rem', color: textMuted }}>{issue.description || issue.issue_type}</div>
                </div>
                <span style={{ fontSize: '0.7rem', color: textMuted }}>{issue.reported_by}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {showVersion && <div style={{ position: 'fixed', bottom: 10, right: 10, fontSize: '0.7rem', opacity: 0.5, color: darkMode ? '#fff' : '#333' }}>AdminProjectDashboard v3.0.0</div>}
    </div>
  );
}

export default AdminProjectDashboard;
