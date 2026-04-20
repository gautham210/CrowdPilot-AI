/**
 * Crowd Simulator Engine — Phase 2
 *
 * Expanded to 22 zones covering a full large-scale motorsport venue.
 * Includes: gates, food, washrooms, shops, grandstands, fan zones,
 * parking areas, transport hubs, VIP/Paddock Club, experience zones.
 *
 * Each zone now exposes:
 *   - capacity (max headcount)
 *   - occupancy (0–1)
 *   - peopleCount (derived)
 *   - level (low/medium/high)
 *   - waitTime
 *   - trend
 *   - flowIndicator (movement text)
 *   - predictedGrowthMinutes (ETA to 60% capacity)
 */

const { getCurrentSession, getElapsedMinutes, getActiveSchedule } = require("../data/eventSchedule");

// ─── Zone Definitions ─────────────────────────────────────────────────────────
// capacity = realistic headcount for that zone type at a 82,500-seat venue
const ZONES = [
  // GATES (entry/exit)
  { id: "gate-a",       name: "Gate A — West",         type: "gate",        capacity: 4200,  baseOccupancy: 0.40 },
  { id: "gate-b",       name: "Gate B — North",        type: "gate",        capacity: 5800,  baseOccupancy: 0.35 },
  { id: "gate-c",       name: "Gate C — East",         type: "gate",        capacity: 3900,  baseOccupancy: 0.30 },

  // FOOD & BEVERAGE
  { id: "food-north",   name: "Food Court North",      type: "food",        capacity: 2200,  baseOccupancy: 0.50 },
  { id: "food-south",   name: "Food Court South",      type: "food",        capacity: 1800,  baseOccupancy: 0.45 },

  // WASHROOMS
  { id: "washroom-a",   name: "Washroom Block A",      type: "washroom",    capacity: 800,   baseOccupancy: 0.30 },
  { id: "washroom-b",   name: "Washroom Block B",      type: "washroom",    capacity: 800,   baseOccupancy: 0.30 },

  // SHOPS / MERCH
  { id: "shop-paddock", name: "Paddock Shop",          type: "shop",        capacity: 600,   baseOccupancy: 0.40 },
  { id: "shop-merch",   name: "Merchandise Store",     type: "shop",        capacity: 1200,  baseOccupancy: 0.35 },

  // GRANDSTANDS
  { id: "stand-s1",     name: "Grandstand S1",         type: "grandstand",  capacity: 18000, baseOccupancy: 0.85 },
  { id: "stand-s2",     name: "Grandstand S2",         type: "grandstand",  capacity: 15500, baseOccupancy: 0.80 },
  { id: "stand-s3",     name: "Grandstand S3",         type: "grandstand",  capacity: 12000, baseOccupancy: 0.75 },

  // FAN ZONES
  { id: "fan-zone-a",   name: "Fan Zone Alpha",        type: "fanzone",     capacity: 8000,  baseOccupancy: 0.55 },
  { id: "fan-zone-b",   name: "Fan Zone Bravo",        type: "fanzone",     capacity: 6500,  baseOccupancy: 0.48 },

  // PARKING
  { id: "parking-n",    name: "Parking — North Lot",   type: "parking",     capacity: 12000, baseOccupancy: 0.70 },
  { id: "parking-s",    name: "Parking — South Lot",   type: "parking",     capacity: 9500,  baseOccupancy: 0.65 },

  // TRANSPORT HUBS
  { id: "transport-a",  name: "Shuttle Hub A",         type: "transport",   capacity: 3000,  baseOccupancy: 0.45 },
  { id: "transport-b",  name: "Metro Drop — Gate B",   type: "transport",   capacity: 4500,  baseOccupancy: 0.40 },

  // VIP / PADDOCK CLUB
  { id: "vip-paddock",  name: "Paddock Club VIP",      type: "vip",         capacity: 1200,  baseOccupancy: 0.60 },
  { id: "vip-lounge",   name: "Hospitality Lounge",    type: "vip",         capacity: 800,   baseOccupancy: 0.55 },

  // EXPERIENCE ZONES
  { id: "exp-pitlane",  name: "Pit Lane Experience",   type: "experience",  capacity: 500,   baseOccupancy: 0.65 },
  { id: "exp-sim",      name: "Sim Racing Zone",       type: "experience",  capacity: 400,   baseOccupancy: 0.70 },
];

// Max wait times per zone type (minutes)
const MAX_WAIT = {
  gate: 18, food: 22, washroom: 14, shop: 10,
  grandstand: 3, fanzone: 6, parking: 25, transport: 12,
  vip: 2, experience: 15,
};

// Base movement rates (people/min flowing in or out) — used for flow indicator text
const FLOW_RATE_LABELS = {
  gate:       { in: "entering venue via", out: "exiting via" },
  food:       { in: "moving towards", out: "leaving" },
  washroom:   { in: "queuing at", out: "clearing from" },
  shop:       { in: "heading to", out: "dispersing from" },
  grandstand: { in: "filling", out: "dispersing from" },
  fanzone:    { in: "moving towards", out: "dispersing from" },
  parking:    { in: "arriving at", out: "departing from" },
  transport:  { in: "boarding at", out: "clearing from" },
  vip:        { in: "checking in at", out: "leaving" },
  experience: { in: "joining queue at", out: "leaving" },
};

// Current state
let crowdState = {};

// ─── Phase modifier ───────────────────────────────────────────────────────────
function getPhaseModifier(sessionInfo, zoneType) {
  if (!sessionInfo.current) return 0.30;

  const { crowdPhase, crowdImportance = 3 } = sessionInfo.current;
  const timeRemaining = sessionInfo.current.timeRemaining;

  // Use the exact 1-5 importance scale mapped back to a multiplier (0.5 to 1.1)
  const importanceMultiplier = (crowdImportance / 5) * 0.6 + 0.5;

  if (crowdPhase === "active") {
    if (timeRemaining <= 10) {
      if (zoneType === "gate")        return 0.88;
      if (zoneType === "grandstand")  return 0.75 * importanceMultiplier + 0.15;
      if (zoneType === "food")        return 0.10;
      if (zoneType === "parking")     return 0.80;
      if (zoneType === "transport")   return 0.75;
      if (zoneType === "fanzone")     return 0.40;
      return 0.15;
    }
    if (zoneType === "grandstand")  return (0.75 + Math.random() * 0.1) * importanceMultiplier + 0.15;
    if (zoneType === "fanzone")     return 0.50 * importanceMultiplier;
    if (zoneType === "gate")        return 0.08;
    if (zoneType === "food")        return 0.18;
    if (zoneType === "washroom")    return 0.22;
    if (zoneType === "parking")     return 0.65;
    if (zoneType === "transport")   return 0.35;
    if (zoneType === "vip")         return 0.65 * importanceMultiplier;
    if (zoneType === "experience")  return 0.20;
    return 0.22;
  }

  if (crowdPhase === "break") {
    const elapsed_in_break = sessionInfo.current.durationMinutes - timeRemaining;
    if (elapsed_in_break < 5) {
      if (zoneType === "food")        return 0.95;
      if (zoneType === "washroom")    return 0.90;
      if (zoneType === "shop")        return 0.75;
      if (zoneType === "fanzone")     return 0.68;
      if (zoneType === "grandstand")  return 0.45;
      if (zoneType === "gate")        return 0.52;
      if (zoneType === "experience")  return 0.60;
      return 0.50;
    } else if (timeRemaining <= 10) {
      if (zoneType === "gate")        return 0.88;
      if (zoneType === "grandstand")  return 0.70;
      if (zoneType === "food")        return 0.28;
      if (zoneType === "transport")   return 0.70;
      return 0.22;
    } else {
      if (zoneType === "food")        return 0.68;
      if (zoneType === "washroom")    return 0.58;
      if (zoneType === "shop")        return 0.52;
      if (zoneType === "fanzone")     return 0.60;
      if (zoneType === "grandstand")  return 0.30;
      if (zoneType === "experience")  return 0.65;
      return 0.42;
    }
  }

  return 0.35;
}

function occupancyToLevel(occ) {
  if (occ < 0.40) return "low";
  if (occ < 0.70) return "medium";
  return "high";
}

function computeWaitTime(occupancy, zoneType) {
  const max = MAX_WAIT[zoneType] || 10;
  return Math.round(occupancy * max + Math.random() * 2);
}

// ─── Flow indicator text ──────────────────────────────────────────────────────
function buildFlowIndicator(zone, occupancy, trend, sessionInfo) {
  const peopleMoving = Math.round(zone.capacity * Math.abs(occupancy - (zone.baseOccupancy || 0.4)) * 0.6 + 80 + Math.random() * 120);
  
  if (trend === "stable") return `${zone.name} holding steady`;

  // Provide realistic source/destination logic
  const isBreak = sessionInfo.current?.type === "break";
  let fromZone = "Concourses";
  let toZone = "Concourses";

  if (isBreak) {
    fromZone = "Grandstands";
    if (zone.type === "food" || zone.type === "washroom" || zone.type === "shop") toZone = zone.name;
    else if (zone.type === "grandstand") return `Crowd dispersing from ${zone.name}`;
  } else {
    fromZone = "Facilities";
    if (zone.type === "grandstand") toZone = zone.name;
    else if (zone.type === "food" || zone.type === "washroom") return `Crowd dispersing from ${zone.name} → Grandstands`;
    else if (zone.type === "gate") {
      fromZone = "Parking Lots";
      toZone = zone.name;
    }
  }

  if (trend === "increasing") {
    // Advanced realistic "from -> to" text
    if (zone.type === "grandstand") return `+${peopleMoving.toLocaleString()} people moving from ${fromZone} → ${zone.name}`;
    if (zone.type === "gate") return `+${peopleMoving.toLocaleString()} people arriving from ${fromZone} → ${zone.name}`;
    if (zone.type === "food" || zone.type === "shop" || zone.type === "washroom") return `+${peopleMoving.toLocaleString()} people moving from ${fromZone} → ${zone.name}`;
    return `+${peopleMoving.toLocaleString()} people arriving at ${zone.name}`;
  } else {
    // Decreasing
    if (zone.type === "gate") return `Crowd dispersing from ${zone.name} → Transport Hubs`;
    return `Crowd dispersing from ${zone.name}`;
  }
}

// ─── Predictive growth text ───────────────────────────────────────────────────
function buildPredictiveGrowth(zone, occupancy, trend, sessionInfo) {
  if (!sessionInfo.current) return null;

  const { type: sessType, timeRemaining, crowdPhase } = sessionInfo.current;

  // If zone is a grandstand and session is active → stays full
  if (zone.type === "grandstand" && crowdPhase === "active") {
    if (occupancy > 0.75) return null; // already high, no need
    return `Filling rapidly — expect ${Math.round(occupancy * 100 + 15)}% in ~5 min as session starts`;
  }

  // If already high → predict when it clears
  if (occupancy >= 0.70) {
    if (trend === "decreasing") return `Clearing — expect low crowd in ~${8 + Math.round(Math.random() * 7)} min`;
    return null;
  }

  // Predict when zone will spike based on session phase
  if (crowdPhase === "active" && (zone.type === "food" || zone.type === "washroom")) {
    if (timeRemaining <= 15) {
      const minsToSpike = Math.max(1, timeRemaining - 3);
      return `Will reach 65%+ capacity in ~${minsToSpike} min when session ends`;
    }
  }

  if (crowdPhase === "break" && (zone.type === "food" || zone.type === "fanzone")) {
    if (trend === "increasing") {
      const minsToFull = Math.round((0.85 - occupancy) / 0.06) + 2;
      return `Projected 60% capacity in ~${minsToFull} min at current rate`;
    }
  }

  if (zone.type === "gate" && trend === "increasing") {
    return `Gate congestion expected — 70%+ capacity in ~${Math.round(timeRemaining * 0.6 + 3)} min`;
  }

  return null;
}

// ─── Simulate one tick ────────────────────────────────────────────────────────
function simulateTick() {
  const elapsed    = getElapsedMinutes();
  const sessionInfo = getCurrentSession(elapsed);
  const newState   = {};

  for (const zone of ZONES) {
    const prev     = crowdState[zone.id];
    const phaseOcc = getPhaseModifier(sessionInfo, zone.type);
    const noise    = (Math.random() - 0.5) * 0.08;
    const targetOcc = Math.max(0.03, Math.min(1, phaseOcc + noise));
    const prevOcc  = prev ? prev.occupancy : zone.baseOccupancy;
    const occupancy = prevOcc * 0.65 + targetOcc * 0.35;

    const delta = occupancy - prevOcc;
    const trend = delta > 0.025 ? "increasing" : delta < -0.025 ? "decreasing" : "stable";

    const peopleCount = Math.round(occupancy * zone.capacity);

    newState[zone.id] = {
      ...zone,
      occupancy,
      level:             occupancyToLevel(occupancy),
      waitTime:          computeWaitTime(occupancy, zone.type),
      trend,
      peopleCount,
      capacityPct:       Math.round(occupancy * 100),
      flowIndicator:     buildFlowIndicator(zone, occupancy, trend, sessionInfo),
      predictedGrowth:   buildPredictiveGrowth(zone, occupancy, trend, sessionInfo),
      lastUpdated:       Date.now(),
    };
  }

  crowdState = newState;
  return crowdState;
}

// Initialize
simulateTick();
setInterval(simulateTick, 15000);

function getCrowdState() {
  return Object.values(crowdState);
}

function getZone(id) {
  return crowdState[id] || null;
}

// ─── Venue-level stats (for global attendance display) ────────────────────────
function getVenueStats() {
  const schedule = getActiveSchedule();
  const state    = getCrowdState();

  const venueCapacity = parseInt((schedule.attendance || "82500").replace(/,/g, ""), 10);
  // Grandstands + fan zones dominate venue count
  const grandstandOcc = state.filter(z => z.type === "grandstand")
    .reduce((s, z) => s + z.peopleCount, 0);
  const fanzoneOcc    = state.filter(z => z.type === "fanzone")
    .reduce((s, z) => s + z.peopleCount, 0);
  const gatesOcc      = state.filter(z => z.type === "gate")
    .reduce((s, z) => s + z.peopleCount, 0);

  const inVenue       = Math.round(grandstandOcc + fanzoneOcc + gatesOcc * 0.3);
  // Circuit area = venue + parking + transport zone clusters + surrounding
  const circuitArea   = Math.round(inVenue * 4.8 + 60000);

  return {
    venueAttendance:   inVenue,
    circuitAttendance: circuitArea,
    maxCapacity:       venueCapacity,
    occupancyPct:      Math.round((inVenue / venueCapacity) * 100),
  };
}

module.exports = { getCrowdState, getZone, simulateTick, ZONES, getVenueStats };
