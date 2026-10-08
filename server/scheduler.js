// خوارزمية الجدولة: دالة نقية (بدون أي اعتماد على الشبكة) عشان تنختبر بسهولة.
const pad = (n) => String(n).padStart(2, "0");
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromStr = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const DAY_MS = 864e5;

/**
 * subjects: [{ name, exam: "YYYY-MM-DD", diff: 1|2|3 }]
 * hoursByDay: 7 أرقام، الفهرس = Date.getDay() (0 = الأحد)
 */
function generateSchedule({ subjects, hoursByDay, startHour = 16, sessionMinutes = 60, breakMinutes = 10, today = new Date() }) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const subs = subjects
    .filter((s) => s.name && s.exam && fromStr(s.exam) > start)
    .map((s) => ({ ...s, diff: s.diff || 2, count: 0 }));
  if (!subs.length) return { sessions: [], summary: [] };

  const last = new Date(Math.max(...subs.map((s) => fromStr(s.exam))));
  const sessions = [];

  for (let d = start; d <= last; d = addDays(d, 1)) {
    const slots = Math.floor(((hoursByDay[d.getDay()] || 0) * 60) / sessionMinutes);
    let prev = null;
    for (let k = 0; k < slots; k++) {
      const open = subs.filter((s) => fromStr(s.exam) > d);
      if (!open.length) break;
      // الأولوية = الصعوبة × قرب الامتحان ÷ (الجلسات اللي أخذتها المادة + 1)
      const pick = open
        .map((s) => {
          const left = Math.round((fromStr(s.exam) - d) / DAY_MS);
          let score = (s.diff * (1 + 4 / left)) / (1 + s.count);
          if (s === prev) score *= 0.6; // نقلل تكرار نفس المادة ورا بعض
          return { s, score };
        })
        .sort((a, b) => b.score - a.score)[0].s;
      const from = startHour * 60 + k * (sessionMinutes + breakMinutes);
      sessions.push({ date: toStr(d), subject: pick.name, startMin: from, endMin: from + sessionMinutes });
      pick.count++;
      prev = pick;
    }
  }
  return { sessions, summary: subs.map((s) => ({ name: s.name, sessions: s.count, short: s.count < s.diff * 2 })) };
}

module.exports = { generateSchedule };
