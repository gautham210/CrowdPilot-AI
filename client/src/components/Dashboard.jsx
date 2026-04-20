import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import EventTimeline from './EventTimeline';
import BestActionPanel from './BestActionPanel';
import AlertsPanel from './AlertsPanel';
import ZoneGrid from './ZoneGrid';
import EventInfoPanel from './EventInfoPanel';
import TicketScanner from './TicketScanner';

// ─── Zone count formatter ─────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="section-title">{label}</div>
      <div className="crowd-value" style={{
        fontSize: '1.6rem', fontWeight: 800,
        color: color || 'var(--text-primary)', lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

// ─── Global Attendance Banner ─────────────────────────────────────────────────
function AttendanceBanner({ timeline }) {
  const vs = timeline?.venueStats;
  if (!vs) return null;

  const inVenue      = vs.venueAttendance  || 0;
  const circuit      = vs.circuitAttendance || 0;
  const maxCap       = vs.maxCapacity      || 82500;
  const occPct       = vs.occupancyPct     || 0;
  const circuitArea  = timeline?.circuitArea || '400,000+';

  const fillColor = occPct >= 80 ? '#ef4444' : occPct >= 55 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '0.875rem',
    }}>
      {/* In-venue count */}
      <div className="glass-card" style={{
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.07), rgba(56,189,248,0.04))',
        borderColor: 'rgba(99,102,241,0.15)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
          pointerEvents: 'none' }} />
        <div className="section-title" style={{ marginBottom: 4 }}>In Venue Now</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
          👥 {inVenue.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
          inside venue
        </div>
        {/* Capacity bar */}
        <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${occPct}%`, background: fillColor, borderRadius: 99, transition: 'width 1s ease' }} />
        </div>
        <div style={{ fontSize: '0.65rem', color: fillColor, marginTop: 3, fontWeight: 700 }}>
          {occPct}% venue capacity
        </div>
      </div>

      {/* Circuit area total */}
      <div className="glass-card" style={{
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(56,189,248,0.03))',
        borderColor: 'rgba(34,197,94,0.12)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12), transparent 70%)',
          pointerEvents: 'none' }} />
        <div className="section-title" style={{ marginBottom: 4 }}>Circuit Area Total</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
          🌍 ~{circuit > 0 ? circuit.toLocaleString() : circuitArea}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
          across event perimeter
        </div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(34,197,94,0.7)', marginTop: 6, fontWeight: 600 }}>
          📡 Includes grandstands, fan zones, hospitality
        </div>
      </div>

      {/* Live fan activity */}
      <div className="glass-card" style={{
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(245,158,11,0.04))',
        borderColor: 'rgba(239,68,68,0.12)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.1), transparent 70%)',
          pointerEvents: 'none' }} />
        <div className="section-title" style={{ marginBottom: 4 }}>Live Crowd Activity</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
            {timeline?.attendance ? `~${timeline.attendance}` : '—'}
          </div>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
          ticketed attendees today
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
          <span className="pulse-dot" style={{ width: 5, height: 5 }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 700 }}>REAL-TIME MONITORING</span>
        </div>
      </div>
    </div>
  );
}

// ─── "What Should I Do Now?" Decision Panel ──────────────────────────────────
function WhatNowPanel({ onClose }) {
  const { recommendation, timeline } = useApp();
  if (!recommendation) return null;

  const URGENCY_COLORS = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
    high:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    medium:   { color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)' },
    low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)' },
  };
  const urgency = recommendation.urgency || 'low';
  const cfg     = URGENCY_COLORS[urgency] || URGENCY_COLORS.low;

  return (
    <div className="animate-scale-in" style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120,
        borderRadius: '50%', background: `radial-gradient(circle, ${cfg.color}20, transparent 70%)`,
        pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${cfg.color}20`,
            border: `1px solid ${cfg.color}40`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
            {recommendation.icon || '💡'}
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: cfg.color }}>
            Decision Engine — Best Action Now
          </div>
          {recommendation.confidence && (
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, color: '#22c55e',
              background: 'rgba(34,197,94,0.1)', padding: '2px 6px',
              borderRadius: 4, border: '1px solid rgba(34,197,94,0.2)'
            }}>
              Confidence: {recommendation.confidence}
            </div>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
        {recommendation.bestAction}
      </div>
      {recommendation.timeContext && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 99, background: `${cfg.color}15`,
          border: `1px solid ${cfg.color}30`, fontSize: '0.72rem', fontWeight: 700,
          color: cfg.color, marginBottom: '0.875rem' }}>
          ⏱ {recommendation.timeContext}
        </div>
      )}
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)',
        borderTop: `1px solid ${cfg.color}15`, paddingTop: '0.75rem', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-primary)' }}>Why: </strong>
        {recommendation.reasoning}
      </div>
      {recommendation.alternatives?.length > 0 && (
        <div style={{ marginTop: '0.875rem' }}>
          <div className="section-title" style={{ marginBottom: 6 }}>Alternatives</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {recommendation.alternatives.map((alt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>{alt.icon}</span><span>{alt.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { crowdData, timeline, isLoading } = useApp();
  const [showScanner, setShowScanner]     = useState(false);
  const [showWhatNow, setShowWhatNow]     = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: '2rem' }}>🏎️</div>
        <div style={{ color: 'var(--text-secondary)' }}>Loading live venue data...</div>
      </div>
    );
  }

  const lowZones  = crowdData.filter(z => z.level === 'low').length;
  const highZones = crowdData.filter(z => z.level === 'high').length;
  const avgWait   = crowdData.length
    ? Math.round(crowdData.reduce((s, z) => s + z.waitTime, 0) / crowdData.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            Command Dashboard
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
            {timeline?.venue || 'Venue'} · {timeline?.eventName || 'Event'} · Real-time crowd intelligence
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-action" onClick={() => setShowWhatNow(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: '1rem' }}>🧠</span>
            What Should I Do Now?
          </button>
          <button className="btn-ghost" onClick={() => setShowScanner(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🎟️</span> Scan Ticket
          </button>
        </div>
      </div>

      {/* ── Decision panel */}
      {showWhatNow && <WhatNowPanel onClose={() => setShowWhatNow(false)} />}

      {/* ── Grand Prix Info Panel */}
      <EventInfoPanel />

      {/* ── Global attendance banner */}
      <AttendanceBanner timeline={timeline} />

      {/* ── Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
        <StatCard label="Active Zones" value={crowdData.length} sub="Monitored areas" />
        <StatCard label="Low Crowd"  value={lowZones}  sub="Zones available"   color="var(--crowd-low)" />
        <StatCard label="High Crowd" value={highZones} sub="Areas to avoid"
          color={highZones > 0 ? 'var(--crowd-high)' : 'var(--crowd-low)'} />
        <StatCard label="Avg Wait"   value={`${avgWait}m`} sub="Across all zones"
          color={avgWait > 12 ? 'var(--crowd-high)' : avgWait > 7 ? 'var(--crowd-medium)' : 'var(--crowd-low)'} />
      </div>

      {/* ── Timeline */}
      <EventTimeline />

      {/* ── Main 2-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>
        <BestActionPanel />
        <AlertsPanel />
      </div>

      {/* ── Zone grid */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <ZoneGrid />
      </div>

      {showScanner && <TicketScanner onClose={() => setShowScanner(false)} />}
    </div>
  );
}
