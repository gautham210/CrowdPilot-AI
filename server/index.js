require("dotenv").config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Prevent caching of API responses
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

// Routes
const eventRoutes = require("./routes/event");
const chatRoutes = require("./routes/chat");

app.use("/api", eventRoutes);
app.use("/api", chatRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🏎️  CrowdPilot AI server running on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  GEMINI_API_KEY not set — using fallback AI responses");
    console.warn("    Create server/.env with GEMINI_API_KEY=your-key to enable Gemini AI");
  }
  console.log("API KEY EXISTS:", !!process.env.GEMINI_API_KEY);
});

// trigger restart
