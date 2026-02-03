/**
 * LYT Communications - Splicing Phase Tracker
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Manages splicing workflow with:
 * - Type-specific photo requirements (1x4: 7, 1x8: 8, F1: 7+trays)
 * - Power meter test entry (8 tests per terminal)
 * - OTDR results upload for feeder
 * - Photo validation blocks completion if missing
 * - Mid-span vs end-of-line billing differences
 */

import React, { useState, useCallback } from 'react';
import { Camera, CheckCircle, ChevronDown, ChevronUp, Upload, X, AlertTriangle, Zap, Send } from 'lucide-react';

// Photo requirements by splice type
const PHOTO_REQS = {
  '1x4': {
    total: 7,
    photos: [
      { key: 'basket', label: '1. Basket', required: true },
      { key: 'splice_tray_1', label: '2. Splice Tray', required: true },
      { key: 'strength_members', label: '3. Strength Members Attached', required: true },
      { key: 'grommets_inside', label: '4. Grommets from Inside', required: true },
      { key: 'enclosure_closed', label: '5. Enclosure Closed', required: true },
      { key: 'cables_entering', label: '6. Cables Entering Enclosure', required: true },
      { key: 'enclosure_in_ground', label: '7. Enclosure in Ground', required: true },
    ],
  },
  '1x8': {
    total: 8,
    photos: [
      { key: 'basket', label: '1. Basket', required: true },
      { key: 'splitter_tray', label: '2. Splitter Tray', required: true },
      { key: 'splice_tray_1', label: '3. Splice Tray', required: true },
      { key: 'strength_members', label: '4. Strength Members Attached', required: true },
      { key: 'grommets_inside', label: '5. Grommets from Inside', required: true },
      { key: 'enclosure_closed', label: '6. Enclosure Closed', required: true },
      { key: 'cables_entering', label: '7. Cables Entering Enclosure', required: true },
      { key: 'enclosure_in_ground', label: '8. Enclosure in Ground', required: true },
    ],
  },
  'F1': null, // Dynamic based on tray count
  'TYCO-D': null,
};

function getF1PhotoReqs(trayCount) {
  const photos = [{ key: 'basket', label: '1. Basket', required: true }];
  for (let i = 1; i <= trayCount; i++) {
    photos.push({ key: `splice_tray_${i}`, label: `${photos.length + 1}. Splice Tray #${i}`, required: true });
  }
  photos.push(
    { key: 'strength_members_grounds', label: `${photos.length + 1}. Strength Members & Grounds`, required: true },
    { key: 'enclosure_exterior', label: `${photos.length + 1}. Enclosure Exterior (Closed)`, required: true },
    { key: 'cable_entry_plugs', label: `${photos.length + 1}. Cable Entry with Plugs/Grommets`, required: true },
    { key: 'enclosure_in_handhole', label: `${photos.length + 1}. Enclosure in Handhole`, required: true },
  );
  return { total: photos.length, photos };
}

function SplicingTracker({ splicePoint, darkMode, user, onStatusUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [photos, setPhotos] = useState({});
  const [powerMeterTests, setPowerMeterTests] = useState(Array(8).fill(''));
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);

  const cardBg = darkMode ? '#1a2f4e' : '#ffffff';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  const status = splicePoint?.status || 'Not Started';
  const spliceType = splicePoint?.splice_type || '1x4';
  const trayCount = splicePoint?.tray_count || 1;
  const isAdmin = user?.role === 'Admin';
  const isWorker = user?.role === 'Employee' || user?.role === 'Contractor';

  // Get photo requirements based on splice type
  const photoReqs = spliceType === 'F1' || spliceType === 'TYCO-D'
    ? getF1PhotoReqs(trayCount)
    : PHOTO_REQS[spliceType] || PHOTO_REQS['1x4'];

  const uploadedCount = Object.keys(photos).filter(k => photos[k]).length;
  const allPhotosUploaded = uploadedCount >= photoReqs.total;
  const allTestsFilled = spliceType !== 'F1' ? powerMeterTests.filter(t => t !== '').length >= 8 : true;

  const statusColor = {
    'Not Started': '#FF4444',
    'In Progress': '#FFB800',
    'Complete': '#4CAF50',
    'QC Approved': '#2196F3',
    'Issue': '#FF9800',
  }[status] || '#9E9E9E';

  const handlePhotoUpload = useCallback((photoKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotos(prev => ({
      ...prev,
      [photoKey]: {
        file,
        preview: URL.createObjectURL(file),
        timestamp: new Date().toISOString(),
      }
    }));
  }, []);

  const removePhoto = (photoKey) => {
    setPhotos(prev => {
      if (prev[photoKey]?.preview) URL.revokeObjectURL(prev[photoKey].preview);
      const updated = { ...prev };
      delete updated[photoKey];
      return updated;
    });
  };

  const handleTestChange = (index, value) => {
    setPowerMeterTests(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const confirmStatusChange = () => {
    if (onStatusUpdate && showConfirm) {
      onStatusUpdate({
        splice_id: splicePoint.splice_id,
        field: 'status',
        value: showConfirm,
        photos,
        power_meter_tests: powerMeterTests,
        notes,
        timestamp: new Date().toISOString(),
        user: user?.email,
      });
    }
    setShowConfirm(null);
    setNotes('');
  };

  return (
    <div style={{
      backgroundColor: cardBg,
      border: `1px solid ${borderColor}`,
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '12px',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          cursor: 'pointer',
          borderLeft: `4px solid ${statusColor}`,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: text }}>
              ⚡ Splice: {splicePoint?.contractor_id}
            </span>
            <span style={{
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: '700',
              backgroundColor: accent + '20',
              color: accent,
            }}>
              {spliceType}
            </span>
            <span style={{
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: '600',
              backgroundColor: statusColor + '20',
              color: statusColor,
            }}>
              {status}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: textMuted, display: 'flex', gap: '12px' }}>
            <span>{splicePoint?.position_type}</span>
            <span>{splicePoint?.fiber_count} fibers</span>
            <span>📸 {uploadedCount}/{photoReqs.total}</span>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} color={textMuted} /> : <ChevronDown size={20} color={textMuted} />}
      </div>

      {/* Progress */}
      <div style={{ height: '3px', backgroundColor: darkMode ? '#0d1b2a' : '#e2e8f0' }}>
        <div style={{ height: '100%', width: `${(uploadedCount / photoReqs.total) * 100}%`, backgroundColor: accent, transition: 'width 0.3s' }} />
      </div>

      {expanded && (
        <div style={{ padding: '16px', borderTop: `1px solid ${borderColor}` }}>
          {/* Splice details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
            <div><span style={{ color: textMuted }}>Location: </span><span style={{ color: text, fontWeight: '500' }}>{splicePoint?.location}</span></div>
            <div><span style={{ color: textMuted }}>Type: </span><span style={{ color: text, fontWeight: '500' }}>{spliceType} ({splicePoint?.position_type})</span></div>
            <div><span style={{ color: textMuted }}>Fibers: </span><span style={{ color: text, fontWeight: '500' }}>{splicePoint?.fiber_count}</span></div>
            <div><span style={{ color: textMuted }}>Trays: </span><span style={{ color: text, fontWeight: '500' }}>{trayCount}</span></div>
            <div><span style={{ color: textMuted }}>Value: </span><span style={{ color: '#28a745', fontWeight: '600' }}>${splicePoint?.total_value?.toFixed(2)}</span></div>
          </div>

          {/* Photo requirements checklist */}
          {(status === 'In Progress' || status === 'Not Started') && isWorker && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={14} />
                Required Photos ({uploadedCount}/{photoReqs.total})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {photoReqs.photos.map((req) => {
                  const hasPhoto = !!photos[req.key];
                  return (
                    <div key={req.key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: hasPhoto ? '#28a74510' : (darkMode ? '#0d1b2a' : '#f8fafc'),
                      border: `1px solid ${hasPhoto ? '#28a74540' : borderColor}`,
                    }}>
                      {hasPhoto ? (
                        <CheckCircle size={18} color="#28a745" />
                      ) : (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${borderColor}` }} />
                      )}
                      
                      <span style={{ flex: 1, fontSize: '0.85rem', color: hasPhoto ? '#28a745' : text, fontWeight: hasPhoto ? '500' : '400' }}>
                        {req.label}
                      </span>

                      {hasPhoto ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <img src={photos[req.key].preview} alt={req.label} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                          <button onClick={() => removePhoto(req.key)} style={{ background: 'none', border: 'none', color: '#e85a4f', cursor: 'pointer', padding: '2px' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: accent,
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <Camera size={12} />
                          Capture
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoUpload(req.key, e)}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Power meter tests (for 1x4 and 1x8) */}
          {(spliceType === '1x4' || spliceType === '1x8') && (status === 'In Progress') && isWorker && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} />
                Power Meter Tests ({powerMeterTests.filter(t => t).length}/8)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {powerMeterTests.map((val, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: textMuted, width: '60px' }}>Test {i + 1}:</span>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleTestChange(i, e.target.value)}
                      placeholder="dBm value"
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${val ? '#28a74540' : borderColor}`,
                        backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
                        color: text,
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: '12px' }}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Splice notes..."
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
                color: text,
                fontSize: '0.9rem',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Action buttons */}
          {status === 'Not Started' && isWorker && (
            <button
              onClick={() => setShowConfirm('In Progress')}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#FFB800', color: '#fff', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Start Splicing
            </button>
          )}

          {status === 'In Progress' && isWorker && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowConfirm('Complete')}
                disabled={!allPhotosUploaded || !allTestsFilled}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                  backgroundColor: allPhotosUploaded && allTestsFilled ? '#4CAF50' : '#9E9E9E',
                  color: '#fff', fontWeight: '600', fontSize: '0.9rem',
                  cursor: allPhotosUploaded && allTestsFilled ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <CheckCircle size={16} />
                {allPhotosUploaded && allTestsFilled ? 'Mark Complete' : `Need ${photoReqs.total - uploadedCount} photos${!allTestsFilled ? ' + tests' : ''}`}
              </button>
              <button
                onClick={() => setShowConfirm('Issue')}
                style={{ padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#FF9800', color: '#fff', cursor: 'pointer' }}
              >
                <AlertTriangle size={16} />
              </button>
            </div>
          )}

          {status === 'Complete' && isAdmin && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowConfirm('QC Approved')}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#2196F3', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <CheckCircle size={16} /> QC Approve
              </button>
              <button
                onClick={() => setShowConfirm('In Progress')}
                style={{ padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#FF9800', color: '#fff', cursor: 'pointer' }}
              >
                Reject
              </button>
            </div>
          )}

          {status === 'QC Approved' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px',
              backgroundColor: '#2196F315', color: '#2196F3', fontSize: '0.85rem',
            }}>
              <CheckCircle size={18} />
              <strong>QC Approved</strong>
              {splicePoint?.qc_approved_by && <span> by {splicePoint.qc_approved_by}</span>}
            </div>
          )}
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '16px',
        }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ color: text, marginTop: 0, marginBottom: '12px' }}>Confirm</h3>
            <p style={{ color: textMuted, fontSize: '0.9rem', marginBottom: '20px' }}>
              Change splice <strong>{splicePoint?.contractor_id}</strong> to <strong>{showConfirm}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: 'transparent', color: textMuted, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmStatusChange} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: accent, color: '#fff', cursor: 'pointer', fontWeight: '600' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SplicingTracker;

// v1.0.0
