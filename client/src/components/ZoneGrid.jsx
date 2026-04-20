import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const ZONE_ICONS = {
  gate:        '🚪',
  food:        '🍔',
  washroom:    '🚻',
  shop:        '🛍️',
  grandstand:  '🏟️',
  fanzone:     '🎉',
  parking:     '🅿️',
  transport:   '🚌',
  vip:         '⭐',
  experience:  '🎮',
};

const ZONE_TYPE_LABELS = {
  gate:        'Gates',
  food:        'Food Courts',
  washroom:    'Washrooms',
  shop:        'Shops',
  grandstand:  'Grandstands',
  fanzone:     'Fan Zones',
  parking:     'Parking',
  transport:   'Transport Hubs',
  vip:         'VIP / Paddock Club',
  experience:  'Experience Zones',
};

const TREND_LABEL = {
  increasing: { label: '↑ Rising',  cls: 'trend-increasing' },
  decreasing: { label: '↓ Falling', cls: 'trend-decreasing' },
  stable:     { label: '→ Stable',  cls: 'trend-stable' },
};

const LEVEL_COLOR = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

// Zone group order for rendering
const GROUP_ORDER = [
  'grandstand', 'fanzone', 'gate', 'food', 'washroom', 'shop',
  'transport', 'parking', 'vip', 'experience',
];

function ZoneCard({ zone }) {
  const trend    = TREND_LABEL[zone.trend] || TREND_LABEL.stable;
  const barColor = LEVEL_COLOR[zone.level] || '#6366f1';
  const capPct   = zone.capacityPct ?? Math.round((zone.occupancy || 0) * 100);
  const people   = zone.peopleCount ?? Math.round((zone.occupancy || 0) * (zone.capacity || 1000));

  return (
    <div className="card" style={{ padding: '0.875rem 1rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1, minWidth: 0, paddingRight: 8 }}>
          {zone.name}
        </div>
        <span className={`badge badge-${zone.level}`} style={{ flexShrink: 0 }}>
          {zone.level}
        </span>
      </div>

      {/* Capacity bar + % */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Capacity</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: barColor }}>{capPct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{
            width: `${capPct}%`, background: barColor,
          }} />
        </div>
      </div>

      {/* People count + wait */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {people >= 1000 ? `~${(people / 1000).toFixed(1)}k` : `~${people}`}
          </span> people
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          Wait: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{zone.waitTime}m</span>
        </div>
      </div>

      {/* Trend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <span className={trend.cls} style={{ fontSize: '0.68rem', fontWeight: 600, flexShrink: 0 }}>
          {trend.label}
        </span>
      </div>

      {/* Flow indicator */}
      {zone.flowIndicator && (
        <div style={{
          marginTop: 7,
          padding: '4px 7px',
          borderRadius: 6,
          background: 'rgba(56,189,248,0.06)',
          border: '1px solid rgba(56,189,248,0.12)',
          fontSize: '0.65rem',
          color: 'rgba(56,189,248,0.85)',
          lineHeight: 1.4,
        }}>
          🔄 {zone.flowIndicator}
        </div>
      )}

      {/* Predictive growth */}
      {zone.predictedGrowth && (
        <div style={{
          marginTop: 5,
          padding: '4px 7px',
          borderRadius: 6,
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.15)',
          fontSize: '0.65rem',
          color: 'rgba(245,158,11,0.9)',
          lineHeight: 1.4,
        }}>
          📈 {zone.predictedGrowth}
        </div>
      )}
    </div>
  );
}

export default function ZoneGrid() {
  const { crowdData } = useApp();
  const [expandedGroups, setExpandedGroups] = useState(
    () => Object.fromEntries(GROUP_ORDER.map(t => [t, true]))
  );

  const toggleGroup = (type) =>
    setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="section-title">Zone Status — {crowdData.length} Zones Monitored</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          🔄 Flow · 📈 Prediction
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {GROUP_ORDER.map(type => {
          const zones = crowdData.filter(z => z.type === type);
          if (!zones.length) return null;
          const isOpen   = expandedGroups[type];
          const highCount = zones.filter(z => z.level === 'high').length;

          return (
            <div key={type}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(type)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '0 0 8px 0',
                  display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: '0.85rem' }}>{ZONE_ICONS[type]}</span>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {ZONE_TYPE_LABELS[type] || type} ({zones.length})
                </span>
                {highCount > 0 && (
                  <span style={{
                    padding: '1px 6px', borderRadius: 99, fontSize: '0.6rem',
                    background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                    fontWeight: 700, border: '1px solid rgba(239,68,68,0.25)',
                  }}>
                    {highCount} HIGH
                  </span>
                )}
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Zone cards */}
              {isOpen && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: 8,
                }}>
                  {zones.map(zone => (
                    <ZoneCard key={zone.id} zone={zone} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
