import React, { useState, useEffect } from 'react';

const TICKET_TYPES = [
  {
    id: 'general',
    name: 'General Admission',
    icon: '🎟️',
    color: '#6366f1',
    access: ['Main Grandstand', 'Food Courts', 'Washrooms', 'Merchandise Store', 'Gates A/B/C'],
    restricted: ['Paddock Shop', 'VIP Lounge', 'Pit Lane', 'Paddock Zone'],
    qrCode: 'GA-2024-MIAMI-F1-48821',
    tier: 'Standard',
  },
  {
    id: 'paddock',
    name: 'Paddock Pass',
    icon: '🏆',
    color: '#f59e0b',
    access: ['Main Grandstand', 'Food Courts', 'Washrooms', 'Merchandise Store', 'Gates A/B/C', 'Paddock Shop', 'VIP Lounge', 'Pit Lane', 'Paddock Zone'],
    restricted: [],
    qrCode: 'PP-2024-MIAMI-F1-00391',
    tier: 'Paddock',
  },
];

// Simulate a random scan result (or fixed for demo)
function simulateScan() {
  return TICKET_TYPES[Math.random() > 0.4 ? 0 : 1];
}

export default function TicketScanner({ onClose }) {
  const [phase, setPhase] = useState('idle'); // idle | scanning | result
  const [result, setResult] = useState(null);

  const startScan = () => {
    setPhase('scanning');
    // Simulate 2.5s scan time
    setTimeout(() => {
      setResult(simulateScan());
      setPhase('result');
    }, 2500);
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 420 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div className="section-title" style={{ marginBottom: 3 }}>Ticket System</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Scan Your Ticket</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-secondary)',
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit',
          }}>✕</button>
        </div>

        {/* Phase: Idle */}
        {phase === 'idle' && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            {/* QR placeholder */}
            <div style={{
              width: 180,
              height: 180,
              margin: '0 auto 1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '2px dashed rgba(99,102,241,0.3)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 10,
              position: 'relative',
            }}>
              {/* Corner decorators */}
              {[
                { top: 8, left: 8, borderTop: '2px solid #6366f1', borderLeft: '2px solid #6366f1' },
                { top: 8, right: 8, borderTop: '2px solid #6366f1', borderRight: '2px solid #6366f1' },
                { bottom: 8, left: 8, borderBottom: '2px solid #6366f1', borderLeft: '2px solid #6366f1' },
                { bottom: 8, right: 8, borderBottom: '2px solid #6366f1', borderRight: '2px solid #6366f1' },
              ].map((style, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: 18, height: 18,
                  ...style,
                }} />
              ))}
              <div style={{ fontSize: '2.5rem' }}>📱</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 120, lineHeight: 1.4 }}>
                Point camera at your ticket QR code
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Scan your physical ticket or digital pass to unlock venue areas and get personalized access.
            </p>

            <button className="btn-primary" onClick={startScan} style={{ width: '100%', padding: '0.75rem' }}>
              Simulate QR Scan
            </button>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Demo: randomly assigns General or Paddock Pass
            </div>
          </div>
        )}

        {/* Phase: Scanning */}
        {phase === 'scanning' && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{
              width: 180,
              height: 180,
              margin: '0 auto 1.5rem',
              background: 'rgba(99,102,241,0.06)',
              border: '2px solid rgba(99,102,241,0.3)',
              borderRadius: 16,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Animated QR grid */}
              <div style={{
                position: 'absolute',
                inset: '14%',
                animation: 'qrAppear 0.4s ease forwards',
              }}>
                <svg viewBox="0 0 100 100" style={{ opacity: 0.25 }}>
                  {/* QR-like grid */}
                  {Array.from({ length: 8 }, (_, row) =>
                    Array.from({ length: 8 }, (_, col) => {
                      if (Math.random() > 0.5) return null;
                      return <rect key={`${row}-${col}`} x={col * 12 + 2} y={row * 12 + 2} width={9} height={9} fill="#6366f1" rx="1" />;
                    })
                  )}
                  {/* Fixed position markers */}
                  <rect x="2" y="2" width="26" height="26" fill="none" stroke="#6366f1" strokeWidth="3" rx="2"/>
                  <rect x="8" y="8" width="14" height="14" fill="#6366f1" rx="1"/>
                  <rect x="72" y="2" width="26" height="26" fill="none" stroke="#6366f1" strokeWidth="3" rx="2"/>
                  <rect x="78" y="8" width="14" height="14" fill="#6366f1" rx="1"/>
                  <rect x="2" y="72" width="26" height="26" fill="none" stroke="#6366f1" strokeWidth="3" rx="2"/>
                  <rect x="8" y="78" width="14" height="14" fill="#6366f1" rx="1"/>
                </svg>
              </div>
              {/* Scan line */}
              <div className="scan-line" />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>Scanning ticket...</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Reading QR data</div>
          </div>
        )}

        {/* Phase: Result */}
        {phase === 'result' && result && (
          <div className="animate-scale-in">
            {/* Ticket Card */}
            <div style={{
              background: `linear-gradient(135deg, ${result.color}18, ${result.color}08)`,
              border: `1px solid ${result.color}40`,
              borderRadius: 14,
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40,
                  background: `${result.color}20`,
                  border: `1px solid ${result.color}40`,
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem',
                }}>
                  {result.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Verified Ticket
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {result.name}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <div style={{
                    background: '#22c55e20', border: '1px solid #22c55e40',
                    borderRadius: 99, padding: '3px 10px',
                    fontSize: '0.65rem', fontWeight: 700,
                    color: '#22c55e', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span>✓</span> Valid
                  </div>
                </div>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
              }}>
                {result.qrCode}
              </div>
            </div>

            {/* Access Areas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1.25rem' }}>
              {/* Unlocked */}
              <div>
                <div className="section-title" style={{ marginBottom: 6 }}>✅ Access Granted</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {result.access.map(area => (
                    <div key={area} style={{
                      padding: '4px 8px',
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      color: '#22c55e',
                      fontWeight: 500,
                    }}>
                      {area}
                    </div>
                  ))}
                </div>
              </div>
              {/* Restricted */}
              <div>
                <div className="section-title" style={{ marginBottom: 6 }}>🔒 Restricted</div>
                {result.restricted.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Full access — no restrictions
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {result.restricted.map(area => (
                      <div key={area} style={{
                        padding: '4px 8px',
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        color: 'rgba(239,68,68,0.7)',
                        fontWeight: 500,
                      }}>
                        {area}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={reset} style={{ flex: 1 }}>
                Scan Again
              </button>
              <button className="btn-primary" onClick={onClose} style={{ flex: 1 }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
