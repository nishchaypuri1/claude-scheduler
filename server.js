require("dotenv").config();
const express = require("express");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DB_FILE = path.join(__dirname, "schedules.json");
const API_KEY = process.env.GROQ_API_KEY;
const MODEL = "openai/gpt-oss-120b"; // Groq model name

// ---------- simple JSON "database" ----------
function loadSchedules() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveSchedules(schedules) {
  fs.writeFileSync(DB_FILE, JSON.stringify(schedules, null, 2));
}

// ---------- call Groq API ----------
async function callClaude(prompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "(no text response)";
}

// ---------- API routes ----------

// Create a new scheduled message
app.post("/api/schedule", (req, res) => {
  const { time, prompt } = req.body; // time = ISO string e.g. "2026-08-25T09:30:00"

  if (!time || !prompt) {
    return res.status(400).json({ error: "time and prompt are required" });
  }

  const scheduledDate = new Date(time);
  if (isNaN(scheduledDate.getTime())) {
    return res.status(400).json({ error: "invalid time format" });
  }

  const schedules = loadSchedules();
  const newSchedule = {
    id: Date.now().toString(),
    time: scheduledDate.toISOString(),
    prompt,
    status: "pending", // pending -> sent / failed
    response: null,
    createdAt: new Date().toISOString(),
  };

  schedules.push(newSchedule);
  saveSchedules(schedules);

  res.json({ message: "Scheduled successfully", schedule: newSchedule });
});

// List all schedules
app.get("/api/schedules", (req, res) => {
  res.json(loadSchedules());
});

// Delete a schedule (before it fires)
app.delete("/api/schedule/:id", (req, res) => {
  let schedules = loadSchedules();
  schedules = schedules.filter((s) => s.id !== req.params.id);
  saveSchedules(schedules);
  res.json({ message: "Deleted" });
});

// ---------- the actual "auto-send" engine ----------
// Runs every minute, checks if any pending schedule's time has arrived.
cron.schedule("* * * * *", async () => {
  const schedules = loadSchedules();
  const now = new Date();
  let changed = false;

  for (const s of schedules) {
    if (s.status === "pending" && new Date(s.time) <= now) {
      console.log(`[${new Date().toISOString()}] Sending scheduled message: ${s.id}`);
      try {
        const reply = await callClaude(s.prompt);
        s.status = "sent";
        s.response = reply;
        s.sentAt = new Date().toISOString();
        console.log(`✔ Sent. Claude replied: ${reply.slice(0, 100)}...`);
      } catch (err) {
        s.status = "failed";
        s.response = err.message;
        console.error(`✘ Failed to send schedule ${s.id}:`, err.message);
      }
      changed = true;
    }
  }

  if (changed) saveSchedules(schedules);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Cron engine active — checking schedules every minute.");
});
