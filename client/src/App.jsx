import { useEffect, useState } from "react";

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]; // الفهرس = getDay()
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const hm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const saved = () => { try { return JSON.parse(localStorage.getItem("plan")); } catch { return null; } };

export default function App() {
  const init = saved();
  const [subjects, setSubjects] = useState(init?.subjects || [
    { name: "هياكل البيانات", exam: iso(9), diff: 3 },
    { name: "قواعد البيانات", exam: iso(13), diff: 2 },
  ]);
  const [hours, setHours] = useState(init?.hours || [3, 3, 3, 3, 3, 1, 3]);
  const [startHour, setStartHour] = useState(init?.startHour || 16);
  const [sessionMinutes, setSessionMinutes] = useState(init?.sessionMinutes || 60);
  const [result, setResult] = useState(null);
  const [connected, setConnected] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { fetch("/api/me").then((r) => r.json()).then((d) => setConnected(d.connected)).catch(() => {}); }, []);
  useEffect(() => { localStorage.setItem("plan", JSON.stringify({ subjects, hours, startHour, sessionMinutes })); }, [subjects, hours, startHour, sessionMinutes]);

  const update = (i, k, v) => setSubjects(subjects.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  async function generate() {
    setMsg("");
    const r = await fetch("/api/schedule", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjects, hoursByDay: hours, startHour: +startHour, sessionMinutes: +sessionMinutes }),
    });
    setResult(await r.json());
  }

  async function sync() {
    const r = await fetch("/api/calendar/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessions: result.sessions }) });
    const d = await r.json();
    setMsg(r.ok ? `تمت إضافة ${d.added} جلسة لتقويمك ✓` : d.error);
  }

  return (
    <main>
      <h1>مخطط المذاكرة</h1>
      <section>
        <h2>المواد</h2>
        {subjects.map((s, i) => (
          <div className="row" key={i}>
            <input type="text" value={s.name} placeholder="اسم المادة" onChange={(e) => update(i, "name", e.target.value)} />
            <input type="date" value={s.exam} onChange={(e) => update(i, "exam", e.target.value)} />
            <select value={s.diff} onChange={(e) => update(i, "diff", +e.target.value)}>
              <option value={1}>سهلة</option><option value={2}>متوسطة</option><option value={3}>صعبة</option>
            </select>
            <button onClick={() => setSubjects(subjects.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button onClick={() => setSubjects([...subjects, { name: "", exam: iso(14), diff: 2 }])}>+ إضافة مادة</button>
      </section>

      <section>
        <h2>ساعات الفراغ</h2>
        <div className="days">
          {DAYS.map((d, i) => (
            <label key={d}>{d}
              <input type="number" min="0" max="12" step="0.5" value={hours[i]} onChange={(e) => setHours(hours.map((h, j) => (j === i ? +e.target.value : h)))} />
            </label>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <label>بداية المذاكرة <input type="number" min="0" max="23" value={startHour} onChange={(e) => setStartHour(e.target.value)} /></label>
          <label>مدة الجلسة <select value={sessionMinutes} onChange={(e) => setSessionMinutes(e.target.value)}>{[30, 45, 60, 90].map((m) => <option key={m}>{m}</option>)}</select></label>
        </div>
      </section>

      <button className="pri" onClick={generate}>ولّدي الجدول</button>

      {result && (
        <section style={{ marginTop: 16 }}>
          {result.summary.filter((s) => s.short).map((s) => <div className="warn" key={s.name}>وقتك ضيق لمادة {s.name}</div>)}
          <p>{result.summary.map((s) => `${s.name}: ${s.sessions} جلسة`).join(" • ")}</p>
          {connected
            ? <button className="pri" onClick={sync}>أضيفيها لـ Google Calendar</button>
            : <a href="/auth/google"><button>سجّلي دخول Google للمزامنة</button></a>}
          {msg && <p>{msg}</p>}
          {result.sessions.map((s, i) => (
            <div className="slot" key={i}>{s.date} — {hm(s.startMin)}–{hm(s.endMin)} — {s.subject}</div>
          ))}
        </section>
      )}
    </main>
  );
}
