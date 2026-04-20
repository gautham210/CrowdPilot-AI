import React from 'react';
import { useApp } from '../context/AppContext';

const URGENCY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: '🚨 CRITICAL' },
  high:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: '⚠️ URGENT' },
  medium:   { color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)', label: 'ℹ️ NOTICE' },
  low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  label: '✅ GOOD TIME' },
};

export default function BestActionPanel() {
  const { recommendation } = useApp();

  if (!recommendation) {
    return (
      <div className="glass-card" style={{ padding: '1.5rem', minHeight: 160 }}>
        <div className="section-title" style={{ marginBottom: 8 }}>Best Action Right Now</div>
        <div style={{
          height: 100,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 10,
          animation: 'pulse-ring 2s ease infinite',
        }} />
      </div>
    );
  }

  const urgency = recommendation.urgency || 'low';
  const config = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.low;

  return (
    <div
      className="animate-fade-in"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative glow */}
      <div style={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${config.color}22, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="section-title">Best Action Right Now</div>
        <span className="badge" style={{
          color: config.color,
          background: `${config.color}18`,
          borderColor: `${config.color}35`,
        }}>
          {config.label}
        </span>
      </div>

      {/* Main action */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: '1rem' }}>
        <div style={{
          fontSize: '2rem',
          lineHeight: 1,
          flexShrink: 0,
          marginTop: 2,
        }}>
          {recommendation.icon || '💡'}
        </div>
        <div>
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
          }}>
            {recommendation.bestAction}
          </div>
          {recommendation.timeContext && (
            <div style={{
              fontSize: '0.75rem',
              color: config.color,
              marginTop: 4,
              fontWeight: 600,
            }}>
              {recommendation.timeContext}
            </div>
          )}
        </div>
      </div>

      {/* Reasoning */}
      <div style={{
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '0.875rem',
        lineHeight: 1.6,
        marginBottom: recommendation.alternatives?.length ? '0.875rem' : 0,
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>Why: </strong>
        {recommendation.reasoning}
      </div>

      {/* Alternatives */}
      {recommendation.alternatives?.length > 0 && (
        <div>
          <div className="section-title" style={{ marginBottom: 8 }}>Alternatives</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recommendation.alternatives.map((alt, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.5rem 0.75rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
              }}>
                <span>{alt.icon}</span>
                <span>{alt.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
