/**
 * LYT Communications - Chat Bubble Component
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Message display for Field Assist chat.
 * Renders user and assistant messages with timestamps,
 * typing indicators, and contextual action buttons.
 */

import React from 'react';
// eslint-disable-next-line no-unused-vars
import { User, Zap, Clock, Copy, CheckCircle } from 'lucide-react';

function ChatBubble({ message, darkMode, onAction }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isTyping = message.typing;

  const text = darkMode ? '#ffffff' : '#1e293b';
  const textMuted = darkMode ? '#8892b0' : '#64748b';
  const accent = darkMode ? '#c850c0' : '#0077B6';
  const userBubbleBg = darkMode ? '#1e3a5f' : '#e8f4fd';
  const assistBubbleBg = darkMode ? '#112240' : '#f8fafc';
  const systemBg = darkMode ? '#0a192f' : '#f1f5f9';
  const borderColor = darkMode ? '#1e3a5f' : '#e2e8f0';

  if (isSystem) {
    return (
      <div style={{
        textAlign: 'center', padding: '8px 16px', margin: '8px 0',
        fontSize: '0.75rem', color: textMuted,
        background: systemBg, borderRadius: '12px',
        border: `1px solid ${borderColor}`
      }}>
        {message.content}
      </div>
    );
  }

  if (isTyping) {
    return (
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '12px',
        justifyContent: 'flex-start'
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: `${accent}20`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Zap size={16} color={accent} />
        </div>
        <div style={{
          padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
          background: assistBubbleBg, border: `1px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          <span style={{ animation: 'pulse 1.4s ease-in-out infinite', width: 6, height: 6, borderRadius: '50%', background: textMuted, display: 'inline-block' }} />
          <span style={{ animation: 'pulse 1.4s ease-in-out 0.2s infinite', width: 6, height: 6, borderRadius: '50%', background: textMuted, display: 'inline-block' }} />
          <span style={{ animation: 'pulse 1.4s ease-in-out 0.4s infinite', width: 6, height: 6, borderRadius: '50%', background: textMuted, display: 'inline-block' }} />
        </div>
      </div>
    );
  }

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  // Parse simple markdown-like formatting
  const formatContent = (content) => {
    if (!content) return '';
    // Bold: **text**
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Numbered lists: detect lines starting with "1. ", "2. " etc
    formatted = formatted.replace(/^(\d+)\.\s/gm, '<br/>$1. ');
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

  return (
    <div style={{
      display: 'flex', gap: '10px', marginBottom: '12px',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row'
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: isUser ? `${accent}15` : `${accent}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: '4px'
      }}>
        {isUser ? (
          <User size={16} color={accent} />
        ) : (
          <Zap size={16} color={accent} />
        )}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '80%', minWidth: '60px' }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? userBubbleBg : assistBubbleBg,
          border: `1px solid ${borderColor}`,
          color: text, fontSize: '0.9rem', lineHeight: '1.5',
          wordBreak: 'break-word'
        }}
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />

        {/* Timestamp + actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginTop: '4px', padding: '0 4px',
          justifyContent: isUser ? 'flex-end' : 'flex-start'
        }}>
          <span style={{ fontSize: '0.7rem', color: textMuted }}>
            {formatTime(message.timestamp)}
          </span>

          {/* Quick action buttons for assistant messages */}
          {!isUser && message.actions && message.actions.length > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {message.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => onAction?.(action)}
                  style={{
                    padding: '2px 8px', borderRadius: '4px',
                    border: `1px solid ${accent}40`, background: 'transparent',
                    color: accent, fontSize: '0.7rem', cursor: 'pointer'
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatBubble;
// ChatBubble v1.0.0
