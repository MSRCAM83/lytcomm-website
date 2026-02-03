/**
 * LYT Communications - Photo Uploader
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Reusable photo capture/upload component with:
 * - Mobile camera integration (rear camera preferred)
 * - File upload for desktop
 * - GPS metadata capture
 * - Photo type tagging
 * - Thumbnail preview
 */

import React, { useState, useRef, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { Camera, Upload, X, CheckCircle, Image, MapPin, Loader } from 'lucide-react';

function PhotoUploader({ 
  requiredTypes,
  requiredPhotos,
  uploadedPhotos = {},
  onUpload,
  onPhotoUpload,
  onPhotoRemove,
  darkMode,
  disabled = false,
  compact = false,
  // eslint-disable-next-line no-unused-vars
  segmentId,
  // eslint-disable-next-line no-unused-vars
  workType,
}) {
  const [uploading, setUploading] = useState(null);
  const [previews, setPreviews] = useState({});
  const [gpsLocation, setGpsLocation] = useState(null);
  const fileInputRefs = useRef({});

  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';
  const successGreen = '#28a745';

  // Normalize props - support both naming conventions
  const photoTypes = requiredTypes || requiredPhotos || [];
  const handleUpload = onUpload || (onPhotoUpload ? (data) => onPhotoUpload(data.photo_type, data) : null);

  const captureGPS = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const handleFileSelect = useCallback(async (photoType, file) => {
    if (!file || disabled) return;
    captureGPS();
    const reader = new FileReader();
    reader.onload = (e) => { setPreviews(prev => ({ ...prev, [photoType]: e.target.result })); };
    reader.readAsDataURL(file);
    setUploading(photoType);
    try { await handleUpload?.({ photo_type: photoType, file, gps: gpsLocation, timestamp: new Date().toISOString() }); }
    catch (err) { console.error('Upload failed:', err); }
    setUploading(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, gpsLocation, captureGPS]);

  const uploadedCount = Object.keys(uploadedPhotos).length;
  const totalRequired = photoTypes.length;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: uploadedCount >= totalRequired ? successGreen : textMuted }}>
          <Camera size={14} /> {uploadedCount}/{totalRequired}
        </div>
        {uploadedCount < totalRequired && !disabled && (
          <label style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${accent}`, color: accent, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Upload size={12} /> Add
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
              onChange={(e) => { const m = photoTypes.find(t => !uploadedPhotos[t]); if (m) handleFileSelect(m, e.target.files[0]); }} />
          </label>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: cardBg, borderRadius: '12px', border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: text, fontWeight: 600, fontSize: '0.9rem' }}>
          <Camera size={18} color={accent} /> Photos
          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: uploadedCount >= totalRequired ? successGreen + '20' : accent + '20', color: uploadedCount >= totalRequired ? successGreen : accent }}>{uploadedCount}/{totalRequired}</span>
        </div>
        {gpsLocation && <div style={{ fontSize: '0.7rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> GPS</div>}
      </div>
      <div style={{ padding: '12px', display: 'grid', gap: '8px' }}>
        {photoTypes.map((photoType, idx) => {
          const isUploaded = !!uploadedPhotos[photoType];
          const preview = previews[photoType];
          const isCurrentlyUploading = uploading === photoType;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', border: `1px solid ${isUploaded ? successGreen + '40' : borderColor}`, background: isUploaded ? successGreen + '06' : 'transparent' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isUploaded ? successGreen + '15' : darkMode ? '#1e3a5f' : '#e2e8f0' }}>
                {(preview || uploadedPhotos[photoType]) ? <img src={preview || uploadedPhotos[photoType]} alt={photoType} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : isCurrentlyUploading ? <Loader size={18} color={accent} /> : <Image size={18} color={textMuted} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{photoType}</div>
                <div style={{ fontSize: '0.7rem', color: textMuted }}>{isUploaded ? 'Uploaded ✓' : isCurrentlyUploading ? 'Uploading...' : 'Required'}</div>
              </div>
              {!isUploaded && !disabled && (
                <label style={{ padding: '6px 10px', borderRadius: '6px', background: accent, color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, opacity: isCurrentlyUploading ? 0.6 : 1 }}>
                  {isCurrentlyUploading ? <Loader size={12} /> : <Camera size={12} />}
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} ref={el => fileInputRefs.current[photoType] = el} onChange={(e) => handleFileSelect(photoType, e.target.files[0])} disabled={isCurrentlyUploading} />
                </label>
              )}
              {isUploaded && <CheckCircle size={18} color={successGreen} style={{ flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '2px', right: '8px', fontSize: '0.55rem', color: 'transparent', userSelect: 'none' }} onDoubleClick={(e) => { e.target.style.color = textMuted; }}>PhotoUploader v1.1.0</div>
      </div>
    </div>
  );
}

export default PhotoUploader;
