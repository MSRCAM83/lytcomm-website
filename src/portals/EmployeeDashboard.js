import React, { useState, useEffect } from 'react';
import { LogOut, Clock, Briefcase, FileText, Users, Settings, Bell, Play, Square, Calendar, MapPin, ChevronRight, Download, Folder } from 'lucide-react';
import { colors, LYT_INFO, mockProjects, mockTimeEntries, mockFiles, mockAnnouncements, mockUsers } from '../config/constants';

const EmployeeDashboard = ({ setCurrentPage, loggedInUser, setLoggedInUser, darkMode }) => {
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
    setCurrentPage('portal');
  };

  const userProjects = mockProjects.filter((p) => p.crew.includes(loggedInUser?.id));
  const userTimeEntries = mockTimeEntries.filter((t) => t.userId === loggedInUser?.id);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Clock },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'files', label: 'Documents', icon: FileText },
    { id: 'team', label: 'Team', icon: Users },
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
              <Clock size={24} color={colors.teal} /> Time Clock
            </h3>
            {clockedIn ? (
              <div>
                <p style={{ color: colors.green, fontWeight: '600', fontSize: '1.1rem' }}>● Clocked In</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'monospace', color: colors.teal }}>{formatElapsed(elapsedTime)}</p>
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
                  backgroundColor: colors.coral,
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
                  backgroundColor: colors.green,
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
          { label: 'Hours This Week', value: '32.5', icon: Clock, color: colors.blue },
          { label: 'Active Projects', value: userProjects.filter((p) => p.status === 'active').length, icon: Briefcase, color: colors.teal },
          { label: 'Pending Approvals', value: userTimeEntries.filter((t) => t.status === 'pending').length, icon: Calendar, color: colors.coral },
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
                  <span style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: project.status === 'active' ? `${colors.green}20` : `${colors.gray}20`, color: project.status === 'active' ? colors.green : colors.gray, borderRadius: '4px' }}>
                    {project.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.gray, fontSize: '0.85rem' }}>
                  <MapPin size={14} /> {project.client}
                </div>
                <div style={{ marginTop: '8px', height: '6px', backgroundColor: darkMode ? colors.dark : '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${project.progress}%`, backgroundColor: colors.teal, borderRadius: '3px' }} />
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => setActiveTab('projects')}
            style={{ marginTop: '16px', backgroundColor: 'transparent', border: 'none', color: colors.teal, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
          >
            View All <ChevronRight size={16} />
          </button>
        </div>

        {/* Announcements */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color={colors.coral} /> Announcements
          </h3>
          {mockAnnouncements.map((announcement) => (
            <div key={announcement.id} style={{ padding: '12px 0', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {announcement.priority === 'high' && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.coral }} />}
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
                        backgroundColor: entry.status === 'approved' ? `${colors.green}20` : entry.status === 'pending' ? `${colors.coral}20` : `${colors.teal}20`,
                        color: entry.status === 'approved' ? colors.green : entry.status === 'pending' ? colors.coral : colors.teal,
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
                backgroundColor: project.status === 'active' ? `${colors.green}20` : project.status === 'completed' ? `${colors.blue}20` : `${colors.coral}20`,
                color: project.status === 'active' ? colors.green : project.status === 'completed' ? colors.blue : colors.coral,
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
                <div style={{ height: '100%', width: `${project.progress}%`, backgroundColor: colors.teal, borderRadius: '4px' }} />
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
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: `${colors.teal}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {file.type === 'pdf' ? <FileText size={20} color={colors.coral} /> : <Folder size={20} color={colors.teal} />}
              </div>
              <div>
                <p style={{ fontWeight: '500', marginBottom: '2px' }}>{file.name}</p>
                <p style={{ fontSize: '0.8rem', color: colors.gray }}>{file.folder} • {file.size} • {file.date}</p>
              </div>
            </div>
            <button style={{ padding: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: colors.teal }}>
              <Download size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeam = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Team Directory</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {mockUsers.map((user) => (
          <div key={user.id} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>
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
      case 'projects': return renderProjects();
      case 'files': return renderFiles();
      case 'team': return renderTeam();
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
            <span style={{ color: colors.teal }}>LYT</span> Portal
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
                backgroundColor: activeTab === item.id ? `${colors.teal}20` : 'transparent',
                border: 'none',
                borderLeft: activeTab === item.id ? `3px solid ${colors.teal}` : '3px solid transparent',
                color: activeTab === item.id ? colors.teal : '#9ca3af',
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
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>
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
              border: `1px solid ${colors.coral}`,
              color: colors.coral,
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
