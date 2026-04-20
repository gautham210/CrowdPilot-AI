/**
 * Prediction Engine
 *
 * Looks ahead in the event timeline to flag upcoming crowd events.
 * Returns spike predictions that influence recommendations.
 */

const { getCurrentSession, getElapsedMinutes, eventSchedule } = require("../data/eventSchedule");

/**
 * Predict upcoming crowd events for the next `lookaheadMinutes`.
 */
function getPredictions(lookaheadMinutes = 20) {
  const elapsed = getElapsedMinutes();
  const { current, next, sessionIndex } = getCurrentSession(elapsed);
  const predictions = [];

  // Predict end-of-session crowd spikes (gates fill up)
  if (current && current.type !== "break") {
    const timeUntilEnd = current.timeRemaining;
    if (timeUntilEnd <= lookaheadMinutes && timeUntilEnd > 0) {
      predictions.push({
        id: "session-end-gates",
        type: "spike",
        zone: "gates",
        severity: timeUntilEnd <= 5 ? "high" : "medium",
        timeToSpike: Math.max(0, timeUntilEnd - 5),
        reason: `${current.name} ends in ${timeUntilEnd} min — gates will fill rapidly`,
        recommendation: "Head to your gate now to avoid the rush",
      });
    }
  }

  // Predict break food/washroom spike
  if (current && current.type === "break") {
    const elapsed_in_break = current.durationMinutes - current.timeRemaining;
    if (elapsed_in_break < 5) {
      predictions.push({
        id: "break-food-rush",
        type: "spike",
        zone: "food",
        severity: "high",
        timeToSpike: 0,
        reason: "Break just started — food courts filling quickly",
        recommendation: "Act now or wait 10 min for the initial rush to pass",
      });
      predictions.push({
        id: "break-washroom-rush",
        type: "spike",
        zone: "washroom",
        severity: "high",
        timeToSpike: 0,
        reason: "Washrooms filling at break start",
        recommendation: "Washroom B typically less crowded at break start",
      });
    }

    // End of break — return alert
    if (current.timeRemaining <= 10 && current.timeRemaining > 0) {
      predictions.push({
        id: "break-ending-return",
        type: "alert",
        zone: "gates",
        severity: current.timeRemaining <= 5 ? "critical" : "high",
        timeToSpike: 0,
        reason: `Break ends in ${current.timeRemaining} min — return to seat`,
        recommendation:
          current.timeRemaining <= 5
            ? "⚠️ Head to your seat immediately!"
            : "Start making your way back to your seat",
      });
    }
  }

  // Predict next session start rush (gates)
  if (next && next.type !== "break") {
    const timeUntilNextStart = next.startMinute - elapsed;
    if (timeUntilNextStart > 0 && timeUntilNextStart <= lookaheadMinutes) {
      predictions.push({
        id: "next-session-start",
        type: "spike",
        zone: "gates",
        severity: "medium",
        timeToSpike: timeUntilNextStart,
        reason: `${next.name} starts in ${timeUntilNextStart} min`,
        recommendation: `Wrap up any food/washroom visits before ${next.name} begins`,
      });
    }
  }

  return predictions;
}

/**
 * Get overall crowd outlook sentiment.
 */
function getCrowdOutlook() {
  const elapsed = getElapsedMinutes();
  const { current } = getCurrentSession(elapsed);

  if (!current) return { sentiment: "calm", message: "Event not started yet" };

  const predictions = getPredictions(10);
  const hasHighSpike = predictions.some((p) => p.severity === "high" || p.severity === "critical");
  const hasCritical = predictions.some((p) => p.severity === "critical");

  if (hasCritical) return { sentiment: "critical", message: "Urgent action required" };
  if (hasHighSpike) return { sentiment: "busy", message: "Crowds increasing soon" };
  if (current.type === "break") return { sentiment: "moderate", message: "Break in progress" };
  return { sentiment: "calm", message: "Crowds are low — good time to move" };
}

module.exports = { getPredictions, getCrowdOutlook };
