require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:4173"],
  methods: ["GET", "POST"],
  credentials: true,
}));
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
  } else {
    console.log("✅ Gemini AI enabled");
  }
});

// trigger restart
