import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const EVENT_ICONS = {
  f1: '🏎️',
  football: '⚽',
  cricket: '🏏',
};

const EVENT_LABELS = {
  f1: 'Formula 1',
  football: 'Football',
  cricket: 'Cricket',
};

const WEATHER_ICON = (w = '') => {
  if (/sun|clear/i.test(w)) return '☀️';
  if (/cloud/i.test(w)) return '⛅';
  if (/rain/i.test(w)) return '🌧️';
  if (/wind/i.test(w)) return '💨';
  return '🌤️';
};

export default function EventInfoPanel() {
  const { timeline, fetchAll } = useApp();
  const [switching, setSwitching] = useState(false);
  const [activeType, setActiveType] = useState('f1');

  if (!timeline) return null;

  const { eventName, venue, track, weather, attendance, eventType } = timeline;

  const handleSwitch = async (type) => {
    if (type === activeType || switching) return;
    setSwitching(true);
    try {
      await fetch('/api/event-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      setActiveType(type);
      await fetchAll(); // refresh all data
    } catch (err) {
      console.error('Failed to switch event type:', err);
    } finally {
      setSwitching(false);
    }
  };

  const currentType = eventType || activeType;

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: '1rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(56,189,248,0.04) 100%)',
        borderColor: 'rgba(99,102,241,0.15)',
        marginBottom: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Event icon + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 200px' }}>
          <div style={{
            width: 42,
            height: 42,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(56,189,248,0.15))',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.35rem',
            flexShrink: 0,
          }}>
            {EVENT_ICONS[currentType] || '🎟️'}
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Live Event
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.25, color: 'var(--text-primary)' }}>
              {eventName}
            </div>
          </div>
        </div>

        {/* Metadata chips */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', flex: '2 1 400px' }}>
          <MetaChip icon="🏟️" label="Track" value={track || venue} />
          <MetaChip icon={WEATHER_ICON(weather)} label="Weather" value={weather || '—'} />
          <MetaChip icon="👥" label="Attendance" value={attendance ? `~${attendance}` : '—'} />
        </div>

        {/* Event type switcher */}
        <div style={{ flexShrink: 0 }}>
          <div className="section-title" style={{ marginBottom: 6, textAlign: 'right' }}>Switch Event</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(EVENT_ICONS).map(([type, icon]) => (
              <button
                key={type}
                onClick={() => handleSwitch(type)}
                disabled={switching}
                title={EVENT_LABELS[type]}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 8,
                  border: `1px solid ${currentType === type ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                  background: currentType === type
                    ? 'rgba(99,102,241,0.18)'
                    : 'rgba(255,255,255,0.03)',
                  color: currentType === type ? 'var(--accent-bright)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: currentType === type ? 700 : 400,
                  cursor: switching ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                  opacity: switching && currentType !== type ? 0.5 : 1,
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>{icon}</span>
                <span style={{ display: 'none' }}>{EVENT_LABELS[type]}</span>
              </button>
            ))}
          </div>
          {switching && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
              Switching...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaChip({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        <span>{icon}</span>
        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      </div>
    </div>
  );
}
