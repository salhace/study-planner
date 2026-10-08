const { generateSchedule } = require("./scheduler");

const today = new Date(2026, 9, 10); // 10 أكتوبر 2026
const base = { hoursByDay: [2, 2, 2, 2, 2, 2, 2], today };

test("ما يجدول مادة في يوم امتحانها أو بعده", () => {
  const { sessions } = generateSchedule({ ...base, subjects: [{ name: "A", exam: "2026-10-13", diff: 2 }, { name: "B", exam: "2026-10-16", diff: 2 }] });
  expect(sessions.filter((s) => s.subject === "A").every((s) => s.date < "2026-10-13")).toBe(true);
});

test("المادة الأصعب تاخذ جلسات أكثر لو نفس تاريخ الامتحان", () => {
  const { summary } = generateSchedule({ ...base, subjects: [{ name: "Hard", exam: "2026-10-15", diff: 3 }, { name: "Easy", exam: "2026-10-15", diff: 1 }] });
  const get = (n) => summary.find((s) => s.name === n).sessions;
  expect(get("Hard")).toBeGreaterThan(get("Easy"));
});

test("ما يتجاوز ساعات الفراغ اليومية", () => {
  const { sessions } = generateSchedule({ ...base, sessionMinutes: 60, subjects: [{ name: "A", exam: "2026-10-20", diff: 2 }] });
  const perDay = {};
  sessions.forEach((s) => (perDay[s.date] = (perDay[s.date] || 0) + 1));
  expect(Math.max(...Object.values(perDay))).toBeLessThanOrEqual(2);
});

test("يتجاهل الامتحانات اللي عدّت", () => {
  const { sessions } = generateSchedule({ ...base, subjects: [{ name: "Old", exam: "2026-10-01", diff: 2 }] });
  expect(sessions).toHaveLength(0);
});

test("ينبّه لما الوقت ما يكفي", () => {
  const { summary } = generateSchedule({ hoursByDay: [1, 1, 1, 1, 1, 1, 1], today, subjects: [{ name: "A", exam: "2026-10-12", diff: 3 }] });
  expect(summary[0].short).toBe(true);
});
