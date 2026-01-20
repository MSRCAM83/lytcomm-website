import React, { useState, useEffect } from 'react';
import { LogOut, Clock, Briefcase, FileText, Settings, Bell, Play, Square, Calendar, MapPin, ChevronRight, Download, Folder, Camera, HardHat, Activity, Plus, AlertTriangle, Truck, Zap, Phone, Award, Upload, Eye, ShieldAlert } from 'lucide-react';
import { colors, mockProjects, mockTimeEntries, mockFiles, mockAnnouncements, mockUsers } from '../config/constants';

const EmployeeDashboard = ({ setCurrentPage, loggedInUser, setLoggedInUser, darkMode }) => {
  // Dynamic colors based on theme
  const accentPrimary = darkMode ? '#667eea' : '#00b4d8';     // Purple vs Teal
  const accentSecondary = darkMode ? '#ff6b35' : '#28a745';   // Orange vs Green
  const accentError = darkMode ? '#ff6b6b' : '#e85a4f';       // Error red

  const bgColor = darkMode ? colors.dark : '#f8fafc';
  const cardBg = darkMode ? colors.darkLight : '#ffffff';
  const textColor = darkMode ? '#ffffff' : colors.dark;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval;
    if (clockedIn && clockTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - clockTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockedIn, clockTime]);

  const formatElapsed = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    setClockedIn(true);
    setClockTime(Date.now());
    setElapsedTime(0);
  };

  const handleClockOut = () => {
    setClockedIn(false);
    setClockTime(null);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentPage('portal-login');
  };

  // Shared form styles - white background for visibility in all modes
  const formInputStyle = {
    width: '100%',
    padding: '10px',
    border: `1px solid ${darkMode ? '#374151' : '#ddd'}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
  };

  const formSelectStyle = {
    ...formInputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
  };

  const userProjects = mockProjects.filter((p) => p.crew.includes(loggedInUser?.id));
  const userTimeEntries = mockTimeEntries.filter((t) => t.userId === loggedInUser?.id);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Clock },
    { id: 'production', label: 'Daily Production', icon: Activity },
    { id: 'otdr', label: 'OTDR Results', icon: Zap },
    { id: 'tickets', label: '811 Tickets', icon: Phone },
    { id: 'equipment', label: 'Equipment Check', icon: Truck },
    { id: 'safety', label: 'Safety / Toolbox', icon: HardHat },
    { id: 'certs', label: 'Certifications', icon: Award },
    { id: 'incidents', label: 'Incident Reports', icon: ShieldAlert },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'files', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderDashboard = () => (
    <div>
      {/* Welcome & Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {loggedInUser?.name?.split(' ')[0]}!
        </h2>
        <p style={{ color: colors.gray }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Time Clock Card */}
      <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={24} color={accentPrimary} /> Time Clock
            </h3>
            {clockedIn ? (
              <div>
                <p style={{ color: accentSecondary, fontWeight: '600', fontSize: '1.1rem' }}>● Clocked In</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'monospace', color: accentPrimary }}>{formatElapsed(elapsedTime)}</p>
              </div>
            ) : (
              <p style={{ color: colors.gray }}>You are not clocked in</p>
            )}
          </div>
          <div>
            {clockedIn ? (
              <button
                onClick={handleClockOut}
                style={{
                  padding: '16px 32px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  backgroundColor: accentError,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Square size={20} /> Clock Out
              </button>
            ) : (
              <button
                onClick={handleClockIn}
                style={{
                  padding: '16px 32px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  backgroundColor: accentSecondary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Play size={20} /> Clock In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Hours This Week', value: '32.5', icon: Clock, color: accentPrimary },
          { label: 'Active Projects', value: userProjects.filter((p) => p.status === 'active').length, icon: Briefcase, color: accentPrimary },
          { label: 'Pending Approvals', value: userTimeEntries.filter((t) => t.status === 'pending').length, icon: Calendar, color: accentError },
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <stat.icon size={20} color={stat.color} />
              <span style={{ color: colors.gray, fontSize: '0.9rem' }}>{stat.label}</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: '700' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Current Projects */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Your Projects</h3>
          {userProjects.length === 0 ? (
            <p style={{ color: colors.gray }}>No active projects assigned</p>
          ) : (
            userProjects.slice(0, 3).map((project) => (
              <div key={project.id} style={{ padding: '12px 0', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '500' }}>{project.name}</span>
                  <span style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: project.status === 'active' ? `${accentSecondary}20` : `${colors.gray}20`, color: project.status === 'active' ? accentSecondary : colors.gray, borderRadius: '4px' }}>
                    {project.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.gray, fontSize: '0.85rem' }}>
                  <MapPin size={14} /> {project.client}
                </div>
                <div style={{ marginTop: '8px', height: '6px', backgroundColor: darkMode ? colors.dark : '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${project.progress}%`, backgroundColor: accentPrimary, borderRadius: '3px' }} />
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => setActiveTab('projects')}
            style={{ marginTop: '16px', backgroundColor: 'transparent', border: 'none', color: accentPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
          >
            View All <ChevronRight size={16} />
          </button>
        </div>

        {/* Announcements */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color={accentError} /> Announcements
          </h3>
          {mockAnnouncements.map((announcement) => (
            <div key={announcement.id} style={{ padding: '12px 0', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {announcement.priority === 'high' && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: accentError }} />}
                <span style={{ fontWeight: '500' }}>{announcement.title}</span>
              </div>
              <p style={{ color: colors.gray, fontSize: '0.85rem', marginBottom: '4px' }}>{announcement.content}</p>
              <span style={{ color: colors.gray, fontSize: '0.75rem' }}>{announcement.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Time Entries */}
      <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', marginTop: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Recent Time Entries</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: colors.gray, fontWeight: '500', fontSize: '0.85rem' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: colors.gray, fontWeight: '500', fontSize: '0.85rem' }}>Project</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: colors.gray, fontWeight: '500', fontSize: '0.85rem' }}>In</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: colors.gray, fontWeight: '500', fontSize: '0.85rem' }}>Out</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: colors.gray, fontWeight: '500', fontSize: '0.85rem' }}>Hours</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: colors.gray, fontWeight: '500', fontSize: '0.85rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {userTimeEntries.slice(0, 5).map((entry) => {
                const hours = entry.clockOut ? ((new Date(`2000-01-01 ${entry.clockOut}`) - new Date(`2000-01-01 ${entry.clockIn}`)) / 3600000 - entry.breakTime / 60).toFixed(1) : '-';
                return (
                  <tr key={entry.id} style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                    <td style={{ padding: '12px 8px' }}>{entry.date}</td>
                    <td style={{ padding: '12px 8px' }}>{entry.project}</td>
                    <td style={{ padding: '12px 8px' }}>{entry.clockIn}</td>
                    <td style={{ padding: '12px 8px' }}>{entry.clockOut || '-'}</td>
                    <td style={{ padding: '12px 8px' }}>{hours}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        backgroundColor: entry.status === 'approved' ? `${accentSecondary}20` : entry.status === 'pending' ? `${accentError}20` : `${accentPrimary}20`,
                        color: entry.status === 'approved' ? accentSecondary : entry.status === 'pending' ? accentError : accentPrimary,
                      }}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Your Projects</h2>
      <div style={{ display: 'grid', gap: '16px' }}>
        {userProjects.map((project) => (
          <div key={project.id} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '4px' }}>{project.name}</h3>
                <p style={{ color: colors.gray }}>{project.client}</p>
              </div>
              <span style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '500',
                backgroundColor: project.status === 'active' ? `${accentSecondary}20` : project.status === 'completed' ? `${accentPrimary}20` : `${accentError}20`,
                color: project.status === 'active' ? accentSecondary : project.status === 'completed' ? accentPrimary : accentError,
              }}>
                {project.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', color: colors.gray, fontSize: '0.9rem' }}>
              <span>Start: {project.startDate}</span>
              <span>End: {project.endDate}</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.9rem', color: colors.gray }}>Progress</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{project.progress}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: darkMode ? colors.dark : '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${project.progress}%`, backgroundColor: accentPrimary, borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFiles = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Documents</h2>
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        {mockFiles.map((file, idx) => (
          <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: idx < mockFiles.length - 1 ? `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: `${accentPrimary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {file.type === 'pdf' ? <FileText size={20} color={accentError} /> : <Folder size={20} color={accentPrimary} />}
              </div>
              <div>
                <p style={{ fontWeight: '500', marginBottom: '2px' }}>{file.name}</p>
                <p style={{ fontSize: '0.8rem', color: colors.gray }}>{file.folder} • {file.size} • {file.date}</p>
              </div>
            </div>
            <button style={{ padding: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: accentPrimary }}>
              <Download size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // eslint-disable-next-line no-unused-vars
  const renderTeam = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Team Directory</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {mockUsers.map((user) => (
          <div key={user.id} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: accentPrimary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>
                {user.avatar}
              </div>
              <div>
                <p style={{ fontWeight: '600' }}>{user.name}</p>
                <p style={{ fontSize: '0.85rem', color: colors.gray, textTransform: 'capitalize' }}>{user.role}</p>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', color: colors.gray }}>
              <p style={{ marginBottom: '4px' }}>{user.email}</p>
              <p>{user.phone}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Field Operations - Daily Production Log
  const [productionLog, setProductionLog] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
    fiberFootage: '',
    splicesCompleted: '',
    polesSet: '',
    hddBoreLength: '',
    conduitInstalled: '',
    notes: '',
    photos: [],
  });

  const renderProduction = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Daily Production Log</h2>
          <p style={{ color: colors.gray }}>Record your daily work progress</p>
        </div>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Date *</label>
            <input
              type="date"
              value={productionLog.date}
              onChange={(e) => setProductionLog({ ...productionLog, date: e.target.value })}
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Project *</label>
            <select
              value={productionLog.project}
              onChange={(e) => setProductionLog({ ...productionLog, project: e.target.value })}
              style={formSelectStyle}
            >
              <option value="">Select project...</option>
              {mockProjects.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: accentPrimary }}>Production Quantities</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Fiber Installed (ft)</label>
            <input
              type="number"
              value={productionLog.fiberFootage}
              onChange={(e) => setProductionLog({ ...productionLog, fiberFootage: e.target.value })}
              placeholder="0"
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Splices Completed</label>
            <input
              type="number"
              value={productionLog.splicesCompleted}
              onChange={(e) => setProductionLog({ ...productionLog, splicesCompleted: e.target.value })}
              placeholder="0"
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Poles Set</label>
            <input
              type="number"
              value={productionLog.polesSet}
              onChange={(e) => setProductionLog({ ...productionLog, polesSet: e.target.value })}
              placeholder="0"
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>HDD Bore (ft)</label>
            <input
              type="number"
              value={productionLog.hddBoreLength}
              onChange={(e) => setProductionLog({ ...productionLog, hddBoreLength: e.target.value })}
              placeholder="0"
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Conduit (ft)</label>
            <input
              type="number"
              value={productionLog.conduitInstalled}
              onChange={(e) => setProductionLog({ ...productionLog, conduitInstalled: e.target.value })}
              placeholder="0"
              style={formInputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Notes / Comments</label>
          <textarea
            value={productionLog.notes}
            onChange={(e) => setProductionLog({ ...productionLog, notes: e.target.value })}
            placeholder="Any delays, issues, or additional notes..."
            rows={3}
            style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? '#1f2937' : '#ffffff', color: textColor, resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>
            <Camera size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Photo Documentation
          </label>
          <div style={{ border: `2px dashed ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
            <Camera size={32} color={colors.gray} style={{ marginBottom: '8px' }} />
            <p style={{ color: colors.gray, marginBottom: '8px' }}>Drag photos here or click to upload</p>
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} id="photo-upload" />
            <label htmlFor="photo-upload" style={{ padding: '8px 16px', backgroundColor: accentPrimary, color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
              Select Photos
            </label>
          </div>
        </div>

        <button
          onClick={() => alert('Production log submitted!')}
          style={{ width: '100%', padding: '14px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
        >
          Submit Production Log
        </button>
      </div>
    </div>
  );

  // Field Operations - Equipment Pre-Use Inspection
  const [equipmentCheck, setEquipmentCheck] = useState({
    date: new Date().toISOString().split('T')[0],
    equipmentType: '',
    equipmentId: '',
    mileage: '',
    items: {
      tires: null,
      brakes: null,
      lights: null,
      fluids: null,
      safetyEquipment: null,
      fireExtinguisher: null,
      firstAidKit: null,
      triangles: null,
    },
    issues: '',
  });

  const equipmentTypes = [
    'Pickup Truck',
    'Service Van',
    'Bucket Truck',
    'Trailer',
    'HDD Drill Rig',
    'Mini Excavator',
    'Fusion Splicer',
    'OTDR',
  ];

  const inspectionItems = [
    { key: 'tires', label: 'Tires / Wheels' },
    { key: 'brakes', label: 'Brakes' },
    { key: 'lights', label: 'Lights / Signals' },
    { key: 'fluids', label: 'Fluids (Oil, Coolant)' },
    { key: 'safetyEquipment', label: 'Safety Equipment' },
    { key: 'fireExtinguisher', label: 'Fire Extinguisher' },
    { key: 'firstAidKit', label: 'First Aid Kit' },
    { key: 'triangles', label: 'Warning Triangles' },
  ];

  const renderEquipment = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Equipment Pre-Use Inspection</h2>
          <p style={{ color: colors.gray }}>Complete before operating any equipment</p>
        </div>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Date *</label>
            <input
              type="date"
              value={equipmentCheck.date}
              onChange={(e) => setEquipmentCheck({ ...equipmentCheck, date: e.target.value })}
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Equipment Type *</label>
            <select
              value={equipmentCheck.equipmentType}
              onChange={(e) => setEquipmentCheck({ ...equipmentCheck, equipmentType: e.target.value })}
              style={formSelectStyle}
            >
              <option value="">Select type...</option>
              {equipmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Unit # / ID *</label>
            <input
              type="text"
              value={equipmentCheck.equipmentId}
              onChange={(e) => setEquipmentCheck({ ...equipmentCheck, equipmentId: e.target.value })}
              placeholder="e.g., T-101"
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Mileage / Hours</label>
            <input
              type="text"
              value={equipmentCheck.mileage}
              onChange={(e) => setEquipmentCheck({ ...equipmentCheck, mileage: e.target.value })}
              placeholder="Current reading"
              style={formInputStyle}
            />
          </div>
        </div>

        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: accentPrimary }}>Inspection Checklist</h4>
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          {inspectionItems.map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
              <span>{item.label}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEquipmentCheck({ ...equipmentCheck, items: { ...equipmentCheck.items, [item.key]: 'pass' } })}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: equipmentCheck.items[item.key] === 'pass' ? accentSecondary : 'transparent',
                    border: `1px solid ${accentSecondary}`,
                    borderRadius: '6px',
                    color: equipmentCheck.items[item.key] === 'pass' ? '#fff' : accentSecondary,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Pass
                </button>
                <button
                  onClick={() => setEquipmentCheck({ ...equipmentCheck, items: { ...equipmentCheck.items, [item.key]: 'fail' } })}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: equipmentCheck.items[item.key] === 'fail' ? accentError : 'transparent',
                    border: `1px solid ${accentError}`,
                    borderRadius: '6px',
                    color: equipmentCheck.items[item.key] === 'fail' ? '#fff' : accentError,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Fail
                </button>
                <button
                  onClick={() => setEquipmentCheck({ ...equipmentCheck, items: { ...equipmentCheck.items, [item.key]: 'na' } })}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: equipmentCheck.items[item.key] === 'na' ? colors.gray : 'transparent',
                    border: `1px solid ${colors.gray}`,
                    borderRadius: '6px',
                    color: equipmentCheck.items[item.key] === 'na' ? '#fff' : colors.gray,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  N/A
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Issues / Deficiencies Found
          </label>
          <textarea
            value={equipmentCheck.issues}
            onChange={(e) => setEquipmentCheck({ ...equipmentCheck, issues: e.target.value })}
            placeholder="Describe any issues found..."
            rows={3}
            style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? '#1f2937' : '#ffffff', color: textColor, resize: 'vertical' }}
          />
        </div>

        <button
          onClick={() => alert('Equipment inspection submitted!')}
          style={{ width: '100%', padding: '14px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
        >
          Submit Inspection
        </button>
      </div>
    </div>
  );

  // Field Operations - Safety / Toolbox Talk
  const [toolboxTalk, setToolboxTalk] = useState({
    date: new Date().toISOString().split('T')[0],
    topic: '',
    customTopic: '',
    project: '',
    attendees: [],
    notes: '',
    acknowledged: false,
  });

  const safetyTopics = [
    'Trenching & Excavation Safety',
    'Electrical Safety / Lockout-Tagout',
    'PPE Requirements',
    'Heat Stress Prevention',
    'Cold Weather Safety',
    'Traffic Control',
    'Ladder Safety',
    'Hand & Power Tool Safety',
    'Hazard Communication',
    'Emergency Procedures',
    'Slip, Trip & Fall Prevention',
    'Confined Space Entry',
    'Other (specify below)',
  ];

  const renderSafety = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Safety / Toolbox Talk</h2>
          <p style={{ color: colors.gray }}>Daily safety briefing sign-in</p>
        </div>
      </div>

      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Date *</label>
            <input
              type="date"
              value={toolboxTalk.date}
              onChange={(e) => setToolboxTalk({ ...toolboxTalk, date: e.target.value })}
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Project / Location *</label>
            <select
              value={toolboxTalk.project}
              onChange={(e) => setToolboxTalk({ ...toolboxTalk, project: e.target.value })}
              style={formSelectStyle}
            >
              <option value="">Select project...</option>
              {mockProjects.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Safety Topic *</label>
          <select
            value={toolboxTalk.topic}
            onChange={(e) => setToolboxTalk({ ...toolboxTalk, topic: e.target.value })}
            style={formSelectStyle}
          >
            <option value="">Select topic...</option>
            {safetyTopics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
          {toolboxTalk.topic === 'Other (specify below)' && (
            <input
              type="text"
              value={toolboxTalk.customTopic}
              onChange={(e) => setToolboxTalk({ ...toolboxTalk, customTopic: e.target.value })}
              placeholder="Enter topic..."
              style={formInputStyle}
            />
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Discussion Notes</label>
          <textarea
            value={toolboxTalk.notes}
            onChange={(e) => setToolboxTalk({ ...toolboxTalk, notes: e.target.value })}
            placeholder="Key points discussed, hazards identified, controls implemented..."
            rows={4}
            style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? '#1f2937' : '#ffffff', color: textColor, resize: 'vertical' }}
          />
        </div>

        <div style={{ padding: '20px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={toolboxTalk.acknowledged}
              onChange={(e) => setToolboxTalk({ ...toolboxTalk, acknowledged: e.target.checked })}
              style={{ width: '20px', height: '20px', marginTop: '2px' }}
            />
            <span style={{ fontSize: '0.95rem' }}>
              I acknowledge that I attended this safety briefing, understand the topics discussed, 
              and will follow the safety procedures outlined. I understand that failure to follow 
              safety procedures may result in injury and disciplinary action.
            </span>
          </label>
        </div>

        <button
          onClick={() => alert('Toolbox talk signed!')}
          disabled={!toolboxTalk.acknowledged}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: toolboxTalk.acknowledged ? accentSecondary : colors.gray,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: toolboxTalk.acknowledged ? 'pointer' : 'not-allowed',
          }}
        >
          Sign & Submit
        </button>
      </div>
    </div>
  );

  // OTDR Test Results
  const [otdrTests, setOtdrTests] = useState([
    { id: 1, date: '2025-01-16', project: 'Metro Fiber Ring', segment: 'Span A1-A5', result: 'pass', loss: '0.18 dB/km', file: 'otdr_a1a5.sor' },
    { id: 2, date: '2025-01-15', project: 'Metro Fiber Ring', segment: 'Span A5-A10', result: 'pass', loss: '0.21 dB/km', file: 'otdr_a5a10.sor' },
  ]);

  const [newOtdr, setNewOtdr] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
    segment: '',
    result: 'pass',
    loss: '',
    notes: '',
  });

  const renderOtdr = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>OTDR Test Results</h2>
          <p style={{ color: colors.gray }}>Upload and track fiber test results</p>
        </div>
      </div>

      {/* Upload New Test */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Upload New Test Result</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Date *</label>
            <input
              type="date"
              value={newOtdr.date}
              onChange={(e) => setNewOtdr({ ...newOtdr, date: e.target.value })}
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Project *</label>
            <select
              value={newOtdr.project}
              onChange={(e) => setNewOtdr({ ...newOtdr, project: e.target.value })}
              style={formSelectStyle}
            >
              <option value="">Select project...</option>
              {mockProjects.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Fiber Segment *</label>
            <input
              type="text"
              value={newOtdr.segment}
              onChange={(e) => setNewOtdr({ ...newOtdr, segment: e.target.value })}
              placeholder="e.g., Span A1-A5"
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Loss (dB/km)</label>
            <input
              type="text"
              value={newOtdr.loss}
              onChange={(e) => setNewOtdr({ ...newOtdr, loss: e.target.value })}
              placeholder="e.g., 0.18"
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Result *</label>
            <select
              value={newOtdr.result}
              onChange={(e) => setNewOtdr({ ...newOtdr, result: e.target.value })}
              style={formSelectStyle}
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail - Needs Resplice</option>
              <option value="marginal">Marginal</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>
            <Upload size={16} style={{ display: 'inline', marginRight: '6px' }} />
            OTDR Trace File (.sor, .trc)
          </label>
          <div style={{ border: `2px dashed ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <input type="file" accept=".sor,.trc,.pdf" style={{ display: 'none' }} id="otdr-upload" />
            <label htmlFor="otdr-upload" style={{ padding: '8px 16px', backgroundColor: accentPrimary, color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
              Select File
            </label>
            <p style={{ color: colors.gray, fontSize: '0.85rem', marginTop: '8px' }}>Accepts .sor, .trc, or PDF export</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (newOtdr.project && newOtdr.segment) {
              const newTest = {
                id: otdrTests.length + 1,
                date: newOtdr.date,
                project: newOtdr.project,
                segment: newOtdr.segment,
                result: newOtdr.result,
                loss: newOtdr.loss || 'N/A',
                file: 'uploaded.sor'
              };
              setOtdrTests([newTest, ...otdrTests]);
              setNewOtdr({ date: new Date().toISOString().split('T')[0], project: '', segment: '', result: 'pass', loss: '', notes: '' });
              alert('OTDR test uploaded successfully!');
            } else {
              alert('Please fill in Project and Fiber Segment fields.');
            }
          }}
          style={{ padding: '12px 24px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}
        >
          Upload Test Result
        </button>
      </div>

      {/* Recent Tests */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Recent Test Results</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? '#111827' : '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Project</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Segment</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Loss</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Result</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '0.85rem', color: colors.gray }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {otdrTests.map(test => (
                <tr key={test.id} style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                  <td style={{ padding: '12px' }}>{test.date}</td>
                  <td style={{ padding: '12px' }}>{test.project}</td>
                  <td style={{ padding: '12px' }}>{test.segment}</td>
                  <td style={{ padding: '12px' }}>{test.loss}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      backgroundColor: test.result === 'pass' ? `${accentSecondary}20` : test.result === 'fail' ? `${accentError}20` : `${accentSecondary}20`,
                      color: test.result === 'pass' ? accentSecondary : test.result === 'fail' ? accentError : accentSecondary,
                      textTransform: 'capitalize',
                    }}>
                      {test.result}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Eye size={18} color={accentPrimary} />
                    </button>
                    <button style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Download size={18} color={colors.gray} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 811 Ticket Tracking
  const [tickets, setTickets] = useState([
    { id: 1, ticketNumber: '2501160001', status: 'active', address: '123 Main St', expires: '2025-01-23', created: '2025-01-16' },
    { id: 2, ticketNumber: '2501140002', status: 'active', address: '456 Oak Ave', expires: '2025-01-21', created: '2025-01-14' },
    { id: 3, ticketNumber: '2501100003', status: 'expired', address: '789 Elm Blvd', expires: '2025-01-17', created: '2025-01-10' },
  ]);

  const [newTicket, setNewTicket] = useState({
    ticketNumber: '',
    address: '',
    expires: '',
    notes: '',
  });

  const renderTickets = () => {
    // eslint-disable-next-line no-unused-vars
    const today = new Date().toISOString().split('T')[0];
    const expiringSoon = tickets.filter(t => {
      const daysUntil = Math.ceil((new Date(t.expires) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3 && daysUntil > 0 && t.status === 'active';
    });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>811 Ticket Tracking</h2>
            <p style={{ color: colors.gray }}>Track underground utility locate tickets</p>
          </div>
        </div>

        {/* Expiring Soon Alert */}
        {expiringSoon.length > 0 && (
          <div style={{ backgroundColor: `${accentError}15`, border: `1px solid ${accentError}`, borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color={accentError} />
            <div>
              <p style={{ fontWeight: '600', color: accentError }}>{expiringSoon.length} ticket(s) expiring within 3 days!</p>
              <p style={{ fontSize: '0.9rem', color: colors.gray }}>Renew tickets before starting work in these areas.</p>
            </div>
          </div>
        )}

        {/* Add New Ticket */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Add New Ticket</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Ticket Number *</label>
              <input
                type="text"
                value={newTicket.ticketNumber}
                onChange={(e) => setNewTicket({ ...newTicket, ticketNumber: e.target.value })}
                placeholder="e.g., 2501160001"
                style={formInputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Work Address *</label>
              <input
                type="text"
                value={newTicket.address}
                onChange={(e) => setNewTicket({ ...newTicket, address: e.target.value })}
                placeholder="Street address"
                style={formInputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Expiration Date *</label>
              <input
                type="date"
                value={newTicket.expires}
                onChange={(e) => setNewTicket({ ...newTicket, expires: e.target.value })}
                style={formInputStyle}
              />
            </div>
          </div>
          <button
            onClick={() => {
              if (newTicket.ticketNumber && newTicket.address && newTicket.expires) {
                const ticket = {
                  id: tickets.length + 1,
                  ticketNumber: newTicket.ticketNumber,
                  status: 'active',
                  address: newTicket.address,
                  expires: newTicket.expires,
                  created: new Date().toISOString().split('T')[0]
                };
                setTickets([ticket, ...tickets]);
                setNewTicket({ ticketNumber: '', address: '', expires: '', notes: '' });
                alert('Ticket added successfully!');
              } else {
                alert('Please fill in all required fields.');
              }
            }}
            style={{ padding: '10px 20px', backgroundColor: accentSecondary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}
          >
            Add Ticket
          </button>
        </div>

        {/* Active Tickets */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>All Tickets</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {tickets.map(ticket => {
              const daysUntil = Math.ceil((new Date(ticket.expires) - new Date()) / (1000 * 60 * 60 * 24));
              const isExpired = daysUntil < 0;
              const isExpiringSoon = daysUntil <= 3 && daysUntil >= 0;

              return (
                <div
                  key={ticket.id}
                  style={{
                    padding: '16px',
                    backgroundColor: darkMode ? '#111827' : '#f8fafc',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${isExpired ? accentError : isExpiringSoon ? accentSecondary : accentSecondary}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Phone size={16} color={accentPrimary} />
                        <span style={{ fontWeight: '600' }}>#{ticket.ticketNumber}</span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: isExpired ? `${accentError}20` : `${accentSecondary}20`,
                          color: isExpired ? accentError : accentSecondary,
                        }}>
                          {isExpired ? 'EXPIRED' : 'Active'}
                        </span>
                      </div>
                      <p style={{ color: colors.gray, fontSize: '0.9rem' }}>{ticket.address}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.85rem', color: isExpiringSoon ? accentSecondary : colors.gray }}>
                        {isExpired ? 'Expired' : `Expires: ${ticket.expires}`}
                      </p>
                      {isExpiringSoon && !isExpired && (
                        <p style={{ fontSize: '0.8rem', color: accentSecondary, fontWeight: '500' }}>
                          ⚠️ {daysUntil} day(s) left
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Certifications Tracking
  // eslint-disable-next-line no-unused-vars
  const [certifications, setCertifications] = useState([
    { id: 1, name: 'OSHA 10-Hour Construction', issueDate: '2024-03-15', expiryDate: '2027-03-15', status: 'active' },
    { id: 2, name: 'CPR/First Aid', issueDate: '2024-06-01', expiryDate: '2025-06-01', status: 'expiring' },
    { id: 3, name: 'Fiber Optic Installer (FOI)', issueDate: '2023-09-20', expiryDate: '2025-09-20', status: 'active' },
    { id: 4, name: 'Confined Space Entry', issueDate: '2024-01-10', expiryDate: '2025-01-25', status: 'expiring' },
    { id: 5, name: 'Flagger Certification', issueDate: '2023-04-12', expiryDate: '2024-04-12', status: 'expired' },
  ]);

  const renderCerts = () => {
    const today = new Date();
    const expiringSoon = certifications.filter(c => {
      const expiry = new Date(c.expiryDate);
      const daysUntil = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return daysUntil <= 30 && daysUntil > 0;
    });
    const expired = certifications.filter(c => new Date(c.expiryDate) < today);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Certifications</h2>
            <p style={{ color: colors.gray }}>Track your training and certification status</p>
          </div>
          <button style={{ padding: '10px 20px', backgroundColor: accentPrimary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
            <Plus size={18} /> Add Certification
          </button>
        </div>

        {/* Alerts */}
        {(expiringSoon.length > 0 || expired.length > 0) && (
          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {expired.length > 0 && (
              <div style={{ backgroundColor: `${accentError}15`, border: `1px solid ${accentError}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={24} color={accentError} />
                <div>
                  <p style={{ fontWeight: '600', color: accentError }}>{expired.length} certification(s) EXPIRED!</p>
                  <p style={{ fontSize: '0.9rem', color: colors.gray }}>Renew immediately to maintain compliance.</p>
                </div>
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div style={{ backgroundColor: `${accentSecondary}15`, border: `1px solid ${accentSecondary}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={24} color={accentSecondary} />
                <div>
                  <p style={{ fontWeight: '600', color: accentSecondary }}>{expiringSoon.length} certification(s) expiring within 30 days</p>
                  <p style={{ fontSize: '0.9rem', color: colors.gray }}>Schedule renewal training soon.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Certifications List */}
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gap: '12px' }}>
            {certifications.map(cert => {
              const expiry = new Date(cert.expiryDate);
              const daysUntil = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
              const isExpired = daysUntil < 0;
              const isExpiringSoon = daysUntil <= 30 && daysUntil > 0;

              return (
                <div
                  key={cert.id}
                  style={{
                    padding: '16px',
                    backgroundColor: darkMode ? '#111827' : '#f8fafc',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${isExpired ? accentError : isExpiringSoon ? accentSecondary : accentSecondary}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Award size={18} color={accentPrimary} />
                        <span style={{ fontWeight: '600' }}>{cert.name}</span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: isExpired ? `${accentError}20` : isExpiringSoon ? `${accentSecondary}20` : `${accentSecondary}20`,
                          color: isExpired ? accentError : isExpiringSoon ? accentSecondary : accentSecondary,
                        }}>
                          {isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING SOON' : 'Active'}
                        </span>
                      </div>
                      <p style={{ color: colors.gray, fontSize: '0.85rem' }}>
                        Issued: {cert.issueDate}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: '500', color: isExpired ? accentError : isExpiringSoon ? accentSecondary : textColor }}>
                        {isExpired ? 'Expired' : `Expires: ${cert.expiryDate}`}
                      </p>
                      {isExpiringSoon && (
                        <p style={{ fontSize: '0.8rem', color: accentSecondary }}>⚠️ {daysUntil} days left</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Incident Reports
  const [incidents, setIncidents] = useState([
    { id: 1, date: '2025-01-10', type: 'Near Miss', description: 'Unsecured load nearly fell during transport', project: 'Metro Fiber Ring', status: 'closed' },
  ]);

  const [newIncident, setNewIncident] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    type: '',
    project: '',
    location: '',
    description: '',
    injuries: 'no',
    injuryDescription: '',
    witnesses: '',
    immediateActions: '',
    photos: [],
  });

  const incidentTypes = [
    'Near Miss',
    'First Aid Injury',
    'Recordable Injury',
    'Property Damage',
    'Vehicle Incident',
    'Environmental Spill',
    'Utility Strike',
    'Third Party Incident',
  ];

  const renderIncidents = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Incident Reports</h2>
          <p style={{ color: colors.gray }}>Report and track safety incidents</p>
        </div>
      </div>

      {/* Report New Incident */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: accentError }}>
          <ShieldAlert size={20} style={{ display: 'inline', marginRight: '8px' }} />
          Report New Incident
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Date *</label>
            <input
              type="date"
              value={newIncident.date}
              onChange={(e) => setNewIncident({ ...newIncident, date: e.target.value })}
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Time *</label>
            <input
              type="time"
              value={newIncident.time}
              onChange={(e) => setNewIncident({ ...newIncident, time: e.target.value })}
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Incident Type *</label>
            <select
              value={newIncident.type}
              onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
              style={formSelectStyle}
            >
              <option value="">Select type...</option>
              {incidentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Project *</label>
            <select
              value={newIncident.project}
              onChange={(e) => setNewIncident({ ...newIncident, project: e.target.value })}
              style={formSelectStyle}
            >
              <option value="">Select project...</option>
              {mockProjects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Location / Address *</label>
          <input
            type="text"
            value={newIncident.location}
            onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
            placeholder="Specific location where incident occurred"
            style={formInputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Description of Incident *</label>
          <textarea
            value={newIncident.description}
            onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
            placeholder="Describe what happened in detail..."
            rows={4}
            style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? '#1f2937' : '#ffffff', color: textColor, resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '10px' }}>Were there any injuries? *</label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="injuries"
                value="no"
                checked={newIncident.injuries === 'no'}
                onChange={(e) => setNewIncident({ ...newIncident, injuries: e.target.value })}
              />
              No injuries
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="injuries"
                value="yes"
                checked={newIncident.injuries === 'yes'}
                onChange={(e) => setNewIncident({ ...newIncident, injuries: e.target.value })}
              />
              Yes, injuries occurred
            </label>
          </div>
          {newIncident.injuries === 'yes' && (
            <textarea
              value={newIncident.injuryDescription}
              onChange={(e) => setNewIncident({ ...newIncident, injuryDescription: e.target.value })}
              placeholder="Describe injuries and treatment provided..."
              rows={2}
              style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? '#1f2937' : '#ffffff', color: textColor, marginTop: '12px' }}
            />
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>Immediate Actions Taken</label>
          <textarea
            value={newIncident.immediateActions}
            onChange={(e) => setNewIncident({ ...newIncident, immediateActions: e.target.value })}
            placeholder="What actions were taken immediately following the incident?"
            rows={2}
            style={{ width: '100%', padding: '10px', border: `1px solid ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', backgroundColor: darkMode ? '#1f2937' : '#ffffff', color: textColor, resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '6px' }}>
            <Camera size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Photo Documentation
          </label>
          <div style={{ border: `2px dashed ${darkMode ? '#374151' : '#ddd'}`, borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} id="incident-photos" />
            <label htmlFor="incident-photos" style={{ padding: '8px 16px', backgroundColor: accentPrimary, color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
              Add Photos
            </label>
          </div>
        </div>

        <button
          onClick={() => {
            if (newIncident.type && newIncident.project && newIncident.description) {
              const incident = {
                id: incidents.length + 1,
                date: newIncident.date,
                type: newIncident.type,
                description: newIncident.description,
                project: newIncident.project,
                status: 'open'
              };
              setIncidents([incident, ...incidents]);
              setNewIncident({
                date: new Date().toISOString().split('T')[0],
                time: '',
                type: '',
                project: '',
                location: '',
                description: '',
                injuries: 'no',
                injuryDescription: '',
                witnesses: '',
                immediateActions: '',
                photos: [],
              });
              alert('Incident report submitted! Supervisor will be notified.');
            } else {
              alert('Please fill in Type, Project, and Description fields.');
            }
          }}
          style={{ width: '100%', padding: '14px', backgroundColor: accentError, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
        >
          Submit Incident Report
        </button>
      </div>

      {/* Previous Incidents */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Previous Reports</h3>
        {incidents.length === 0 ? (
          <p style={{ color: colors.gray, textAlign: 'center', padding: '24px' }}>No incident reports on file.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {incidents.map(incident => (
              <div key={incident.id} style={{ padding: '16px', backgroundColor: darkMode ? '#111827' : '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600' }}>{incident.type}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        backgroundColor: incident.status === 'closed' ? `${accentSecondary}20` : `${accentSecondary}20`,
                        color: incident.status === 'closed' ? accentSecondary : accentSecondary,
                        textTransform: 'capitalize',
                      }}>
                        {incident.status}
                      </span>
                    </div>
                    <p style={{ color: colors.gray, fontSize: '0.9rem', marginBottom: '4px' }}>{incident.description}</p>
                    <p style={{ color: colors.gray, fontSize: '0.85rem' }}>{incident.project} • {incident.date}</p>
                  </div>
                  <button style={{ padding: '6px 12px', backgroundColor: 'transparent', border: `1px solid ${accentPrimary}`, borderRadius: '6px', color: accentPrimary, cursor: 'pointer', fontSize: '0.85rem' }}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Settings</h2>
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Profile Information</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '4px' }}>Name</label>
            <p style={{ fontWeight: '500' }}>{loggedInUser?.name}</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '4px' }}>Email</label>
            <p style={{ fontWeight: '500' }}>{loggedInUser?.email}</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: colors.gray, marginBottom: '4px' }}>Role</label>
            <p style={{ fontWeight: '500', textTransform: 'capitalize' }}>{loggedInUser?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'production': return renderProduction();
      case 'otdr': return renderOtdr();
      case 'tickets': return renderTickets();
      case 'equipment': return renderEquipment();
      case 'safety': return renderSafety();
      case 'certs': return renderCerts();
      case 'incidents': return renderIncidents();
      case 'projects': return renderProjects();
      case 'files': return renderFiles();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor, display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: colors.dark, padding: '24px 0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh' }}>
        <div style={{ padding: '0 24px', marginBottom: '32px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>
            <span style={{ color: accentPrimary }}>LYT</span> Portal
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: activeTab === item.id ? `${accentPrimary}20` : 'transparent',
                border: 'none',
                borderLeft: activeTab === item.id ? `3px solid ${accentPrimary}` : '3px solid transparent',
                color: activeTab === item.id ? accentPrimary : '#9ca3af',
                fontSize: '0.95rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '0 24px' }}>
          <div style={{ padding: '16px', backgroundColor: colors.darkLight, borderRadius: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: accentPrimary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>
                {loggedInUser?.avatar || 'U'}
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: '500', fontSize: '0.9rem' }}>{loggedInUser?.name}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'capitalize' }}>{loggedInUser?.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              border: `1px solid ${accentError}`,
              color: accentError,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '32px' }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default EmployeeDashboard;
