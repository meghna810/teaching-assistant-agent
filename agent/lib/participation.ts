export type Contribution = { id: string; student: string; date: string; source: string; text: string };
export type Rating = { id: string; quality: number; reason: string };
export type ParticipationRow = {
  student: string;
  contributions: number;
  /** Quality ratings counted toward the score, best first. */
  counted: number[];
  points: number;
  maxPoints: number;
  note?: string;
};

export const QUALITY_MAX = 3;

/**
 * Quality, not quantity: a student's score is the average of their best `best` ratings, and
 * slots below `best` count as 0. Extra low-quality posts never raise a score, and a single
 * good post is not enough on its own. The model rates each contribution; this does the maths.
 */
export function scoreParticipation(
  roster: string[],
  contributions: Contribution[],
  ratings: Rating[],
  { best = 3, maxPoints = 10 } = {},
): { rows: ParticipationRow[]; unrated: string[] } {
  const byId = new Map(contributions.map((c) => [c.id, c]));
  const seen = new Set<string>();
  for (const r of ratings) {
    if (!byId.has(r.id)) throw new Error(`Rating for unknown contribution "${r.id}"`);
    if (seen.has(r.id)) throw new Error(`Contribution "${r.id}" was rated twice`);
    if (!Number.isInteger(r.quality) || r.quality < 0 || r.quality > QUALITY_MAX) {
      throw new Error(`Quality for "${r.id}" must be a whole number from 0 to ${QUALITY_MAX}`);
    }
    if (!r.reason.trim()) throw new Error(`Rating for "${r.id}" needs a reason from the rubric`);
    seen.add(r.id);
  }
  const unrated = contributions.filter((c) => !seen.has(c.id)).map((c) => c.id);
  if (unrated.length) return { rows: [], unrated };

  const key = (s: string) => s.trim().toLowerCase();
  const known = new Set(roster.map(key));
  const strangers = contributions.filter((c) => !known.has(key(c.student))).map((c) => c.student);
  if (strangers.length) throw new Error(`Contributions from students not on the roster: ${[...new Set(strangers)].join(", ")}`);

  const rows = roster.map((student) => {
    const mine = contributions.filter((c) => key(c.student) === key(student));
    const qualities = ratings
      .filter((r) => mine.some((c) => c.id === r.id))
      .map((r) => r.quality)
      .sort((a, b) => b - a);
    const counted = qualities.slice(0, best);
    const sum = counted.reduce((a, b) => a + b, 0);
    const points = Math.round((sum / (best * QUALITY_MAX)) * maxPoints * 10) / 10;
    const note = mine.length === 0
      ? "No recorded contributions. Check for participation outside the log before grading."
      : mine.length < best
        ? `Only ${mine.length} contribution${mine.length === 1 ? "" : "s"}; missing slots count as 0.`
        : undefined;
    return { student, contributions: mine.length, counted, points, maxPoints, ...(note ? { note } : {}) };
  });
  return { rows, unrated: [] };
}
