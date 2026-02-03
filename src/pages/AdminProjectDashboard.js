/**
 * LYT Communications - Admin Project Dashboard
 * Version: 2.0.0
 * Created: 2026-02-02
 * Updated: 2026-02-03
 * Route: #admin-projects
 * 
 * Admin overview showing all projects with live data from Google Sheets.
 * Progress stats calculated from real segment statuses.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Map, Users, AlertCircle, Upload, BarChart3, Loader, Sun, Moon, ChevronRight, Zap, AlertTriangle } from 'lucide-react';
import { loadFullProject, loadIssues } from '../services/mapService';

function AdminProjectDashboard({ darkMode, setDarkMode, user, setCurrentPage }) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [segments, setSegments] = useState([]);
  const [splicePoints, setSplicePoints] = useState([]);
  const [issues, setIssues] = useState([]);
  const [dataSource, setDataSource] = useState('loading');
  const [showVersion, setShowVersion] = useState(false);

  const bg = darkMode ? '#0d1b2a' : '#ffffff';
  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const data = await loadFullProject('VXS-SLPH01-006');
        const issueData = await loadIssues('VXS-SLPH01-006');
        if (!cancelled) {
          setProject(data.project);
          setSegments(data.segments || []);
          setSplicePoints(data.splicePoints || []);
          setIssues(Array.isArray(issueData) ? issueData : []);
          setDataSource(data.isDemo ? 'demo' : 'live');
          setLoading(false);
        }
      } catch (err) {
        console.error('[AdminProjects] Load failed:', err);
        if (!cancelled) { setLoading(false); setDataSource('error'); }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    if (!segments.length) return { boring: 0, pulling: 0, splicing: 0, totalFootage: 0, totalSegments: 0, totalSplices: 0, crews: 0, sections: [] };
    const total = segments.length;
    const boringDone = segments.filter(seg => ['QC Approved', 'Complete'].includes(seg.boring_status)).length;
    const pullingDone = segments.filter(seg => ['QC Approved', 'Complete'].includes(seg.pulling_status)).length;
    const splicingDone = splicePoints.filter(sp => ['QC Approved', 'Complete'].includes(sp.status)).length;
    const splicingTotal = splicePoints.length || 1;
    const totalFootage = segments.reduce((sum, seg) => sum + (parseInt(seg.footage) || 0), 0);
    const contractors = new Set();
    segments.forEach(seg => {
      if (seg.boring_assigned_to) contractors.add(seg.boring_assigned_to);
      if (seg.pulling_assigned_to) contractors.add(seg.pulling_assigned_to);
    });
    const sections = [...new Set(segments.map(s => s.section))].sort();
    return {
      boring: Math.round((boringDone / total) * 100),
      pulling: Math.round((pullingDone / total) * 100),
      splicing: Math.round((splicingDone / splicingTotal) * 100),
      totalFootage, totalSegments: total, totalSplices: splicePoints.length,
      crews: contractors.size, sections,
    };
  }, [segments, splicePoints]);

  const openIssues = issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed');

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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

      {/* Quick Stats */}
      <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Segments', value: stats.totalSegments, icon: <Map size={18} />, color: accent },
          { label: 'Total Footage', value: `${stats.totalFootage.toLocaleString()} LF`, icon: <BarChart3 size={18} />, color: '#2196F3' },
          { label: 'Splice Points', value: stats.totalSplices, icon: <Zap size={18} />, color: '#4CAF50' },
          { label: 'Active Crews', value: stats.crews, icon: <Users size={18} />, color: '#FFB800' },
          { label: 'Open Issues', value: openIssues.length, icon: <AlertTriangle size={18} />, color: openIssues.length > 0 ? '#FF9800' : '#4CAF50' },
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
          ].map(action => (
            <button key={action.label} onClick={() => setCurrentPage && setCurrentPage(action.page)}
              style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: text, fontSize: '0.9rem', fontWeight: 500, flex: 1, minWidth: 160, transition: 'border-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = action.color}
              onMouseOut={(e) => e.currentTarget.style.borderColor = borderColor}
            >
              <span style={{ color: action.color }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project Card */}
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Active Projects</h2>
        {project && (
          <div style={{ backgroundColor: cardBg, borderRadius: 12, padding: 20, marginBottom: 16, border: `1px solid ${borderColor}`, cursor: 'pointer', transition: 'border-color 0.2s' }}
            onClick={() => setCurrentPage && setCurrentPage('project-map')}
            onMouseOver={(e) => e.currentTarget.style.borderColor = accent}
            onMouseOut={(e) => e.currentTarget.style.borderColor = borderColor}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{project.project_name || 'Sulphur LA City Build'}</h3>
                  <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#4CAF5022', color: '#4CAF50', border: '1px solid #4CAF5044' }}>Active</span>
                </div>
                <p style={{ margin: 0, color: textMuted, fontSize: '0.85rem' }}>
                  {project.customer || 'Vexus Fiber'} &bull; {project.project_id} &bull; PO #{project.po_number || '3160880'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 2px', fontSize: '1.2rem', fontWeight: 700, color: accent }}>${(parseFloat(project.total_value) || 421712.30).toLocaleString()}</p>
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
              {openIssues.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FF9800', fontSize: '0.8rem', marginLeft: 'auto' }}>
                  <AlertCircle size={14} /> {openIssues.length} issues
                </span>
              )}
              <ChevronRight size={16} color={textMuted} style={{ marginLeft: openIssues.length === 0 ? 'auto' : 0 }} />
            </div>
          </div>
        )}

        {/* Section Breakdown */}
        {stats.sections.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Section Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {stats.sections.map(section => {
                const segs = segments.filter(s => s.section === section);
                const bDone = segs.filter(s => ['QC Approved', 'Complete'].includes(s.boring_status)).length;
                const pDone = segs.filter(s => ['QC Approved', 'Complete'].includes(s.pulling_status)).length;
                const ft = segs.reduce((sum, s) => sum + (parseInt(s.footage) || 0), 0);
                const hasIssue = segs.some(s => s.boring_status === 'Issue');
                return (
                  <div key={section} style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 16, cursor: 'pointer' }}
                    onClick={() => setCurrentPage && setCurrentPage('project-map')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: accent }}>Section {section}</span>
                      {hasIssue && <AlertTriangle size={14} color="#FF9800" />}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: textMuted, marginBottom: 8 }}>{segs.length} segments &bull; {ft.toLocaleString()} LF</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem' }}>
                      <span style={{ color: '#FFB800' }}>Bore: {bDone}/{segs.length}</span>
                      <span style={{ color: '#2196F3' }}>Pull: {pDone}/{segs.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Open Issues */}
        {openIssues.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#FF9800' }}>
              <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Open Issues ({openIssues.length})
            </h3>
            {openIssues.map((issue, idx) => (
              <div key={idx} style={{ backgroundColor: cardBg, border: '1px solid #FF980044', borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertCircle size={16} color="#FF9800" />
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

      {showVersion && <div style={{ position: 'fixed', bottom: 10, right: 10, fontSize: '0.7rem', opacity: 0.5, color: darkMode ? '#fff' : '#333' }}>AdminProjectDashboard v2.0.0</div>}
    </div>
  );
}

export default AdminProjectDashboard;
