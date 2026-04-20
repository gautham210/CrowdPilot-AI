import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CrowdMap from './components/CrowdMap';
import ChatAssistant from './components/ChatAssistant';
import ScheduleView from './components/ScheduleView';

// ─── Persistent Status Bar ────────────────────────────────────────────────────
function StatusBar() {
  const { timeline, crowdData, lastUpdated } = useApp();
  const [, tick] = useState(0);

  // Re-render every second for live countdown and "updated ago"
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const secsAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null;
  const updatedLabel = secsAgo === null
    ? 'Connecting...'
    : secsAgo < 5
      ? 'Just updated'
      : `Updated ${secsAgo}s ago`;

  const current = timeline?.current;
  const venue = timeline?.venue || 'Venue';
  const eventType = timeline?.eventType || 'f1';

  // Crowd summary
  const highZones  = crowdData.filter(z => z.level === 'high').length;
  const medZones   = crowdData.filter(z => z.level === 'medium').length;
  const crowdSummary = highZones > 0
    ? `${highZones} zone${highZones > 1 ? 's' : ''} HIGH`
    : medZones > 2
      ? `${medZones} zones MEDIUM`
      : 'All zones clear';
  const crowdColor = highZones > 0 ? 'var(--danger)' : medZones > 2 ? 'var(--warning)' : 'var(--crowd-low)';

  // Time remaining label
  let timeLabel = null;
  if (current?.timeRemaining != null) {
    const mins = current.timeRemaining;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    timeLabel = h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  }

  const EVENT_LABELS = { f1: 'F1 Grand Prix', football: 'Football', cricket: 'Cricket' };

  return (
    <header style={{
      height: 48,
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.5rem',
      gap: 10,
      background: 'rgba(7,7,16,0.85)',
      backdropFilter: 'blur(16px)',
      flexShrink: 0,
      zIndex: 50,
    }}>
      {/* Live pulse + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span className="pulse-dot" style={{ width: 7, height: 7 }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700, letterSpacing: '0.08em' }}>
          LIVE
        </span>
      </div>

      <span style={{ color: 'var(--border)', fontSize: '0.8rem' }}>|</span>

      {/* Event + session */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {EVENT_LABELS[eventType] || 'Event'}
        </span>
        {current && (
          <>
            <span style={{ color: 'var(--border)', fontSize: '0.75rem' }}>·</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-bright)', fontWeight: 600 }}>
              {current.name}
            </span>
          </>
        )}
      </div>

      {/* Time remaining pill */}
      {timeLabel && (
        <div style={{
          padding: '2px 9px',
          borderRadius: 99,
          background: current?.timeRemaining <= 10
            ? 'rgba(239,68,68,0.12)'
            : 'rgba(99,102,241,0.1)',
          border: `1px solid ${current?.timeRemaining <= 10
            ? 'rgba(239,68,68,0.25)'
            : 'rgba(99,102,241,0.2)'}`,
          fontSize: '0.68rem',
          fontWeight: 700,
          color: current?.timeRemaining <= 10 ? 'var(--danger)' : 'var(--accent-bright)',
          flexShrink: 0,
        }}>
          ⏱ {timeLabel}
        </div>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Crowd status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: crowdColor, flexShrink: 0,
            boxShadow: `0 0 6px ${crowdColor}`,
          }} />
          <span style={{ fontSize: '0.68rem', color: crowdColor, fontWeight: 600 }}>
            {crowdSummary}
          </span>
        </div>

        <span style={{ color: 'var(--border)', fontSize: '0.75rem' }}>|</span>

        {/* Venue */}
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          🏟️ {venue}
        </span>

        <span style={{ color: 'var(--border)', fontSize: '0.75rem' }}>|</span>

        {/* Last updated */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="status-blink" style={{
            width: 5, height: 5, borderRadius: '50%',
            background: secsAgo !== null && secsAgo < 30 ? '#22c55e' : '#f59e0b',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{updatedLabel}</span>
        </div>

        {/* AI badge */}
        <span style={{
          fontSize: '0.65rem',
          padding: '2px 8px',
          borderRadius: 99,
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.2)',
          color: 'var(--accent-bright)',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          AI Powered
        </span>
      </div>
    </header>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function MainContent() {
  const { activeTab } = useApp();

  return (
    <main style={{
      flex: 1,
      padding: '1.75rem 2rem',
      overflowY: 'auto',
      minHeight: 0,
    }}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Venue Map</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
              Real-time crowd density · Click a zone for details
            </div>
          </div>
          <CrowdMap />
        </div>
      )}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>AI Assistant</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
              Ask anything about the venue, crowds, timing, or recommendations
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ChatAssistant />
          </div>
        </div>
      )}
      {activeTab === 'timeline' && <ScheduleView />}
    </main>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-base)',
      }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Persistent status bar */}
          <StatusBar />

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <MainContent />
          </div>
        </div>
      </div>
    </AppProvider>
  );
}
