/**
 * LYT Communications - Project Map Page
 * Version: 2.1.0
 * Created: 2026-02-02
 * Route: #project-map
 * 
 * Interactive Google Maps-based project management view.
 * Displays construction segments as polylines with color-coded status,
 * handhole markers with icons, crew GPS positions, and segment detail panels.
 * 
 * Features:
 * - Google Maps with satellite/roadmap toggle
 * - Color-coded polyline segments (boring/pulling/splicing status)
 * - Clickable handhole markers with info windows
 * - Segment detail side panel
 * - Section/status/phase filters
 * - List view fallback
 * - Mobile-optimized with bottom sheet details
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { ArrowLeft, Map, List, Search, AlertCircle, MapPin, Ruler, Users, Zap, X, ChevronDown, ChevronUp, Filter, Layers, Camera, CheckCircle, Clock, AlertTriangle, Navigation, Wrench, Cable, Zap as ZapIcon } from 'lucide-react';
import { STATUS_COLORS, PHOTO_REQUIREMENTS } from '../config/mapConfig';
import BoringTracker from '../components/Workflow/BoringTracker';
import PullingTracker from '../components/Workflow/PullingTracker';
import SplicingTracker from '../components/Workflow/SplicingTracker';

// Google Maps API key placeholder - set in environment or here
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// Demo project data - Phase 2 will load from Google Sheets via mapService
const DEMO_SEGMENTS = [
  { segment_id: 'VXS-SLPH01-006-A-A01', contractor_id: 'A→A01', section: 'A', from_handhole: 'A (17x30x18)', to_handhole: 'A01 (15x20x12)', footage: 148, street: 'W Parish Rd', gps_start: { lat: 30.2367, lng: -93.3776 }, gps_end: { lat: 30.2372, lng: -93.3768 }, boring_status: 'QC Approved', pulling_status: 'Complete', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #2', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-A-A02', contractor_id: 'A01→A02', section: 'A', from_handhole: 'A01 (15x20x12)', to_handhole: 'A02 (15x20x12)', footage: 132, street: 'W Parish Rd', gps_start: { lat: 30.2372, lng: -93.3768 }, gps_end: { lat: 30.2378, lng: -93.3760 }, boring_status: 'QC Approved', pulling_status: 'In Progress', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #2', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-A-A03', contractor_id: 'A02→A03', section: 'A', from_handhole: 'A02 (15x20x12)', to_handhole: 'A03 (15x20x12)', footage: 156, street: 'Beglis Pkwy', gps_start: { lat: 30.2378, lng: -93.3760 }, gps_end: { lat: 30.2385, lng: -93.3752 }, boring_status: 'Complete', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: '', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-A-A04', contractor_id: 'A03→A04', section: 'A', from_handhole: 'A03 (15x20x12)', to_handhole: 'A04 (15x20x12)', footage: 198, street: 'Beglis Pkwy', gps_start: { lat: 30.2385, lng: -93.3752 }, gps_end: { lat: 30.2392, lng: -93.3743 }, boring_status: 'In Progress', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: '', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-A-A05', contractor_id: 'A04→A05', section: 'A', from_handhole: 'A04 (15x20x12)', to_handhole: 'A05 (15x20x12)', footage: 175, street: 'Elm St', gps_start: { lat: 30.2392, lng: -93.3743 }, gps_end: { lat: 30.2398, lng: -93.3735 }, boring_status: 'Not Started', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: '', pulling_assigned_to: '', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-B-B01', contractor_id: 'B→B01', section: 'B', from_handhole: 'B (17x30x18)', to_handhole: 'B01 (15x20x12)', footage: 210, street: 'S Cities Service Hwy', gps_start: { lat: 30.2350, lng: -93.3810 }, gps_end: { lat: 30.2358, lng: -93.3800 }, boring_status: 'QC Approved', pulling_status: 'QC Approved', splicing_status: 'In Progress', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #1', splicing_assigned_to: 'LYT Splice Crew' },
  { segment_id: 'VXS-SLPH01-006-B-B02', contractor_id: 'B01→B02', section: 'B', from_handhole: 'B01 (15x20x12)', to_handhole: 'B02 (15x20x12)', footage: 185, street: 'S Cities Service Hwy', gps_start: { lat: 30.2358, lng: -93.3800 }, gps_end: { lat: 30.2365, lng: -93.3790 }, boring_status: 'QC Approved', pulling_status: 'In Progress', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: 'LYT Crew #1', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-B-B03', contractor_id: 'B02→B03', section: 'B', from_handhole: 'B02 (15x20x12)', to_handhole: 'B03 (15x20x12)', footage: 162, street: 'Oak Ave', gps_start: { lat: 30.2365, lng: -93.3790 }, gps_end: { lat: 30.2370, lng: -93.3782 }, boring_status: 'Issue', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: 'Gulf Coast Boring LLC', pulling_assigned_to: '', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-C-C01', contractor_id: 'C→C01', section: 'C', from_handhole: 'C (30x48x24)', to_handhole: 'C01 (15x20x12)', footage: 220, street: 'N Main St', gps_start: { lat: 30.2340, lng: -93.3820 }, gps_end: { lat: 30.2348, lng: -93.3810 }, boring_status: 'Not Started', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: '', pulling_assigned_to: '', splicing_assigned_to: '' },
  { segment_id: 'VXS-SLPH01-006-C-C02', contractor_id: 'C01→C02', section: 'C', from_handhole: 'C01 (15x20x12)', to_handhole: 'C02 (15x20x12)', footage: 195, street: 'N Main St', gps_start: { lat: 30.2348, lng: -93.3810 }, gps_end: { lat: 30.2355, lng: -93.3800 }, boring_status: 'Not Started', pulling_status: 'Not Started', splicing_status: 'Not Started', boring_assigned_to: '', pulling_assigned_to: '', splicing_assigned_to: '' },
];

const DEMO_PROJECT = {
  project_id: 'VXS-SLPH01-006',
  customer: 'Vexus Fiber',
  project_name: 'Sulphur LA City Build',
  po_number: '3160880',
  total_value: 421712.30,
};

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
function ProjectGoogleMap({ segments, selectedSegment, onSelectSegment, filterPhase, darkMode }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState('roadmap');

  // Calculate map center from segments
  const center = useMemo(() => {
    if (segments.length === 0) return { lat: 30.2367, lng: -93.3776 };
    let lat = 0, lng = 0;
    segments.forEach(s => {
      lat += s.gps_start.lat + s.gps_end.lat;
      lng += s.gps_start.lng + s.gps_end.lng;
    });
    const count = segments.length * 2;
    return { lat: lat / count, lng: lng / count };
  }, [segments]);

  // Load Google Maps script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }
    if (!GOOGLE_MAPS_API_KEY) {
      // No API key - use fallback canvas map
      setMapLoaded(false);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
    return () => {
      // Cleanup not needed for Google Maps script
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return;
    
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 16,
      mapTypeId: mapType,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      styles: darkMode ? [
        { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
      ] : [],
    });
    
    mapInstanceRef.current = map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, darkMode]);

  // Update map type
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Draw segments and markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    const map = mapInstanceRef.current;

    // Clear existing
    markersRef.current.forEach(m => m.setMap(null));
    polylinesRef.current.forEach(p => p.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];

    const handholes = new Set();

    segments.forEach(seg => {
      const status = filterPhase === 'boring' ? seg.boring_status 
                   : filterPhase === 'pulling' ? seg.pulling_status 
                   : seg.splicing_status;
      const color = getStatusColor(status);
      const isSelected = selectedSegment && selectedSegment.segment_id === seg.segment_id;

      // Draw polyline
      const polyline = new window.google.maps.Polyline({
        path: [seg.gps_start, seg.gps_end],
        strokeColor: color,
        strokeOpacity: isSelected ? 1.0 : 0.8,
        strokeWeight: isSelected ? 6 : 4,
        map,
        zIndex: isSelected ? 10 : 1,
      });

      polyline.addListener('click', () => onSelectSegment(seg));
      polylinesRef.current.push(polyline);

      // Add footage label at midpoint
      const midLat = (seg.gps_start.lat + seg.gps_end.lat) / 2;
      const midLng = (seg.gps_start.lng + seg.gps_end.lng) / 2;
      
      const label = new window.google.maps.Marker({
        position: { lat: midLat, lng: midLng },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 0,
        },
        label: {
          text: `${seg.footage}'`,
          color: darkMode ? '#ffffff' : '#1e293b',
          fontSize: '11px',
          fontWeight: 'bold',
        },
        clickable: false,
      });
      markersRef.current.push(label);

      // Add handhole markers (deduplicate)
      const addHandhole = (pos, name) => {
        const key = `${pos.lat},${pos.lng}`;
        if (handholes.has(key)) return;
        handholes.add(key);

        const isLarge = name.includes('30x48') || name.includes('24x36');
        const isMedium = name.includes('17x30');
        const fillColor = isLarge ? '#FF9800' : isMedium ? '#2196F3' : '#4CAF50';
        const scale = isLarge ? 10 : isMedium ? 8 : 6;

        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale,
            fillColor,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          zIndex: 5,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="padding:8px;font-family:system-ui;min-width:150px">
            <strong style="font-size:14px">${name.split(' (')[0]}</strong><br/>
            <span style="color:#666;font-size:12px">${name.includes('(') ? name.match(/\(([^)]+)\)/)?.[1] || '' : ''}</span>
          </div>`,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
      };

      addHandhole(seg.gps_start, seg.from_handhole);
      addHandhole(seg.gps_end, seg.to_handhole);
    });

    // Fit bounds to show all segments
    if (segments.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      segments.forEach(s => {
        bounds.extend(s.gps_start);
        bounds.extend(s.gps_end);
      });
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  }, [segments, selectedSegment, filterPhase, onSelectSegment, darkMode]);

  // Fallback canvas map when no Google Maps API key
  if (!GOOGLE_MAPS_API_KEY) {
    return <CanvasMap segments={segments} selectedSegment={selectedSegment} onSelectSegment={onSelectSegment} filterPhase={filterPhase} darkMode={darkMode} />;
  }

  if (!mapLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: darkMode ? '#8892b0' : '#64748b' }}>
        <Zap size={20} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} /> Loading map...
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {/* Map type toggle */}
      <div style={{ position: 'absolute', top: 10, right: 60, display: 'flex', gap: 4, zIndex: 5 }}>
        {['roadmap', 'satellite', 'hybrid'].map(type => (
          <button key={type} onClick={() => setMapType(type)} style={{
            padding: '6px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: mapType === type ? (darkMode ? '#c850c0' : '#0077B6') : (darkMode ? '#112240' : '#f1f5f9'),
            color: mapType === type ? '#fff' : (darkMode ? '#8892b0' : '#64748b'),
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10, padding: '8px 12px', borderRadius: 8,
        background: darkMode ? 'rgba(17,34,64,0.9)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)', fontSize: 11, zIndex: 5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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

// ===== SEGMENT DETAIL PANEL =====
function SegmentDetailPanel({ segment, darkMode, onClose, user }) {
  const [activeTab, setActiveTab] = useState('info');

  if (!segment) return null;

  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

  const tabs = [
    { key: 'info', label: 'Info', icon: '📋' },
    { key: 'boring', label: 'Boring', icon: '🚧' },
    { key: 'pulling', label: 'Pulling', icon: '🚛' },
    { key: 'splicing', label: 'Splicing', icon: '⚡' },
  ];

  const phases = [
    { key: 'boring', label: 'Boring', status: segment.boring_status, assigned: segment.boring_assigned_to, icon: '🚧' },
    { key: 'pulling', label: 'Fiber Pulling', status: segment.pulling_status, assigned: segment.pulling_assigned_to, icon: '🚛' },
    { key: 'splicing', label: 'Splicing', status: segment.splicing_status || 'Not Started', assigned: segment.splicing_assigned_to || '', icon: '⚡' },
  ];

  // Stub handlers — will connect to Google Sheets backend later
  const handleStatusUpdate = (phase, newStatus, data) => {
    console.log('[StatusUpdate]', phase, newStatus, data);
  };
  const handlePhotoUpload = (phase, photos) => {
    console.log('[PhotoUpload]', phase, photos);
  };
  const handleQCApprove = (phase, approved, notes) => {
    console.log('[QCApprove]', phase, approved, notes);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'boring':
        return (
          <div style={{ padding: '12px 16px' }}>
            <BoringTracker
              segment={segment}
              darkMode={darkMode}
              user={user || { name: 'Demo User', role: 'Admin' }}
              onStatusUpdate={(status, data) => handleStatusUpdate('boring', status, data)}
              onPhotoUpload={(photos) => handlePhotoUpload('boring', photos)}
            />
          </div>
        );
      case 'pulling':
        return (
          <div style={{ padding: '12px 16px' }}>
            <PullingTracker
              segment={segment}
              darkMode={darkMode}
              user={user || { name: 'Demo User', role: 'Admin' }}
              isAdmin={isAdmin}
              isSplicer={user?.role === 'Splicer'}
              onStatusUpdate={(status, data) => handleStatusUpdate('pulling', status, data)}
              onPhotoUpload={(photos) => handlePhotoUpload('pulling', photos)}
              onQCApprove={(approved, notes) => handleQCApprove('pulling', approved, notes)}
            />
          </div>
        );
      case 'splicing':
        return (
          <div style={{ padding: '12px 16px' }}>
            <SplicingTracker
              segment={segment}
              splicePoint={{
                splice_type: '1x4',
                position_type: 'mid-span',
                tray_count: 1,
                fiber_count: 2,
              }}
              darkMode={darkMode}
              user={user || { name: 'Demo User', role: 'Admin' }}
              isAdmin={isAdmin}
              onStatusUpdate={(status, data) => handleStatusUpdate('splicing', status, data)}
              onPhotoUpload={(photos) => handlePhotoUpload('splicing', photos)}
              onQCApprove={(approved, notes) => handleQCApprove('splicing', approved, notes)}
            />
          </div>
        );
      default:
        return (
          <div style={{ padding: '16px 20px' }}>
            {/* Location */}
            <div style={{ background: cardBg, borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MapPin size={16} color={accent} />
                <span style={{ fontWeight: 600, color: text }}>Location</span>
              </div>
              <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.6 }}>
                <div><strong style={{ color: text }}>From:</strong> {segment.from_handhole}</div>
                <div><strong style={{ color: text }}>To:</strong> {segment.to_handhole}</div>
                <div><strong style={{ color: text }}>Street:</strong> {segment.street}</div>
                <div><strong style={{ color: text }}>Section:</strong> {segment.section}</div>
              </div>
            </div>

            {/* Footage */}
            <div style={{ background: cardBg, borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ruler size={16} color={accent} />
                <span style={{ fontWeight: 600, color: text }}>Footage</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>{segment.footage} <span style={{ fontSize: 14, fontWeight: 400 }}>LF</span></div>
            </div>

            {/* Phase Status — clickable to open workflow tabs */}
            <div style={{ fontWeight: 600, color: text, marginBottom: 8, fontSize: 14 }}>Workflow Status</div>
            {phases.map(phase => (
              <div key={phase.key} style={{
                background: cardBg, borderRadius: 10, padding: 14, marginBottom: 8,
                border: `1px solid ${borderColor}`,
                borderLeft: `4px solid ${getStatusColor(phase.status)}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onClick={() => setActiveTab(phase.key)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 2px 8px ${getStatusColor(phase.status)}30`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{phase.icon}</span>
                    <span style={{ fontWeight: 600, color: text, fontSize: 13 }}>{phase.label}</span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: getStatusColor(phase.status) + '20',
                    color: getStatusColor(phase.status),
                  }}>
                    <StatusIcon status={phase.status} size={12} />
                    {phase.status}
                  </div>
                </div>
                {phase.assigned && (
                  <div style={{ fontSize: 12, color: textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={11} /> {phase.assigned}
                  </div>
                )}
                <div style={{ fontSize: 10, color: accent, marginTop: 4, fontWeight: 500, opacity: 0.8 }}>Tap to manage →</div>
              </div>
            ))}

            {/* Quick Actions */}
            <div style={{ fontWeight: 600, color: text, marginBottom: 8, marginTop: 16, fontSize: 14 }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: <Camera size={14} />, label: 'Upload Photos', color: '#28a745', tab: 'boring' },
                { icon: <Users size={14} />, label: 'Assign Crew', color: '#0077B6', tab: 'info' },
                { icon: <AlertTriangle size={14} />, label: 'Report Issue', color: '#e85a4f', tab: 'info' },
                { icon: <CheckCircle size={14} />, label: 'QC Approve', color: '#c850c0', tab: 'boring' },
              ].map(action => (
                <button key={action.label} onClick={() => setActiveTab(action.tab)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px',
                  background: action.color + '15', border: `1px solid ${action.color}40`,
                  borderRadius: 8, cursor: 'pointer', color: action.color,
                  fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.target.style.background = action.color + '25'}
                onMouseLeave={e => e.target.style.background = action.color + '15'}
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: darkMode ? '#0d1b2a' : '#ffffff',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: text }}>{segment.contractor_id}</div>
          <div style={{ fontSize: 12, color: textMuted }}>{segment.segment_id}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4 }}>
          <X size={20} />
        </button>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${borderColor}`,
        background: darkMode ? '#0a1628' : '#f1f5f9',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? (darkMode ? '#0d1b2a' : '#ffffff') : 'transparent',
              color: activeTab === tab.key ? accent : textMuted,
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              borderBottom: activeTab === tab.key ? `2px solid ${accent}` : '2px solid transparent',
              transition: 'all 0.2s', minWidth: 70, whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Version tag */}
      <div style={{ padding: '8px 20px', fontSize: 9, color: darkMode ? '#1e3a5f' : '#e2e8f0', textAlign: 'right', userSelect: 'none' }}>v2.1.0</div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
function ProjectMapPage({ darkMode, setDarkMode, user, setCurrentPage }) {
  const [viewMode, setViewMode] = useState('map');
  const [filterSection, setFilterSection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPhase, setFilterPhase] = useState('boring');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  // Filter segments
  const filteredSegments = useMemo(() => {
    return DEMO_SEGMENTS.filter(seg => {
      if (filterSection !== 'all' && seg.section !== filterSection) return false;
      if (filterStatus !== 'all') {
        const status = filterPhase === 'boring' ? seg.boring_status : filterPhase === 'pulling' ? seg.pulling_status : seg.splicing_status;
        if (status !== filterStatus) return false;
      }
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return seg.contractor_id.toLowerCase().includes(search) || seg.street.toLowerCase().includes(search) || seg.segment_id.toLowerCase().includes(search);
      }
      return true;
    });
  }, [filterSection, filterStatus, filterPhase, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const totalFootage = DEMO_SEGMENTS.reduce((sum, s) => sum + s.footage, 0);
    const phaseKey = filterPhase === 'boring' ? 'boring_status' : filterPhase === 'pulling' ? 'pulling_status' : 'splicing_status';
    const approved = DEMO_SEGMENTS.filter(s => s[phaseKey] === 'QC Approved').length;
    const complete = DEMO_SEGMENTS.filter(s => s[phaseKey] === 'Complete').length;
    const inProgress = DEMO_SEGMENTS.filter(s => s[phaseKey] === 'In Progress').length;
    const issues = DEMO_SEGMENTS.filter(s => s[phaseKey] === 'Issue').length;
    const notStarted = DEMO_SEGMENTS.filter(s => s[phaseKey] === 'Not Started').length;
    return { totalFootage, approved, complete, inProgress, issues, notStarted, total: DEMO_SEGMENTS.length };
  }, [filterPhase]);

  const handleSelectSegment = useCallback((seg) => {
    setSelectedSegment(prev => prev && prev.segment_id === seg.segment_id ? null : seg);
  }, []);

  const sections = [...new Set(DEMO_SEGMENTS.map(s => s.section))].sort();

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{
        padding: '12px 20px', borderBottom: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: darkMode ? '#112240' : '#f8fafc', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setCurrentPage('admin-projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{DEMO_PROJECT.project_name}</div>
            <div style={{ fontSize: 12, color: textMuted }}>{DEMO_PROJECT.project_id} • PO: {DEMO_PROJECT.po_number}</div>
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
            <ProjectGoogleMap
              segments={filteredSegments}
              selectedSegment={selectedSegment}
              onSelectSegment={handleSelectSegment}
              filterPhase={filterPhase}
              darkMode={darkMode}
            />
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
            <SegmentDetailPanel segment={selectedSegment} darkMode={darkMode} onClose={() => setSelectedSegment(null)} user={user} />
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
              <SegmentDetailPanel segment={selectedSegment} darkMode={darkMode} onClose={() => setSelectedSegment(null)} user={user} />
            </div>
          </div>
        )}
      </div>

      {/* Hidden version */}
      <div style={{ position: 'fixed', bottom: 4, right: 8, fontSize: 9, color: 'transparent', userSelect: 'none' }}>ProjectMapPage v2.0.0</div>
    </div>
  );
}

export default ProjectMapPage;
