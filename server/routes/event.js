const express = require("express");
const router = express.Router();
const { getCrowdState, getVenueStats } = require("../engines/crowdSimulator");
const {
  getCurrentSession,
  getElapsedMinutes,
  getActiveSchedule,
  setActiveEventType,
  SCHEDULES,
} = require("../data/eventSchedule");
const { getPredictions, getCrowdOutlook } = require("../engines/predictionEngine");
const { getRecommendation } = require("../engines/decisionEngine");

// GET /api/crowd — All zone crowd data
router.get("/crowd", (req, res) => {
  res.json(getCrowdState());
});

// GET /api/timeline — Current session info + full schedule + event metadata
router.get("/timeline", (req, res) => {
  const elapsed = getElapsedMinutes();
  const sessionInfo = getCurrentSession(elapsed);
  const schedule = getActiveSchedule();

  res.json({
    ...sessionInfo,
    elapsed,
    schedule:          schedule.sessions,
    eventName:         schedule.eventName,
    venue:             schedule.venue,
    track:             schedule.track,
    weather:           schedule.weather,
    attendance:        schedule.attendance,
    circuitArea:       schedule.circuitArea,
    eventType:         schedule.eventType,
    venueStats:        getVenueStats(),
  });
});

// GET /api/predictions — Crowd spike predictions
router.get("/predictions", (req, res) => {
  res.json(getPredictions(20));
});

// GET /api/recommendation — Best action recommendation
router.get("/recommendation", (req, res) => {
  res.json(getRecommendation());
});

// GET /api/outlook — Crowd sentiment overview
router.get("/outlook", (req, res) => {
  res.json(getCrowdOutlook());
});

// POST /api/event-type — Switch event type (f1 / football / cricket)
router.post("/event-type", (req, res) => {
  const { type } = req.body;
  if (!type) return res.status(400).json({ error: "type is required" });

  const success = setActiveEventType(type);
  if (!success) {
    return res.status(400).json({
      error: `Unknown event type: ${type}. Valid: ${Object.keys(SCHEDULES).join(", ")}`,
    });
  }

  const schedule = getActiveSchedule();
  res.json({
    success: true,
    eventType: schedule.eventType,
    eventName: schedule.eventName,
  });
});

// GET /api/event-types — List available event types
router.get("/event-types", (req, res) => {
  res.json(
    Object.entries(SCHEDULES).map(([type, s]) => ({
      type,
      eventName: s.eventName,
      venue: s.venue,
    }))
  );
});

module.exports = router;
