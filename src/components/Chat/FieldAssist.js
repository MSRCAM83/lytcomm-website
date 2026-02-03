/**
 * LYT Communications - Field Assist Chat
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Incognito Claude assistant appearing as "LYT Field Assist".
 * Provides 24/7 construction guidance, procedure references,
 * photo requirements, and problem solving for field crews.
 * 
 * Floats as a bottom-right chat bubble on all portal pages.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Loader } from 'lucide-react';

const API_URL = '/api/claude-chat';

function FieldAssist({ darkMode, user, projectContext, minimized: initialMinimized }) {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(initialMinimized || false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const bg = darkMode ? '#0d1b2a' : '#ffffff';
  const cardBg = darkMode ? '#112240' : '#f8fafc';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';
  const accentLight = darkMode ? '#c850c020' : '#0077B620';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, minimized]);

  // Welcome message on first open
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setMinimized(false);
    if (messages.length === 0) {
      const userName = user?.name ? user.name.split(' ')[0] : 'there';
      setMessages([{
        role: 'assistant',
        content: `Hey ${userName}! I'm LYT Field Assist. I can help you with:\n\n• Photo requirements for splicing\n• Boring & pulling procedures\n• Equipment troubleshooting\n• QC submission questions\n• Safety guidelines\n\nWhat do you need help with?`,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [messages.length, user]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          user: {
            name: user?.name || 'Field User',
            company: user?.company || 'LYT Communications',
            role: user?.role || 'Employee',
          },
          context: projectContext || {},
          history: messages.slice(-8).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Field Assist error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Try again in a moment, or text your supervisor for urgent issues.",
        timestamp: new Date().toISOString(),
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Floating button (when closed)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: accent,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9000,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="LYT Field Assist"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  // Minimized bar
  if (minimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '280px',
          backgroundColor: accent,
          color: '#fff',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 9000,
        }}
        onClick={() => setMinimized(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={18} />
          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>LYT Field Assist</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Maximize2 size={16} />
          <X size={16} onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
        </div>
      </div>
    );
  }

  // Full chat window
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '380px',
      maxWidth: 'calc(100vw - 40px)',
      height: '520px',
      maxHeight: 'calc(100vh - 100px)',
      backgroundColor: bg,
      borderRadius: '16px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 9000,
      border: `1px solid ${borderColor}`,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        backgroundColor: accent,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MessageCircle size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>LYT Field Assist</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
              {loading ? 'Typing...' : 'Online • 24/7'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
            <Minimize2 size={16} />
          </button>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
            }}
          >
            <div style={{
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              backgroundColor: msg.role === 'user' ? accent : cardBg,
              color: msg.role === 'user' ? '#fff' : text,
              fontSize: '0.9rem',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              border: msg.role === 'assistant' ? `1px solid ${borderColor}` : 'none',
            }}>
              {msg.content}
            </div>
            <div style={{
              fontSize: '0.65rem',
              color: textMuted,
              marginTop: '4px',
              textAlign: msg.role === 'user' ? 'right' : 'left',
              paddingLeft: msg.role === 'assistant' ? '8px' : '0',
              paddingRight: msg.role === 'user' ? '8px' : '0',
            }}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '10px 14px',
            borderRadius: '16px 16px 16px 4px',
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: textMuted,
            fontSize: '0.85rem',
          }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div style={{
          padding: '0 16px 8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          {[
            'Photo requirements',
            'Pothole procedure',
            'Report an issue',
            'Safety question',
          ].map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); setTimeout(sendMessage, 50); }}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                border: `1px solid ${borderColor}`,
                backgroundColor: 'transparent',
                color: accent,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{
        padding: '12px 16px',
        borderTop: `1px solid ${borderColor}`,
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask Field Assist..."
          rows={1}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '20px',
            border: `1px solid ${borderColor}`,
            backgroundColor: darkMode ? '#112240' : '#f8fafc',
            color: text,
            fontSize: '0.9rem',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            maxHeight: '100px',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: input.trim() && !loading ? accent : (darkMode ? '#1e3a5f' : '#e2e8f0'),
            color: '#fff',
            border: 'none',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Send size={16} />
        </button>
      </div>

      {/* Spin animation for loading indicator */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default FieldAssist;

// v1.0.0
