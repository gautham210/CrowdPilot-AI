# 🏎️ CrowdPilot AI

## Problem Statement
Navigating large-scale sports venues (like F1 races, football stadiums, or multi-session festivals) is often a frustrating experience for attendees. Fans face unpredictable wait times for food, washrooms, and merchandise, miss out on critical events due to poor time management, and struggle to avoid heavy crowd congestion during session breaks.

## Solution
CrowdPilot AI is an AI-powered venue event assistant designed to optimize the fan experience. It provides real-time crowd intelligence, session tracking, and smart recommendations through a dynamic dashboard and a contextual AI Chat Assistant. The system anticipates crowd spikes and recommends the fastest routes or best times to visit specific areas, ensuring fans maximize their event enjoyment.

## Features
- **AI Chat Assistant**: Gemini-powered Q&A with live contextual awareness of venue crowds and event schedules.
- **Event Timeline Engine**: Multi-session tracking with a live countdown and automated session transitions.
- **Intelligent Crowd Simulation**: Realistic, zone-based crowd data tracked across different venue areas (food, washrooms, gates, shops).
- **Prediction Engine**: Forecasts crowd spikes 15 minutes ahead based on the event timeline to help fans proactively plan.
- **Decision Engine**: Calculates the best immediate proactive action with logical comparisons and wait time calculations.
- **Best Action Panel**: A dynamic "What to do right now" card that continually updates based on your available time before the next session.
- **Venue Assessment**: Visual layout map highlighting live zone occupancies through dynamic color-coded status indicators and alerts.
- **Smart Rule-Based Fallback**: Built-in fallback logic ensuring the platform reliably serves recommendations even if the AI API is unavailable.

## Architecture
- **Frontend** (`/client`): Built with React 19, Tailwind CSS v4, and Vite. Utilizes the Context API for lightweight global state management and features a premium, responsive UI.
- **Backend** (`/server`): Powered by Node.js and Express. It houses the live event schedules, runs continuous mock crowd simulations, orchestrates recommendations, and proxies context-enriched prompts to the AI system.
- **AI Integration**: Integrates the Google Gemini Generative AI SDK (`@google/generative-ai`), utilizing the high-speed `gemini-2.5-flash` model for robust natural language processing.

## How to Run

### Setup Environment
First, clone the repository. Then, securely set up your API credentials:
```bash
cd server
# If not present, create a .env file and configure your GEMINI_API_KEY
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

### 1. Start the Backend
Open a terminal and start the Express server (runs on Port 3001):
```bash
cd server
npm install
npm start
```

### 2. Start the Frontend
Open a new terminal and start the Vite app (runs on Port 5173):
```bash
cd client
npm install
npm run dev
```

Navigate to **http://localhost:5173** to experience CrowdPilot AI!

---

## 🤖 Google Gemini Integration

CrowdPilot AI leverages Google's Generative AI capabilities via the `@google/generative-ai` SDK.

- **Model Used**: `gemini-1.5-flash`
- **Purpose**:
  - Natural language understanding for user queries.
  - Context-aware responses combining live crowd simulation data and event schedule data.
- **Dynamic Prompt Injection**:
  - **Crowd Queries**: Enriched with live venue metrics for navigational intelligence.
  - **General Queries**: Automatically filtered for factual accuracy without crowd distraction.

### Fail-Safe Architecture
If the Gemini API encounters a network issue or rate limit, the system gracefully switches to its local **Intelligent Fallback Engine**, ensuring a reliable user experience during critical race moments.

---

## 🔐 Security & Environment Handling

- **Environment Variables**: Sensitive API keys are managed exclusively through `.env` files and are never committed to version control.
- **Input Validation**: The backend implements strict type checking and a 500-character limit on all chat inputs.
- **Sanitization**: All user-provided strings are sanitized to strip potentially malicious characters like `<` and `>`, preventing basic script injection.
- **Rate Awareness**: The system is designed to handle API failures gracefully without exposing stack traces to the end user.

---

## 🧪 Testing Strategy

CrowdPilot AI includes a specialized test suite demonstrating core system integrity.

- **Native Node.js Testing**: Uses the built-in `node:test` runner to maintain a lightweight, zero-dependency footprint.
- **Coverage Areas**:
  - API endpoint structure verification.
  - Input validation and length restriction logic.
  - Environment variable presence and configuration.

### How to Run Tests
```bash
cd server
node --test server.test.js
```
