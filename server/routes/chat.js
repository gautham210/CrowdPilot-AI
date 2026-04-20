const express = require("express");
const router = express.Router();
const { buildCrowdContext, buildDetailedCrowdContext } = require("../engines/decisionEngine");

// (Gemini SDK initialized dynamically in route)

// ─── Upgraded System Prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are CrowdPilot AI — a sharp, data-driven crowd intelligence assistant for a live Formula 1 Grand Prix venue.

You receive real-time crowd data, wait times, event timeline context, and upcoming crowd predictions before every message.

RESPONSE RULES (strict):
- Maximum 2–3 sentences. Never more.
- ALWAYS compare options: e.g. "Gate B is 40% less crowded than Gate A, saving ~6 minutes"
- ALWAYS reference time: e.g. "You have 14 minutes — enough for washroom, not enough for food"
- ALWAYS include predictions when relevant: e.g. "Food Court will get busier in ~10 minutes when the break starts"
- Prioritize DECISIONS, not descriptions. Guide, don't just inform.
- Use specific zone names, wait times, and percentages from the context data.
- If two zones are similar, explain the marginal advantage of the better one.
- Use short, direct language. No filler. Every sentence must add useful information.

TONE: Confident, concise, and helpful — like a knowledgeable friend who knows the venue.

EXAMPLES of good responses:
- "Head to Food Court North (8 min wait) — it's 35% less busy than South right now. You have 22 minutes before F1 Qualifying, so you'll make it comfortably."
- "Skip Gate A (15 min wait) and use Gate C — half the crowd and saving ~7 minutes. With the session ending in 9 minutes, move now before it spikes."
- "Washroom B shows a 4-min wait vs Washroom A at 9 minutes. Go to B. Be back in 12 minutes — you have 18 minutes before next session, just enough."`; 

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
    if (!process.env.GEMINI_API_KEY) {
      console.log(">>> NO API KEY");
      throw new Error("Missing API key");
    }

    console.log(">>> PRIMARY BRAIN: Attempting Gemini AI");

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT
    });

    let chatHistory = history.slice(-6).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));
    while (chatHistory.length > 0 && chatHistory[0].role !== "user") {
      chatHistory.shift();
    }

    const chat = model.startChat({ history: chatHistory });
    const userMessageWithContext = `[LIVE CROWD & EVENT CONTEXT]\n${buildCrowdContext()}\n\n[USER QUESTION]\n${message}`;

    const result = await chat.sendMessage(userMessageWithContext);
    const text = result.response.text();

    console.log(">>> GEMINI SUCCESS");
    return res.json({ response: text, source: "gemini" });

  } catch (err) {
    console.error(">>> GEMINI ERROR:", err.message);
    
    // Safety: use rule-based fallback instead of crashing
    console.log(">>> Serving intelligent fallback response due to error");
    const detailedCtx = buildDetailedCrowdContext();
    const fallbackText = getFallbackResponse(message, detailedCtx);
    
    return res.json({ 
      response: fallbackText, 
      source: "fallback",
      error: err.message 
    });
  }
});

module.exports = router;
