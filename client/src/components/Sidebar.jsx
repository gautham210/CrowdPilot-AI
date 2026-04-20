import React from 'react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '⚡', label: 'Dashboard' },
  { id: 'map',       icon: '🗺️', label: 'Venue Map' },
  { id: 'chat',      icon: '🤖', label: 'AI Assistant' },
  { id: 'timeline',  icon: '🏁', label: 'Schedule' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, alerts } = useApp();

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'rgba(10,10,20,0.95)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      gap: '0.25rem',
      backdropFilter: 'blur(20px)',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
        }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0,
          }}>🏎️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>CrowdPilot</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent-bright)', fontWeight: 600, letterSpacing: '0.08em' }}>AI</div>
          </div>
        </div>
        <div className="section-title" style={{ paddingLeft: 44 }}>
          Venue AI System
        </div>
      </div>

      {/* Nav */}
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0.6rem 0.75rem',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.875rem',
            fontWeight: activeTab === item.id ? 600 : 400,
            color: activeTab === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: activeTab === item.id
              ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(56,189,248,0.08))'
              : 'transparent',
            boxShadow: activeTab === item.id ? 'inset 0 0 0 1px rgba(99,102,241,0.25)' : 'none',
            transition: 'all 0.15s ease',
            textAlign: 'left',
            width: '100%',
          }}
          onMouseEnter={e => {
            if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={e => {
            if (activeTab !== item.id) e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
          <span>{item.label}</span>
          {item.id === 'dashboard' && alerts.length > 0 && (
            <span style={{
              marginLeft: 'auto',
              background: 'var(--danger)',
              color: '#fff',
              borderRadius: 99,
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 6px',
              minWidth: 18,
              textAlign: 'center',
            }}>{alerts.length}</span>
          )}
        </button>
      ))}

      {/* Bottom — live indicator */}
      <div style={{ marginTop: 'auto', padding: '0.75rem 0.5rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0.625rem 0.875rem',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: 10,
        }}>
          <span className="pulse-dot green" />
          <div style={{ fontSize: '0.75rem' }}>
            <div style={{ color: '#22c55e', fontWeight: 600 }}>Live Data</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Updates every 15s</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
