import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// ─── Series colors ────────────────────────────────────────────────────────────
const SERIES_CONFIG = {
  F1:      { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  label: 'F1',       short: 'F1' },
  F2:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'F2',       short: 'F2' },
  F3:      { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  label: 'F3',       short: 'F3' },
  Academy: { color: '#ec4899', bg: 'rgba(236,72,153,0.15)', label: 'Academy',  short: 'Acad' },
  null:    { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  label: '',         short: '' },
};

const TYPE_FALLBACK_COLORS = {
  race:       '#ef4444',
  qualifying: '#6366f1',
  practice:   '#22c55e',
  break:      '#44445a',
  ceremony:   '#f59e0b',
  active:     '#6366f1',
};

function getSessionColor(session) {
  if (session.series && SERIES_CONFIG[session.series]) {
    return SERIES_CONFIG[session.series].color;
  }
  return TYPE_FALLBACK_COLORS[session.type] || '#6366f1';
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function SessionPip({ session, isCurrent, isPast, elapsed }) {
  const color    = getSessionColor(session);
  const isBreak  = session.type === 'break';
  const start    = session.startMinute;
  const progress = isCurrent
    ? Math.round(((elapsed - start) / session.durationMinutes) * 100)
    : isPast ? 100 : 0;

  return (
    <div style={{
      flex: session.durationMinutes,
      minWidth: isBreak ? 24 : 48,
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      position: 'relative',
    }}>
      {/* Series badge above pip */}
      {session.series && !isBreak && (
        <div style={{
          fontSize: '0.52rem', fontWeight: 800, color: color,
          letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1,
          opacity: isCurrent ? 1 : isPast ? 0.5 : 0.7,
        }}>
          {SERIES_CONFIG[session.series]?.short || session.series}
        </div>
      )}
      {/* Bar */}
      <div style={{
        height: 8,
        background: isPast ? `${color}44` : isCurrent ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
        borderRadius: 4, overflow: 'hidden', position: 'relative',
        border: isCurrent ? `1px solid ${color}` : 'none',
        boxShadow: isCurrent ? `0 0 10px ${color}` : 'none',
        animation: isCurrent ? 'pulse-border 2s infinite' : 'none',
      }}>
        <div style={{
          height: '100%', width: `${progress}%`, background: color,
          borderRadius: 3, transition: 'width 1s ease',
        }} />
      </div>
      {/* Label */}
      <div style={{
        fontSize: '0.58rem',
        fontWeight: isCurrent ? 700 : 400,
        color: isCurrent ? '#f0f0ff' : isPast ? 'var(--text-muted)' : 'var(--text-secondary)',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        textAlign: 'center',
      }}>
        {isCurrent && <span style={{ color }}>▶ </span>}
        {session.label || session.name.split(' ')[0]}
      </div>
    </div>
  );
}

export default function EventTimeline() {
  const { timeline }   = useApp();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const t = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!timeline) {
    return (
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Event Timeline</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading schedule...</div>
      </div>
    );
  }

  const { current, next, elapsed, schedule, eventName } = timeline;
  const currentColor = current ? getSessionColor(current) : '#6366f1';

  return (
    <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div className="section-title" style={{ marginBottom: 4 }}>Event Timeline</div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{eventName}</div>
        </div>
        {current && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div className="badge badge-accent">
              <span className="pulse-dot green" style={{ width: 6, height: 6 }} />
              Live
            </div>
            {current.series && (
              <div style={{
                padding: '2px 7px', borderRadius: 99, fontSize: '0.62rem', fontWeight: 800,
                background: `${currentColor}20`, border: `1px solid ${currentColor}40`,
                color: currentColor, letterSpacing: '0.05em',
              }}>
                {current.series}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current session callout */}
      {current && (
        <div style={{
          background: `${currentColor}0e`,
          border: `1px solid ${currentColor}30`,
          borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.875rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Session</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {current.name}
              </div>
              {current.series && (
                <span style={{
                  padding: '1px 6px', borderRadius: 99, fontSize: '0.6rem', fontWeight: 800,
                  background: `${currentColor}20`, color: currentColor, border: `1px solid ${currentColor}35`,
                }}>
                  {current.series}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {current.description}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Remaining</div>
            <div style={{
              fontSize: '1.5rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
              color: current.timeRemaining <= 10 ? 'var(--danger)' : 'var(--text-primary)',
            }}>
              {formatTime(current.timeRemaining)}
            </div>
          </div>
        </div>
      )}

      {/* Next session */}
      {next && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem',
          padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.02)',
          borderRadius: 8, border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Up Next:</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {next.name}
          </span>
          {next.series && (
            <span style={{
              padding: '1px 5px', borderRadius: 99, fontSize: '0.58rem', fontWeight: 800,
              background: `${getSessionColor(next)}18`, color: getSessionColor(next),
              border: `1px solid ${getSessionColor(next)}30`, flexShrink: 0,
            }}>
              {next.series}
            </span>
          )}
          {current && (
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--accent-bright)', fontWeight: 600 }}>
              in {formatTime(current.timeRemaining)} →
            </span>
          )}
        </div>
      )}

      {/* Series legend (F1 events only) */}
      {schedule?.some(s => s.series) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {Object.entries(SERIES_CONFIG).filter(([k]) => k !== 'null').map(([key, cfg]) =>
            schedule.some(s => s.series === key) ? (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color }} />
                {cfg.label}
              </div>
            ) : null
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#44445a' }} />
            Break
          </div>
        </div>
      )}

      {/* Timeline track */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
        {schedule?.map(session => {
          const isPast    = elapsed >= session.startMinute + session.durationMinutes;
          const isCurrent = !!(current && current.id === session.id);
          return (
            <SessionPip
              key={session.id}
              session={session}
              isCurrent={isCurrent}
              isPast={isPast}
              elapsed={elapsed}
            />
          );
        })}
      </div>
    </div>
  );
}
