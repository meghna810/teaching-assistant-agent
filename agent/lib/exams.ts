export type RubricItem = { id: string; description: string; points: number };
export type Question = { id: string; prompt: string; points: number; items: RubricItem[] };
export type Rubric = { exam: string; questions: Question[] };
export type Answer = { student: string; question: string; answer: string };
export type Grading = { student: string; question: string; items: string[]; needsReview?: boolean; note?: string };

export type ExamRow = {
  student: string;
  total: number;
  max: number;
  byQuestion: Record<string, number>;
  review: { question: string; note: string }[];
};

export function parseRubric(json: string): Rubric {
  const r = JSON.parse(json) as Rubric;
  if (!r.exam || !Array.isArray(r.questions) || !r.questions.length) throw new Error("Rubric needs an exam name and questions");
  for (const q of r.questions) {
    if (!q.id || !(q.points > 0) || !q.items?.length) throw new Error(`Rubric question ${q.id ?? "?"} needs points and items`);
  }
  return r;
}

/**
 * The model picks which rubric items an answer earns; this adds up the points. A question's score
 * is clamped to [0, its points], so a grading can never award more than the rubric allows.
 */
export function tallyExam(rubric: Rubric, answers: Answer[], gradings: Grading[]): ExamRow[] {
  const questions = new Map(rubric.questions.map((q) => [q.id, q]));
  const key = (g: { student: string; question: string }) => `${g.student.trim().toLowerCase()}|${g.question}`;
  const graded = new Map<string, Grading>();
  for (const g of gradings) {
    const q = questions.get(g.question);
    if (!q) throw new Error(`Unknown question "${g.question}"`);
    const bad = g.items.filter((id) => !q.items.some((i) => i.id === id));
    if (bad.length) throw new Error(`Rubric items ${bad.join(", ")} are not in question ${q.id}`);
    if (graded.has(key(g))) throw new Error(`${g.student} / ${g.question} was graded twice`);
    graded.set(key(g), g);
  }
  const answered = new Set(answers.map(key));
  const extra = [...graded.keys()].filter((k) => !answered.has(k));
  if (extra.length) throw new Error(`Gradings with no matching answer: ${extra.join(", ")}`);
  const missing = answers.filter((a) => !graded.has(key(a))).map((a) => `${a.student} / ${a.question}`);
  if (missing.length) throw new Error(`Ungraded answers: ${missing.join(", ")}`);

  const students = [...new Set(answers.map((a) => a.student))];
  const max = rubric.questions.reduce((s, q) => s + q.points, 0);
  return students.map((student) => {
    const byQuestion: Record<string, number> = {};
    const review: ExamRow["review"] = [];
    for (const q of rubric.questions) {
      const g = graded.get(key({ student, question: q.id }));
      if (!g) { byQuestion[q.id] = 0; continue; }
      const raw = [...new Set(g.items)].reduce((s, id) => s + q.items.find((i) => i.id === id)!.points, 0);
      byQuestion[q.id] = Math.min(q.points, Math.max(0, raw));
      if (g.needsReview) review.push({ question: q.id, note: g.note?.trim() || "Flagged for review" });
    }
    const total = Object.values(byQuestion).reduce((a, b) => a + b, 0);
    return { student, total, max, byQuestion, review };
  });
}
