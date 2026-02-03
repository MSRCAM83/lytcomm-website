/**
 * LYT Communications - Project Map Page
 * Version: 3.0.0
 * Created: 2026-02-02
 * Updated: 2026-02-03
 * Route: #project-map
 * 
 * Interactive map-based project management view using Leaflet/OpenStreetMap.
 * Displays construction segments as polylines with color-coded status,
 * handhole markers with popups, and segment detail panels.
 * 
 * Features:
 * - Leaflet map with satellite/street toggle (no API key needed)
 * - Color-coded polyline segments (boring/pulling/splicing status)
 * - Clickable handhole markers with popups
 * - Segment detail side panel with workflow tabs
 * - Section/status/phase filters
 * - List view fallback
 * - Photo upload to Google Drive
 * - Auto-refresh polling (30s)
 * - Toast notifications for actions
 * - Mobile-optimized with bottom sheet details
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { ArrowLeft, Map, List, Search, AlertCircle, MapPin, Ruler, Users, Zap, X, ChevronDown, ChevronUp, Filter, Layers, Camera, CheckCircle, Clock, AlertTriangle, Navigation, Wrench, Cable } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { STATUS_COLORS, PHOTO_REQUIREMENTS } from '../config/mapConfig';
import BoringTracker from '../components/Workflow/BoringTracker';
import PullingTracker from '../components/Workflow/PullingTracker';
import SplicingTracker from '../components/Workflow/SplicingTracker';
// eslint-disable-next-line no-unused-vars
import { loadFullProject, isDemoMode, updateSegmentField, logAction } from '../services/mapService';
import { uploadPhotoBatch } from '../services/photoUploadService';
import CrewTracker from '../components/Map/CrewTracker';
// eslint-disable-next-line no-unused-vars
import Toast, { useToast } from '../components/Toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons (webpack issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Helper: get status color
function getStatusColor(status) {
  switch (status) {
    case 'QC Approved': return STATUS_COLORS.QC_APPROVED;
    case 'Complete': return STATUS_COLORS.COMPLETE;
    case 'In Progress': return STATUS_COLORS.IN_PROGRESS;
    case 'Issue': return STATUS_COLORS.ISSUE;
    case 'Blocked': return STATUS_COLORS.BLOCKED;
    default: return STATUS_COLORS.NOT_STARTED;
  }
}

// Helper: get status icon
function StatusIcon({ status, size }) {
  const s = size || 14;
  switch (status) {
    case 'QC Approved': return <CheckCircle size={s} color={STATUS_COLORS.QC_APPROVED} />;
    case 'Complete': return <CheckCircle size={s} color={STATUS_COLORS.COMPLETE} />;
    case 'In Progress': return <Clock size={s} color={STATUS_COLORS.IN_PROGRESS} />;
    case 'Issue': return <AlertTriangle size={s} color={STATUS_COLORS.ISSUE} />;
    default: return <Clock size={s} color={STATUS_COLORS.NOT_STARTED} />;
  }
}

// ===== GOOGLE MAPS COMPONENT =====
function ProjectLeafletMap({ segments, selectedSegment, onSelectSegment, filterPhase, darkMode }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.2366, -93.3776], // Sulphur LA default
      zoom: 15,
      zoomControl: true,
    });

    // Street layer
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    });

    // Satellite layer
    const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 19,
    });

    // Add street layer by default
    streetLayer.addTo(map);

    // Layer control
    L.control.layers({
      'Street': streetLayer,
      'Satellite': satLayer,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Draw segments and markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old layers
    layersRef.current.forEach(l => map.removeLayer(l));
    layersRef.current = [];

    if (!segments || segments.length === 0) return;

    const boundsArr = [];
    const handholes = new window.Map();

    segments.forEach(seg => {
      const startLat = parseFloat(seg.gps_start_lat);
      const startLng = parseFloat(seg.gps_start_lng);
      const endLat = parseFloat(seg.gps_end_lat);
      const endLng = parseFloat(seg.gps_end_lng);

      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) return;

      // Status color
      const statusField = filterPhase === 'pulling' ? seg.pulling_status : filterPhase === 'splicing' ? (seg.splicing_status || 'Not Started') : seg.boring_status;
      const color = statusField === 'QC Approved' ? '#4CAF50' :
                    statusField === 'Complete' ? '#4CAF50' :
                    statusField === 'In Progress' ? '#FFB800' :
                    statusField === 'Issue' ? '#FF9800' :
                    statusField === 'Blocked' ? '#9E9E9E' : '#FF4444';

      // Draw polyline
      const line = L.polyline([[startLat, startLng], [endLat, endLng]], {
        color: color,
        weight: 5,
        opacity: selectedSegment === seg.segment_id ? 1.0 : 0.8,
      }).addTo(map);

      line.bindTooltip(`${seg.contractor_id} • ${seg.footage} LF`, { direction: 'center', className: 'seg-tooltip' });
      line.on('click', () => onSelectSegment(seg.segment_id));
      layersRef.current.push(line);

      boundsArr.push([startLat, startLng], [endLat, endLng]);

      // Collect handholes
      const fromKey = `${startLat},${startLng}`;
      const toKey = `${endLat},${endLng}`;
      if (!handholes.has(fromKey)) handholes.set(fromKey, { lat: startLat, lng: startLng, label: seg.from_handhole || seg.contractor_id?.split('→')[0] || '?' });
      if (!handholes.has(toKey)) handholes.set(toKey, { lat: endLat, lng: endLng, label: seg.to_handhole || seg.contractor_id?.split('→')[1] || '?' });
    });

    // Add handhole markers
    handholes.forEach((hh) => {
      const isLarge = (hh.label || '').includes('30x48');
      const isMedium = (hh.label || '').includes('17x30');
      const radius = isLarge ? 8 : isMedium ? 6 : 5;
      const fillColor = isLarge ? '#2196F3' : isMedium ? '#FFB800' : '#4CAF50';

      const circle = L.circleMarker([hh.lat, hh.lng], {
        radius: radius,
        color: '#fff',
        weight: 2,
        fillColor: fillColor,
        fillOpacity: 1,
      }).addTo(map);

      circle.bindTooltip(hh.label, { permanent: false, direction: 'top', offset: [0, -8] });
      layersRef.current.push(circle);
    });

    // Fit bounds
    if (boundsArr.length > 0) {
      try {
        map.fitBounds(boundsArr, { padding: [40, 40], maxZoom: 17 });
      } catch (e) {
        console.warn('fitBounds error:', e);
      }
    }
  }, [segments, selectedSegment, onSelectSegment, filterPhase]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10, padding: '8px 12px', borderRadius: 8,
        background: darkMode ? 'rgba(17,34,64,0.9)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)', fontSize: 11, zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: darkMode ? '#fff' : '#1e293b' }}>Status Legend</div>
        {[
          ['Not Started', '#FF4444'],
          ['In Progress', '#FFB800'],
          ['Complete', '#4CAF50'],
          ['QC Approved', '#4CAF50'],
          ['Issue', '#FF9800'],
        ].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 20, height: 3, background: color, borderRadius: 2 }} />
            <span style={{ color: darkMode ? '#8892b0' : '#64748b' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// ===== CANVAS FALLBACK MAP (no API key needed) =====
function CanvasMap({ segments, selectedSegment, onSelectSegment, filterPhase, darkMode }) {
  const canvasRef = useRef(null);
  const [hoveredSeg, setHoveredSeg] = useState(null);

  // Calculate bounds
  const bounds = useMemo(() => {
    if (segments.length === 0) return { minLat: 30.23, maxLat: 30.24, minLng: -93.39, maxLng: -93.37 };
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    segments.forEach(s => {
      minLat = Math.min(minLat, s.gps_start.lat, s.gps_end.lat);
      maxLat = Math.max(maxLat, s.gps_start.lat, s.gps_end.lat);
      minLng = Math.min(minLng, s.gps_start.lng, s.gps_end.lng);
      maxLng = Math.max(maxLng, s.gps_start.lng, s.gps_end.lng);
    });
    const padLat = (maxLat - minLat) * 0.15 || 0.001;
    const padLng = (maxLng - minLng) * 0.15 || 0.001;
    return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLng: minLng - padLng, maxLng: maxLng + padLng };
  }, [segments]);

  const toCanvas = useCallback((lat, lng, width, height) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
    const y = height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
    return { x, y };
  }, [bounds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = darkMode ? '#0a1628' : '#e8f0fe';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = darkMode ? '#1e3a5f33' : '#cbd5e133';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let i = 0; i < h; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

    // Draw segments
    const handholes = new Map();
    segments.forEach(seg => {
      const status = filterPhase === 'boring' ? seg.boring_status : filterPhase === 'pulling' ? seg.pulling_status : seg.splicing_status;
      const color = getStatusColor(status);
      const isSelected = selectedSegment && selectedSegment.segment_id === seg.segment_id;
      const isHovered = hoveredSeg === seg.segment_id;

      const start = toCanvas(seg.gps_start.lat, seg.gps_start.lng, w, h);
      const end = toCanvas(seg.gps_end.lat, seg.gps_end.lng, w, h);

      // Segment line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 5 : isHovered ? 4 : 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow effect for selected/hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = color + '40';
        ctx.lineWidth = 12;
        ctx.stroke();
      }

      // Footage label
      const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      ctx.fillStyle = darkMode ? '#ffffff' : '#1e293b';
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${seg.footage}'`, mid.x, mid.y - 8);

      // Contractor ID label
      ctx.fillStyle = darkMode ? '#8892b0' : '#64748b';
      ctx.font = '9px system-ui';
      ctx.fillText(seg.contractor_id, mid.x, mid.y + 12);

      // Track handholes
      const startKey = `${seg.gps_start.lat},${seg.gps_start.lng}`;
      const endKey = `${seg.gps_end.lat},${seg.gps_end.lng}`;
      if (!handholes.has(startKey)) handholes.set(startKey, { pos: start, name: seg.from_handhole });
      if (!handholes.has(endKey)) handholes.set(endKey, { pos: end, name: seg.to_handhole });
    });

    // Draw handhole markers
    handholes.forEach(({ pos, name }) => {
      const isLarge = name.includes('30x48') || name.includes('24x36');
      const isMedium = name.includes('17x30');
      const radius = isLarge ? 8 : isMedium ? 6 : 5;
      const fillColor = isLarge ? '#FF9800' : isMedium ? '#2196F3' : '#4CAF50';

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = darkMode ? '#ffffff' : '#1e293b';
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(name.split(' (')[0], pos.x, pos.y - radius - 4);
    });

    // Title
    ctx.fillStyle = darkMode ? '#8892b0' : '#94a3b8';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('Interactive Canvas Map (Add Google Maps API key for full features)', 10, h - 10);
  }, [segments, selectedSegment, hoveredSeg, filterPhase, darkMode, toCanvas]);

  // Click handler
  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find closest segment
    let closest = null;
    let minDist = 20; // 20px threshold
    segments.forEach(seg => {
      const start = toCanvas(seg.gps_start.lat, seg.gps_start.lng, rect.width, rect.height);
      const end = toCanvas(seg.gps_end.lat, seg.gps_end.lng, rect.width, rect.height);
      // Point-to-line distance
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      const t = Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / (len * len)));
      const px = start.x + t * dx;
      const py = start.y + t * dy;
      const dist = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
      if (dist < minDist) {
        minDist = dist;
        closest = seg;
      }
    });
    if (closest) onSelectSegment(closest);
  }, [segments, toCanvas, onSelectSegment]);

  // Hover handler
  const handleCanvasMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let closest = null;
    let minDist = 15;
    segments.forEach(seg => {
      const start = toCanvas(seg.gps_start.lat, seg.gps_start.lng, rect.width, rect.height);
      const end = toCanvas(seg.gps_end.lat, seg.gps_end.lng, rect.width, rect.height);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      const t = Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / (len * len)));
      const px = start.x + t * dx;
      const py = start.y + t * dy;
      const dist = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
      if (dist < minDist) { minDist = dist; closest = seg; }
    });
    setHoveredSeg(closest ? closest.segment_id : null);
    canvas.style.cursor = closest ? 'pointer' : 'default';
  }, [segments, toCanvas]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {/* Legend overlay */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10, padding: '8px 12px', borderRadius: 8,
        background: darkMode ? 'rgba(17,34,64,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)', fontSize: 11, zIndex: 5,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: darkMode ? '#fff' : '#1e293b' }}>Status Legend</div>
        {[
          ['Not Started', STATUS_COLORS.NOT_STARTED],
          ['In Progress', STATUS_COLORS.IN_PROGRESS],
          ['Complete', STATUS_COLORS.COMPLETE],
          ['QC Approved', STATUS_COLORS.QC_APPROVED],
          ['Issue', STATUS_COLORS.ISSUE],
        ].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 20, height: 3, background: color, borderRadius: 2 }} />
            <span style={{ color: darkMode ? '#8892b0' : '#64748b' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== SEGMENT DETAIL PANEL (v2.5.0 - Photo Upload + Auto-refresh) =====
function SegmentDetailPanel({ segment, darkMode, onClose, isAdmin, user, onSegmentUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!segment) return null;

  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  const phases = [
    { key: 'boring', label: 'Boring', status: segment.boring_status, assigned: segment.boring_assigned_to, icon: '🚧' },
    { key: 'pulling', label: 'Fiber Pulling', status: segment.pulling_status, assigned: segment.pulling_assigned_to, icon: '🚛' },
    { key: 'splicing', label: 'Splicing', status: segment.splicing_status || 'Not Started', assigned: segment.splicing_assigned_to || '', icon: '⚡' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <MapPin size={13} /> },
    { id: 'boring', label: 'Boring', icon: <Wrench size={13} /> },
    { id: 'pulling', label: 'Pulling', icon: <Cable size={13} /> },
    { id: 'splicing', label: 'Splicing', icon: <Zap size={13} /> },
  ];

  // Build segment data that workflow components expect
  const segmentData = {
    ...segment,
    segment_id: segment.segment_id,
    project_id: segment.segment_id?.split('-').slice(0, 3).join('-') || 'VXS-SLPH01-006',
    boring_photos: segment.boring_photos || [],
    pulling_photos: segment.pulling_photos || [],
    splicing_photos: segment.splicing_photos || [],
    boring_actual_footage: segment.boring_actual_footage || segment.footage,
    pulling_cable_type: segment.pulling_cable_type || '',
    pulling_direction: segment.pulling_direction || '',
    handhole_type: segment.to_handhole?.match(/\(([^)]+)\)/)?.[1] || '15x20x12',
  };

  // Placeholder handlers for workflow state changes
  const handleStatusChange = async (phase, statusData) => {
    // statusData comes from workflow trackers - may be string or object
    const newStatus = typeof statusData === 'string' ? statusData : (statusData?.value || statusData?.newStatus || statusData);
    const segId = segment.segment_id;
    const field = phase === 'boring' ? 'boring_status' : phase === 'pulling' ? 'pulling_status' : 'splicing_status';
    console.log(`[ProjectMap] DB write: ${segId}.${field} = ${newStatus}`);

    // Write to Google Sheets
    const ok = await updateSegmentField(segId, field, newStatus);
    if (ok) {
      // Log the action
      await logAction(segment.project_id || 'VXS-SLPH01-006', segId, user?.email, `${phase}_status_changed`, { from: segment[field], to: newStatus, notes: statusData?.notes });
      
      // Write timestamp if completing
      if (newStatus === 'Complete' || newStatus === 'QC Approved') {
        const tsField = phase === 'boring' ? 'boring_completed' : phase === 'pulling' ? 'pulling_completed' : 'completed';
        await updateSegmentField(segId, tsField, new Date().toISOString());
      }
      if (newStatus === 'In Progress') {
        const tsField = phase === 'boring' ? 'boring_started' : phase === 'pulling' ? 'pulling_started' : 'started';
        await updateSegmentField(segId, tsField, new Date().toISOString());
      }
      if (newStatus === 'QC Approved') {
        const qcField = phase === 'boring' ? 'boring_qc_approved_by' : phase === 'pulling' ? 'pulling_qc_approved_by' : 'qc_approved_by';
        const qcDateField = phase === 'boring' ? 'boring_qc_approved_date' : phase === 'pulling' ? 'pulling_qc_approved_date' : 'qc_approved_date';
        await updateSegmentField(segId, qcField, user?.name || user?.email || 'Admin');
        await updateSegmentField(segId, qcDateField, new Date().toISOString());
      }
      if (statusData?.actual_footage) {
        await updateSegmentField(segId, 'boring_actual_footage', statusData.actual_footage);
      }
      if (statusData?.notes) {
        const notesField = phase === 'boring' ? 'boring_notes' : phase === 'pulling' ? 'pulling_notes' : 'notes';
        await updateSegmentField(segId, notesField, statusData.notes);
      }

      // Notify parent to refresh local state
      if (onSegmentUpdate) onSegmentUpdate(segId, field, newStatus);
      console.log(`[ProjectMap] ✅ DB updated: ${segId}.${field} = ${newStatus}`);
    } else {
      console.error(`[ProjectMap] ❌ DB write failed: ${segId}.${field}`);
    }
  };

  const handlePhotoUpload = async (phase, photos) => {
    console.log(`[ProjectMap] Photo upload: ${segment.segment_id} ${phase}`, photos);
    if (!photos || photos.length === 0) return;
    
    const projectId = segment.project_id || 'VXS-SLPH01-006';
    const segId = segment.segment_id;
    
    try {
      // Upload batch to Google Drive
      const results = await uploadPhotoBatch(
        photos.map((p, i) => ({ file: p.file || p, type: `${phase}_photo_${i + 1}` })),
        projectId,
        segId,
        (current, total) => console.log(`[PhotoUpload] ${current}/${total}`)
      );
      
      const successCount = results.filter(r => r.success).length;
      const cachedCount = results.filter(r => r.cached).length;
      
      // Store photo URLs in segment
      const photoUrls = results.filter(r => r.url).map(r => r.url);
      if (photoUrls.length > 0) {
        const photoField = `${phase}_photos`;
        const existing = segment[photoField] ? JSON.parse(segment[photoField]) : [];
        await updateSegmentField(segId, photoField, JSON.stringify([...existing, ...photoUrls]));
      }
      
      // Log the upload
      await logAction(projectId, segId, user?.email, `${phase}_photos_uploaded`, {
        count: photos.length, success: successCount, cached: cachedCount,
      });
      
      console.log(`[ProjectMap] ✅ Photos uploaded: ${successCount} success, ${cachedCount} cached`);
    } catch (err) {
      console.error('[ProjectMap] ❌ Photo upload failed:', err);
    }
  };

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: darkMode ? '#0d1b2a' : '#ffffff',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: text }}>{segment.contractor_id}</div>
          <div style={{ fontSize: 11, color: textMuted }}>{segment.segment_id}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4 }}>
          <X size={20} />
        </button>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${borderColor}`, flexShrink: 0,
        background: darkMode ? '#0a1628' : '#f8fafc',
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          // Show status dot for workflow tabs
          let statusDot = null;
          if (tab.id === 'boring') statusDot = segment.boring_status;
          if (tab.id === 'pulling') statusDot = segment.pulling_status;
          if (tab.id === 'splicing') statusDot = segment.splicing_status || 'Not Started';

          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              borderBottom: isActive ? `2px solid ${accent}` : '2px solid transparent',
              color: isActive ? accent : textMuted,
              fontSize: 11, fontWeight: isActive ? 700 : 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'all 0.2s',
            }}>
              {tab.icon}
              {tab.label}
              {statusDot && (
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: getStatusColor(statusDot),
                  flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'overview' && (
          <div style={{ padding: '14px 16px' }}>
            {/* Location */}
            <div style={{ background: cardBg, borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MapPin size={15} color={accent} />
                <span style={{ fontWeight: 600, color: text, fontSize: 13 }}>Location</span>
              </div>
              <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.7 }}>
                <div><strong style={{ color: text }}>From:</strong> {segment.from_handhole}</div>
                <div><strong style={{ color: text }}>To:</strong> {segment.to_handhole}</div>
                <div><strong style={{ color: text }}>Street:</strong> {segment.street}</div>
                <div><strong style={{ color: text }}>Section:</strong> {segment.section}</div>
              </div>
            </div>

            {/* Footage */}
            <div style={{ background: cardBg, borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ruler size={15} color={accent} />
                <span style={{ fontWeight: 600, color: text, fontSize: 13 }}>Footage</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: accent }}>{segment.footage} <span style={{ fontSize: 13, fontWeight: 400 }}>LF</span></div>
            </div>

            {/* Phase Status */}
            <div style={{ fontWeight: 600, color: text, marginBottom: 8, fontSize: 13 }}>Workflow Status</div>
            {phases.map(phase => (
              <div key={phase.key} onClick={() => setActiveTab(phase.key)} style={{
                background: cardBg, borderRadius: 10, padding: 12, marginBottom: 8,
                border: `1px solid ${borderColor}`,
                borderLeft: `4px solid ${getStatusColor(phase.status)}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#162b4d' : '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = cardBg}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>{phase.icon}</span>
                    <span style={{ fontWeight: 600, color: text, fontSize: 12 }}>{phase.label}</span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                    background: getStatusColor(phase.status) + '20',
                    color: getStatusColor(phase.status),
                  }}>
                    <StatusIcon status={phase.status} size={11} />
                    {phase.status}
                  </div>
                </div>
                {phase.assigned && (
                  <div style={{ fontSize: 11, color: textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={10} /> {phase.assigned}
                  </div>
                )}
                <div style={{ fontSize: 10, color: accent, marginTop: 4, textAlign: 'right' }}>Tap to manage →</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'boring' && (
          <div style={{ padding: '8px' }}>
            <BoringTracker
              segment={segmentData}
              darkMode={darkMode}
              user={user}
              onStatusUpdate={(status) => handleStatusChange('boring', status)}
              onPhotoUpload={(photos) => handlePhotoUpload('boring', photos)}
            />
          </div>
        )}

        {activeTab === 'pulling' && (
          <div style={{ padding: '8px' }}>
            <PullingTracker
              segment={segmentData}
              darkMode={darkMode}
              user={user}
              isAdmin={isAdmin || false}
              isSplicer={user?.role === 'Splicer' || false}
              onStatusUpdate={(status) => handleStatusChange('pulling', status)}
              onPhotoUpload={(photos) => handlePhotoUpload('pulling', photos)}
              onQCApprove={(data) => handleStatusChange('pulling', 'QC Approved')}
            />
          </div>
        )}

        {activeTab === 'splicing' && (
          <div style={{ padding: '8px' }}>
            <SplicingTracker
              segment={segmentData}
              darkMode={darkMode}
              user={user}
              isAdmin={isAdmin || false}
              onStatusUpdate={(status) => handleStatusChange('splicing', status)}
              onPhotoUpload={(photos) => handlePhotoUpload('splicing', photos)}
              onQCApprove={(data) => handleStatusChange('splicing', 'QC Approved')}
            />
          </div>
        )}
      </div>

      {/* Version tag */}
      <div style={{ padding: '4px 16px', fontSize: 9, color: 'transparent', textAlign: 'right', userSelect: 'none', flexShrink: 0 }}>v2.2.0</div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
function ProjectMapPage({ darkMode, setDarkMode, user, setCurrentPage, projectId }) {
  const [viewMode, setViewMode] = useState('map');
  const [filterSection, setFilterSection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPhase, setFilterPhase] = useState('boring');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Dynamic data state
  const [allSegments, setAllSegments] = useState([]);
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('loading');

  const [showVersion, setShowVersion] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [lastRefresh, setLastRefresh] = useState(null);

  const isAdmin = user?.role === 'Admin' || user?.role === 'admin';
  const isContractor = user?.role === 'Contractor' || user?.role === 'contractor';

  // Load project data on mount + auto-refresh every 30s
  useEffect(() => {
    let cancelled = false;
    let refreshInterval = null;

    async function fetchData(silent = false) {
      if (!silent) setLoading(true);
      try {
        const data = await loadFullProject(projectId || 'VXS-SLPH01-006');
        if (!cancelled) {
          setAllSegments(data.segments);
          setProjectInfo(data.project);
          setDataSource(data.isDemo ? 'demo' : 'live');
          setLastRefresh(new Date());
          if (!silent) setLoading(false);
        }
      } catch (err) {
        console.error('[ProjectMapPage] Data load failed:', err);
        if (!cancelled && !silent) { setLoading(false); setDataSource('demo'); }
      }
    }

    fetchData(false);

    // Auto-refresh every 30 seconds (silent - no loading spinner)
    refreshInterval = setInterval(() => {
      if (!cancelled) fetchData(true);
    }, 30000);

    return () => { cancelled = true; if (refreshInterval) clearInterval(refreshInterval); };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bg = darkMode ? '#0d1b2a' : '#ffffff';
  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  // Contractor-filtered base segments (contractors only see assigned work)
  const visibleSegments = useMemo(() => {
    if (!isContractor || !user?.company) return allSegments;
    const company = (user.company || '').toLowerCase();
    return allSegments.filter(seg => {
      const boringMatch = (seg.boring_assigned_to || '').toLowerCase().includes(company);
      const pullingMatch = (seg.pulling_assigned_to || '').toLowerCase().includes(company);
      const splicingMatch = (seg.splicing_assigned_to || '').toLowerCase().includes(company);
      return boringMatch || pullingMatch || splicingMatch;
    });
  }, [allSegments, isContractor, user]);

  // Filter segments (section, status, phase, search)
  const filteredSegments = useMemo(() => {
    return visibleSegments.filter(seg => {
      if (filterSection !== 'all' && seg.section !== filterSection) return false;
      if (filterStatus !== 'all') {
        const status = filterPhase === 'boring' ? seg.boring_status : filterPhase === 'pulling' ? seg.pulling_status : seg.splicing_status;
        if (status !== filterStatus) return false;
      }
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (seg.contractor_id || '').toLowerCase().includes(search) || (seg.street || '').toLowerCase().includes(search) || (seg.segment_id || '').toLowerCase().includes(search);
      }
      return true;
    });
  }, [visibleSegments, filterSection, filterStatus, filterPhase, searchTerm]);

  // Stats (based on visible segments for role-appropriate counts)
  const stats = useMemo(() => {
    const totalFootage = visibleSegments.reduce((sum, s) => sum + (parseFloat(s.footage) || 0), 0);
    const phaseKey = filterPhase === 'boring' ? 'boring_status' : filterPhase === 'pulling' ? 'pulling_status' : 'splicing_status';
    const approved = visibleSegments.filter(s => s[phaseKey] === 'QC Approved').length;
    const complete = visibleSegments.filter(s => s[phaseKey] === 'Complete').length;
    const inProgress = visibleSegments.filter(s => s[phaseKey] === 'In Progress').length;
    const issues = visibleSegments.filter(s => s[phaseKey] === 'Issue').length;
    const notStarted = visibleSegments.filter(s => s[phaseKey] === 'Not Started').length;
    return { totalFootage, approved, complete, inProgress, issues, notStarted, total: visibleSegments.length };
  }, [visibleSegments, filterPhase]);

  const handleSelectSegment = useCallback((seg) => {
    setSelectedSegment(prev => prev && prev.segment_id === seg.segment_id ? null : seg);
  }, []);

  const sections = [...new Set(visibleSegments.map(s => s.section))].sort();

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Loading Overlay */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: darkMode ? 'rgba(13,27,42,0.92)' : 'rgba(255,255,255,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${borderColor}`, borderTopColor: accent, borderRadius: '50%', animation: 'mapSpin 0.8s linear infinite' }} />
          <div style={{ color: textMuted, fontSize: 13 }}>Loading project data...</div>
          <style>{`@keyframes mapSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {/* Top Bar */}
      <div style={{
        padding: '12px 20px', borderBottom: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: darkMode ? '#112240' : '#f8fafc', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setCurrentPage(isAdmin ? 'admin-projects' : (user?.role === 'Contractor' || user?.role === 'contractor') ? 'contractor-dashboard' : 'employee-dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              {projectInfo?.project_name || 'Loading...'}
              {isContractor && <span style={{ padding: '1px 6px', borderRadius: 4, background: '#667eea', color: '#fff', fontSize: 10, fontWeight: 600 }}>CONTRACTOR VIEW</span>}
            </div>
            <div style={{ fontSize: 12, color: textMuted }}>
              {projectInfo?.project_id || '---'}{!isContractor && ` • PO: ${projectInfo?.po_number || '---'}`}
              {dataSource === 'demo' && <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 4, background: '#ff6b35', color: '#fff', fontSize: 10, fontWeight: 600 }}>DEMO</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
            <button onClick={() => setViewMode('map')} style={{
              padding: '6px 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
              background: viewMode === 'map' ? accent : 'transparent', color: viewMode === 'map' ? '#fff' : textMuted,
            }}>
              <Map size={14} /> Map
            </button>
            <button onClick={() => setViewMode('list')} style={{
              padding: '6px 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
              background: viewMode === 'list' ? accent : 'transparent', color: viewMode === 'list' ? '#fff' : textMuted,
            }}>
              <List size={14} /> List
            </button>
          </div>
          {/* Filter toggle */}
          <button onClick={() => setShowFilters(!showFilters)} style={{
            padding: '6px 10px', border: `1px solid ${borderColor}`, borderRadius: 8, cursor: 'pointer',
            background: showFilters ? accent + '20' : 'transparent', color: showFilters ? accent : textMuted,
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
          }}>
            <Filter size={14} /> Filters
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div style={{
          padding: '10px 20px', borderBottom: `1px solid ${borderColor}`,
          background: darkMode ? '#0f1f38' : '#f1f5f9',
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', flexShrink: 0,
        }}>
          {/* Phase selector */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['boring', 'pulling', 'splicing'].map(phase => (
              <button key={phase} onClick={() => setFilterPhase(phase)} style={{
                padding: '4px 12px', borderRadius: 16, border: `1px solid ${borderColor}`, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: filterPhase === phase ? accent : 'transparent', color: filterPhase === phase ? '#fff' : textMuted,
              }}>
                {phase === 'boring' ? '🚧' : phase === 'pulling' ? '🚛' : '⚡'} {phase.charAt(0).toUpperCase() + phase.slice(1)}
              </button>
            ))}
          </div>

          {/* Section filter */}
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)} style={{
            padding: '4px 8px', borderRadius: 6, border: `1px solid ${borderColor}`, fontSize: 12,
            background: darkMode ? '#112240' : '#fff', color: text,
          }}>
            <option value="all">All Sections</option>
            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>

          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
            padding: '4px 8px', borderRadius: 6, border: `1px solid ${borderColor}`, fontSize: 12,
            background: darkMode ? '#112240' : '#fff', color: text,
          }}>
            <option value="all">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Complete">Complete</option>
            <option value="QC Approved">QC Approved</option>
            <option value="Issue">Issue</option>
          </select>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
            <Search size={14} style={{ position: 'absolute', left: 8, top: 7, color: textMuted }} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search segments..." style={{
              width: '100%', padding: '4px 8px 4px 28px', borderRadius: 6, border: `1px solid ${borderColor}`, fontSize: 12,
              background: darkMode ? '#112240' : '#fff', color: text, outline: 'none',
            }} />
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div style={{
        padding: '8px 20px', borderBottom: `1px solid ${borderColor}`,
        display: 'flex', gap: 16, overflowX: 'auto', flexShrink: 0,
        background: darkMode ? '#0f1f38' : '#f1f5f9',
      }}>
        {[
          { label: 'Total', value: stats.total, color: text },
          { label: 'Footage', value: `${stats.totalFootage.toLocaleString()} LF`, color: accent },
          { label: 'QC Approved', value: stats.approved, color: STATUS_COLORS.QC_APPROVED },
          { label: 'Complete', value: stats.complete, color: STATUS_COLORS.COMPLETE },
          { label: 'In Progress', value: stats.inProgress, color: STATUS_COLORS.IN_PROGRESS },
          { label: 'Issues', value: stats.issues, color: STATUS_COLORS.ISSUE },
          { label: 'Not Started', value: stats.notStarted, color: STATUS_COLORS.NOT_STARTED },
        ].map(stat => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</span>
            <span style={{ fontSize: 11, color: textMuted }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Map or List View */}
        <div style={{ flex: 1, position: 'relative' }}>
          {viewMode === 'map' ? (
            <div style={{ position: 'relative', height: '100%' }}>
              <ProjectLeafletMap
                segments={filteredSegments}
                selectedSegment={selectedSegment}
                onSelectSegment={handleSelectSegment}
                filterPhase={filterPhase}
                darkMode={darkMode}
              />
              {/* Crew GPS Tracker - visible to all logged-in users */}
              {user && (
                <CrewTracker
                  segments={visibleSegments}
                  darkMode={darkMode}
                  isAdmin={isAdmin}
                  user={user}
                  onCrewClick={(seg) => handleSelectSegment(seg)}
                />
              )}
            </div>
          ) : (
            /* List View */
            <div style={{ overflow: 'auto', height: '100%', padding: 16 }}>
              {filteredSegments.map(seg => {
                const phaseKey = filterPhase === 'boring' ? 'boring_status' : filterPhase === 'pulling' ? 'pulling_status' : 'splicing_status';
                const status = seg[phaseKey];
                const isSelected = selectedSegment && selectedSegment.segment_id === seg.segment_id;
                return (
                  <div key={seg.segment_id} onClick={() => handleSelectSegment(seg)} style={{
                    background: isSelected ? accent + '15' : cardBg,
                    border: `1px solid ${isSelected ? accent : borderColor}`,
                    borderLeft: `4px solid ${getStatusColor(status)}`,
                    borderRadius: 10, padding: 14, marginBottom: 8, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: text }}>{seg.contractor_id}</span>
                        <span style={{ fontSize: 11, color: textMuted, background: darkMode ? '#1e3a5f' : '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>§{seg.section}</span>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: getStatusColor(status) + '20', color: getStatusColor(status),
                      }}>
                        <StatusIcon status={status} size={12} />
                        {status}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: textMuted }}>
                      <span><Ruler size={11} style={{ verticalAlign: 'middle' }} /> {seg.footage} LF</span>
                      <span><MapPin size={11} style={{ verticalAlign: 'middle' }} /> {seg.street}</span>
                    </div>
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
                      {seg.from_handhole} → {seg.to_handhole}
                    </div>
                  </div>
                );
              })}
              {filteredSegments.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: textMuted }}>
                  <AlertCircle size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div>No segments match filters</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Panel - Desktop */}
        {selectedSegment && !isMobile && (
          <div style={{
            width: 360, borderLeft: `1px solid ${borderColor}`,
            flexShrink: 0, overflow: 'hidden',
          }}>
            <SegmentDetailPanel segment={selectedSegment} darkMode={darkMode} onClose={() => setSelectedSegment(null)} isAdmin={isAdmin} user={user} onSegmentUpdate={(segId, field, value) => { setAllSegments(prev => prev.map(s => s.segment_id === segId ? { ...s, [field]: value } : s)); setSelectedSegment(prev => prev && prev.segment_id === segId ? { ...prev, [field]: value } : prev); }} />
          </div>
        )}

        {/* Detail Panel - Mobile Bottom Sheet */}
        {selectedSegment && isMobile && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            maxHeight: '60vh', borderTop: `1px solid ${borderColor}`,
            borderRadius: '16px 16px 0 0', overflow: 'hidden',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
            background: darkMode ? '#0d1b2a' : '#ffffff',
            zIndex: 20,
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: borderColor }} />
            </div>
            <div style={{ overflow: 'auto', maxHeight: 'calc(60vh - 20px)' }}>
              <SegmentDetailPanel segment={selectedSegment} darkMode={darkMode} onClose={() => setSelectedSegment(null)} isAdmin={isAdmin} user={user} onSegmentUpdate={(segId, field, value) => { setAllSegments(prev => prev.map(s => s.segment_id === segId ? { ...s, [field]: value } : s)); setSelectedSegment(prev => prev && prev.segment_id === segId ? { ...prev, [field]: value } : prev); }} />
            </div>
          </div>
        )}}
      </div>

      {/* Hidden version */}
      <div onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }} style={{ position: 'fixed', bottom: 4, right: 8, fontSize: 9, color: showVersion ? (darkMode ? '#fff' : '#333') : 'transparent', opacity: showVersion ? 0.5 : 1, userSelect: 'none', cursor: 'default' }}>ProjectMapPage v2.6.0</div>
    </div>
  );
}

export default ProjectMapPage;
