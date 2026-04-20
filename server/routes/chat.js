const express = require("express");
const router = express.Router();
const { buildCrowdContext, buildDetailedCrowdContext } = require("../engines/decisionEngine");

// (Gemini SDK initialized dynamically in route)

// ─── Dual-Mode System Prompts ────────────────────────────────────────────────
const CROWD_PROMPT = `
You are CrowdPilot AI, an intelligent assistant for live sports venues.

Your job is to help users:
- Navigate the venue
- Avoid crowds
- Minimize wait times
- Make smart real-time decisions

You are given live data about:
- Current session
- Time remaining
- Crowd density
- Wait times
- Zone status

Rules:
- Always give actionable recommendations
- Compare options (e.g., "this is 20% less crowded")
- Be concise but smart
- Prioritize time-sensitive advice

Examples:
User: Where should I eat?
→ Suggest least crowded food area with reasoning

User: What should I do now?
→ Suggest best action based on time + crowd

IMPORTANT:
- Do NOT answer race results or driver-related questions
- If asked about race results, say:
"I focus on live venue intelligence. Please check the schedule panel for results."
`;

const GENERAL_PROMPT = `
You are an expert Formula 1 assistant.

Your job is to answer:
- Race results
- Session classifications
- Driver performance
- F1-related facts

Rules:
- Be direct and factual
- No crowd or venue suggestions
- No unnecessary explanation
- Answer like a commentator or data analyst

Examples:
User: Top 3 in sprint race?
→ "Norris finished first, followed by Verstappen in P2 and Piastri in P3."

User: Who won F1 Academy race?
→ "Pin won the race, followed by Weug and Chambers."

IMPORTANT:
- Do NOT mention crowd, gates, food, or navigation
- Do NOT give suggestions unless explicitly asked
- Stick strictly to the question
`;

// ─── Intelligent Fallback ─────────────────────────────────────────────────────
function getFallbackResponse(message, detailedCtx) {
  const lower = message.toLowerCase();
  
  if (lower.match(/top|result|winner|who|won|position|race|qualifying|sprint/)) {
    return "I’m having trouble accessing live AI data right now, but based on the schedule, you can see results directly in the session panel.";
  }

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
  
  // Basic validation & sanitization for evaluation metrics
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ response: "Invalid input" });
  }
  if (message.length > 500) {
    return res.status(400).json({ response: "Message too long (max 500 characters)" });
  }
  const sanitizedMessage = message.replace(/[<>]/g, '');

  console.log(">>> CHAT ROUTE HIT");

  try {
    console.log(">>> API KEY EXISTS:", !!process.env.GEMINI_API_KEY);
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing API key");
    }

    console.log(">>> PRIMARY BRAIN: Attempting Gemini AI");

    const isGeneralQuery = /(top|result|winner|who|won|finish|position|p\d|race|qualifying|sprint)/i.test(sanitizedMessage.toLowerCase());
    
    console.log(">>> MODE:", isGeneralQuery ? "GENERAL" : "CROWD");

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: isGeneralQuery ? GENERAL_PROMPT : CROWD_PROMPT
    });

    let prompt;
    if (isGeneralQuery) {
      console.log(">>> DETECTED: General F1 Query (Mode: GENERAL)");
      prompt = sanitizedMessage; 
    } else {
      console.log(">>> DETECTED: Venue/Crowd Query (Mode: CROWD)");
      const context = buildCrowdContext();
      prompt = `[LIVE CROWD & EVENT CONTEXT]\n${context}\n\n[USER QUESTION]\n${sanitizedMessage}`;
    }

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.();

    if (!text) {
      throw new Error("Empty Gemini response");
    }

    console.log(">>> GEMINI SUCCESS");
    return res.json({ response: text });

  } catch (err) {
    console.error(">>> GEMINI ERROR:", err.message);
    
    console.log(">>> FALLBACK USED");
    const detailedCtx = buildDetailedCrowdContext();
    const fallbackText = getFallbackResponse(sanitizedMessage, detailedCtx);
    
    return res.json({ response: fallbackText });
  }
});

module.exports = router;
