/**
 * LYT Communications - Admin Project Dashboard
 * Version: 1.0.0
 * Created: 2026-02-02
 * Route: #admin-projects
 * 
 * Admin overview showing all projects, progress stats,
 * crew assignments, and quick actions. Entry point to 
 * the project management system.
 */

import React, { useState } from 'react';
import { ArrowLeft, Plus, Map, FileText, Users, AlertCircle, Upload, BarChart3 } from 'lucide-react';

// Demo projects (Phase 2 will load from Google Sheets)
const DEMO_PROJECTS = [
  {
    project_id: 'VXS-SLPH01-006',
    customer: 'Vexus Fiber',
    project_name: 'Sulphur LA City Build',
    po_number: '3160880',
    total_value: 421712.30,
    start_date: '2026-02-05',
    status: 'Active',
    segments: 42,
    boringProgress: 65,
    pullingProgress: 35,
    splicingProgress: 10,
    issues: 2,
    crews: 3,
  },
  {
    project_id: 'VXS-SLPH01-007',
    customer: 'Vexus Fiber',
    project_name: 'Sulphur LA Phase 2',
    po_number: '3160881',
    total_value: 285000.00,
    start_date: '2026-03-15',
    status: 'Pending',
    segments: 28,
    boringProgress: 0,
    pullingProgress: 0,
    splicingProgress: 0,
    issues: 0,
    crews: 0,
  },
];

function AdminProjectDashboard({ darkMode, setDarkMode, user, setCurrentPage }) {
  // eslint-disable-next-line no-unused-vars
  const [selectedProject, setSelectedProject] = useState(null);

  const bg = darkMode ? '#0d1b2a' : '#ffffff';
  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  const ProgressBar = ({ percent, color, label }) => (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.75rem', color: textMuted }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{percent}%</span>
      </div>
      <div style={{ height: '6px', backgroundColor: darkMode ? '#0d1b2a' : '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, backgroundColor: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, color: text }}>
      {/* Header */}
      <div style={{
        backgroundColor: darkMode ? '#112240' : '#f1f5f9',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${borderColor}`,
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setCurrentPage && setCurrentPage('admin-dashboard')} style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={20} /> Dashboard
          </button>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>
            <span style={{ color: accent }}>Project</span> Management
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setCurrentPage && setCurrentPage('job-import')}
            style={{
              backgroundColor: accent,
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <Plus size={16} /> Import Project
          </button>
          <button onClick={() => setDarkMode && setDarkMode(!darkMode)} style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '1.2rem' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { icon: <Upload size={18} />, label: 'Import Work Order', page: 'job-import', color: accent },
            { icon: <Map size={18} />, label: 'View Active Map', page: 'project-map', color: '#4CAF50' },
            { icon: <Users size={18} />, label: 'Crew Assignments', page: 'admin-projects', color: '#FFB800' },
            { icon: <BarChart3 size={18} />, label: 'Reports', page: 'metrics', color: '#2196F3' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => setCurrentPage && setCurrentPage(action.page)}
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: '10px',
                padding: '14px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: text,
                fontSize: '0.9rem',
                fontWeight: 500,
                flex: '1',
                minWidth: '180px',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = action.color}
              onMouseOut={(e) => e.currentTarget.style.borderColor = borderColor}
            >
              <span style={{ color: action.color }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div style={{ padding: '24px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Active Projects</h2>
        
        {DEMO_PROJECTS.map(project => (
          <div
            key={project.project_id}
            style={{
              backgroundColor: cardBg,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              border: `1px solid ${borderColor}`,
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = accent}
            onMouseOut={(e) => e.currentTarget.style.borderColor = borderColor}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{project.project_name}</h3>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: project.status === 'Active' ? '#4CAF5022' : '#FFB80022',
                    color: project.status === 'Active' ? '#4CAF50' : '#FFB800',
                    border: `1px solid ${project.status === 'Active' ? '#4CAF5044' : '#FFB80044'}`,
                  }}>
                    {project.status}
                  </span>
                </div>
                <p style={{ margin: 0, color: textMuted, fontSize: '0.85rem' }}>
                  {project.customer} • {project.project_id} • PO #{project.po_number}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 2px', fontSize: '1.2rem', fontWeight: 700, color: accent }}>
                  ${project.total_value.toLocaleString()}
                </p>
                <p style={{ margin: 0, color: textMuted, fontSize: '0.8rem' }}>
                  {project.segments} segments • {project.crews} crews
                </p>
              </div>
            </div>

            {/* Progress Bars */}
            <ProgressBar percent={project.boringProgress} color="#FFB800" label="Boring" />
            <ProgressBar percent={project.pullingProgress} color="#2196F3" label="Pulling" />
            <ProgressBar percent={project.splicingProgress} color="#4CAF50" label="Splicing" />

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentPage && setCurrentPage('project-map'); }}
                style={{
                  backgroundColor: `${accent}15`,
                  color: accent,
                  border: `1px solid ${accent}33`,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                <Map size={14} /> View Map
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); }}
                style={{
                  backgroundColor: 'transparent',
                  color: textMuted,
                  border: `1px solid ${borderColor}`,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                }}
              >
                <FileText size={14} /> Work Order
              </button>
              {project.issues > 0 && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#FF9800',
                  fontSize: '0.8rem',
                  marginLeft: 'auto',
                }}>
                  <AlertCircle size={14} /> {project.issues} issues
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Version */}
      <div style={{ position: 'fixed', bottom: '4px', right: '8px', fontSize: '0.6rem', color: 'transparent', userSelect: 'none' }}
        onDoubleClick={(e) => { e.target.style.color = textMuted; }}
      >
        AdminProjectDashboard v1.0.0
      </div>
    </div>
  );
}

export default AdminProjectDashboard;
