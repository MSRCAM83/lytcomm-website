/**
 * LYT Communications - Notification Bell Component
 * Version: 1.0.0
 * Created: 2026-02-03
 *
 * Dropdown notification bell for dashboard headers.
 * Shows unread count badge, notification list with severity colors,
 * mark-as-read, and links to relevant pages.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import {
  getStoredNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  checkExpirations,
  addNotification,
// eslint-disable-next-line no-unused-vars
  SEVERITY,
} from '../services/notificationService';

const SEVERITY_COLORS = {
  info: '#2196F3',
  warning: '#FFB800',
  urgent: '#FF9800',
  critical: '#dc3545',
};

const SEVERITY_ICONS = {
  info: Info,
  warning: AlertCircle,
  urgent: AlertTriangle,
  critical: AlertTriangle,
};

const NotificationBell = ({ darkMode = true, user = null, setCurrentPage }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const checkedRef = useRef(false);

  const bg = darkMode ? '#112240' : '#ffffff';
  const border = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const muted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';

  // Load notifications + check expirations
  useEffect(() => {
    const loadNotifs = () => {
      setNotifications(getStoredNotifications());
      setUnreadCount(getUnreadCount());
    };
    loadNotifs();

    // Check expirations once per session
    if (user?.email && !checkedRef.current) {
      checkedRef.current = true;
      checkExpirations(user.email, user.role || 'employee').then(expNotifs => {
        if (expNotifs.length > 0) {
          expNotifs.forEach(n => addNotification(n));
          loadNotifs();
        }
      });
    }

    // Refresh every 60s
    const interval = setInterval(loadNotifs, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = (id) => {
    markAsRead(id);
    setNotifications(getStoredNotifications());
    setUnreadCount(getUnreadCount());
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    setNotifications(getStoredNotifications());
    setUnreadCount(0);
  };

  const handleClear = () => {
    clearNotifications();
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTimeAgo = (isoString) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          position: 'relative', padding: 8, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Bell size={20} color={text} />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: 2, right: 2,
            minWidth: 18, height: 18, borderRadius: 9,
            backgroundColor: '#dc3545', color: '#fff',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, width: 340,
          backgroundColor: bg, border: `1px solid ${border}`,
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 1000, overflow: 'hidden', maxHeight: 480,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: `1px solid ${border}`,
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: text }}>Notifications</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} title="Mark all read" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <CheckCheck size={16} color={accent} />
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClear} title="Clear all" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={16} color={muted} />
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={16} color={muted} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ overflow: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: muted, fontSize: 13 }}>
                No notifications
              </div>
            ) : (
              notifications.slice(0, 50).map(notif => {
                const SevIcon = SEVERITY_ICONS[notif.severity] || Info;
                const sevColor = SEVERITY_COLORS[notif.severity] || SEVERITY_COLORS.info;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkRead(notif.id)}
                    style={{
                      display: 'flex', gap: 10, padding: '12px 16px',
                      borderBottom: `1px solid ${border}`,
                      backgroundColor: notif.read ? 'transparent' : (darkMode ? '#1e3a5f10' : '#f0f9ff'),
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      backgroundColor: `${sevColor}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <SevIcon size={16} color={sevColor} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: notif.read ? 500 : 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent, flexShrink: 0 }} />
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: muted, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: 11, color: muted, marginTop: 4, opacity: 0.7 }}>
                        {formatTimeAgo(notif.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Hidden version */}
      <div onClick={(e) => { if (e.detail === 3) alert('NotificationBell v1.0.0'); }} style={{ height: 0, overflow: 'hidden' }} />
    </div>
  );
};

export default NotificationBell;

// v1.0.0
