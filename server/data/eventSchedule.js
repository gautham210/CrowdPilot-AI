/**
 * Multi-sport event schedules.
 * Supports: F1 Standard Weekend, F1 Sprint Weekend, Football, Cricket
 */

// ─── F1 Standard Weekend ───────────────────────────────────────────────────────
const f1StandardSchedule = {
  eventType:      "f1-standard",
  eventName:      "Silverstone Grand Prix — Standard Weekend",
  venue:          "Silverstone Circuit",
  track:          "Silverstone Circuit",
  location:       "Silverstone, Northamptonshire, UK",
  weather:        "Overcast, 19°C, 20% rain chance",
  attendance:     "160,000",
  circuitArea:    "480,000+",
  laps:           52,
  circuitLength:  "5.891 km",
  dayStartHour:   8,
  sessions: [
    // ── Pre-Race ─────────────────────────────────────────────────────────────
    {
      id: "track-open", name: "Gates & Fan Zones Open", series: null, type: "break",
      startMinute: 0, durationMinutes: 60, crowdPhase: "break", crowdImportance: 1, label: "Gates Open",
      description: "Fans arriving, exploring fan zones and food courts."
    },
    {
      id: "f3-race", name: "F3 Feature Race", series: "F3", type: "race",
      startMinute: 60, durationMinutes: 45, crowdPhase: "active", crowdImportance: 3, label: "Race",
      description: "Formula 3 Feature Race — 22 laps.",
      results: [
        { name: "Ugochukwu", time: "42:15.823", medal: "🥇" },
        { name: "Del Pino", time: "+1.832s", medal: "🥈" },
        { name: "Slater", time: "+4.110s", medal: "🥉" }
      ]
    },
    {
      id: "break-1", name: "Morning Break", series: null, type: "break",
      startMinute: 105, durationMinutes: 45, crowdPhase: "break", crowdImportance: 0, label: "Break",
      description: "Morning break — peak time for merchandise and food."
    },
    {
      id: "f2-race", name: "F2 Feature Race", series: "F2", type: "race",
      startMinute: 150, durationMinutes: 60, crowdPhase: "active", crowdImportance: 4, label: "Race",
      description: "Formula 2 Feature Race — mandatory pit stops.",
      results: [
        { name: "Tsolov", time: "58:33.201", medal: "🥇" },
        { name: "Câmara", time: "+3.400s", medal: "🥈" },
        { name: "Dürksen", time: "+5.122s", medal: "🥉" }
      ]
    },
    {
      id: "paddock-club", name: "Drivers Parade & Grid Walk", series: "F1", type: "ceremony",
      startMinute: 210, durationMinutes: 40, crowdPhase: "break", crowdImportance: 3, label: "Parade",
      description: "F1 drivers parade track lap and grid preparations."
    },
    {
      id: "f1-race", name: "F1 Grand Prix", series: "F1", type: "race",
      startMinute: 250, durationMinutes: 120, crowdPhase: "active", crowdImportance: 5, label: "Race",
      description: "Formula 1 Grand Prix — 52 laps of intense racing.",
      results: null // In progress or upcoming won't show results yet
    },
    {
      id: "f1-podium", name: "F1 Podium Ceremony", series: "F1", type: "ceremony",
      startMinute: 370, durationMinutes: 30, crowdPhase: "active", crowdImportance: 4, label: "Podium",
      description: "Trophy presentation and national anthems."
    }
  ]
};

// ─── F1 Sprint Weekend (Miami) ────────────────────────────────────────────────
const f1SprintSchedule = {
  eventType:      "f1-sprint",
  eventName:      "Miami Grand Prix — Sprint Weekend",
  venue:          "Miami International Autodrome",
  track:          "Miami International Autodrome",
  location:       "Miami Gardens, Florida, USA",
  weather:        "Sunny, 31°C, light wind",
  attendance:     "82,500",
  circuitArea:    "400,000+",
  laps:           57,
  circuitLength:  "5.412 km",
  dayStartHour:   10,
  sessions: [
    {
      id: "gates-open", name: "Gates & Fan Zones Open", series: null, type: "break",
      startMinute: 0, durationMinutes: 60, crowdPhase: "break", crowdImportance: 1, label: "Gates Open",
      description: "Fans arriving for Saturday action."
    },
    {
      id: "f1-sprint-race", name: "F1 Sprint Race", series: "F1", type: "race",
      startMinute: 60, durationMinutes: 45, crowdPhase: "active", crowdImportance: 4, label: "Sprint",
      description: "100km flat-out Sprint Race for world championship points.",
      results: [
        { name: "Norris", time: "34:12.721", medal: "🥇" },
        { name: "Verstappen", time: "+1.923s", medal: "🥈" },
        { name: "Piastri", time: "+4.331s", medal: "🥉" }
      ]
    },
    {
      id: "break-1", name: "Lunch Break", series: null, type: "break",
      startMinute: 105, durationMinutes: 45, crowdPhase: "break", crowdImportance: 0, label: "Break",
      description: "Lunch time in Miami — food courts heavily congested."
    },
    {
      id: "academy-race", name: "F1 Academy Race", series: "Academy", type: "race",
      startMinute: 150, durationMinutes: 35, crowdPhase: "active", crowdImportance: 2, label: "Race",
      description: "F1 Academy weekend race.",
      results: [
        { name: "Pin", time: "28:11.832", medal: "🥇" },
        { name: "Weug", time: "+2.100s", medal: "🥈" },
        { name: "Chambers", time: "+5.012s", medal: "🥉" }
      ]
    },
    {
      id: "break-2", name: "Paddock Break", series: null, type: "break",
      startMinute: 185, durationMinutes: 35, crowdPhase: "break", crowdImportance: 0, label: "Break",
      description: "Quick turnaround before F1 Qualifying."
    },
    {
      id: "f1-qualifying", name: "F1 Qualifying", series: "F1", type: "qualifying",
      startMinute: 220, durationMinutes: 60, crowdPhase: "active", crowdImportance: 5, label: "Qualifying",
      description: "Knockout qualifying for Sunday's Grand Prix grid.",
      results: [
        { name: "Antonelli", time: "1:26.111", medal: "🥇" },
        { name: "Russell", time: "+0.103s", medal: "🥈" },
        { name: "Leclerc", time: "+0.254s", medal: "🥉" }
      ]
    },
    {
      id: "post-sessions", name: "Fan Zone Concert", series: null, type: "ceremony",
      startMinute: 280, durationMinutes: 90, crowdPhase: "break", crowdImportance: 2, label: "Concert",
      description: "Evening music performances and fan zone activities."
    }
  ]
};

// ─── Football Match ───────────────────────────────────────────────────────────
const footballSchedule = {
  eventType: "football", eventName: "Premier League — Home Match", venue: "The Etihad Stadium", track: "Natural Grass Pitch", location: "Manchester, UK",
  weather: "Partly cloudy, 14°C", attendance: "53,400", circuitArea: "110,000+", dayStartHour: 14,
  sessions: [
    { id: "pre-match", name: "Pre-Match", series: null, type: "active", startMinute: 0, durationMinutes: 30, description: "Teams warm up", crowdPhase: "active", crowdImportance: 2, label: "Pre-Match" },
    { id: "first-half", name: "First Half", series: null, type: "race", startMinute: 30, durationMinutes: 45, description: "First 45 minutes", crowdPhase: "active", crowdImportance: 4, label: "1st Half" },
    { id: "halftime", name: "Half Time", series: null, type: "break", startMinute: 75, durationMinutes: 15, description: "15-minute break", crowdPhase: "break", crowdImportance: 0, label: "Half Time" },
    { id: "second-half", name: "Second Half", series: null, type: "race", startMinute: 90, durationMinutes: 45, description: "Second 45 minutes", crowdPhase: "active", crowdImportance: 5, label: "2nd Half" },
    { id: "post-match", name: "Post-Match", series: null, type: "ceremony", startMinute: 135, durationMinutes: 20, description: "Presentation", crowdPhase: "active", crowdImportance: 3, label: "Post-Match" },
  ],
};

const SCHEDULES = { "f1-sprint": f1SprintSchedule, "f1-standard": f1StandardSchedule, football: footballSchedule };

let activeEventType = "f1-sprint"; // Set Sprint as default

function getActiveSchedule() { return SCHEDULES[activeEventType] || SCHEDULES["f1-sprint"]; }

function setActiveEventType(type) {
  if (SCHEDULES[type]) { activeEventType = type; return true; }
  return false;
}

function getCurrentSession(elapsedMinutes) {
  const schedule = getActiveSchedule();
  const sessions = schedule.sessions;

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const end = s.startMinute + s.durationMinutes;

    if (elapsedMinutes >= s.startMinute && elapsedMinutes < end) {
      const timeRemaining = end - elapsedMinutes;
      const nextSession = sessions[i + 1] || null;
      return { current: { ...s, timeRemaining }, next: nextSession, sessionIndex: i };
    }
  }

  if (elapsedMinutes < 0) return { current: null, next: sessions[0], sessionIndex: -1 };
  return { current: null, next: null, sessionIndex: sessions.length };
}

function getElapsedMinutes() {
  const now = new Date();
  const demoOffset = 230; // Starts right in F1 Qualifying for the Sprint Weekend
  return demoOffset + Math.floor((now.getTime() % (90 * 1000)) / 1000);
}

module.exports = { getActiveSchedule, setActiveEventType, getCurrentSession, getElapsedMinutes, SCHEDULES, get eventSchedule() { return getActiveSchedule(); } };
