# Study Planner | مخطط المذاكرة

A web app that generates a study schedule from subject difficulty, exam dates, and free hours, and adds the sessions directly to Google Calendar.

**Live UI preview:** https://salhace.github.io/study-planner/
The server is not deployed yet, so Google sign-in and Calendar sync work only when running locally.

## Features
- Automatic study schedule from subjects, exam dates, and available hours
- Priority-based assignment of subjects to sessions
- Google OAuth sign-in and Google Calendar integration
- Scheduling algorithm covered by Jest tests

## How the scheduling works
**Inputs:** subjects (name, exam date, difficulty 1–3), available hours per weekday, start hour, session length, and break length.

For each day from today until the last exam, the available hours are split into sessions (default: 60 minutes with 10-minute breaks, starting at 16:00). For every session, the subject with the highest priority score is chosen among subjects whose exam has not passed:

```
priority = difficulty × (1 + 4 / days_left) / (sessions_so_far + 1)
```

- Harder subjects score higher.
- The closer the exam, the higher the score.
- Subjects that already received many sessions score lower, so time is spread across subjects.
- The score is multiplied by 0.6 if the subject was also the previous session of the same day, to avoid back-to-back repeats.

The result includes the list of sessions and a per-subject summary that flags subjects with fewer than 2 × difficulty sessions.

Implementation: `server/scheduler.js`, tested with Jest.

## Tech stack
- **Client:** React (Vite)
- **Server:** Node.js, Express
- **Auth and integration:** Google OAuth, Google Calendar API
- **Testing:** Jest

## Project structure
```
client/   React (Vite) interface
server/   Express API, Google OAuth, scheduler
```

## Run locally
Requires Node.js (LTS) and npm.

```bash
git clone https://github.com/salhace/study-planner.git
cd study-planner

# Terminal 1: server
cd server
cp .env.example .env
npm install
npm run dev

# Terminal 2: client
cd client
npm install
npm run dev
```

Then open http://localhost:5173

## Tests
```bash
cd server
npm test
```

## Google Calendar setup
1. In Google Cloud Console, create a project and enable the Google Calendar API.
2. Create an OAuth client (Web) with the redirect URI `http://localhost:5173/auth/callback`.
3. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `server/.env`.

Do not commit your `.env` file.

## Roadmap
- [ ] Store schedules in a database
- [ ] Deploy the server on Render
- [ ] Tune the algorithm for peak and rest hours

## Author
Salha Alwahby
