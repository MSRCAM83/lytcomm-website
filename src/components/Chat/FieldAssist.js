/**
 * LYT Communications - Field Assist Chat Component
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Incognito AI assistant ("LYT Field Assist") for field crews.
 * Uses Claude Sonnet 4 via Vercel serverless function.
 * Never reveals it's AI - presents as LYT's smart assistant.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { MessageSquare, Send, X, Minimize2, Maximize2, HelpCircle, Loader } from 'lucide-react';

const QUICK_ACTIONS = [
  { label: '📸 Photo requirements', prompt: 'What photos do I need for my current splice type?' },
  { label: '🔧 Bore procedure', prompt: 'Walk me through the boring procedure step by step.' },
  { label: '📊 Power meter help', prompt: 'How do I run power meter tests for a 1x4 terminal?' },
  { label: '⚠️ Report issue', prompt: 'I found an issue on site. What do I need to document?' },
  { label: '📋 QC checklist', prompt: 'What does QC check for before approval?' },
];

function FieldAssist({ darkMode, user, projectContext, onClose, minimized = false, onToggleMinimize }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I'm LYT Field Assist. I can help with procedures, photo requirements, troubleshooting, and anything else on the job. What do you need?`,
      timestamp: new Date().toISOString(),
    }
  ]);
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
  const userBubble = darkMode ? '#1e3a5f' : '#e8f4fd';
  const assistBubble = darkMode ? '#162b4d' : '#f1f5f9';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() || loading) return;

    const userMsg = { role: 'user', content: messageText.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build context for the AI
      const context = {
        user: { name: user?.name, company: user?.company, role: user?.role },
        project: projectContext,
      };

      // Call Vercel serverless function (will be created at /api/claude-chat)
      const response = await fetch('/api/claude-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText.trim(),
          context,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply || 'Sorry, I had trouble processing that. Try again?',
          timestamp: new Date().toISOString(),
        }]);
      } else {
        // Fallback: offline/demo response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: getOfflineResponse(messageText),
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      // Offline fallback
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: getOfflineResponse(messageText),
        timestamp: new Date().toISOString(),
      }]);
    }

    setLoading(false);
  }, [loading, messages, user, projectContext]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (prompt) => {
    sendMessage(prompt);
  };

  if (minimized) {
    return (
      <button
        onClick={onToggleMinimize}
        style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          width: '56px', height: '56px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${accent}, ${darkMode ? '#ff6b35' : '#28a745'})`,
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 2s infinite',
        }}
      >
        <MessageSquare size={24} color="#fff" />
        <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
      width: '380px', maxWidth: 'calc(100vw - 40px)',
      height: '520px', maxHeight: 'calc(100vh - 80px)',
      background: bg, borderRadius: '16px',
      border: `1px solid ${borderColor}`,
      boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: `linear-gradient(135deg, ${accent}, ${darkMode ? '#ff6b35' : '#28a745'})`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>LYT Field Assist</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>Always here to help</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={onToggleMinimize} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Minimize2 size={14} color="#fff" />
          </button>
          {onClose && (
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color="#fff" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px',
              background: msg.role === 'user' ? userBubble : assistBubble,
              borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              color: text, fontSize: '0.88rem', lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
            <span style={{ color: textMuted, fontSize: '0.65rem', marginTop: '2px', padding: '0 4px' }}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px 14px', background: assistBubble, borderRadius: '14px 14px 14px 4px', display: 'flex', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: textMuted, animation: 'bounce 1.4s infinite' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: textMuted, animation: 'bounce 1.4s infinite 0.2s' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: textMuted, animation: 'bounce 1.4s infinite 0.4s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions (show when few messages) */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {QUICK_ACTIONS.map((action, i) => (
            <button key={i} onClick={() => handleQuickAction(action.prompt)} style={{
              padding: '5px 10px', borderRadius: '12px', fontSize: '0.75rem',
              background: `${accent}15`, color: accent, border: `1px solid ${accent}30`,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{action.label}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '10px 12px', borderTop: `1px solid ${borderColor}`,
        display: 'flex', gap: '8px', background: cardBg,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          disabled={loading}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '20px',
            background: darkMode ? '#0a192f' : '#fff',
            border: `1px solid ${borderColor}`, color: text,
            fontSize: '0.9rem', outline: 'none',
          }}
        />
        <button type="submit" disabled={!input.trim() || loading} style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: input.trim() ? accent : `${accent}40`,
          border: 'none', cursor: input.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Send size={16} color="#fff" />
        </button>
      </form>

      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }`}</style>

      <div style={{ position: 'absolute', bottom: '2px', right: '8px' }}>
        <span style={{ fontSize: '0.55rem', color: 'transparent', userSelect: 'none' }} onDoubleClick={(e) => { e.target.style.color = textMuted; }}>FieldAssist v1.0.0</span>
      </div>
    </div>
  );
}

// Offline responses for common questions
function getOfflineResponse(query) {
  const q = query.toLowerCase();
  if (q.includes('photo') && q.includes('1x4')) return 'For a 1x4 terminal, you need exactly 7 photos:\n1. Basket\n2. Splice tray (1 tray)\n3. Attached strength members\n4. Grommets from inside\n5. Completed enclosure closed\n6. Cables entering enclosure\n7. Enclosure in ground';
  if (q.includes('photo') && q.includes('1x8')) return 'For a 1x8 terminal, you need 8 photos:\n1. Basket\n2. Splitter tray\n3. Splice tray (1 tray)\n4. Attached strength members\n5. Grommets from inside\n6. Completed enclosure closed\n7. Cables entering enclosure\n8. Enclosure in ground';
  if (q.includes('photo') && (q.includes('f1') || q.includes('tyco'))) return 'For F1/TYCO-D splices, you need 7 + number of tray photos:\n1. Basket\n2-N. One photo per splice tray\nN+1. Strength members and grounds\nN+2. Completed enclosure (closed)\nN+3. Cable entry with grommets\nN+4. Enclosure in handhole';
  if (q.includes('power meter')) return 'Power meter testing for 1x4 terminal:\n- 8 total tests required\n- Test each fiber pair at 1310nm and 1550nm\n- Record readings in dBm\n- Pass threshold: typically < -25 dBm\n- Enter all values in the splice tracker before marking complete.';
  if (q.includes('bore') || q.includes('boring')) return 'Boring procedure:\n1. Submit pothole photos (3 required) for admin approval\n2. Wait for admin to approve pothole\n3. Start bore - track actual footage\n4. Document any utility crossings\n5. Upload 3 completion photos (entry, exit, pothole before)\n6. Mark complete for admin QC review';
  if (q.includes('issue') || q.includes('problem')) return 'To document a site issue:\n1. Take photos of the problem\n2. Note the exact location (segment ID)\n3. Describe what happened\n4. Flag the issue in the workflow tracker\n5. If it\'s a safety concern, stop work and call Matt Roy at (832) 850-3887';
  if (q.includes('qc') || q.includes('quality')) return 'QC checks before approval:\n- All required photos uploaded and clear\n- Footage matches plan (±10%)\n- No visible defects in photos\n- Power meter tests within spec\n- OTDR results uploaded (for F1/feeder)\n- Notes documented for any variations';
  return 'I\'m having trouble connecting right now, but I\'m still here to help with what I know offline. Try asking about:\n• Photo requirements for any splice type\n• Boring/pulling/splicing procedures\n• Power meter testing\n• QC requirements\n• Issue reporting\n\nIf you need urgent help, text Matt Roy at (832) 850-3887.';
}

export default FieldAssist;
