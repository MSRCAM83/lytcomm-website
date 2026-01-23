// WorkMap.js v1.0 - Project Maps, Section Tracking, GPS Work Validation
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Play, Square, Clock, CheckCircle, AlertTriangle, 
  Camera, Truck, Users, Navigation, Pause, AlertOctagon, Eye, Layers
} from 'lucide-react';

function WorkMap({ darkMode, user, userType }) {
  const [activeProject, setActiveProject] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [workStatus, setWorkStatus] = useState('idle');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showValidationError, setShowValidationError] = useState(null);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState('map');

  // Theme colors
  const accentPrimary = darkMode ? '#c850c0' : '#0077B6';
  const bgColor = darkMode ? '#0d1b2a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1e293b';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  // Mock project data
  const [projects] = useState([
    {
      id: 'SLPH.01',
      name: 'Sulphur Area 1',
      customer: 'Metronet/Vexus',
      location: 'Lake Charles, LA',
      sections: [
        { 
          id: 'SLPH.01.006', 
          status: 'in_progress', 
          assignedTo: 'Gulf Coast Boring LLC',
          footage: 487,
          completedFootage: 210,
          locateExpires: '2026-01-30',
          permitExpires: '2026-02-15',
          potholesApproved: 2,
          potholesPending: 1
        },
        { 
          id: 'SLPH.01.007', 
          status: 'not_started', 
          assignedTo: 'XYZ Drilling',
          footage: 623,
          completedFootage: 0,
          locateExpires: '2026-01-28',
          permitExpires: '2026-02-15',
          potholesApproved: 2,
          potholesPending: 0
        },
        { 
          id: 'SLPH.01.008', 
          status: 'completed', 
          assignedTo: 'Gulf Coast Boring LLC',
          footage: 412,
          completedFootage: 412,
          locateExpires: '2026-01-25',
          permitExpires: '2026-02-15',
          potholesApproved: 3,
          potholesPending: 0
        }
      ]
    }
  ]);

  // Mock active crews
  const [activeCrews] = useState([
    {
      id: 1,
      contractor: 'Gulf Coast Boring LLC',
      drillId: 'Drill 1',
      crewLead: 'Mike Torres',
      section: 'SLPH.01.006',
      status: 'working',
      startTime: '08:47 AM',
      footageToday: 145
    },
    {
      id: 2,
      contractor: 'Gulf Coast Boring LLC',
      drillId: 'Drill 2',
      crewLead: 'Carlos Rivera',
      section: 'SLPH.01.006',
      status: 'working',
      startTime: '08:52 AM',
      footageToday: 132
    }
  ]);

  // Get GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('GPS Error:', error)
      );
    }
  }, []);

  // Track elapsed time
  useEffect(() => {
    let interval;
    if (workStatus === 'working' && workStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - workStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workStatus, workStartTime]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Validate work start
  const validateWorkStart = (section) => {
    const errors = [];
    
    if (!currentLocation) {
      errors.push({ type: 'error', message: 'GPS location unavailable. Enable location services.' });
    }
    
    if (new Date(section.locateExpires) < new Date()) {
      errors.push({ type: 'error', message: '811 Locate ticket expired. Cannot start work.' });
    }
    
    if (new Date(section.permitExpires) < new Date()) {
      errors.push({ type: 'error', message: 'Permit expired. Cannot start work.' });
    }
    
    if (section.potholesPending > 0) {
      errors.push({ type: 'error', message: `${section.potholesPending} pothole(s) pending approval. Cannot drill.` });
    }
    
    return errors;
  };

  const handleStartWork = () => {
    if (!selectedSection) return;
    const errors = validateWorkStart(selectedSection);
    
    if (errors.filter(e => e.type === 'error').length > 0) {
      setShowValidationError(errors);
      return;
    }
    
    setWorkStatus('working');
    setWorkStartTime(Date.now());
    setShowValidationError(null);
  };

  const handleStopWork = () => {
    setWorkStatus('idle');
    setWorkStartTime(null);
    setElapsedTime(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'not_started': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Complete';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      default: return status;
    }
  };

  // Management View - shows all crews and sections
  const renderManagementView = () => (
    <div style={{ padding: '24px' }}>
      {/* Capacity Summary */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '24px',
        border: `1px solid ${borderColor}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ color: textColor, marginBottom: '4px' }}>Active Crews Today</h3>
            <p style={{ color: mutedColor, fontSize: '0.9rem' }}>Real-time work tracking</p>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                {activeCrews.filter(c => c.status === 'working').length}
              </div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>Working</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
                {activeCrews.filter(c => c.status === 'idle').length}
              </div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>Idle</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: textColor }}>
                {activeCrews.reduce((sum, c) => sum + c.footageToday, 0)}
              </div>
              <div style={{ fontSize: '0.85rem', color: mutedColor }}>Footage Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '12px', 
        height: '400px', 
        marginBottom: '24px',
        border: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', color: mutedColor }}>
          <MapPin size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ fontWeight: '600' }}>Interactive Map</p>
          <p style={{ fontSize: '0.85rem' }}>Shows crew locations, section status, work progress</p>
          <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>Google Maps API integration required</p>
        </div>
        
        {/* Legend */}
        <div style={{ 
          position: 'absolute', 
          bottom: '16px', 
          left: '16px', 
          backgroundColor: cardBg, 
          padding: '12px 16px', 
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          display: 'flex',
          gap: '16px',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ color: textColor }}>Complete</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span style={{ color: textColor }}>In Progress</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6b7280' }} />
            <span style={{ color: textColor }}>Not Started</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
            <span style={{ color: textColor }}>Active Crew</span>
          </div>
        </div>
      </div>

      {/* Active Crews Table */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '12px', 
        border: `1px solid ${borderColor}`,
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderColor}` }}>
          <h3 style={{ color: textColor, margin: 0 }}>Active Crews</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: darkMode ? '#112240' : '#f8fafc' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Contractor</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Drill</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Crew Lead</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Section</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Started</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: mutedColor, fontWeight: '600', fontSize: '0.85rem' }}>Footage Today</th>
            </tr>
          </thead>
          <tbody>
            {activeCrews.map(crew => (
              <tr key={crew.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                <td style={{ padding: '12px 16px', color: textColor, fontWeight: '500' }}>{crew.contractor}</td>
                <td style={{ padding: '12px 16px', color: textColor }}>{crew.drillId}</td>
                <td style={{ padding: '12px 16px', color: textColor }}>{crew.crewLead}</td>
                <td style={{ padding: '12px 16px', color: accentPrimary, fontWeight: '500' }}>{crew.section}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    backgroundColor: crew.status === 'working' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: crew.status === 'working' ? '#10b981' : '#f59e0b'
                  }}>
                    {crew.status === 'working' ? '● Working' : '○ Idle'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: textColor }}>{crew.startTime || '-'}</td>
                <td style={{ padding: '12px 16px', color: textColor, fontWeight: '600' }}>{crew.footageToday} ft</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Contractor/Crew View - shows their assigned sections
  const renderCrewView = () => (
    <div style={{ padding: '24px' }}>
      {/* Work Status Bar */}
      {workStatus === 'working' && (
        <div style={{ 
          backgroundColor: 'rgba(16, 185, 129, 0.1)', 
          borderRadius: '12px', 
          padding: '16px 20px', 
          marginBottom: '24px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: '#10b981',
              animation: 'pulse 2s infinite'
            }} />
            <div>
              <div style={{ color: '#10b981', fontWeight: '600' }}>Working on {selectedSection?.id}</div>
              <div style={{ color: textColor, fontSize: '0.9rem' }}>Elapsed: {formatTime(elapsedTime)}</div>
            </div>
          </div>
          <button
            onClick={handleStopWork}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Square size={18} /> Stop Work
          </button>
        </div>
      )}

      {/* Validation Error Modal */}
      {showValidationError && (
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '24px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <AlertOctagon size={24} color="#ef4444" />
            <h3 style={{ color: '#ef4444', margin: 0 }}>Cannot Start Work</h3>
          </div>
          {showValidationError.map((error, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 0',
              color: error.type === 'error' ? '#ef4444' : '#f59e0b'
            }}>
              <AlertTriangle size={16} />
              {error.message}
            </div>
          ))}
          <button
            onClick={() => setShowValidationError(null)}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Project Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ color: textColor, fontWeight: '500', display: 'block', marginBottom: '8px' }}>
          Select Project
        </label>
        <select
          value={activeProject?.id || ''}
          onChange={(e) => {
            const project = projects.find(p => p.id === e.target.value);
            setActiveProject(project);
            setSelectedSection(null);
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            backgroundColor: cardBg,
            color: textColor,
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          <option value="">Choose a project...</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
          ))}
        </select>
      </div>

      {/* Map Placeholder */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '12px', 
        height: '300px', 
        marginBottom: '24px',
        border: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: mutedColor }}>
          <Navigation size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ fontWeight: '600' }}>Your Location + Assigned Sections</p>
          <p style={{ fontSize: '0.85rem' }}>Tap a section to select, then Start Work</p>
          {currentLocation && (
            <p style={{ fontSize: '0.8rem', marginTop: '8px', color: '#10b981' }}>
              GPS Active: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </p>
          )}
        </div>
      </div>

      {/* Assigned Sections List */}
      {activeProject && (
        <div style={{ 
          backgroundColor: cardBg, 
          borderRadius: '12px', 
          border: `1px solid ${borderColor}`,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderColor}` }}>
            <h3 style={{ color: textColor, margin: 0 }}>Your Assigned Sections</h3>
          </div>
          {activeProject.sections
            .filter(s => s.assignedTo === user?.company || s.assignedTo === 'Gulf Coast Boring LLC') // Filter by user's company
            .map(section => (
              <div 
                key={section.id}
                onClick={() => setSelectedSection(section)}
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: `1px solid ${borderColor}`,
                  cursor: 'pointer',
                  backgroundColor: selectedSection?.id === section.id ? `${accentPrimary}10` : 'transparent',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ 
                        fontWeight: '600', 
                        color: selectedSection?.id === section.id ? accentPrimary : textColor,
                        fontSize: '1.1rem'
                      }}>
                        {section.id}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: `${getStatusColor(section.status)}20`,
                        color: getStatusColor(section.status)
                      }}>
                        {getStatusLabel(section.status)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: mutedColor }}>
                      <span>📏 {section.completedFootage}/{section.footage} ft</span>
                      <span>📋 Locate: {section.locateExpires}</span>
                      <span>✅ Potholes: {section.potholesApproved} approved</span>
                      {section.potholesPending > 0 && (
                        <span style={{ color: '#ef4444' }}>⚠️ {section.potholesPending} pending</span>
                      )}
                    </div>
                  </div>
                  {selectedSection?.id === section.id && workStatus === 'idle' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartWork();
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Play size={18} /> Start Work
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  // Tab navigation for management
  const tabs = [
    { id: 'map', label: 'Live Map', icon: <MapPin size={18} /> },
    { id: 'sections', label: 'Sections', icon: <Layers size={18} /> },
    { id: 'crews', label: 'Crews', icon: <Users size={18} /> }
  ];

  const isManagement = userType === 'admin' || userType === 'supervisor';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: cardBg, 
        padding: '16px 24px',
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ color: textColor, margin: 0 }}>
            {isManagement ? 'Work Map - Management View' : 'My Assigned Work'}
          </h2>
          <p style={{ color: mutedColor, fontSize: '0.9rem', margin: '4px 0 0' }}>
            {isManagement ? 'Monitor all crews and sections in real-time' : 'View your sections and start work'}
          </p>
        </div>
        {currentLocation && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#10b981'
          }}>
            <Navigation size={16} />
            GPS Active
          </div>
        )}
      </div>

      {/* Tab Navigation for Management */}
      {isManagement && (
        <div style={{ 
          backgroundColor: cardBg, 
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          gap: '4px',
          padding: '0 24px'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 20px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? `3px solid ${accentPrimary}` : '3px solid transparent',
                color: activeTab === tab.id ? accentPrimary : mutedColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: activeTab === tab.id ? '600' : '400'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isManagement ? renderManagementView() : renderCrewView()}

      {/* Pulse animation for working indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default WorkMap;
