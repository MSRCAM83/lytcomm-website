/**
 * LYT Communications - Boring Phase Tracker
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Manages boring workflow: Potholing → Approval → Boring → QC
 * Used by contractors (status updates, photos) and admins (QC approval).
 */

import React, { useState, useCallback } from 'react';
import { Camera, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, Upload, MapPin, Ruler, Send, X, AlertTriangle } from 'lucide-react';

const BORING_STATUSES = ['Not Started', 'Potholing', 'Pothole Approved', 'In Progress', 'Complete', 'QC Approved', 'Issue'];

const STATUS_COLORS = {
  'Not Started': '#FF4444',
  'Potholing': '#FFB800',
  'Pothole Approved': '#2196F3',
  'In Progress': '#FFB800',
  'Complete': '#4CAF50',
  'QC Approved': '#2196F3',
  'Issue': '#FF9800',
};

function BoringTracker({ segment, darkMode, user, onStatusUpdate, onPhotoUpload }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [actualFootage, setActualFootage] = useState(segment?.boring_actual_footage || '');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);

  const bg = darkMode ? '#112240' : '#f8fafc';
  const cardBg = darkMode ? '#1a2f4e' : '#ffffff';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  const status = segment?.boring_status || 'Not Started';
  const isAdmin = user?.role === 'Admin';
  const isContractor = user?.role === 'Contractor' || user?.role === 'Employee';

  const handlePhotoCapture = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      type: 'boring',
      timestamp: new Date().toISOString(),
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  const removePhoto = (index) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleStatusChange = (newStatus) => {
    setShowConfirm(newStatus);
  };

  const confirmStatusChange = () => {
    if (onStatusUpdate && showConfirm) {
      onStatusUpdate({
        segment_id: segment.segment_id,
        field: 'boring_status',
        value: showConfirm,
        notes,
        actual_footage: actualFootage,
        photos: photos.map(p => p.file),
        timestamp: new Date().toISOString(),
        user: user?.email,
      });
    }
    setShowConfirm(null);
    setNotes('');
  };

  const getNextActions = () => {
    switch (status) {
      case 'Not Started':
        return isContractor ? [{ label: 'Start Potholing', status: 'Potholing', color: '#FFB800' }] : [];
      case 'Potholing':
        return isContractor ? [{ label: 'Submit Pothole Photos', status: 'Potholing', color: '#FFB800', needsPhotos: true }] : 
               isAdmin ? [{ label: 'Approve Pothole', status: 'Pothole Approved', color: '#2196F3' }] : [];
      case 'Pothole Approved':
        return isContractor ? [{ label: 'Start Boring', status: 'In Progress', color: '#FFB800' }] : [];
      case 'In Progress':
        return isContractor ? [
          { label: 'Mark Complete', status: 'Complete', color: '#4CAF50', needsPhotos: true, needsFootage: true },
          { label: 'Report Issue', status: 'Issue', color: '#FF9800' }
        ] : [];
      case 'Complete':
        return isAdmin ? [
          { label: 'QC Approve', status: 'QC Approved', color: '#2196F3' },
          { label: 'Reject - Redo', status: 'In Progress', color: '#FF9800' }
        ] : [];
      case 'Issue':
        return isContractor ? [{ label: 'Issue Resolved', status: 'In Progress', color: '#FFB800' }] :
               isAdmin ? [{ label: 'Clear Issue', status: 'In Progress', color: '#FFB800' }] : [];
      default:
        return [];
    }
  };

  const actions = getNextActions();
  const statusColor = STATUS_COLORS[status] || '#9E9E9E';
  const progressPercent = BORING_STATUSES.indexOf(status) / (BORING_STATUSES.length - 2) * 100;

  return (
    <div style={{
      backgroundColor: cardBg,
      border: `1px solid ${borderColor}`,
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '12px',
    }}>
      {/* Header - always visible */}
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
              🚧 Boring: {segment?.contractor_id}
            </span>
            <span style={{
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              backgroundColor: statusColor + '20',
              color: statusColor,
            }}>
              {status}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: textMuted, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span><Ruler size={12} style={{ marginRight: '3px' }} />{segment?.footage} LF</span>
            <span><MapPin size={12} style={{ marginRight: '3px' }} />{segment?.street}</span>
            {segment?.boring_assigned_to && (
              <span>👷 {segment.boring_assigned_to}</span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={20} color={textMuted} /> : <ChevronDown size={20} color={textMuted} />}
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', backgroundColor: darkMode ? '#0d1b2a' : '#e2e8f0' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(progressPercent, 100)}%`,
          backgroundColor: statusColor,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '16px', borderTop: `1px solid ${borderColor}` }}>
          {/* Status timeline */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: textMuted, marginBottom: '8px' }}>
              WORKFLOW PROGRESS
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {BORING_STATUSES.filter(s => s !== 'Issue').map((s, i) => {
                const isActive = BORING_STATUSES.indexOf(status) >= i;
                const isCurrent = status === s;
                return (
                  <div key={s} style={{
                    flex: 1,
                    minWidth: '60px',
                    textAlign: 'center',
                    padding: '6px 4px',
                    borderRadius: '6px',
                    fontSize: '0.65rem',
                    fontWeight: isCurrent ? '700' : '500',
                    backgroundColor: isActive ? (STATUS_COLORS[s] || '#9E9E9E') + '20' : (darkMode ? '#0d1b2a' : '#f1f5f9'),
                    color: isActive ? (STATUS_COLORS[s] || '#9E9E9E') : textMuted,
                    border: isCurrent ? `2px solid ${STATUS_COLORS[s]}` : '2px solid transparent',
                  }}>
                    {s}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: textMuted }}>From: </span>
              <span style={{ color: text, fontWeight: '500' }}>{segment?.from_handhole}</span>
            </div>
            <div>
              <span style={{ color: textMuted }}>To: </span>
              <span style={{ color: text, fontWeight: '500' }}>{segment?.to_handhole}</span>
            </div>
            <div>
              <span style={{ color: textMuted }}>Plan footage: </span>
              <span style={{ color: text, fontWeight: '500' }}>{segment?.footage} LF</span>
            </div>
            {segment?.boring_actual_footage && (
              <div>
                <span style={{ color: textMuted }}>Actual: </span>
                <span style={{ color: text, fontWeight: '500' }}>{segment.boring_actual_footage} LF</span>
              </div>
            )}
            {segment?.boring_started && (
              <div>
                <span style={{ color: textMuted }}>Started: </span>
                <span style={{ color: text }}>{new Date(segment.boring_started).toLocaleDateString()}</span>
              </div>
            )}
            {segment?.boring_completed && (
              <div>
                <span style={{ color: textMuted }}>Completed: </span>
                <span style={{ color: text }}>{new Date(segment.boring_completed).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Actual footage input (when completing) */}
          {status === 'In Progress' && isContractor && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: textMuted, marginBottom: '4px' }}>
                Actual Footage (LF)
              </label>
              <input
                type="number"
                value={actualFootage}
                onChange={(e) => setActualFootage(e.target.value)}
                placeholder={`Plan: ${segment?.footage} LF`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: darkMode ? '#0d1b2a' : '#ffffff',
                  color: text,
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Photo upload area */}
          {(status === 'In Progress' || status === 'Potholing') && isContractor && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: textMuted, marginBottom: '4px' }}>
                <Camera size={14} style={{ marginRight: '4px' }} />
                Photos ({photos.length} / 3 minimum)
              </label>
              
              {/* Photo grid */}
              {photos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  {photos.map((photo, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img
                        src={photo.preview}
                        alt={`Bore photo ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          width: '22px', height: '22px', borderRadius: '50%',
                          backgroundColor: '#e85a4f', border: 'none', color: '#fff',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: `2px dashed ${borderColor}`,
                cursor: 'pointer',
                color: accent,
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'border-color 0.2s',
              }}>
                <Upload size={16} />
                Take Photo or Upload
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handlePhotoCapture}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: textMuted, marginBottom: '4px' }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this bore..."
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
          {actions.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleStatusChange(action.status)}
                  disabled={action.needsPhotos && photos.length < 1}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: action.needsPhotos && photos.length < 1 ? '#9E9E9E' : action.color,
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: action.needsPhotos && photos.length < 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {action.status === 'QC Approved' ? <CheckCircle size={16} /> :
                   action.status === 'Issue' ? <AlertTriangle size={16} /> :
                   <Send size={16} />}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* QC Approved info */}
          {status === 'QC Approved' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#2196F3' + '15',
              color: '#2196F3',
              fontSize: '0.85rem',
            }}>
              <CheckCircle size={18} />
              <div>
                <strong>QC Approved</strong>
                {segment?.boring_qc_approved_by && (
                  <span> by {segment.boring_qc_approved_by}</span>
                )}
                {segment?.boring_qc_approved_date && (
                  <span> on {new Date(segment.boring_qc_approved_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: cardBg,
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ color: text, marginTop: 0, marginBottom: '12px' }}>
              Confirm Status Change
            </h3>
            <p style={{ color: textMuted, fontSize: '0.9rem', marginBottom: '20px' }}>
              Change boring status for <strong>{segment?.contractor_id}</strong> to <strong>{showConfirm}</strong>?
              {photos.length > 0 && ` (${photos.length} photos will be uploaded)`}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowConfirm(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: 'transparent',
                  color: textMuted,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: accent,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoringTracker;

// v1.0.0
