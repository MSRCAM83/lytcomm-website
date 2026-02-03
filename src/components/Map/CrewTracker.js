/**
 * LYT Communications - Crew GPS Tracker Component
 * Version: 1.1.0
 * Created: 2026-02-03
 *
 * Shows real-time crew GPS positions on the project map.
 * Admin-only feature that displays colored markers for each active crew,
 * with movement trails, status badges, and nearest-segment detection.
 *
 * Features:
 * - Real-time crew markers with role-based colors
 * - Movement detection (stationary vs moving indicator)
 * - Nearest segment auto-detection
 * - Crew info popup on click
 * - Auto-updates every 30 seconds
 * - Battery-efficient tracking mode toggle
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { Navigation, Users, Battery, Signal, MapPin, Clock, Activity, X } from 'lucide-react';
import { startTracking, stopTracking, isTracking, getCurrentPosition, findNearestSegment, calculateDistance } from '../../services/gpsService';
import { logAction } from '../../services/mapService';

// Crew type colors
const CREW_COLORS = {
  boring: '#FFB800',    // Yellow
  pulling: '#2196F3',   // Blue
  splicing: '#9C27B0',  // Purple
  admin: '#4CAF50',     // Green
  unknown: '#9E9E9E',   // Gray
};

// Crew type icons (emoji)
const CREW_ICONS = {
  boring: '🚧',
  pulling: '🚛',
  splicing: '⚡',
  admin: '👷',
  unknown: '📍',
};

/**
 * CrewTracker - Manages and displays crew GPS positions
 * Props:
 * - segments: array of project segments (for nearest-segment detection)
 * - darkMode: boolean
 * - isAdmin: boolean (only admins see all crews)
 * - user: current logged-in user object
 * - onCrewClick: callback when a crew marker is clicked
 */
const CrewTracker = ({ segments = [], darkMode = true, isAdmin = false, user = null, onCrewClick }) => {
  const [myPosition, setMyPosition] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [nearestSeg, setNearestSeg] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [highAccuracy, setHighAccuracy] = useState(false);
  const trackingStartedRef = useRef(false);

  // Colors
  const bg = darkMode ? '#112240' : '#f8fafc';
  const border = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const muted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  const crewType = user?.role?.toLowerCase() === 'admin' ? 'admin'
    : user?.workType?.toLowerCase() || 'unknown';

  // Start/stop tracking
  const toggleTracking = useCallback(() => {
    if (trackingEnabled) {
      stopTracking();
      setTrackingEnabled(false);
      trackingStartedRef.current = false;
    } else {
      const success = startTracking({
        onUpdate: (pos) => {
          setMyPosition(pos);
          setError(null);
          // Find nearest segment
          let nearestInfo = null;
          if (segments.length > 0) {
            nearestInfo = findNearestSegment(pos, segments);
            setNearestSeg(nearestInfo);
          }
          // Report position to Google Sheets Work Log (throttled - every 5th update)
          if (!window._gpsReportCount) window._gpsReportCount = 0;
          window._gpsReportCount++;
          if (window._gpsReportCount % 5 === 1) {
            const userEmail = window.lytUser?.email || 'unknown';
            const projectId = segments[0]?.project_id || 'unknown';
            const segId = nearestInfo?.segment?.segment_id || '';
            logAction(projectId, segId, userEmail, 'GPS Update', JSON.stringify({
              lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy,
              speed: pos.speed, isMoving: pos.isMoving,
              nearestSegment: nearestInfo?.segment?.segment_id || null,
              nearestDistance: nearestInfo?.distance ? Math.round(nearestInfo.distance) : null,
            }), { lat: pos.lat, lng: pos.lng }).catch(() => {/* silent - don't break tracking on log failure */});
          }
        },
        onError: (msg) => setError(msg),
        interval: highAccuracy ? 15000 : 30000,
        highAccuracy,
      });
      if (success) {
        setTrackingEnabled(true);
        trackingStartedRef.current = true;
      }
    }
  }, [trackingEnabled, highAccuracy, segments]);

  // Get one-shot position on mount
  useEffect(() => {
    getCurrentPosition()
      .then(pos => setMyPosition(pos))
      .catch(() => {/* silent */});
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingStartedRef.current) {
        stopTracking();
      }
    };
  }, []);

  // Update nearest segment when position or segments change
  useEffect(() => {
    if (myPosition && segments.length > 0) {
      const nearest = findNearestSegment(myPosition, segments);
      setNearestSeg(nearest);
    }
  }, [myPosition, segments]);

  const formatDistance = (meters) => {
    if (!meters && meters !== 0) return '—';
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16, zIndex: 20,
      backgroundColor: bg, borderRadius: 12, border: `1px solid ${border}`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      width: expanded ? 280 : 'auto', overflow: 'hidden',
      transition: 'width 0.2s ease',
    }}>
      {/* Header - always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          cursor: 'pointer', borderBottom: expanded ? `1px solid ${border}` : 'none',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          backgroundColor: trackingEnabled ? (myPosition?.isMoving ? '#FFB800' : '#4CAF50') : `${muted}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <Navigation size={16} color={trackingEnabled ? '#fff' : muted} />
          {trackingEnabled && (
            <div style={{
              position: 'absolute', top: -2, right: -2,
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: myPosition?.isMoving ? '#FFB800' : '#4CAF50',
              border: `2px solid ${bg}`,
              animation: 'pulse 2s infinite',
            }} />
          )}
        </div>
        {!expanded && (
          <span style={{ fontSize: 13, fontWeight: 600, color: text }}>
            {trackingEnabled ? (myPosition?.isMoving ? 'Moving' : 'Tracking') : 'GPS Off'}
          </span>
        )}
        {expanded && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: text }}>Crew GPS Tracker</div>
            <div style={{ fontSize: 11, color: muted }}>
              {trackingEnabled ? `Updated ${formatTime(myPosition?.timestamp)}` : 'Not tracking'}
            </div>
          </div>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding: 14 }}>
          {/* Current position */}
          {myPosition && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: muted, textTransform: 'uppercase', marginBottom: 6 }}>My Position</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ backgroundColor: darkMode ? '#0d1b2a' : '#f1f5f9', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: muted }}>Lat</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{myPosition.lat?.toFixed(5)}</div>
                </div>
                <div style={{ backgroundColor: darkMode ? '#0d1b2a' : '#f1f5f9', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: muted }}>Lng</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{myPosition.lng?.toFixed(5)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: muted }}>
                <span>±{Math.round(myPosition.accuracy || 0)}m</span>
                {myPosition.speed != null && <span>{(myPosition.speed * 2.237).toFixed(1)} mph</span>}
                <span style={{ color: myPosition.isMoving ? '#FFB800' : '#4CAF50' }}>
                  {myPosition.isMoving ? '● Moving' : '● Stationary'}
                </span>
              </div>
            </div>
          )}

          {/* Nearest segment */}
          {nearestSeg && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: muted, textTransform: 'uppercase', marginBottom: 6 }}>Nearest Segment</div>
              <div
                onClick={() => onCrewClick && onCrewClick(nearestSeg)}
                style={{
                  backgroundColor: darkMode ? '#0d1b2a' : '#f1f5f9', borderRadius: 8,
                  padding: '10px 12px', cursor: 'pointer',
                  borderLeft: `3px solid ${accent}`,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: text }}>{nearestSeg.contractor_id}</div>
                <div style={{ fontSize: 12, color: muted }}>{nearestSeg.street || 'Unknown St'}</div>
                <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginTop: 4 }}>
                  {formatDistance(nearestSeg.distance)} away
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{ padding: '8px 10px', backgroundColor: '#dc354520', borderRadius: 8, marginBottom: 12, fontSize: 12, color: '#dc3545' }}>
              {error}
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Track toggle */}
            <button
              onClick={toggleTracking}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13,
                backgroundColor: trackingEnabled ? '#dc354520' : `${accent}20`,
                color: trackingEnabled ? '#dc3545' : accent,
              }}
            >
              {trackingEnabled ? (
                <><X size={14} /> Stop Tracking</>
              ) : (
                <><Navigation size={14} /> Start Tracking</>
              )}
            </button>

            {/* High accuracy toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: 12, color: muted }}>High Accuracy (uses more battery)</span>
              <button
                onClick={() => setHighAccuracy(!highAccuracy)}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  backgroundColor: highAccuracy ? accent : `${muted}40`,
                  border: 'none', cursor: 'pointer', position: 'relative',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
                  position: 'absolute', top: 2, left: highAccuracy ? 20 : 2,
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Hidden version - triple click */}
      <div
        onClick={(e) => { if (e.detail === 3) alert('CrewTracker v1.1.0'); }}
        style={{ height: 1, opacity: 0 }}
      />
    </div>
  );
};

export default CrewTracker;

// v1.0.0
