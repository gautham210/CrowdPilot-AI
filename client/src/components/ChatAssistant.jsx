import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const QUICK_PROMPTS = [
  { label: '🍔 Food',     text: 'Where should I go for food right now?',          color: '#f59e0b' },
  { label: '🚻 Washroom', text: 'Is it a good time to use the washroom?',          color: '#38bdf8' },
  { label: '🚪 Gate',     text: 'Which gate is least crowded right now?',          color: '#22c55e' },
  { label: '🛍️ Shop',    text: 'Are the merchandise shops busy right now?',       color: '#8b5cf6' },
  { label: '⏱️ Time',    text: 'How much time do I have before the next session?', color: '#6366f1' },
];

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--accent-bright)',
            animation: `typing-dot 1.4s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 10,
        marginBottom: '0.875rem',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: isUser
          ? 'linear-gradient(135deg, #6366f1, #38bdf8)'
          : 'linear-gradient(135deg, #1e1e3a, #2a2a4a)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        flexShrink: 0,
      }}>
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '78%',
        padding: '0.75rem 1rem',
        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        background: isUser
          ? 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(56,189,248,0.3))'
          : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isUser ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`,
        fontSize: '0.875rem',
        lineHeight: 1.6,
        color: 'var(--text-primary)',
      }}>
        {msg.content}
        {msg.source === 'fallback' && (
          <div style={{
            marginTop: 4,
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}>
            (Rule-based — no Gemini API key set)
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatAssistant() {
  const { crowdData, timeline } = useApp();
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      content: "Hi! I'm CrowdPilot AI 🏎️ I can help you navigate the venue, find the least crowded spots, and make the most of your race day. Ask me anything!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const msgIdRef = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || isTyping) return;

    setInput('');
    const userMsg = { id: msgIdRef.current++, role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const history = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history }),
        cache: 'no-store'
      });
      const data = await res.json();

      if (data.response) {
        setMessages(prev => [...prev, {
          id: msgIdRef.current++,
          role: 'assistant',
          content: data.response,
          source: data.source,
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: msgIdRef.current++,
        role: 'assistant',
        content: "Sorry, I couldn't connect to the AI service. Please try again!",
      }]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
    }}>
      <div className="glass-card" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <div style={{
            width: 38,
            height: 38,
            background: 'linear-gradient(135deg, #1e1e3a, #2a2a4a)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>CrowdPilot AI Assistant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span className="pulse-dot green" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>
                Powered by Gemini · Live context
              </span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            {timeline?.current && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                📍 {timeline.current.name}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div 
          role="log"
          aria-live="polite"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 1.5rem',
          }}
        >
          {messages.map(msg => (
            <Message key={msg.id} msg={msg} />
          ))}
          {isTyping && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: '0.875rem' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e1e3a, #2a2a4a)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', flexShrink: 0,
              }}>🤖</div>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '4px 16px 16px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div style={{
          padding: '0.75rem 1.5rem 0',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
          position: 'relative',
        }}>
          <div className="section-title" style={{ marginBottom: 6 }}>Quick Actions</div>
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: '0.625rem',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            {QUICK_PROMPTS.map(p => (
              <button
                key={p.text}
                onClick={() => sendMessage(p.text)}
                disabled={isTyping}
                style={{
                  padding: '5px 13px',
                  borderRadius: 99,
                  border: `1px solid ${p.color}35`,
                  background: `${p.color}12`,
                  color: p.color,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  transition: 'all 0.18s ease',
                  flexShrink: 0,
                  opacity: isTyping ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${p.color}22`;
                  e.currentTarget.style.borderColor = `${p.color}60`;
                  e.currentTarget.style.boxShadow = `0 0 10px ${p.color}25`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `${p.color}12`;
                  e.currentTarget.style.borderColor = `${p.color}35`;
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div style={{
          padding: '0.875rem 1.5rem 1.25rem',
          display: 'flex',
          gap: 10,
          flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            id="chatInput"
            name="chatInput"
            aria-label="Chat input"
            className="input-dark"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about food, gates, washrooms, timing..."
            disabled={isTyping}
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            aria-label="Send message"
            onClick={() => sendMessage()}
            disabled={isTyping || !input.trim()}
            style={{ flexShrink: 0, padding: '0.6rem 1rem' }}
          >
            Send →
          </button>
        </div>
      </div>
    </div>
  );
}
