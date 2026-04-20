import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [crowdData, setCrowdData]         = useState([]);
  const [timeline, setTimeline]           = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [predictions, setPredictions]     = useState([]);
  const [alerts, setAlerts]               = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [activeTab, setActiveTab]         = useState('dashboard');
  const [lastUpdated, setLastUpdated]     = useState(null);
  const alertIdRef = useRef(0);
  const seenPredIds = useRef(new Set());

  const fetchAll = useCallback(async () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
    try {
      const [crowdRes, timelineRes, recRes, predRes] = await Promise.all([
        fetch(`${API_BASE}/api/crowd`),
        fetch(`${API_BASE}/api/timeline`),
        fetch(`${API_BASE}/api/recommendation`),
        fetch(`${API_BASE}/api/predictions`),
      ]);

      const [crowd, tl, rec, pred] = await Promise.all([
        crowdRes.json(),
        timelineRes.json(),
        recRes.json(),
        predRes.json(),
      ]);

      setCrowdData(crowd);
      setTimeline(tl);
      setRecommendation(rec);
      setPredictions(pred);
      setLastUpdated(Date.now());
      setIsLoading(false);

      generateAlerts(pred);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setIsLoading(false);
    }
  }, []);

  const alertCooldowns = useRef(new Map());

  const getPriorityScore = (severity) => {
    if (severity === 'critical') return 3;
    if (severity === 'high') return 2;
    if (severity === 'medium') return 1;
    return 0;
  };

  const generateAlerts = useCallback((preds) => {
    const now = Date.now();
    
    setAlerts(prev => {
      let updatedAlerts = [...prev];
      
      preds.filter(p => p.severity !== 'low').forEach(p => {
        // Cooldown check: if dismissed recently (3 minutes)
        if (alertCooldowns.current.has(p.id)) {
          const lastDismissed = alertCooldowns.current.get(p.id);
          if (now - lastDismissed < 3 * 60 * 1000) return;
        }

        const existingIdx = updatedAlerts.findIndex(a => a.id === p.id);
        if (existingIdx >= 0) {
          // Update timestamp to float it visually if needed and prevent stacking
          updatedAlerts[existingIdx] = {
            ...updatedAlerts[existingIdx],
            timestamp: now,
            message: p.recommendation,
            reason: p.reason
          };
        } else {
          // New alert
          updatedAlerts.push({
            id: p.id,
            message: p.recommendation,
            reason: p.reason,
            severity: p.severity,
            zone: p.zone,
            timestamp: now,
            priorityScore: getPriorityScore(p.severity)
          });
        }
      });

      // Sort by priority (critical > high > medium) then by newest
      return updatedAlerts.sort((a, b) => {
        if (a.priorityScore !== b.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        return b.timestamp - a.timestamp;
      }).slice(0, 10);
    });
  }, []);

  const dismissAlert = useCallback((id) => {
    alertCooldowns.current.set(id, Date.now());
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Reset seen pred IDs when session changes (so new session alerts fire again)
  useEffect(() => {
    if (timeline?.current?.id) {
      seenPredIds.current.clear();
    }
  }, [timeline?.current?.id]);

  const getZoneById   = useCallback((id)   => crowdData.find(z => z.id === id) || null, [crowdData]);
  const getZonesByType = useCallback((type) => crowdData.filter(z => z.type === type), [crowdData]);

  return (
    <AppContext.Provider value={{
      crowdData,
      timeline,
      recommendation,
      predictions,
      alerts,
      isLoading,
      activeTab,
      setActiveTab,
      lastUpdated,
      fetchAll,
      dismissAlert,
      getZoneById,
      getZonesByType,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
