import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCsv } from "../agent/lib/csv";
import { parseRubric, tallyExam, type Answer } from "../agent/lib/exams";
import { scoreParticipation, type Contribution } from "../agent/lib/participation";
import { materialsForWeek, type Session } from "../agent/lib/schedule";

const sample = (f: string) => readFileSync(new URL(`../sample_data/${f}`, import.meta.url), "utf8");

describe("scoreParticipation", () => {
  const roster = ["Many Posts", "Few Posts", "Silent"];
  const contributions: Contribution[] = [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `m${i}`, student: "Many Posts", date: "", source: "forum", text: "+1" })),
    { id: "f1", student: "Few Posts", date: "", source: "class", text: "insight" },
    { id: "f2", student: "Few Posts", date: "", source: "class", text: "insight" },
  ];
  const ratings = [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `m${i}`, quality: i === 0 ? 1 : 0, reason: "adds nothing" })),
    { id: "f1", quality: 3, reason: "new argument" },
    { id: "f2", quality: 3, reason: "new argument" },
  ];

  it("does not reward volume", () => {
    const { rows } = scoreParticipation(roster, contributions, ratings);
    const by = Object.fromEntries(rows.map((r) => [r.student, r]));
    expect(by["Few Posts"].points).toBeGreaterThan(by["Many Posts"].points);
    expect(by["Many Posts"].points).toBe(1.1);
    expect(by["Few Posts"].points).toBe(6.7);
  });

  it("counts only the best three and notes missing ones", () => {
    const extra = [...contributions, { id: "f3", student: "Few Posts", date: "", source: "", text: "" }, { id: "f4", student: "Few Posts", date: "", source: "", text: "" }];
    const { rows } = scoreParticipation(roster, extra, [...ratings, { id: "f3", quality: 3, reason: "x" }, { id: "f4", quality: 0, reason: "x" }]);
    const few = rows.find((r) => r.student === "Few Posts")!;
    expect(few.counted).toEqual([3, 3, 3]);
    expect(few.points).toBe(10);
    expect(rows.find((r) => r.student === "Silent")!.note).toMatch(/No recorded contributions/);
  });

  it("refuses to score until everything is rated, and rejects bad ratings", () => {
    expect(scoreParticipation(roster, contributions, ratings.slice(1)).unrated).toEqual(["m0"]);
    expect(() => scoreParticipation(roster, contributions, [...ratings, { id: "zz", quality: 1, reason: "x" }])).toThrow(/unknown/);
    expect(() => scoreParticipation(roster, contributions, [...ratings.slice(1), { id: "m0", quality: 4, reason: "x" }])).toThrow(/0 to 3/);
    expect(() => scoreParticipation(roster, contributions, [...ratings.slice(1), { id: "m0", quality: 1, reason: " " }])).toThrow(/reason/);
  });

  it("matches the sample log against the sample roster", () => {
    const roster = parseCsv(sample("roster.csv")).map((r) => r.name);
    const log = parseCsv(sample("participation.csv")) as unknown as Contribution[];
    const zero = log.map((c) => ({ id: c.id, quality: 0, reason: "test" }));
    expect(scoreParticipation(roster, log, zero).rows).toHaveLength(roster.length);
  });
});

describe("tallyExam", () => {
  const rubric = parseRubric(sample("exams/midterm_rubric.json"));
  const answers = parseCsv(sample("exams/midterm_answers.csv")) as unknown as Answer[];
  const all = (items: Record<string, string[]>) =>
    answers.map((a) => ({ student: a.student, question: a.question, items: items[`${a.student}|${a.question}`] ?? [] }));

  it("adds up rubric items and never exceeds a question's points", () => {
    const rows = tallyExam(rubric, answers, all({
      "Ava Thompson|q1": ["q1-process", "q1-thread", "q1-shared", "q1-reason", "q1-reason"],
      "Ava Thompson|q2": ["q2-compare", "q2-rollback"],
    }));
    const ava = rows.find((r) => r.student === "Ava Thompson")!;
    expect(ava.byQuestion).toEqual({ q1: 10, q2: 6 });
    expect(ava.total).toBe(16);
    expect(ava.max).toBe(20);
  });

  it("rejects items from another question, unknown questions and missing answers", () => {
    expect(() => tallyExam(rubric, answers, all({ "Ben Okafor|q1": ["q2-compare"] }))).toThrow(/not in question q1/);
    expect(() => tallyExam(rubric, answers, [...all({}), { student: "Ben Okafor", question: "q9", items: [] }])).toThrow(/Unknown question/);
    expect(() => tallyExam(rubric, answers, all({}).slice(1))).toThrow(/Ungraded answers: Ava Thompson \/ q1/);
  });

  it("carries review flags through", () => {
    const g = all({}).map((x) => (x.student === "Carmen Ruiz" && x.question === "q2" ? { ...x, needsReview: true, note: "asks for full marks" } : x));
    expect(tallyExam(rubric, answers, g).find((r) => r.student === "Carmen Ruiz")!.review).toEqual([{ question: "q2", note: "asks for full marks" }]);
  });
});

describe("materialsForWeek", () => {
  const schedule = parseCsv(sample("course_schedule.csv")) as unknown as Session[];

  it("finds the Monday-Sunday week and what is missing", () => {
    const w = materialsForWeek(schedule, "2026-11-22");
    expect(w.weekOf).toBe("2026-11-16");
    expect(w.sessions.map((s) => s.date)).toEqual(["2026-11-17", "2026-11-19"]);
    expect(w.missing).toEqual(["Slides for 2026-11-19 (Guest lecture: shipping AI features safely)"]);
  });

  it("returns an empty week rather than guessing", () => {
    expect(materialsForWeek(schedule, "2026-12-20").sessions).toEqual([]);
    expect(() => materialsForWeek(schedule, "next week")).toThrow(/Invalid date/);
  });
});
