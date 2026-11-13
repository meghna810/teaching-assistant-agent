import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type GradeRow = { student: string; points: number; maxPoints: number; comment: string };
export type StoredResult = { kind: "participation" | "exam"; label: string; rows: GradeRow[] };

const dir = () => path.resolve(process.env.TA_OUTBOX_DIR ?? "outbox", ".results");

/**
 * Scoring tools store their numbers here and hand the model an id. Saving grades reads the
 * numbers back from the id, so the model never retypes a grade and cannot miscopy one.
 */
export function storeResult(result: StoredResult): string {
  const id = `${result.kind}-${randomUUID().slice(0, 8)}`;
  mkdirSync(dir(), { recursive: true });
  writeFileSync(path.join(dir(), `${id}.json`), JSON.stringify(result, null, 2));
  return id;
}

export function loadResult(id: string): StoredResult {
  if (!/^(participation|exam)-[0-9a-f]{8}$/.test(id)) throw new Error(`Unknown result id "${id}"`);
  try {
    return JSON.parse(readFileSync(path.join(dir(), `${id}.json`), "utf8")) as StoredResult;
  } catch {
    throw new Error(`No stored result "${id}". Run the scoring tool again.`);
  }
}
