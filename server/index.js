require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { google } = require("googleapis");
const { generateSchedule } = require("./scheduler");

const app = express();
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || "dev-secret", resave: false, saveUninitialized: false }));

const oauthClient = () =>
  new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

app.post("/api/schedule", (req, res) => {
  const { subjects, hoursByDay, startHour, sessionMinutes } = req.body || {};
  if (!Array.isArray(subjects) || !Array.isArray(hoursByDay) || hoursByDay.length !== 7)
    return res.status(400).json({ error: "البيانات ناقصة" });
  res.json(generateSchedule({ subjects, hoursByDay, startHour, sessionMinutes }));
});

app.get("/auth/google", (req, res) => {
  const url = oauthClient().generateAuthUrl({ access_type: "online", scope: ["https://www.googleapis.com/auth/calendar.events"] });
  res.redirect(url);
});

app.get("/auth/callback", async (req, res) => {
  try {
    const { tokens } = await oauthClient().getToken(req.query.code);
    req.session.tokens = tokens;
    res.redirect("/?connected=1");
  } catch (e) {
    res.redirect("/?error=auth");
  }
});

app.get("/api/me", (req, res) => res.json({ connected: !!req.session.tokens }));

app.post("/api/calendar/sync", async (req, res) => {
  if (!req.session.tokens) return res.status(401).json({ error: "سجّلي دخول Google أول" });
  const auth = oauthClient();
  auth.setCredentials(req.session.tokens);
  const calendar = google.calendar({ version: "v3", auth });
  const tz = process.env.TIMEZONE || "Asia/Riyadh";
  const hm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
  try {
    for (const s of req.body.sessions || []) {
      await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: `مذاكرة: ${s.subject}`,
          start: { dateTime: `${s.date}T${hm(s.startMin)}`, timeZone: tz },
          end: { dateTime: `${s.date}T${hm(s.endMin)}`, timeZone: tz },
        },
      });
    }
    res.json({ added: (req.body.sessions || []).length });
  } catch (e) {
    res.status(500).json({ error: "فشل الإضافة للتقويم" });
  }
});

const port = process.env.PORT || 3001;
if (require.main === module) app.listen(port, () => console.log(`API on http://localhost:${port}`));
module.exports = app;
