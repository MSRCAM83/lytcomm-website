/**
 * LYT Communications - Pulling Tracker Component
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Fiber pulling phase: Splicer QC of bore → pull direction → cable type → photos → QC
 */

import React, { useState, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { CheckCircle, Clock, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import PhotoUploader from './PhotoUploader';
import { STATUS_COLORS } from '../../config/mapConfig';

const PULLING_PHOTO_TYPES = ['Cable reel label/tag', 'Cable entering conduit', 'Cable at pull-through point', 'Slack coil at handhole'];
const CABLE_TYPES = ['12F','24F','48F','96F','144F','288F','432F'];
const PULL_DIRECTIONS = [
  { value: 'Forward', icon: '→', desc: 'Standard direction' },
  { value: 'Backward', icon: '←', desc: 'Backfeed (reverse)' },
  { value: 'Both', icon: '↔', desc: 'Pull from both ends' },
];

function PullingTracker({ darkMode, segment, onStatusUpdate, onPhotoUpload, onQCApprove, user, isAdmin = false, isSplicer = false }) {
  const [expanded, setExpanded] = useState(true);
  const [pullPhotos, setPullPhotos] = useState({});
  const [pullNotes, setPullNotes] = useState('');
  const [cableType, setCableType] = useState(segment?.pulling_cable_type || '24F');
  const [pullDirection, setPullDirection] = useState(segment?.pulling_direction || 'Forward');

  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';
  const successGreen = '#28a745';
  const warningYellow = '#FFB800';
  const errorRed = '#e85a4f';

  const status = segment?.pulling_status || 'Not Started';
  const boringDone = segment?.boring_status === 'QC Approved';
  const statusColor = { 'Not Started': STATUS_COLORS.NOT_STARTED, 'In Progress': STATUS_COLORS.IN_PROGRESS, 'Complete': STATUS_COLORS.COMPLETE, 'QC Approved': STATUS_COLORS.QC_APPROVED, 'Issue': STATUS_COLORS.ISSUE }[status] || STATUS_COLORS.NOT_STARTED;

  const handlePullPhotoUpload = useCallback((t, d) => { setPullPhotos(p => ({ ...p, [t]: d })); if (onPhotoUpload) onPhotoUpload(t, d); }, [onPhotoUpload]);
  const handlePullPhotoRemove = useCallback((t) => { setPullPhotos(p => { const c = { ...p }; delete c[t]; return c; }); }, []);

  const handleStartPulling = () => { if (onStatusUpdate) onStatusUpdate({ segmentId: segment?.segment_id, phase: 'pulling', newStatus: 'In Progress', cableType, pullDirection, updatedBy: user?.email, updatedAt: new Date().toISOString() }); };
  const handleMarkComplete = () => {
    if (Object.keys(pullPhotos).length < PULLING_PHOTO_TYPES.length) return;
    if (onStatusUpdate) onStatusUpdate({ segmentId: segment?.segment_id, phase: 'pulling', newStatus: 'Complete', cableType, pullDirection, photos: pullPhotos, notes: pullNotes, updatedBy: user?.email, updatedAt: new Date().toISOString() });
  };

  const segmentLabel = segment?.contractor_id || `${segment?.from_handhole} → ${segment?.to_handhole}`;

  return (
    <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
      <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '14px 16px', background: darkMode ? '#0a192f' : '#f1f5f9', border: 'none', borderBottom: expanded ? `1px solid ${borderColor}` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: text }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🚛</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Fiber Pulling — {segmentLabel}</div>
            <div style={{ color: textMuted, fontSize: '0.8rem' }}>{segment?.footage || '—'} LF • {cableType}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>{status}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '16px' }}>
          {/* Prerequisite */}
          {!boringDone && status === 'Not Started' && (
            <div style={{ padding: '12px', background: `${errorRed}10`, borderRadius: '8px', border: `1px solid ${errorRed}30`, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: errorRed, fontSize: '0.85rem' }}>
              <Clock size={14} /> Boring must be QC approved first
            </div>
          )}

          {/* Start Pull */}
          {boringDone && status === 'Not Started' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: textMuted, fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Cable Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {CABLE_TYPES.map(ct => (
                    <button key={ct} onClick={() => setCableType(ct)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', background: cableType === ct ? accent : 'transparent', color: cableType === ct ? '#fff' : text, border: `1px solid ${cableType === ct ? accent : borderColor}`, cursor: 'pointer' }}>{ct}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: textMuted, fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Pull Direction</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {PULL_DIRECTIONS.map(pd => (
                    <button key={pd.value} onClick={() => setPullDirection(pd.value)} style={{ padding: '10px 14px', borderRadius: '8px', textAlign: 'left', background: pullDirection === pd.value ? `${accent}15` : 'transparent', border: `2px solid ${pullDirection === pd.value ? accent : borderColor}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.3rem', width: '28px', textAlign: 'center' }}>{pd.icon}</span>
                      <div>
                        <div style={{ color: text, fontWeight: '600', fontSize: '0.85rem' }}>{pd.value}</div>
                        <div style={{ color: textMuted, fontSize: '0.75rem' }}>{pd.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {pullDirection === 'Backward' && (
                <div style={{ padding: '10px', background: `${warningYellow}15`, borderRadius: '8px', border: `1px solid ${warningYellow}30`, marginBottom: '12px', color: warningYellow, fontSize: '0.85rem' }}>
                  ⚠️ Backfeed detected — verify cable continuity at both ends
                </div>
              )}

              <button onClick={handleStartPulling} style={{ width: '100%', padding: '12px', background: accent, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>
                🚛 Start Fiber Pull ({cableType} {pullDirection})
              </button>
            </div>
          )}

          {/* In Progress */}
          {status === 'In Progress' && (
            <div>
              <div style={{ color: textMuted, fontSize: '0.8rem', marginBottom: '12px' }}>{cableType} • {pullDirection} pull • Upload photos when done</div>
              <PhotoUploader darkMode={darkMode} requiredPhotos={PULLING_PHOTO_TYPES} uploadedPhotos={pullPhotos} onPhotoUpload={handlePullPhotoUpload} onPhotoRemove={handlePullPhotoRemove} segmentId={segment?.segment_id} workType="pulling" />
              <textarea value={pullNotes} onChange={(e) => setPullNotes(e.target.value)} placeholder="Pull notes..." style={{ width: '100%', minHeight: '50px', marginTop: '10px', padding: '8px 10px', background: darkMode ? '#0a192f' : '#fff', border: `1px solid ${borderColor}`, borderRadius: '6px', color: text, fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }} />
              <button onClick={handleMarkComplete} disabled={Object.keys(pullPhotos).length < PULLING_PHOTO_TYPES.length} style={{ marginTop: '12px', width: '100%', padding: '12px', background: Object.keys(pullPhotos).length >= PULLING_PHOTO_TYPES.length ? successGreen : `${successGreen}40`, color: '#fff', border: 'none', borderRadius: '8px', cursor: Object.keys(pullPhotos).length >= PULLING_PHOTO_TYPES.length ? 'pointer' : 'default', fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CheckCircle size={18} /> Mark Pull Complete
              </button>
            </div>
          )}

          {/* QC Pending */}
          {status === 'Complete' && (
            <div style={{ padding: '12px', background: `${warningYellow}10`, borderRadius: '8px', border: `1px solid ${warningYellow}30` }}>
              <div style={{ color: warningYellow, fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={16} /> Awaiting Splicer QC</div>
              {(isAdmin || isSplicer) ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onQCApprove && onQCApprove({ segmentId: segment?.segment_id, phase: 'pulling', approved: true })} style={{ flex: 1, padding: '10px', background: successGreen, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>✓ Approve</button>
                  <button onClick={() => onQCApprove && onQCApprove({ segmentId: segment?.segment_id, phase: 'pulling', approved: false })} style={{ padding: '10px 16px', background: errorRed, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>✗ Reject</button>
                </div>
              ) : (
                <div style={{ color: textMuted, fontSize: '0.85rem' }}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Pending splicer review</div>
              )}
            </div>
          )}

          {/* Approved */}
          {status === 'QC Approved' && (
            <div style={{ padding: '16px', background: `${successGreen}10`, borderRadius: '8px', border: `1px solid ${successGreen}30`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={22} color={successGreen} />
              <div>
                <div style={{ color: successGreen, fontWeight: '600' }}>Pull Complete & QC Approved</div>
                <div style={{ color: textMuted, fontSize: '0.8rem' }}>{cableType} • {pullDirection}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '2px 8px 4px', textAlign: 'right' }}><span style={{ fontSize: '0.6rem', color: 'transparent', userSelect: 'none' }} onDoubleClick={(e) => { e.target.style.color = textMuted; }}>PullingTracker v1.0.0</span></div>
    </div>
  );
}

export default PullingTracker;
