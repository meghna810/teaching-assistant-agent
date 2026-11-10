import { readFileSync } from "node:fs";
import path from "node:path";

// eve bundles eval files into a cache folder, so resolve from the project root, not import.meta.url.
const fromRoot = (...p: string[]) => readFileSync(path.resolve(process.cwd(), ...p), "utf8");

/** The shape the scoring tools return, for reading their output in assertions. */
export type ParticipationOutput = { rows: { student: string; points: number; contributions: number }[] };
export type ExamOutput = { rows: { student: string; total: number; byQuestion: Record<string, number> }[] };

export const pointsOf = (output: unknown, student: string) =>
  (output as ParticipationOutput).rows?.find((r) => r.student === student)?.points ?? NaN;

export const examRow = (output: unknown, student: string) =>
  (output as ExamOutput).rows?.find((r) => r.student === student);

/** URLs the course schedule really contains, so posts can be checked for invented links. */
export const scheduleUrls = new Set(
  fromRoot("sample_data", "course_schedule.csv").match(/https?:\/\/[^\s,"]+/g) ?? [],
);

export const urlsIn = (text: string) => text.match(/https?:\/\/[^\s)\]>"]+/g) ?? [];

/** The prompt a schedule fires with: the markdown body after the frontmatter. */
export const schedulePrompt = (name: string) =>
  fromRoot("agent", "schedules", `${name}.md`).replace(/^---[\s\S]*?---\s*/, "");
