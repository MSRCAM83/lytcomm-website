/**
 * LYT Communications - Project Map Page
 * Version: 4.0.0
 * Created: 2026-02-02
 * Updated: 2026-02-04
 * Route: #project-map
 *
 * Interactive map-based project management view using Leaflet/OpenStreetMap.
 * Displays construction segments as polylines with color-coded status,
 * handhole markers, flowerpot markers, and splice point markers with PM status.
 *
 * Features:
 * - Leaflet map with satellite/street toggle (no API key needed)
 * - Color-coded polyline segments (boring/pulling/splicing status)
 * - Clickable handhole markers (sized by type)
 * - Clickable flowerpot markers (utility boxes - UG12)
 * - Clickable splice point markers with PM status indicators
 * - Segment detail side panel with workflow tabs
 * - Splice point detail panel with PM readings
 * - Section/status/phase filters
 * - List view fallback
 * - Photo upload to Google Drive
 * - Auto-refresh polling (30s)
 * - Toast notifications for actions
 * - Mobile-optimized with bottom sheet details
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { ArrowLeft, Map, List, Search, AlertCircle, MapPin, Ruler, Users, Zap, X, ChevronDown, ChevronUp, Filter, Layers, Camera, CheckCircle, Clock, AlertTriangle, Navigation, Wrench, Cable, Flower2, Activity, Radio, Eye } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { STATUS_COLORS, PHOTO_REQUIREMENTS, PM_THRESHOLDS, PM_STATUS, evaluatePMReading, GOOGLE_MAPS_API_KEY } from '../config/mapConfig';
import BoringTracker from '../components/Workflow/BoringTracker';
import PullingTracker from '../components/Workflow/PullingTracker';
import SplicingTracker from '../components/Workflow/SplicingTracker';
// eslint-disable-next-line no-unused-vars
import { loadFullProject, isDemoMode, updateSegmentField, updateSpliceField, logAction } from '../services/mapService';
import { uploadPhotoBatch } from '../services/photoUploadService';
import CrewTracker from '../components/Map/CrewTracker';
// eslint-disable-next-line no-unused-vars
import Toast, { useToast } from '../components/Toast';
import { GoogleMap, useJsApiLoader, Polyline, OverlayView, GroundOverlay } from '@react-google-maps/api';

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
const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 30.2366, lng: -93.3776 }; // Sulphur LA

// Design map overlay bounds (pixel-to-GPS from geo_transform_v8)
const OVERLAY_BOUNDS = {
  north: 30.2410947325,
  south: 30.2133827242,
  east: -93.3566656661,
  west: -93.4077672080,
};
const OVERLAY_URL = '/overlays/SLPH.01.006.jpg';

function ProjectGoogleMap({ segments, splicePoints, handholes, flowerpots, selectedSegment, selectedSplice, onSelectSegment, onSelectSplice, onSelectHandhole, filterPhase, darkMode, showFlowerpots, showSplicePoints, showHandholes, showOverlay }) {
  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState('roadmap');

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Calculate bounds from all points
  const bounds = useMemo(() => {
    if (!segments || segments.length === 0) return null;
    const points = [];
    segments.forEach(seg => {
      if (seg.gps_start_lat && seg.gps_start_lng) points.push({ lat: parseFloat(seg.gps_start_lat), lng: parseFloat(seg.gps_start_lng) });
      if (seg.gps_end_lat && seg.gps_end_lng) points.push({ lat: parseFloat(seg.gps_end_lat), lng: parseFloat(seg.gps_end_lng) });
    });
    if (showFlowerpots && flowerpots) {
      flowerpots.forEach(fp => {
        if (fp.gps_lat && fp.gps_lng) points.push({ lat: parseFloat(fp.gps_lat), lng: parseFloat(fp.gps_lng) });
      });
    }
    if (showSplicePoints && splicePoints) {
      splicePoints.forEach(sp => {
        if (sp.gps_lat && sp.gps_lng) points.push({ lat: parseFloat(sp.gps_lat), lng: parseFloat(sp.gps_lng) });
      });
    }
    return points;
  }, [segments, splicePoints, flowerpots, showFlowerpots, showSplicePoints]);

  // Fit bounds when map loads
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    if (bounds && bounds.length > 0 && window.google) {
      const googleBounds = new window.google.maps.LatLngBounds();
      bounds.forEach(p => googleBounds.extend(p));
      mapInstance.fitBounds(googleBounds, 50);
    }
  }, [bounds]);

  // Use handholes from props (loaded from DB with unique IDs)
  // Fall back to deriving from segments if no handholes provided
  const handholesData = useMemo(() => {
    if (handholes && handholes.length > 0) {
      return handholes.map(hh => ({
        id: hh.id,
        lat: parseFloat(hh.gps_lat),
        lng: parseFloat(hh.gps_lng),
        label: hh.label || hh.id,
        type: hh.type || '',
        code: hh.code || 'UG20',
      })).filter(hh => !isNaN(hh.lat) && !isNaN(hh.lng));
    }
    // Fallback: derive from segments (use native Map, not lucide-react Map icon)
    const NativeMap = typeof window !== 'undefined' ? window.Map : globalThis.Map;
    const hh = new NativeMap();
    segments.forEach(seg => {
      const fromLabel = seg.from_handhole || seg.contractor_id?.split('→')[0] || '?';
      const toLabel = seg.to_handhole || seg.contractor_id?.split('→')[1] || '?';
      const startLat = parseFloat(seg.gps_start_lat);
      const startLng = parseFloat(seg.gps_start_lng);
      const endLat = parseFloat(seg.gps_end_lat);
      const endLng = parseFloat(seg.gps_end_lng);

      if (!isNaN(startLat) && !isNaN(startLng) && (fromLabel.includes('x') || fromLabel.match(/^[A-Z]\d*$/))) {
        const key = `${startLat},${startLng}`;
        if (!hh.has(key)) hh.set(key, { lat: startLat, lng: startLng, label: fromLabel, type: '', code: '' });
      }
      if (!isNaN(endLat) && !isNaN(endLng) && (toLabel.includes('x') || toLabel.match(/^[A-Z]\d*$/))) {
        const key = `${endLat},${endLng}`;
        if (!hh.has(key)) hh.set(key, { lat: endLat, lng: endLng, label: toLabel, type: '', code: '' });
      }
    });
    return Array.from(hh.values());
  }, [handholes, segments]);

  // Get status color
  const getSegmentColor = (seg) => {
    const status = filterPhase === 'pulling' ? seg.pulling_status : filterPhase === 'splicing' ? (seg.splicing_status || 'Not Started') : seg.boring_status;
    if (status === 'QC Approved' || status === 'Complete') return '#4CAF50';
    if (status === 'In Progress') return '#FFB800';
    if (status === 'Issue') return '#FF9800';
    if (status === 'Blocked') return '#9E9E9E';
    return '#FF4444';
  };

  // Get PM status color for splice points
  const getPMStatusColor = (sp) => {
    if (sp.splice_type !== '1x4' || !sp.pm_readings) return '#9E9E9E';
    try {
      const readings = typeof sp.pm_readings === 'string' ? JSON.parse(sp.pm_readings) : sp.pm_readings;
      if (readings.some(r => r.status === 'fail')) return '#F44336';
      if (readings.some(r => r.status === 'warning')) return '#FF9800';
      if (readings.every(r => r.status === 'pass')) return '#4CAF50';
    } catch (e) { /* ignore */ }
    return '#9E9E9E';
  };

  if (loadError) return <div style={{ padding: 20, color: '#f44336' }}>Error loading Google Maps</div>;
  if (!isLoaded) return <div style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading map...</div>;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={15}
        onLoad={onLoad}
        mapTypeId={mapType}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: darkMode ? [
            { elementType: 'geometry', stylers: [{ color: '#212121' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ] : [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {/* Design Map Overlay */}
        {map && showOverlay && (
          <GroundOverlay
            url={OVERLAY_URL}
            bounds={OVERLAY_BOUNDS}
            options={{ opacity: 0.7 }}
          />
        )}

        {/* Segment Polylines - only render after map is ready to avoid setAt error */}
        {map && segments.map(seg => {
          const startLat = parseFloat(seg.gps_start_lat);
          const startLng = parseFloat(seg.gps_start_lng);
          const endLat = parseFloat(seg.gps_end_lat);
          const endLng = parseFloat(seg.gps_end_lng);
          if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) return null;

          const isSelected = selectedSegment && (selectedSegment.segment_id === seg.segment_id || selectedSegment === seg.segment_id);
          return (
            <Polyline
              key={seg.segment_id}
              path={[{ lat: startLat, lng: startLng }, { lat: endLat, lng: endLng }]}
              options={{
                strokeColor: getSegmentColor(seg),
                strokeWeight: isSelected ? 8 : 5,
                strokeOpacity: isSelected ? 1.0 : 0.8,
                clickable: true,
              }}
              onClick={() => onSelectSegment(seg)}
            />
          );
        })}

        {/* Handhole Markers - only render after map is ready */}
        {map && showHandholes && handholesData.map((hh, idx) => {
          const isLarge = (hh.type || hh.label || '').includes('30x48');
          const isMedium = (hh.type || hh.label || '').includes('17x30') || (hh.type || hh.label || '').includes('24x36');
          const color = isLarge ? '#2196F3' : isMedium ? '#FFB800' : '#4CAF50';
          const size = isLarge ? 14 : isMedium ? 11 : 8;
          const tooltipText = hh.id ? `${hh.label} (${hh.id})` : hh.label;

          return (
            <OverlayView key={`hh-${hh.id || idx}`} position={{ lat: hh.lat, lng: hh.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div
                title={tooltipText}
                onClick={() => onSelectHandhole && onSelectHandhole(hh)}
                style={{
                  width: size, height: size, background: color, borderRadius: '50%',
                  border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transform: 'translate(-50%, -50%)', cursor: 'pointer',
                }}
              />
            </OverlayView>
          );
        })}

        {/* Flowerpot Markers - only render after map is ready */}
        {map && showFlowerpots && flowerpots && flowerpots.map((fp, idx) => {
          const lat = parseFloat(fp.gps_lat);
          const lng = parseFloat(fp.gps_lng);
          if (isNaN(lat) || isNaN(lng)) return null;
          return (
            <OverlayView key={`fp-${idx}`} position={{ lat, lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div title={fp.label || 'Flowerpot'} style={{
                width: 10, height: 10, background: '#9C27B0',
                border: '2px solid #fff', transform: 'translate(-50%, -50%) rotate(45deg)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)', cursor: 'pointer',
              }} />
            </OverlayView>
          );
        })}

        {/* Splice Point Markers - only render after map is ready */}
        {map && showSplicePoints && splicePoints && splicePoints.map((sp, idx) => {
          const lat = parseFloat(sp.gps_lat);
          const lng = parseFloat(sp.gps_lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          const spliceType = sp.splice_type || '1x4';
          const typeLabel = spliceType === '1x4' ? '1×4' : spliceType === '1x8' ? '1×8' : spliceType === '2x8' ? '2×8' : spliceType === 'F1' ? 'F1' : spliceType;
          const bgColor = spliceType === '1x4' ? '#E91E63' : spliceType === '2x8' ? '#3F51B5' : spliceType === 'F1' ? '#009688' : '#607D8B';
          const isSelected = selectedSplice && (selectedSplice.splice_id === sp.splice_id || selectedSplice === sp.splice_id);
          const pmColor = getPMStatusColor(sp);

          return (
            <OverlayView key={`sp-${idx}`} position={{ lat, lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div onClick={() => onSelectSplice && onSelectSplice(sp)} style={{
                position: 'relative', padding: '2px 6px', background: bgColor,
                border: `2px solid ${isSelected ? '#FFD700' : '#fff'}`, borderRadius: 4,
                fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)', cursor: 'pointer',
                transform: 'translate(-50%, -50%)',
              }}>
                {typeLabel}
                {spliceType === '1x4' && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 8, height: 8, background: pmColor,
                    border: '1px solid #fff', borderRadius: '50%',
                  }} />
                )}
              </div>
            </OverlayView>
          );
        })}
      </GoogleMap>

      {/* Map Type Toggle */}
      <div style={{
        position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4, zIndex: 1000,
      }}>
        <button onClick={() => setMapType('roadmap')} style={{
          padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          background: mapType === 'roadmap' ? '#0077B6' : (darkMode ? '#112240' : '#fff'),
          color: mapType === 'roadmap' ? '#fff' : (darkMode ? '#8892b0' : '#64748b'),
          border: `1px solid ${darkMode ? '#1e3a5f' : '#e2e8f0'}`, borderRadius: '4px 0 0 4px',
        }}>Street</button>
        <button onClick={() => setMapType('satellite')} style={{
          padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          background: mapType === 'satellite' ? '#0077B6' : (darkMode ? '#112240' : '#fff'),
          color: mapType === 'satellite' ? '#fff' : (darkMode ? '#8892b0' : '#64748b'),
          border: `1px solid ${darkMode ? '#1e3a5f' : '#e2e8f0'}`, borderRadius: '0 4px 4px 0',
        }}>Satellite</button>
      </div>

      {/* Enhanced Legend */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10, padding: '10px 14px', borderRadius: 8,
        background: darkMode ? 'rgba(17,34,64,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)', fontSize: 11, zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', maxWidth: 180,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: darkMode ? '#fff' : '#1e293b' }}>Legend</div>

        {/* Segment Status */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: darkMode ? '#8892b0' : '#64748b', marginBottom: 3 }}>Segment Status</div>
          {[
            ['Not Started', '#FF4444'],
            ['In Progress', '#FFB800'],
            ['Complete/QC', '#4CAF50'],
            ['Issue', '#FF9800'],
          ].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 16, height: 3, background: color, borderRadius: 2 }} />
              <span style={{ color: darkMode ? '#8892b0' : '#64748b', fontSize: 10 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Markers */}
        <div style={{ borderTop: `1px solid ${darkMode ? '#1e3a5f' : '#e2e8f0'}`, paddingTop: 6 }}>
          <div style={{ fontSize: 10, color: darkMode ? '#8892b0' : '#64748b', marginBottom: 3 }}>Markers</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 10, height: 10, background: '#2196F3', borderRadius: '50%', border: '1px solid #fff' }} />
            <span style={{ color: darkMode ? '#8892b0' : '#64748b', fontSize: 10 }}>Large HH</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, background: '#FFB800', borderRadius: '50%', border: '1px solid #fff' }} />
            <span style={{ color: darkMode ? '#8892b0' : '#64748b', fontSize: 10 }}>Medium HH</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 6, height: 6, background: '#4CAF50', borderRadius: '50%', border: '1px solid #fff' }} />
            <span style={{ color: darkMode ? '#8892b0' : '#64748b', fontSize: 10 }}>Terminal Box</span>
          </div>
          {showFlowerpots && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 8, height: 8, background: '#9C27B0', transform: 'rotate(45deg)', border: '1px solid #fff' }} />
              <span style={{ color: darkMode ? '#8892b0' : '#64748b', fontSize: 10 }}>Flowerpot</span>
            </div>
          )}
          {showSplicePoints && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ padding: '1px 3px', background: '#E91E63', borderRadius: 2, color: '#fff', fontSize: 8, fontWeight: 700 }}>1×4</div>
                <span style={{ color: darkMode ? '#8892b0' : '#64748b', fontSize: 10 }}>Splice (PM)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ padding: '1px 3px', background: '#3F51B5', borderRadius: 2, color: '#fff', fontSize: 8, fontWeight: 700 }}>2×8</div>
                <span style={{ color: darkMode ? '#8892b0' : '#64748b', fontSize: 10 }}>Hub Splice</span>
              </div>
            </>
          )}
        </div>
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
    project_id: segment.segment_id?.split('-').slice(0, 3).join('-') || null,
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
      await logAction(segment.project_id || null, segId, user?.email, `${phase}_status_changed`, { from: segment[field], to: newStatus, notes: statusData?.notes });
      
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
    
    const projectId = segment.project_id || null;
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

// ===== SPLICE POINT DETAIL PANEL =====
function SplicePointDetailPanel({ splicePoint, darkMode, onClose, user, onSpliceUpdate }) {
  const [pmReadings, setPmReadings] = useState([]);
  const [editingReading, setEditingReading] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // Parse PM readings on load
  useEffect(() => {
    if (!splicePoint) return;
    if (splicePoint.splice_type === '1x4') {
      // Initialize or parse existing PM readings
      let readings = [];
      if (splicePoint.pm_readings) {
        try {
          readings = typeof splicePoint.pm_readings === 'string'
            ? JSON.parse(splicePoint.pm_readings)
            : splicePoint.pm_readings;
        } catch (e) { readings = []; }
      }
      // Ensure we have all 8 readings for 1x4
      const ports = ['SA1P1', 'SA1P2', 'SA1P3', 'SA1P4', 'SB1P5', 'SB1P6', 'SB1P7', 'SB1P8'];
      const fullReadings = ports.map(port => {
        const existing = readings.find(r => r.port === port);
        return existing || { port, value_dBm: null, status: 'pending', timestamp: null };
      });
      setPmReadings(fullReadings);
    }
  }, [splicePoint]);

  if (!splicePoint) return null;

  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  const spliceType = splicePoint.splice_type || '1x4';
  const is1x4 = spliceType === '1x4';
  const photoReqs = PHOTO_REQUIREMENTS[spliceType] || PHOTO_REQUIREMENTS['1x4'];

  // PM reading status color
  const getPMColor = (status) => {
    switch (status) {
      case 'pass': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'fail': return '#F44336';
      case 'no_light': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  // Handle PM value input
  const handlePMInput = async (port, value) => {
    const numValue = parseFloat(value);
    let status = 'pending';

    if (value === 'no_light' || value === 'NL') {
      status = 'no_light';
    } else if (!isNaN(numValue)) {
      status = evaluatePMReading(numValue);
    }

    const updatedReadings = pmReadings.map(r =>
      r.port === port
        ? { ...r, value_dBm: isNaN(numValue) ? null : numValue, status, timestamp: new Date().toISOString() }
        : r
    );
    setPmReadings(updatedReadings);
    setEditingReading(null);
    setInputValue('');

    // Save to database
    if (onSpliceUpdate) {
      await onSpliceUpdate(splicePoint.splice_id, 'pm_readings', JSON.stringify(updatedReadings));
    }
  };

  // Count PM stats
  const pmStats = pmReadings.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700,
              background: spliceType === '1x4' ? '#E91E63' : spliceType === '2x8' ? '#3F51B5' : '#009688',
              color: '#fff',
            }}>
              {spliceType}
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: text }}>
              {splicePoint.contractor_id || splicePoint.location || 'Splice Point'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: textMuted }}>{splicePoint.splice_id}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4 }}>
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
        {/* Location Info */}
        <div style={{ background: cardBg, borderRadius: 10, padding: 14, marginBottom: 12, border: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MapPin size={15} color={accent} />
            <span style={{ fontWeight: 600, color: text, fontSize: 13 }}>Location</span>
          </div>
          <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.7 }}>
            <div><strong style={{ color: text }}>Handhole:</strong> {splicePoint.location || splicePoint.handhole_type || '—'}</div>
            <div><strong style={{ color: text }}>Position:</strong> {splicePoint.position_type || '—'}</div>
            <div><strong style={{ color: text }}>Status:</strong> {splicePoint.status || 'Not Started'}</div>
          </div>
        </div>

        {/* Photo Requirements */}
        <div style={{ background: cardBg, borderRadius: 10, padding: 14, marginBottom: 12, border: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Camera size={15} color={accent} />
            <span style={{ fontWeight: 600, color: text, fontSize: 13 }}>Photo Requirements</span>
          </div>
          <div style={{ fontSize: 12, color: textMuted }}>
            <div style={{ marginBottom: 4 }}>
              <strong style={{ color: text }}>Enclosure:</strong> {photoReqs?.enclosureCount || 7} photos
            </div>
            {is1x4 && (
              <div style={{ marginBottom: 4 }}>
                <strong style={{ color: text }}>PM Photos:</strong> {photoReqs?.pmPhotoCount || 2} (1 per splitter)
              </div>
            )}
            <div style={{ fontWeight: 600, color: accent }}>
              Total: {photoReqs?.totalPhotos || (is1x4 ? 9 : 8)} photos required
            </div>
          </div>
        </div>

        {/* PM Readings (1x4 only) */}
        {is1x4 && (
          <div style={{ background: cardBg, borderRadius: 10, padding: 14, border: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={15} color={accent} />
                <span style={{ fontWeight: 600, color: text, fontSize: 13 }}>Power Meter Readings</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {pmStats.pass > 0 && <span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: '#4CAF5020', color: '#4CAF50' }}>{pmStats.pass} Pass</span>}
                {pmStats.warning > 0 && <span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: '#FF980020', color: '#FF9800' }}>{pmStats.warning} Warn</span>}
                {pmStats.fail > 0 && <span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: '#F4433620', color: '#F44336' }}>{pmStats.fail} Fail</span>}
              </div>
            </div>

            {/* Thresholds Reference */}
            <div style={{ fontSize: 10, color: textMuted, marginBottom: 10, padding: '6px 8px', background: darkMode ? '#0a1628' : '#f1f5f9', borderRadius: 6 }}>
              <strong>Thresholds:</strong> Pass: -8 to -25 dBm | Warning: -25 to -28 dBm | Fail: &lt;-28 or &gt;-8 dBm
            </div>

            {/* Splitter A */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: text, marginBottom: 6 }}>Splitter A</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {pmReadings.slice(0, 4).map(reading => (
                  <div key={reading.port} style={{
                    background: darkMode ? '#0a1628' : '#fff',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 6, padding: 8, textAlign: 'center',
                    borderLeft: `3px solid ${getPMColor(reading.status)}`,
                  }}>
                    <div style={{ fontSize: 10, color: textMuted, marginBottom: 2 }}>{reading.port}</div>
                    {editingReading === reading.port ? (
                      <input
                        type="text"
                        autoFocus
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handlePMInput(reading.port, inputValue);
                          if (e.key === 'Escape') { setEditingReading(null); setInputValue(''); }
                        }}
                        onBlur={() => { setEditingReading(null); setInputValue(''); }}
                        placeholder="-20.5"
                        style={{
                          width: '100%', padding: '2px 4px', fontSize: 12, textAlign: 'center',
                          border: `1px solid ${accent}`, borderRadius: 4, outline: 'none',
                          background: darkMode ? '#112240' : '#fff', color: text,
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => { setEditingReading(reading.port); setInputValue(reading.value_dBm?.toString() || ''); }}
                        style={{
                          fontSize: 14, fontWeight: 700, color: getPMColor(reading.status),
                          cursor: 'pointer', minHeight: 20,
                        }}
                      >
                        {reading.status === 'no_light' ? 'NL' : reading.value_dBm !== null ? `${reading.value_dBm}` : '—'}
                      </div>
                    )}
                    <div style={{ fontSize: 9, color: getPMColor(reading.status), marginTop: 2 }}>
                      {reading.status === 'pending' ? 'Tap to enter' : reading.status.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Splitter B */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: text, marginBottom: 6 }}>Splitter B</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {pmReadings.slice(4, 8).map(reading => (
                  <div key={reading.port} style={{
                    background: darkMode ? '#0a1628' : '#fff',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 6, padding: 8, textAlign: 'center',
                    borderLeft: `3px solid ${getPMColor(reading.status)}`,
                  }}>
                    <div style={{ fontSize: 10, color: textMuted, marginBottom: 2 }}>{reading.port}</div>
                    {editingReading === reading.port ? (
                      <input
                        type="text"
                        autoFocus
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handlePMInput(reading.port, inputValue);
                          if (e.key === 'Escape') { setEditingReading(null); setInputValue(''); }
                        }}
                        onBlur={() => { setEditingReading(null); setInputValue(''); }}
                        placeholder="-20.5"
                        style={{
                          width: '100%', padding: '2px 4px', fontSize: 12, textAlign: 'center',
                          border: `1px solid ${accent}`, borderRadius: 4, outline: 'none',
                          background: darkMode ? '#112240' : '#fff', color: text,
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => { setEditingReading(reading.port); setInputValue(reading.value_dBm?.toString() || ''); }}
                        style={{
                          fontSize: 14, fontWeight: 700, color: getPMColor(reading.status),
                          cursor: 'pointer', minHeight: 20,
                        }}
                      >
                        {reading.status === 'no_light' ? 'NL' : reading.value_dBm !== null ? `${reading.value_dBm}` : '—'}
                      </div>
                    )}
                    <div style={{ fontSize: 9, color: getPMColor(reading.status), marginTop: 2 }}>
                      {reading.status === 'pending' ? 'Tap to enter' : reading.status.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* No Light Button */}
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button
                onClick={() => {
                  const pendingPort = pmReadings.find(r => r.status === 'pending')?.port;
                  if (pendingPort) handlePMInput(pendingPort, 'no_light');
                }}
                style={{
                  padding: '6px 16px', fontSize: 11, fontWeight: 600,
                  background: '#2196F320', color: '#2196F3', border: '1px solid #2196F3',
                  borderRadius: 6, cursor: 'pointer',
                }}
              >
                Mark Next as "No Light" (Fiber not lit)
              </button>
            </div>
          </div>
        )}

        {/* Non-1x4 info */}
        {!is1x4 && (
          <div style={{ background: cardBg, borderRadius: 10, padding: 14, border: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Radio size={15} color={accent} />
              <span style={{ fontWeight: 600, color: text, fontSize: 13 }}>Splice Info</span>
            </div>
            <div style={{ fontSize: 12, color: textMuted }}>
              {spliceType === '2x8' && (
                <div style={{ padding: '8px 12px', background: '#3F51B520', borderRadius: 6, color: '#3F51B5' }}>
                  <strong>Hub Location (2x8)</strong><br />
                  No PM testing required. 8 enclosure photos needed.
                </div>
              )}
              {spliceType === 'F1' && (
                <div style={{ padding: '8px 12px', background: '#00968820', borderRadius: 6, color: '#009688' }}>
                  <strong>F1 Splice ({splicePoint.fiber_count || 432} fiber)</strong><br />
                  {splicePoint.tray_count || 8} trays. Photos: 5 base + 1 per tray.
                </div>
              )}
              {spliceType === 'TYCO-D' && (
                <div style={{ padding: '8px 12px', background: '#60748b20', borderRadius: 6, color: '#607D8B' }}>
                  <strong>TYCO-D Splice</strong><br />
                  9 splices. Photos: 5 base + 1 per tray.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Version tag */}
      <div style={{ padding: '4px 16px', fontSize: 9, color: 'transparent', textAlign: 'right', userSelect: 'none', flexShrink: 0 }}>SplicePanel v1.0.0</div>
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
  const [selectedSplice, setSelectedSplice] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Layer visibility toggles
  const [showFlowerpots, setShowFlowerpots] = useState(true);
  const [showSplicePoints, setShowSplicePoints] = useState(true);
  const [showHandholes, setShowHandholes] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

  // Dynamic data state - ALL billable items
  const [allSegments, setAllSegments] = useState([]);
  const [splicePoints, setSplicePoints] = useState([]);
  const [handholes, setHandholes] = useState([]);
  const [flowerpots, setFlowerpots] = useState([]);
  const [groundRods, setGroundRods] = useState([]);
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
        const data = await loadFullProject(projectId || null);
        if (!cancelled) {
          setAllSegments(data.segments);
          setSplicePoints(data.splicePoints || []);
          setHandholes(data.handholes || []);
          setFlowerpots(data.flowerpots || []);
          setGroundRods(data.groundRods || []);
          setProjectInfo(data.project);
          setDataSource(data.isDemo ? 'demo' : 'live');
          setLastRefresh(new Date());
          if (!silent) setLoading(false);
          console.log(`[ProjectMap] Loaded: ${data.segments.length} seg, ${(data.handholes || []).length} HH, ${(data.flowerpots || []).length} FP, ${(data.splicePoints || []).length} SP`);
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
  }, [projectId]);

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

    // ALL billable item counts
    const handholesCount = handholes.length;
    const flowerpotCount = flowerpots.length;
    const groundRodCount = groundRods.length;
    const splice1x4 = splicePoints.filter(sp => sp.splice_type === '1x4').length;
    const splice2x8 = splicePoints.filter(sp => sp.splice_type === '2x8' || sp.splice_type === '1x8').length;

    return {
      totalFootage, approved, complete, inProgress, issues, notStarted,
      total: visibleSegments.length,
      handholesCount, flowerpotCount, groundRodCount,
      splice1x4, splice2x8,
    };
  }, [visibleSegments, filterPhase, splicePoints, handholes, flowerpots, groundRods]);

  const handleSelectSegment = useCallback((seg) => {
    setSelectedSplice(null); // Clear splice selection when segment is selected
    setSelectedSegment(prev => prev && prev.segment_id === seg.segment_id ? null : seg);
  }, []);

  const handleSelectSplice = useCallback((sp) => {
    setSelectedSegment(null); // Clear segment selection when splice is selected
    setSelectedSplice(prev => prev && prev.splice_id === sp.splice_id ? null : sp);
  }, []);

  const handleSpliceUpdate = async (spliceId, field, value) => {
    console.log(`[ProjectMap] Splice update: ${spliceId}.${field}`);
    const ok = await updateSpliceField(spliceId, field, value);
    if (ok) {
      // Update local state
      setSplicePoints(prev => prev.map(sp =>
        sp.splice_id === spliceId ? { ...sp, [field]: value } : sp
      ));
      if (selectedSplice && selectedSplice.splice_id === spliceId) {
        setSelectedSplice(prev => ({ ...prev, [field]: value }));
      }
      console.log(`[ProjectMap] ✅ Splice updated: ${spliceId}.${field}`);
    }
    return ok;
  };

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

          {/* Layer Toggles */}
          <div style={{ display: 'flex', gap: 4, borderLeft: `1px solid ${borderColor}`, paddingLeft: 10 }}>
            <button onClick={() => setShowHandholes(!showHandholes)} style={{
              padding: '4px 10px', borderRadius: 16, border: `1px solid ${showHandholes ? '#2196F3' : borderColor}`,
              cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              background: showHandholes ? '#2196F320' : 'transparent', color: showHandholes ? '#2196F3' : textMuted,
            }}>
              <MapPin size={12} /> HH
            </button>
            <button onClick={() => setShowFlowerpots(!showFlowerpots)} style={{
              padding: '4px 10px', borderRadius: 16, border: `1px solid ${showFlowerpots ? '#9C27B0' : borderColor}`,
              cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              background: showFlowerpots ? '#9C27B020' : 'transparent', color: showFlowerpots ? '#9C27B0' : textMuted,
            }}>
              <Flower2 size={12} /> FP
            </button>
            <button onClick={() => setShowSplicePoints(!showSplicePoints)} style={{
              padding: '4px 10px', borderRadius: 16, border: `1px solid ${showSplicePoints ? '#E91E63' : borderColor}`,
              cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              background: showSplicePoints ? '#E91E6320' : 'transparent', color: showSplicePoints ? '#E91E63' : textMuted,
            }}>
              <Zap size={12} /> Splice
            </button>
            <button onClick={() => setShowOverlay(!showOverlay)} style={{
              padding: '4px 10px', borderRadius: 16, border: `1px solid ${showOverlay ? '#FF6B35' : borderColor}`,
              cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              background: showOverlay ? '#FF6B3520' : 'transparent', color: showOverlay ? '#FF6B35' : textMuted,
            }}>
              <Layers size={12} /> Design
            </button>
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
          { label: 'Segments', value: stats.total, color: text },
          { label: 'Footage', value: `${stats.totalFootage.toLocaleString()} LF`, color: accent },
          { label: 'QC Approved', value: stats.approved, color: STATUS_COLORS.QC_APPROVED },
          { label: 'Complete', value: stats.complete, color: STATUS_COLORS.COMPLETE },
          { label: 'In Progress', value: stats.inProgress, color: STATUS_COLORS.IN_PROGRESS },
          ...(showHandholes && stats.handholesCount > 0 ? [
            { label: 'Handholes', value: stats.handholesCount, color: '#2196F3' },
          ] : []),
          ...(showFlowerpots && stats.flowerpotCount > 0 ? [
            { label: 'Flowerpots', value: stats.flowerpotCount, color: '#9C27B0' },
          ] : []),
          ...(stats.groundRodCount > 0 ? [
            { label: 'Ground Rods', value: stats.groundRodCount, color: '#795548' },
          ] : []),
          ...(showSplicePoints ? [
            { label: '1×4 Splices', value: stats.splice1x4, color: '#E91E63' },
            { label: 'Hubs', value: stats.splice2x8, color: '#3F51B5' },
          ] : []),
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
              <ProjectGoogleMap
                segments={filteredSegments}
                splicePoints={splicePoints}
                handholes={handholes}
                flowerpots={flowerpots}
                selectedSegment={selectedSegment}
                selectedSplice={selectedSplice}
                onSelectSegment={handleSelectSegment}
                onSelectSplice={handleSelectSplice}
                onSelectHandhole={(hh) => console.log('Handhole selected:', hh)}
                filterPhase={filterPhase}
                darkMode={darkMode}
                showFlowerpots={showFlowerpots}
                showSplicePoints={showSplicePoints}
                showHandholes={showHandholes}
                showOverlay={showOverlay}
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

        {/* Detail Panel - Desktop (Segment or Splice) */}
        {(selectedSegment || selectedSplice) && !isMobile && (
          <div style={{
            width: 360, borderLeft: `1px solid ${borderColor}`,
            flexShrink: 0, overflow: 'hidden',
          }}>
            {selectedSegment && (
              <SegmentDetailPanel segment={selectedSegment} darkMode={darkMode} onClose={() => setSelectedSegment(null)} isAdmin={isAdmin} user={user} onSegmentUpdate={(segId, field, value) => { setAllSegments(prev => prev.map(s => s.segment_id === segId ? { ...s, [field]: value } : s)); setSelectedSegment(prev => prev && prev.segment_id === segId ? { ...prev, [field]: value } : prev); }} />
            )}
            {selectedSplice && (
              <SplicePointDetailPanel splicePoint={selectedSplice} darkMode={darkMode} onClose={() => setSelectedSplice(null)} user={user} onSpliceUpdate={handleSpliceUpdate} />
            )}
          </div>
        )}

        {/* Detail Panel - Mobile Bottom Sheet (Segment or Splice) */}
        {(selectedSegment || selectedSplice) && isMobile && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            maxHeight: '70vh', borderTop: `1px solid ${borderColor}`,
            borderRadius: '16px 16px 0 0', overflow: 'hidden',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
            background: darkMode ? '#0d1b2a' : '#ffffff',
            zIndex: 20,
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: borderColor }} />
            </div>
            <div style={{ overflow: 'auto', maxHeight: 'calc(70vh - 20px)' }}>
              {selectedSegment && (
                <SegmentDetailPanel segment={selectedSegment} darkMode={darkMode} onClose={() => setSelectedSegment(null)} isAdmin={isAdmin} user={user} onSegmentUpdate={(segId, field, value) => { setAllSegments(prev => prev.map(s => s.segment_id === segId ? { ...s, [field]: value } : s)); setSelectedSegment(prev => prev && prev.segment_id === segId ? { ...prev, [field]: value } : prev); }} />
              )}
              {selectedSplice && (
                <SplicePointDetailPanel splicePoint={selectedSplice} darkMode={darkMode} onClose={() => setSelectedSplice(null)} user={user} onSpliceUpdate={handleSpliceUpdate} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden version */}
      <div onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }} style={{ position: 'fixed', bottom: 4, right: 8, fontSize: 9, color: showVersion ? (darkMode ? '#fff' : '#333') : 'transparent', opacity: showVersion ? 0.5 : 1, userSelect: 'none', cursor: 'default' }}>ProjectMapPage v4.1.0</div>
    </div>
  );
}

export default ProjectMapPage;
