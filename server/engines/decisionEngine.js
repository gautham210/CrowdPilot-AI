/**
 * Decision Engine
 *
 * Combines event timeline + crowd data + predictions to produce
 * the best action recommendation and alternatives.
 */

const { getCrowdState } = require("./crowdSimulator");
const { getPredictions, getCrowdOutlook } = require("./predictionEngine");
const { getCurrentSession, getElapsedMinutes, getActiveSchedule } = require("../data/eventSchedule");

/**
 * Get the best zone of a given type based on current crowd data.
 */
function getBestZone(type) {
  const zones = getCrowdState().filter((z) => z.type === type);
  if (!zones.length) return null;
  return zones.sort((a, b) => a.occupancy - b.occupancy)[0];
}

/**
 * Summarize a zone for use in text recommendations.
 */
function describeZone(zone) {
  if (!zone) return "No zone available";
  return `${zone.name} (wait: ~${zone.waitTime} min, crowd: ${zone.level})`;
}

/**
 * Core decision function. Returns best action, alternatives, and reasoning.
 */
function getRecommendation() {
  const elapsed = getElapsedMinutes();
  const sessionInfo = getCurrentSession(elapsed);
  const predictions = getPredictions(15);
  const outlook = getCrowdOutlook();

  const { current, next } = sessionInfo;

  // Helper to compute percentage diff
  const pctDiff = (a, b) => a && b ? Math.round(Math.abs(a.occupancy - b.occupancy) * 100) : 0;

  // Critical situation: break ending soon
  const returnAlert = predictions.find((p) => p.id === "break-ending-return");
  if (returnAlert) {
    return {
      bestAction: returnAlert.recommendation,
      icon: "🏃",
      urgency: returnAlert.severity === "critical" ? "critical" : "high",
      confidence: "High",
      alternatives: [
        { action: "Check gate crowd levels on the map", icon: "🗺️" },
        { action: "Use Washroom A which is typically less busy", icon: "🚻" },
      ],
      reasoning: returnAlert.reason,
      timeContext: current ? `${current.timeRemaining} min remaining in break` : "",
    };
  }

  // During break — recommend food/washroom based on crowd
  if (current && current.type === "break") {
    const sortedFood = getCrowdState().filter(z => z.type === 'food').sort((a,b)=>a.occupancy - b.occupancy);
    const sortedWashroom = getCrowdState().filter(z => z.type === 'washroom').sort((a,b)=>a.occupancy - b.occupancy);
    
    const bestFood = sortedFood[0];
    const altFood = sortedFood[1];
    const bestWashroom = sortedWashroom[0];
    const bestShop = getBestZone("shop");

    const timeLeft = current.timeRemaining;

    if (timeLeft > 20) {
      const diff = pctDiff(bestFood, altFood);
      return {
        bestAction: `Visit ${describeZone(bestFood)}`,
        icon: "🍔",
        urgency: "low",
        confidence: "High",
        alternatives: [
          { action: describeZone(bestWashroom), icon: "🚻" },
          { action: describeZone(bestShop), icon: "🛍️" },
        ],
        reasoning: `${bestFood?.name} is ~${diff}% less crowded right now. You have ${timeLeft} minutes — enough time for food.`,
        timeContext: `${timeLeft} min in ${current.name}`,
      };
    } else if (timeLeft > 10) {
      const diff = pctDiff(bestWashroom, sortedWashroom[1]);
      return {
        bestAction: `Quick washroom stop: ${describeZone(bestWashroom)}`,
        icon: "🚻",
        urgency: "medium",
        confidence: "High",
        alternatives: [
          { action: describeZone(bestFood), icon: "🍔" },
          { action: "Head to your seat and skip queues", icon: "🪑" },
        ],
        reasoning: `${bestWashroom?.name} is ~${diff}% less crowded. You have ${timeLeft} minutes — enough for a quick washroom stop, avoid food courts. Crowd will spike in ~10 minutes.`,
        timeContext: `${timeLeft} min in ${current.name}`,
      };
    } else {
      return {
        bestAction: "Return to your seat now",
        icon: "🪑",
        urgency: "high",
        confidence: "High",
        alternatives: [
          { action: "Quick washroom run if urgent", icon: "🚻" },
          { action: describeZone(getBestZone("gate")), icon: "🚪" },
        ],
        reasoning: `Only ${timeLeft} minutes remain — ${next ? next.name : "next session"} starts soon. Grandstands are filling rapidly.`,
        timeContext: `${timeLeft} min in ${current.name}`,
      };
    }
  }

  // During active session: least crowded recommendation
  if (current && current.type !== "break") {
    const bestGate = getBestZone("gate");
    const timeLeft = current.timeRemaining;

    if (timeLeft > 20) {
      const sortedWashroom = getCrowdState().filter(z => z.type === 'washroom').sort((a,b)=>a.occupancy - b.occupancy);
      const bestWashroom = sortedWashroom[0];
      const diff = pctDiff(bestWashroom, sortedWashroom[1]);
      return {
        bestAction: `Now is a great time for washroom: ${describeZone(bestWashroom)}`,
        icon: "🚻",
        urgency: "low",
        confidence: "High",
        alternatives: [
          { action: `Quieter gate: ${describeZone(bestGate)}`, icon: "🚪" },
          { action: "Stay and enjoy the race", icon: "🏎️" },
        ],
        reasoning: `${bestWashroom?.name} is ~${diff}% less crowded. You have ${timeLeft} minutes remaining in ${current.name}. Best window before the rush.`,
        timeContext: `${timeLeft} min remaining in ${current.name}`,
      };
    } else {
      return {
        bestAction: "Stay in your seat — session ending soon",
        icon: "🏎️",
        urgency: "low",
        confidence: "High",
        alternatives: [
          { action: "Very quick washroom if urgent", icon: "🚻" },
        ],
        reasoning: `${timeLeft} minutes until session ends — gates and facilities will crowd immediately after.`,
        timeContext: `${timeLeft} min remaining in ${current.name}`,
      };
    }
  }

  return {
    bestAction: "Welcome to the venue — check the map for crowd levels",
    icon: "👋",
    urgency: "low",
    confidence: "High",
    alternatives: [],
    reasoning: "Event starting soon. No immediate crowd threats predicted.",
    timeContext: "",
  };
}




/**
 * Build a structured crowd context object for use in smart fallback.
 * Returns raw data, not a string.
 */
function buildDetailedCrowdContext() {
  const elapsed = getElapsedMinutes();
  const sessionInfo = getCurrentSession(elapsed);
  const zones = getCrowdState();
  const predictions = getPredictions(15);

  return { zones, sessionInfo, predictions, elapsed };
}

/**
 * Build a rich crowd context string to inject into Gemini prompts.
 * Includes comparative zone analysis.
 */
function buildCrowdContext() {
  const elapsed = getElapsedMinutes();
  const sessionInfo = getCurrentSession(elapsed);
  const zones = getCrowdState();
  const predictions = getPredictions(15);
  const recommendation = getRecommendation();

  // Per-type sorted summaries for easy AI comparison
  const grouped = {};
  for (const z of zones) {
    if (!grouped[z.type]) grouped[z.type] = [];
    grouped[z.type].push(z);
  }
  for (const type of Object.keys(grouped)) {
    grouped[type].sort((a, b) => a.occupancy - b.occupancy);
  }

  const groupedSummary = Object.entries(grouped)
    .map(([type, list]) => {
      const header = `${type.toUpperCase()} zones (best → worst):`;
      const items = list.map((z, i) => {
        const pct = Math.round(z.occupancy * 100);
        const diff = i > 0
          ? ` (+${Math.round((z.occupancy - list[0].occupancy) * 100)}% more crowded vs ${list[0].name})`
          : " ← BEST OPTION";
        return `  ${z.name}: ${pct}% occupancy, wait ~${z.waitTime}min, trend ${z.trend}${diff}`;
      });
      return [header, ...items].join("\n");
    })
    .join("\n\n");

  const predSummary = predictions
    .map((p) => `- [${p.severity.toUpperCase()}] In ~${p.timeToSpike ?? 0}min: ${p.reason} → ${p.recommendation}`)
    .join("\n") || "No crowd spikes predicted in next 15 minutes";

  const sessionSummary = sessionInfo.current
    ? `CURRENT: ${sessionInfo.current.name} (${sessionInfo.current.type}) — ${sessionInfo.current.timeRemaining} min remaining`
    : "No active session";

  const nextSummary = sessionInfo.next
    ? `NEXT: ${sessionInfo.next.name} — starts in ${sessionInfo.next.startMinute - elapsed} min`
    : "No further sessions today";

  const schedule = getActiveSchedule();

  return `
=== CrowdPilot AI — Live Event Context ===
Venue: ${schedule.venue} — ${schedule.eventName}
Location: ${schedule.location}
Attendance: ~${schedule.attendance || 'Unknown'} spectators

SESSION STATUS:
${sessionSummary}
${nextSummary}

CROWD DATA (with comparisons):
${groupedSummary}

PREDICTIONS (next 15 min):
${predSummary}

CURRENT BEST ACTION: ${recommendation.bestAction}
REASONING: ${recommendation.reasoning}

RESPONSE RULES REMINDER: Keep to 2-3 sentences max. Always compare options with percentages and time estimates. Be decisive, not descriptive.
`.trim();
}

module.exports = { getRecommendation, buildCrowdContext, buildDetailedCrowdContext };

