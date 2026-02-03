/**
 * LYT Communications - QC Approval
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Admin QC review interface for approving/rejecting work.
 * Shows checklist, photo gallery, test results, and actions.
 */

import React, { useState, useCallback } from 'react';
import {
  Shield, CheckCircle, X, Check, Camera, AlertTriangle,
  ChevronLeft, ChevronRight, Activity, Loader
} from 'lucide-react';
import { STATUS_COLORS } from '../../config/mapConfig';

function QCApproval({ item, phase, photos = {}, requiredPhotos = [], testResults = [], requiredTestCount = 0, darkMode, user, onApprove, onReject }) {
  const [qcNotes, setQcNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [updating, setUpdating] = useState(false);

  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  const isAdmin = user?.role === 'Admin' || user?.role === 'QC Inspector';
  const uploadedCount = Object.keys(photos).length;
  const photosComplete = uploadedCount >= requiredPhotos.length;
  const testsComplete = testResults.length >= requiredTestCount;
  const photoEntries = Object.entries(photos);

  const handleApprove = useCallback(async () => {
    if (!isAdmin) return;
    setUpdating(true);
    try { await onApprove?.({ notes: qcNotes, approved_by: user?.name || user?.email, timestamp: new Date().toISOString() }); }
    catch (err) { console.error('Approval failed:', err); }
    setUpdating(false);
  }, [isAdmin, qcNotes, user, onApprove]);

  const handleReject = useCallback(async () => {
    if (!isAdmin || !qcNotes.trim()) { alert('Please provide rejection notes.'); return; }
    setUpdating(true);
    try { await onReject?.({ notes: qcNotes, rejected_by: user?.name || user?.email, timestamp: new Date().toISOString() }); }
    catch (err) { console.error('Rejection failed:', err); }
    setUpdating(false);
  }, [isAdmin, qcNotes, user, onReject]);

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: darkMode ? '#0d1b2a' : '#ffffff', color: text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
  const btnStyle = (color) => ({ padding: '10px 20px', borderRadius: '8px', border: 'none', background: color, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', opacity: updating ? 0.6 : 1, pointerEvents: updating ? 'none' : 'auto', flex: 1, justifyContent: 'center' });

  if (!item) return null;

  return (
    <div style={{ background: cardBg, borderRadius: '12px', border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
      <div style={{ padding: '16px', background: darkMode ? '#1a2f4a' : '#f0f7ff', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color={accent} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: text }}>QC Review: {phase.charAt(0).toUpperCase() + phase.slice(1)}</div>
            <div style={{ fontSize: '0.8rem', color: textMuted }}>{item.contractor_id || item.segment_id || item.splice_id}</div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div style={{ padding: '16px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: text, marginBottom: '10px' }}>Requirements Checklist</div>
        <div style={{ display: 'grid', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            {photosComplete ? <CheckCircle size={16} color={STATUS_COLORS.COMPLETE} /> : <AlertTriangle size={16} color={STATUS_COLORS.ISSUE} />}
            <span style={{ color: text }}>Photos: {uploadedCount}/{requiredPhotos.length}</span>
          </div>
          {requiredTestCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              {testsComplete ? <CheckCircle size={16} color={STATUS_COLORS.COMPLETE} /> : <AlertTriangle size={16} color={STATUS_COLORS.ISSUE} />}
              <span style={{ color: text }}>Tests: {testResults.length}/{requiredTestCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Photo Gallery */}
      {photoEntries.length > 0 && (
        <div style={{ padding: '16px', borderBottom: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Camera size={16} color={accent} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: text }}>Photo Review</span>
          </div>
          {selectedPhoto && (
            <div style={{ marginBottom: '12px', position: 'relative' }}>
              <img src={selectedPhoto.url} alt={selectedPhoto.type} style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px', background: '#000' }} />
              <button onClick={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}><X size={16} color="#fff" /></button>
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#fff' }}>{selectedPhoto.type}</div>
              {photoEntries.length > 1 && (
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '8px', right: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={() => { const i = (photoIndex - 1 + photoEntries.length) % photoEntries.length; setPhotoIndex(i); setSelectedPhoto({ type: photoEntries[i][0], url: photoEntries[i][1] }); }} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}><ChevronLeft size={20} color="#fff" /></button>
                  <button onClick={() => { const i = (photoIndex + 1) % photoEntries.length; setPhotoIndex(i); setSelectedPhoto({ type: photoEntries[i][0], url: photoEntries[i][1] }); }} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}><ChevronRight size={20} color="#fff" /></button>
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px' }}>
            {photoEntries.map(([type, url], idx) => (
              <div key={type} onClick={() => { setSelectedPhoto({ type, url }); setPhotoIndex(idx); }} style={{ cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', border: `2px solid ${selectedPhoto?.type === type ? accent : 'transparent'}`, aspectRatio: '1' }}>
                <img src={url} alt={type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={{ padding: '16px', borderBottom: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Activity size={16} color={accent} /><span style={{ fontSize: '0.85rem', fontWeight: 600, color: text }}>Test Results</span></div>
          {testResults.map((test, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', color: text }}>
              <span>#{test.fiber}</span><span>{test.wavelength}nm</span><span>{test.value}</span>
              <span style={{ color: test.pass ? STATUS_COLORS.COMPLETE : STATUS_COLORS.ISSUE, fontWeight: 600 }}>{test.pass ? 'PASS' : 'FAIL'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {isAdmin && (
        <div style={{ padding: '16px' }}>
          <textarea value={qcNotes} onChange={(e) => setQcNotes(e.target.value)} placeholder="QC notes (required for rejection)..." rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleApprove} style={btnStyle(STATUS_COLORS.QC_APPROVED)}>{updating ? <Loader size={16} /> : <Check size={16} />} Approve</button>
            <button onClick={handleReject} style={btnStyle(STATUS_COLORS.ISSUE)}>{updating ? <Loader size={16} /> : <X size={16} />} Reject</button>
          </div>
        </div>
      )}

      <div style={{ position: 'relative' }}><div style={{ position: 'absolute', bottom: '2px', right: '8px', fontSize: '0.55rem', color: 'transparent', userSelect: 'none' }} onDoubleClick={(e) => { e.target.style.color = textMuted; }}>QCApproval v1.0.0</div></div>
    </div>
  );
}

export default QCApproval;
