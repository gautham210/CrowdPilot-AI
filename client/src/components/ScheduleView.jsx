import React from 'react';
import { useApp } from '../context/AppContext';

// ─── Series config ─────────────────────────────────────────────────────────────
const SERIES_CONFIG = {
  F1:      { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: '🏎️',  label: 'Formula 1' },
  F2:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: '🏁',  label: 'Formula 2' },
  F3:      { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: '🔰',  label: 'Formula 3' },
  Academy: { color: '#ec4899', bg: 'rgba(236,72,153,0.1)',  icon: '⭐',  label: 'F1 Academy' },
};

// Fallback for non-series sessions (breaks, ceremonies in football/cricket)
const TYPE_FALLBACK = {
  race:       { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: '🏎️' },
  qualifying: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: '⏱️' },
  practice:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  icon: '🔧' },
  break:      { color: '#44445a', bg: 'rgba(68,68,90,0.12)',   icon: '☕' },
  ceremony:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: '🏆' },
  active:     { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: '⚽' },
};

const CROWD_IMPORTANCE_LABEL = {
  5: { label: '🔴 Peak', color: '#ef4444' },
  4: { label: '🟠 High', color: '#f59e0b' },
  3: { label: '🟡 Medium',  color: '#eab308' },
  2: { label: '🟢 Low',  color: '#22c55e' },
  1: { label: '⬜ Minimal',  color: '#6b7280' },
  0: { label: '☕ Redistribute', color: '#9ca3af' },
};

function getSessionCfg(session) {
  if (session.series && SERIES_CONFIG[session.series]) {
    return SERIES_CONFIG[session.series];
  }
  return TYPE_FALLBACK[session.type] || TYPE_FALLBACK.race;
}

function formatClock(minutes, dayStartHour = 9) {
  const totalMins = dayStartHour * 60 + minutes;
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${suffix}`;
}

export default function ScheduleView() {
  const { timeline } = useApp();

  if (!timeline) return (
    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
      Loading schedule...
    </div>
  );

  const { schedule, current, elapsed, eventName, venueStats } = timeline;
  const dayStartHour = 9;
  const totalDuration = schedule.reduce((s, x) => s + x.durationMinutes, 0);

  // Group non-break sessions by series for the series legend
  const seriesPresent = [...new Set(schedule.filter(s => s.series).map(s => s.series))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Race Weekend Schedule</h1>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
          {eventName}
        </div>
      </div>

      {/* ── Series legend ────────────────────────────────────────────────────────── */}
      {seriesPresent.length > 0 && (
        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Series on Track This Weekend</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {seriesPresent.map(s => {
              const cfg = SERIES_CONFIG[s];
              if (!cfg) return null;
              const count = schedule.filter(x => x.series === s).length;
              return (
                <div key={s} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 12px', borderRadius: 8,
                  background: cfg.bg, border: `1px solid ${cfg.color}35`,
                }}>
                  <span style={{ fontSize: '1rem' }}>{cfg.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: cfg.color }}>
                      {cfg.label} ({s})
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {count} session{count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Day progress ───────────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="section-title">Day Progress</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {Math.round((elapsed / totalDuration) * 100)}% complete
          </div>
        </div>

        {/* Multi-series segmented progress bar */}
        <div style={{ display: 'flex', gap: 2, height: 12, borderRadius: 99, overflow: 'hidden' }}>
          {schedule.map(s => {
            const cfg    = getSessionCfg(s);
            const end    = s.startMinute + s.durationMinutes;
            const isPast = elapsed >= end;
            const isCurr = !!(current && current.id === s.id);
            const prog   = isCurr
              ? ((elapsed - s.startMinute) / s.durationMinutes) * 100
              : isPast ? 100 : 0;

            return (
              <div key={s.id} style={{
                flex: s.durationMinutes, background: 'rgba(255,255,255,0.04)',
                borderRadius: 2, overflow: 'hidden', position: 'relative',
                minWidth: s.type === 'break' ? 8 : 14,
              }}>
                <div style={{
                  height: '100%', width: `${prog}%`, background: cfg.color,
                  transition: 'width 0.5s',
                  boxShadow: isCurr ? `0 0 8px ${cfg.color}` : 'none',
                }} />
              </div>
            );
          })}
        </div>

        {/* Crowd importance scale */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Crowd Impact:</span>
          {[5, 4, 3, 2, 1].map(imp => (
            <div key={imp} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: '0.65rem', color: CROWD_IMPORTANCE_LABEL[imp].color }}>
                {CROWD_IMPORTANCE_LABEL[imp].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Session list ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {schedule.map((session) => {
          const cfg      = getSessionCfg(session);
          const isPast   = elapsed >= session.startMinute + session.durationMinutes;
          const isCurr   = !!(current && current.id === session.id);
          const startClock = formatClock(session.startMinute, dayStartHour);
          const endClock   = formatClock(session.startMinute + session.durationMinutes, dayStartHour);
          const impCfg     = CROWD_IMPORTANCE_LABEL[session.crowdImportance ?? 0];
          const isBreak    = session.type === 'break';

          return (
            <div key={session.id} className="glass-card" style={{
              padding: isBreak ? '0.75rem 1.25rem' : '1.1rem 1.5rem',
              borderColor: isCurr ? `${cfg.color}55` : undefined,
              background: isCurr ? cfg.bg : isBreak ? 'rgba(255,255,255,0.01)' : undefined,
              opacity: isPast && !isCurr ? 0.58 : 1,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Left accent bar for current (Glowing target pulse) */}
              {isCurr && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                  background: cfg.color, borderRadius: '4px 0 0 4px',
                  boxShadow: `0 0 12px ${cfg.color}, 0 0 4px ${cfg.color}`,
                  animation: 'pulse-border 2s infinite'
                }} />
              )}

              <div style={{ display: 'flex', alignItems: isBreak ? 'center' : 'flex-start', gap: 12 }}>
                {/* Icon */}
                {!isBreak && (
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: cfg.bg, border: `1px solid ${cfg.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isPast ? '1rem' : '1.15rem', flexShrink: 0,
                  }}>
                    {isPast ? '✓' : cfg.icon}
                  </div>
                )}

                {isBreak ? (
                  /* Break — compact row */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9rem' }}>☕</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {session.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {session.durationMinutes} min
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      {startClock} – {endClock}
                    </span>
                    {isCurr && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700,
                        color: current.timeRemaining <= 10 ? 'var(--danger)' : cfg.color }}>
                        {current.timeRemaining}m left
                      </span>
                    )}
                  </div>
                ) : (
                  /* Full session row */
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        {/* Status + series badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          {isCurr && (
                            <div className="badge" style={{ color: cfg.color, background: `${cfg.color}18`, borderColor: `${cfg.color}35` }}>
                              <span className="pulse-dot" style={{ width: 5, height: 5, background: cfg.color }} />
                              Now
                            </div>
                          )}
                          {isPast && (
                            <div className="badge" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', borderColor: 'var(--border)' }}>
                              Completed
                            </div>
                          )}
                          {/* Series badge */}
                          {session.series && (
                            <span style={{
                              padding: '1px 7px', borderRadius: 99, fontSize: '0.62rem', fontWeight: 800,
                              background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40`,
                              letterSpacing: '0.05em',
                            }}>
                              {session.series}
                            </span>
                          )}
                          {/* Label badge */}
                          <span style={{
                            padding: '1px 6px', borderRadius: 99, fontSize: '0.6rem', fontWeight: 600,
                            background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}>
                            {session.label || session.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{session.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                          {session.description}
                        </div>
                        {/* Crowd impact */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Crowd Impact:</span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: impCfg.color }}>
                            {impCfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Time / remaining */}
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {startClock} – {endClock}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {session.durationMinutes} min
                        </div>
                        {isCurr && current.timeRemaining && (
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: current.timeRemaining <= 10 ? 'var(--danger)' : cfg.color, marginTop: 4 }}>
                            {current.timeRemaining}m remaining
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar for current session */}
                    {isCurr && (
                      <div style={{ marginTop: 10 }}>
                        <div className="progress-bar" style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                          <div className="progress-fill" style={{
                            width: `${Math.round(((elapsed - session.startMinute) / session.durationMinutes) * 100)}%`,
                            background: cfg.color,
                            height: '100%', borderRadius: 3,
                            boxShadow: `0 0 8px ${cfg.color}`
                          }} />
                        </div>
                      </div>
                    )}

                    {/* F1 Premium Results Engine */}
                    {isPast && session.results && (
                      <div style={{
                        marginTop: 14, padding: '0.875rem 1rem', borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        borderLeft: `2px solid ${cfg.color}`
                      }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Session Classification
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {session.results.map((r, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{r.medal}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: idx === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                  {r.name}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums', color: idx === 0 ? cfg.color : 'var(--text-muted)', fontWeight: idx === 0 ? 700 : 500 }}>
                                {r.time}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
