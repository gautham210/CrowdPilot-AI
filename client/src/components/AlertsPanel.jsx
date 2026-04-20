import React from 'react';
import { useApp } from '../context/AppContext';

const SEVERITY_CONFIG = {
  critical: {
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.25)',
    color: '#ef4444',
    icon: '🚨',
    label: 'HIGH PRIORITY'
  },
  high: {
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    color: '#ef4444',
    icon: '⚠️',
    label: 'HIGH PRIORITY'
  },
  medium: {
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    color: '#f59e0b',
    icon: 'ℹ️',
    label: 'MEDIUM PRIORITY'
  },
  low: {
    bg: 'rgba(56,189,248,0.06)',
    border: 'rgba(56,189,248,0.15)',
    color: '#38bdf8',
    icon: '💡',
    label: 'LOW PRIORITY'
  }
};

function formatAge(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

function EmptyState({ timeline }) {
  const current = timeline?.current;
  const isBreak = current?.type === 'break';
  const timeLeft = current?.timeRemaining;

  let suggestion, suggestionIcon, suggestionColor;

  if (isBreak && timeLeft > 15) {
    suggestion = `Great time to grab food or visit the shops — ${timeLeft}m left in ${current.name}.`;
    suggestionIcon = '🍔';
    suggestionColor = 'var(--crowd-low)';
  } else if (isBreak && timeLeft <= 15) {
    suggestion = `Quick washroom break now — only ${timeLeft}m left before the next session.`;
    suggestionIcon = '🚻';
    suggestionColor = 'var(--warning)';
  } else if (current && current.type !== 'break') {
    suggestion = 'Good time to use washrooms mid-session while it\'s quiet.';
    suggestionIcon = '🚻';
    suggestionColor = 'var(--info)';
  } else {
    suggestion = 'Explore the venue — zones are clear and wait times are short.';
    suggestionIcon = '🗺️';
    suggestionColor = 'var(--crowd-low)';
  }

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* All clear header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0.875rem 1rem',
        borderRadius: 10,
        background: 'rgba(34,197,94,0.06)',
        border: '1px solid rgba(34,197,94,0.15)',
        marginBottom: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(34,197,94,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0,
        }}>✅</div>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--crowd-low)' }}>
            All clear — no active alerts
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
            Crowd levels are normal across all monitored zones
          </div>
        </div>
      </div>

      {/* Suggestion */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '0.7rem 0.875rem',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{suggestionIcon}</span>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
            Suggestion
          </div>
          <div style={{ fontSize: '0.78rem', color: suggestionColor, fontWeight: 500, lineHeight: 1.5 }}>
            {suggestion}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPanel() {
  const { alerts, dismissAlert, predictions, timeline } = useApp();

  return (
    <div className="glass-card" style={{ padding: '1.25rem' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <div className="section-title">Smart Alerts</div>
        {alerts.length > 0 && (
          <span style={{
            background: 'var(--danger)',
            color: '#fff',
            borderRadius: 99,
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '2px 7px',
          }}>
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 && predictions.length === 0 ? (
        <EmptyState timeline={timeline} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Active alerts */}
          {alerts.map(alert => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
            return (
              <div
                key={alert.id}
                className="animate-slide-right"
                style={{
                  padding: '0.7rem 0.875rem',
                  borderRadius: 10,
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{cfg.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: cfg.color, letterSpacing: '0.04em', background: `${cfg.color}15`, padding: '1px 5px', borderRadius: 4, border: `1px solid ${cfg.color}30` }}>
                        {cfg.label}
                      </span>
                      <div style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}>
                        {alert.message}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      marginTop: 2,
                    }}>
                      {alert.reason}
                    </div>
                    <div style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}>
                      {formatAge(alert.timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      padding: 0,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}

          {/* Predictions as notice items */}
          {alerts.length === 0 && predictions.map(pred => {
            const cfg = SEVERITY_CONFIG[pred.severity] || SEVERITY_CONFIG.medium;
            return (
              <div key={pred.id} style={{
                padding: '0.7rem 0.875rem',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>🔮</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {pred.recommendation}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {pred.reason}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
