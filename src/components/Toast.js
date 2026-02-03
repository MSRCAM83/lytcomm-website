/**
 * LYT Communications - Toast Notification Component
 * Version: 1.0.0
 * Created: 2026-02-03
 * 
 * Reusable toast notification for success/error/info feedback.
 * Usage: <Toast message="Saved!" type="success" onClose={fn} />
 * Or use the hook: const { toast, showToast } = useToast();
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const TOAST_COLORS = {
  success: { bg: '#10b981', icon: CheckCircle },
  error: { bg: '#ef4444', icon: XCircle },
  warning: { bg: '#f59e0b', icon: AlertCircle },
  info: { bg: '#3b82f6', icon: Info },
};

function Toast({ message, type = 'info', duration = 4000, onClose }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => { setVisible(false); if (onClose) onClose(); }, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  const config = TOAST_COLORS[type] || TOAST_COLORS.info;
  const IconComp = config.icon;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: `translateX(-50%) translateY(${exiting ? '20px' : '0'})`,
      zIndex: 99999, display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 20px', borderRadius: 12,
      background: config.bg, color: '#fff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      fontSize: '0.9rem', fontWeight: 500,
      opacity: exiting ? 0 : 1,
      transition: 'opacity 0.3s, transform 0.3s',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <IconComp size={18} />
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={() => { setExiting(true); setTimeout(() => { setVisible(false); if (onClose) onClose(); }, 300); }}
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2, opacity: 0.7 }}>
        <X size={16} />
      </button>
    </div>
  );
}

// Hook for easy toast management
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <>
      {toasts.map((t, i) => (
        <div key={t.id} style={{ position: 'fixed', bottom: 24 + (i * 64), left: '50%', transform: 'translateX(-50%)', zIndex: 99999 }}>
          <Toast message={t.message} type={t.type} duration={t.duration} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </>
  );

  return { showToast, ToastContainer };
}

export default Toast;
