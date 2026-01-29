// WorkMap.js v2.0 - Connected to Real Backend
// Project Maps, Section Tracking, GPS Work Validation
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Play, Square, Clock, CheckCircle, AlertTriangle, 
  Camera, Truck, Users, Navigation, Pause, AlertOctagon, Eye, Layers,
  ArrowLeft, RefreshCw, Loader, Plus
} from 'lucide-react';
import { colors } from '../config/constants';

const GATEWAY_URL = 'https://script.google.com/macros/s/AKfycbxKqHqIRbYHyjN5sCz7iBJs6WCg1Xt5BdTsMQ3YLspe15UWJ_Qsf_IOa9qapcln_JDS/exec';
const GATEWAY_SECRET = 'LYTcomm2026ClaudeGatewaySecretKey99';
const SHEET_ID = '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc';

const fetchWithRedirect = async (url, options = {}) => {
  try {
    const response = await fetch(url, { ...options, redirect: 'follow' });
    const text = await response.text();
    if (text.trim().startsWith('<')) {
      const match = text.match(/HREF="([^"]+)"/i);
      if (match) {
        const redirectUrl = match[1].replace(/&amp;/g, '&');
        const redirectResponse = await fetch(redirectUrl);
        return redirectResponse.text();
      }
    }
    return text;
  } catch (err) { throw err; }
};

function WorkMap({ darkMode, user, userType, setCurrentPage, loggedInUser }) {
  const currentUser = user || loggedInUser;
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';
  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  const [activeProject, setActiveProject] = useState(null);
  const [workSessions, setWorkSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showVersion, setShowVersion] = useState(false);
  const [message, setMessage] = useState(null);

  // Sample projects - in real app would come from backend
  const projects = [
    { id: 1, name: 'Metronet - Webster Phase 3', location: 'Webster, TX', status: 'active', sections: 12, completed: 8 },
    { id: 2, name: 'Metronet - League City', location: 'League City, TX', status: 'active', sections: 20, completed: 5 },
    { id: 3, name: 'Vexus - Lafayette', location: 'Lafayette, LA', status: 'active', sections: 15, completed: 15 },
  ];

  useEffect(() => {
    if (tracking) {
      const watchId = navigator.geolocation?.watchPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error('GPS error:', err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation?.clearWatch(watchId);
    }
  }, [tracking]);

  const startTracking = async () => {
    if (!activeProject) {
      setMessage({ type: 'error', text: 'Please select a project first' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setTracking(true);
    // Log start to sheet
    await fetchWithRedirect(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: GATEWAY_SECRET,
        action: 'sheetsAppend',
        params: {
          spreadsheetId: SHEET_ID,
          range: 'Work Sessions!A:G',
          values: [[
            new Date().toISOString(),
            currentUser?.email || '',
            currentUser?.name || '',
            activeProject.name,
            'STARTED',
            currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : '',
            ''
          ]]
        }
      })
    });
  };

  const stopTracking = async () => {
    setTracking(false);
    // Log stop to sheet
    await fetchWithRedirect(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: GATEWAY_SECRET,
        action: 'sheetsAppend',
        params: {
          spreadsheetId: SHEET_ID,
          range: 'Work Sessions!A:G',
          values: [[
            new Date().toISOString(),
            currentUser?.email || '',
            currentUser?.name || '',
            activeProject?.name || '',
            'STOPPED',
            currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : '',
            ''
          ]]
        }
      })
    });
    setMessage({ type: 'success', text: 'Work session saved!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const goBack = () => {
    const role = currentUser?.role || userType || 'employee';
    if (role === 'admin') setCurrentPage('admin-dashboard');
    else if (role === 'contractor') setCurrentPage('contractor-dashboard');
    else setCurrentPage('employee-dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '32px' }} onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>
      {message && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', backgroundColor: message.type === 'success' ? accentSecondary : '#ef4444', color: '#fff', borderRadius: '8px', zIndex: 1000 }}>
          {message.text}
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${borderColor}`, borderRadius: '8px', color: textColor, cursor: 'pointer' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: textColor }}>Work Map</h1>
            <p style={{ color: mutedColor }}>GPS tracking and section management</p>
          </div>
        </div>

        {/* Current Location */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${tracking ? accentSecondary : accentPrimary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Navigation size={22} color={tracking ? accentSecondary : accentPrimary} />
              </div>
              <div>
                <div style={{ fontWeight: '500', color: textColor }}>GPS Status</div>
                <div style={{ fontSize: '0.85rem', color: mutedColor }}>
                  {currentLocation ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : 'Location not available'}
                </div>
              </div>
            </div>
            {tracking ? (
              <button onClick={stopTracking} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                <Square size={18} /> Stop Tracking
              </button>
            ) : (
              <button onClick={startTracking} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                <Play size={18} /> Start Tracking
              </button>
            )}
          </div>
        </div>

        {/* Project Selection */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: textColor, marginBottom: '16px' }}>Select Project</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setActiveProject(project)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px', backgroundColor: activeProject?.id === project.id ? `${accentPrimary}15` : (darkMode ? '#1a2633' : '#f8fafc'),
                  border: activeProject?.id === project.id ? `2px solid ${accentPrimary}` : `1px solid ${borderColor}`,
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', color: textColor }}>{project.name}</div>
                  <div style={{ fontSize: '0.85rem', color: mutedColor }}>{project.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: accentSecondary }}>{project.completed}/{project.sections} sections</div>
                  <div style={{ height: '4px', width: '100px', backgroundColor: borderColor, borderRadius: '2px', marginTop: '4px' }}>
                    <div style={{ height: '100%', width: `${(project.completed / project.sections) * 100}%`, backgroundColor: accentSecondary, borderRadius: '2px' }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map Placeholder */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: mutedColor }}>
            <MapPin size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '1.1rem' }}>Map View</div>
            <div style={{ fontSize: '0.9rem', marginTop: '8px' }}>
              {activeProject ? `Viewing: ${activeProject.name}` : 'Select a project to view map'}
            </div>
            {tracking && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: `${accentSecondary}20`, borderRadius: '8px', color: accentSecondary }}>
                <Clock size={16} style={{ marginRight: '8px' }} />
                Tracking in progress...
              </div>
            )}
          </div>
        </div>
      </div>

      {showVersion && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.7rem', opacity: 0.5, color: textColor, backgroundColor: cardBg, padding: '4px 8px', borderRadius: '4px' }}>
          WorkMap v2.0
        </div>
      )}
    </div>
  );
}

export default WorkMap;
