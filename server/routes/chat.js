const express = require("express");
const router = express.Router();
const { buildCrowdContext, buildDetailedCrowdContext } = require("../engines/decisionEngine");

// (Gemini SDK initialized dynamically in route)

// ─── Upgraded System Prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are CrowdPilot AI — a smart assistant for a Formula 1 venue.

You handle TWO types of queries:

1. CROWD / VENUE QUESTIONS → give crowd-optimized recommendations
2. GENERAL QUESTIONS (like race results, drivers, sessions) → answer directly and correctly

IMPORTANT RULE:
- If the user asks about RESULTS, DRIVERS, or EVENTS → DO NOT give crowd advice
- Answer the question directly

CROWD RESPONSE RULES (only when relevant):
- Max 2–3 sentences
- Compare options
- Mention time remaining
- Use real zone data

GENERAL RESPONSE RULES:
- Answer clearly and directly
- No crowd suggestions
- Example:
  "Top 3 in the F1 Sprint were Norris, Verstappen, and Piastri."

TONE:
Short, sharp, helpful.
`;

// ─── Intelligent Fallback ─────────────────────────────────────────────────────
function getFallbackResponse(message, detailedCtx) {
  const lower = message.toLowerCase();
  const { zones, sessionInfo, predictions } = detailedCtx;

  const timeLeft = sessionInfo.current?.timeRemaining ?? null;
  const sessionName = sessionInfo.current?.name ?? "session";
  const nextSessionName = sessionInfo.next?.name ?? "next session";
  const isBreak = sessionInfo.current?.type === "break";

  // Helper: get zones by type sorted by occupancy
  const byType = (type) =>
    zones.filter((z) => z.type === type).sort((a, b) => a.occupancy - b.occupancy);

  // Helper: compute occupancy difference as percentage
  const pctDiff = (a, b) =>
    Math.round(Math.abs(a.occupancy - b.occupancy) * 100);

  // Helper: time suffix
  const timeSuffix = (mins) => {
    if (!mins) return "";
    if (mins <= 5) return `⚠️ Only ${mins}m left — move now.`;
    if (mins <= 12) return `You have ${mins}m — just enough.`;
    return `You have ${mins}m — plenty of time.`;
  };

  // Helper: upcoming spike for a zone type
  const spike = (type) => {
    const p = predictions.find((p) => p.zone === type && p.severity !== "low");
    return p ? ` Note: ${type} areas will get busier in ~${p.timeToSpike || 5} min (${p.reason.split("—")[0].trim()}).` : "";
  };

  // ─── Food
  if (lower.match(/food|eat|hungry|lunch|snack|drink/)) {
    const foodZones = byType("food");
    if (foodZones.length === 0) return "No food courts currently tracked.";
    const best = foodZones[0];
    const alt = foodZones[1];
    const diff = alt ? pctDiff(best, alt) : 0;

    if (!isBreak && timeLeft && timeLeft < 12) {
      return `Skip food for now — only ${timeLeft}m before ${nextSessionName} starts. ${best.name} will be less crowded right after the session instead.`;
    }
    return `Head to ${best.name} (wait ~${best.waitTime}min)${alt ? ` — ${diff}% less crowded than ${alt.name} (${alt.waitTime}min)` : ""}. ${timeSuffix(timeLeft)}${spike("food")}`;
  }

  // ─── Washroom
  if (lower.match(/washroom|toilet|bathroom|restroom|loo|wc/)) {
    const wcs = byType("washroom");
    if (wcs.length === 0) return "No washroom data available.";
    const best = wcs[0];
    const alt = wcs[1];
    const diff = alt ? pctDiff(best, alt) : 0;
    const timingNote = timeLeft
      ? timeLeft < 8
        ? `⚠️ Be quick — ${sessionName} ends in ${timeLeft}m.`
        : `${timeSuffix(timeLeft)}`
      : "";
    return `Use ${best.name} (wait ~${best.waitTime}min)${alt ? ` — ${diff}% shorter queue than ${alt.name} (${alt.waitTime}min wait)` : ""}. ${timingNote}${spike("washroom")}`;
  }

  // ─── Gate / exit
  if (lower.match(/gate|exit|entrance|leave|crowd/)) {
    const gates = byType("gate");
    if (gates.length === 0) return "Gate data unavailable.";
    const best = gates[0];
    const alt = gates[1];
    const diff = alt ? pctDiff(best, alt) : 0;
    const timingNote = timeLeft && timeLeft < 10
      ? `Session ends in ${timeLeft}m — all gates will spike soon, use ${best.name} now.`
      : `${timeSuffix(timeLeft)}`;
    return `${best.name} is the least congested (wait ~${best.waitTime}min)${alt ? `, saving ~${Math.round(alt.waitTime - best.waitTime + 1)}min vs ${alt.name}` : ""}. ${timingNote}`;
  }

  // ─── Shop / merchandise
  if (lower.match(/shop|merch|merchandise|souvenir|store|paddock/)) {
    const shops = byType("shop");
    if (shops.length === 0) return "Shop data unavailable.";
    const best = shops[0];
    const alt = shops[1];
    const bestTime = isBreak && timeLeft && timeLeft > 15;
    return `${best.name} (wait ~${best.waitTime}min) is the better option right now${alt ? ` — ${pctDiff(best, alt)}% less crowded than ${alt.name}` : ""}. ${bestTime ? "Great time to visit mid-break." : timeSuffix(timeLeft)}`;
  }

  // ─── Time / session
  if (lower.match(/time|when|session|next|how long|how much|schedule|break/)) {
    const cur = sessionInfo.current;
    const next = sessionInfo.next;
    if (!cur) return `No active session right now. ${next ? `${next.name} starts soon.` : ""}`;
    const enough15 = timeLeft && timeLeft >= 15;
    return `${cur.name} has ${timeLeft}m remaining${next ? ` — then ${next.name}` : ""}. ${enough15 ? "Enough time to grab food or visit washrooms." : "Time is limited — prioritize washrooms over food."}${spike("food")}`;
  }

  // ─── Generic
  const allZones = zones.slice().sort((a, b) => a.occupancy - b.occupancy);
  const bestOverall = allZones[0];
  return `Least crowded right now: ${bestOverall.name} (${bestOverall.level}, ~${bestOverall.waitTime}min wait). ${timeSuffix(timeLeft)}${spike("food")}`;
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body;
  console.log(">>> CHAT ROUTE HIT");

  try {
    console.log(">>> API KEY EXISTS:", !!process.env.GEMINI_API_KEY);
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing API key");
    }

    console.log(">>> PRIMARY BRAIN: Attempting Gemini AI");

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT
    });

    const context = buildCrowdContext();
    const prompt = `[LIVE CROWD & EVENT CONTEXT]\n${context}\n\n[USER QUESTION]\n${message}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log(">>> GEMINI SUCCESS");
    return res.json({ response: text });

  } catch (err) {
    console.error(">>> GEMINI ERROR:", err.message);
    
    console.log(">>> FALLBACK USED");
    const detailedCtx = buildDetailedCrowdContext();
    const fallbackText = getFallbackResponse(message, detailedCtx);
    
    return res.json({ response: fallbackText });
  }
});

module.exports = router;
