/**
 * LYT Communications - Splicing Tracker Component
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Splicing phase: type-specific photos, power meter tests, OTDR, billing
 */

import React, { useState, useCallback, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { CheckCircle, Clock, ChevronDown, ChevronUp, Shield, Upload } from 'lucide-react';
import PhotoUploader from './PhotoUploader';
import { STATUS_COLORS, PHOTO_REQUIREMENTS } from '../../config/mapConfig';

function SplicingTracker({ darkMode, segment, splicePoint, onStatusUpdate, onPhotoUpload, onQCApprove, user, isAdmin = false }) {
  const [expanded, setExpanded] = useState(true);
  const [splicePhotos, setSplicePhotos] = useState({});
  const [spliceNotes, setSpliceNotes] = useState('');
  const [powerMeterTests, setPowerMeterTests] = useState([]);
  const [otdrFile, setOtdrFile] = useState(null);

  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';
  const successGreen = '#28a745';
  const warningYellow = '#FFB800';
  const errorRed = '#e85a4f';

  const spliceType = splicePoint?.splice_type || '1x4';
  const positionType = splicePoint?.position_type || 'mid-span';
  const trayCount = splicePoint?.tray_count || 1;
  const status = splicePoint?.status || 'Not Started';
  const pullingDone = segment?.pulling_status === 'QC Approved';

  const statusColor = { 'Not Started': STATUS_COLORS.NOT_STARTED, 'In Progress': STATUS_COLORS.IN_PROGRESS, 'Complete': STATUS_COLORS.COMPLETE, 'QC Approved': STATUS_COLORS.QC_APPROVED, 'Issue': STATUS_COLORS.ISSUE }[status] || STATUS_COLORS.NOT_STARTED;

  const requiredPhotos = useMemo(() => {
    const config = PHOTO_REQUIREMENTS[spliceType];
    if (!config) return ['Before photo', 'During splice', 'Completed splice'];
    if (config.types) return config.types;
    const photos = ['Basket'];
    for (let i = 1; i <= trayCount; i++) photos.push(`${config.trayPrefix} #${i}`);
    config.baseTypes.slice(1).forEach(t => photos.push(t));
    return photos;
  }, [spliceType, trayCount]);

  const requiredPMTests = useMemo(() => {
    if (spliceType === '1x4') return 8;
    if (spliceType === '1x8') return 16;
    return 0;
  }, [spliceType]);

  const needsOTDR = spliceType === 'F1' || spliceType === 'TYCO-D';

  const handleSplicePhotoUpload = useCallback((t, d) => { setSplicePhotos(p => ({ ...p, [t]: d })); if (onPhotoUpload) onPhotoUpload(t, d); }, [onPhotoUpload]);
  const handleSplicePhotoRemove = useCallback((t) => { setSplicePhotos(p => { const c = { ...p }; delete c[t]; return c; }); }, []);
  const handlePowerMeterEntry = (index, value) => { setPowerMeterTests(prev => { const c = [...prev]; c[index] = parseFloat(value) || 0; return c; }); };
  const handleStartSplicing = () => { if (onStatusUpdate) onStatusUpdate({ segmentId: segment?.segment_id, spliceId: splicePoint?.splice_id, phase: 'splicing', newStatus: 'In Progress', updatedBy: user?.email, updatedAt: new Date().toISOString() }); };

  const photosComplete = Object.keys(splicePhotos).length >= requiredPhotos.length;
  const pmTestsComplete = requiredPMTests === 0 || powerMeterTests.filter(v => v !== undefined && v !== 0).length >= requiredPMTests;
  const otdrComplete = !needsOTDR || otdrFile;
  const canComplete = photosComplete && pmTestsComplete && otdrComplete;

  const handleMarkComplete = () => {
    if (!canComplete) return;
    if (onStatusUpdate) onStatusUpdate({ segmentId: segment?.segment_id, spliceId: splicePoint?.splice_id, phase: 'splicing', newStatus: 'Complete', photos: splicePhotos, powerMeterTests, otdrFile, notes: spliceNotes, updatedBy: user?.email, updatedAt: new Date().toISOString() });
  };

  const billingInfo = useMemo(() => {
    if (spliceType === '1x4') {
      const setup = positionType === 'mid-span' ? { code: 'FS2', desc: 'Ring cut', qty: 1, price: 275.00 } : { code: 'FS4', desc: 'Case setup', qty: 1, price: 137.50 };
      return { items: [setup, { code: 'FS1', desc: 'Fusion splice', qty: 2, price: 16.50 }, { code: 'FS3', desc: 'PM test', qty: 8, price: 6.60 }], total: setup.price + 33.00 + 52.80 };
    }
    if (spliceType === '1x8') {
      const setup = positionType === 'mid-span' ? { code: 'FS2', desc: 'Ring cut', qty: 1, price: 275.00 } : { code: 'FS4', desc: 'Case setup', qty: 1, price: 137.50 };
      return { items: [setup, { code: 'FS1', desc: 'Fusion splice', qty: 2, price: 16.50 }, { code: 'FS3', desc: 'PM test', qty: 16, price: 6.60 }], total: setup.price + 33.00 + 105.60 };
    }
    const fc = splicePoint?.fiber_count || 432;
    return { items: [{ code: 'FS1', desc: 'Fusion splice', qty: fc, price: 16.50 }, { code: 'FS4', desc: 'Case setup', qty: 1, price: 137.50 }], total: (fc * 16.50) + 137.50 };
  }, [spliceType, positionType, splicePoint?.fiber_count]);

  const label = splicePoint?.location || splicePoint?.splice_id || 'Unknown';

  return (
    <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
      <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '14px 16px', background: darkMode ? '#0a192f' : '#f1f5f9', border: 'none', borderBottom: expanded ? `1px solid ${borderColor}` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: text }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Splicing — {label}</div>
            <div style={{ color: textMuted, fontSize: '0.8rem' }}>{spliceType} • {positionType} • {requiredPhotos.length} photos req</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>{status}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px', marginBottom: '16px' }}>
            {[{ l: 'Type', v: spliceType }, { l: 'Position', v: positionType }, { l: 'Photos', v: `${Object.keys(splicePhotos).length}/${requiredPhotos.length}` }, { l: 'PM Tests', v: requiredPMTests > 0 ? `${powerMeterTests.filter(v => v).length}/${requiredPMTests}` : 'N/A' }, { l: 'Handhole', v: splicePoint?.handhole_type || '—' }, { l: 'Value', v: `$${billingInfo.total.toFixed(2)}` }].map(item => (
              <div key={item.l} style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${borderColor}`, background: darkMode ? '#0a192f' : '#fff' }}>
                <div style={{ color: textMuted, fontSize: '0.65rem' }}>{item.l}</div>
                <div style={{ color: text, fontSize: '0.8rem', fontWeight: '500' }}>{item.v}</div>
              </div>
            ))}
          </div>

          {!pullingDone && status === 'Not Started' && (
            <div style={{ padding: '12px', background: `${errorRed}10`, borderRadius: '8px', border: `1px solid ${errorRed}30`, marginBottom: '16px', color: errorRed, fontSize: '0.85rem' }}>
              <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Pulling must be QC approved first
            </div>
          )}

          {pullingDone && status === 'Not Started' && (
            <button onClick={handleStartSplicing} style={{ width: '100%', padding: '12px', background: accent, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', marginBottom: '16px' }}>⚡ Start Splicing ({spliceType})</button>
          )}

          {status === 'In Progress' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: text, fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px' }}>📸 Photos ({spliceType})</div>
                <PhotoUploader darkMode={darkMode} requiredPhotos={requiredPhotos} uploadedPhotos={splicePhotos} onPhotoUpload={handleSplicePhotoUpload} onPhotoRemove={handleSplicePhotoRemove} segmentId={splicePoint?.splice_id} workType="splicing" />
              </div>

              {requiredPMTests > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: text, fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px' }}>🔬 Power Meter ({powerMeterTests.filter(v => v).length}/{requiredPMTests})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                    {Array.from({ length: requiredPMTests }).map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: textMuted, fontSize: '0.7rem', minWidth: '20px' }}>#{i+1}</span>
                        <input type="number" step="0.1" value={powerMeterTests[i] || ''} onChange={(e) => handlePowerMeterEntry(i, e.target.value)} placeholder="dBm" style={{ width: '100%', padding: '5px 6px', background: darkMode ? '#0a192f' : '#fff', border: `1px solid ${powerMeterTests[i] ? successGreen : borderColor}`, borderRadius: '4px', color: text, fontSize: '0.8rem' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {needsOTDR && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: text, fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px' }}>📊 OTDR {otdrFile ? '✓' : '(required)'}</div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', border: `2px dashed ${otdrFile ? successGreen : borderColor}`, background: otdrFile ? `${successGreen}10` : 'transparent', cursor: 'pointer', color: otdrFile ? successGreen : textMuted, fontSize: '0.85rem' }}>
                    <Upload size={16} />{otdrFile ? otdrFile.name : 'Upload OTDR (PDF)'}
                    <input type="file" accept=".pdf,.sor" onChange={(e) => setOtdrFile(e.target.files[0])} style={{ display: 'none' }} />
                  </label>
                </div>
              )}

              <textarea value={spliceNotes} onChange={(e) => setSpliceNotes(e.target.value)} placeholder="Splice notes..." style={{ width: '100%', minHeight: '50px', padding: '8px 10px', background: darkMode ? '#0a192f' : '#fff', border: `1px solid ${borderColor}`, borderRadius: '6px', color: text, fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', marginBottom: '12px' }} />

              <div style={{ padding: '10px', background: darkMode ? '#0a192f' : '#f1f5f9', borderRadius: '8px', marginBottom: '12px' }}>
                <div style={{ color: text, fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px' }}>Checklist</div>
                {[{ label: `Photos (${Object.keys(splicePhotos).length}/${requiredPhotos.length})`, done: photosComplete }, ...(requiredPMTests > 0 ? [{ label: `PM Tests (${powerMeterTests.filter(v => v).length}/${requiredPMTests})`, done: pmTestsComplete }] : []), ...(needsOTDR ? [{ label: 'OTDR', done: otdrComplete }] : [])].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ color: item.done ? successGreen : textMuted }}>{item.done ? '✓' : '○'}</span>
                    <span style={{ color: item.done ? successGreen : textMuted, fontSize: '0.8rem' }}>{item.label}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleMarkComplete} disabled={!canComplete} style={{ width: '100%', padding: '12px', background: canComplete ? successGreen : `${successGreen}40`, color: '#fff', border: 'none', borderRadius: '8px', cursor: canComplete ? 'pointer' : 'default', fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CheckCircle size={18} /> Mark Splice Complete
              </button>
            </div>
          )}

          {status === 'Complete' && (
            <div style={{ padding: '12px', background: `${warningYellow}10`, borderRadius: '8px', border: `1px solid ${warningYellow}30` }}>
              <div style={{ color: warningYellow, fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}><Shield size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Final QC</div>
              {isAdmin ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onQCApprove && onQCApprove({ spliceId: splicePoint?.splice_id, phase: 'splicing', approved: true })} style={{ flex: 1, padding: '10px', background: successGreen, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>✓ Approve</button>
                  <button onClick={() => onQCApprove && onQCApprove({ spliceId: splicePoint?.splice_id, phase: 'splicing', approved: false })} style={{ padding: '10px 16px', background: errorRed, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>✗ Reject</button>
                </div>
              ) : (
                <div style={{ color: textMuted, fontSize: '0.85rem' }}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Pending admin QC</div>
              )}
            </div>
          )}

          {status === 'QC Approved' && (
            <div style={{ padding: '16px', background: `${successGreen}10`, borderRadius: '8px', border: `1px solid ${successGreen}30`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={22} color={successGreen} />
              <div>
                <div style={{ color: successGreen, fontWeight: '600' }}>Splice Complete & Approved</div>
                <div style={{ color: textMuted, fontSize: '0.8rem' }}>{spliceType} {positionType} • ${billingInfo.total.toFixed(2)}</div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div style={{ marginTop: '12px', padding: '10px', background: darkMode ? '#0a192f' : '#f1f5f9', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
              <div style={{ color: textMuted, fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px' }}>💰 Billing</div>
              {billingInfo.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: textMuted, fontSize: '0.8rem' }}>{item.code}: {item.desc} × {item.qty}</span>
                  <span style={{ color: text, fontSize: '0.8rem', fontWeight: '500' }}>${(item.qty * item.price).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${borderColor}`, marginTop: '4px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: text, fontWeight: '600', fontSize: '0.85rem' }}>Total</span>
                <span style={{ color: successGreen, fontWeight: '700', fontSize: '0.9rem' }}>${billingInfo.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '2px 8px 4px', textAlign: 'right' }}><span style={{ fontSize: '0.6rem', color: 'transparent', userSelect: 'none' }} onDoubleClick={(e) => { e.target.style.color = textMuted; }}>SplicingTracker v1.0.0</span></div>
    </div>
  );
}

export default SplicingTracker;
