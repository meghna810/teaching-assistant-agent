export type Seen = { name: string; candidates: string[] };
export type AttendanceReport = {
  present: string[];
  notSeen: string[];
  /** Names that could be a student but are not certain. A person decides these. */
  unclear: Seen[];
  /** Names that match nobody on the roster: guests, staff, unreadable tags. */
  unmatched: string[];
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z\s'-]/g, " ")
    .replace(/\s+/g, " ").trim();

function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Deterministic on purpose: exact full names count as present and everything else goes to a
 * person. A wrong absence affects a student's grade, so this never guesses.
 */
export function matchAttendance(roster: string[], seen: string[]): AttendanceReport {
  const byName = new Map(roster.map((r) => [norm(r), r]));
  const present = new Set<string>();
  const leftovers: string[] = [];
  for (const raw of seen) {
    const hit = byName.get(norm(raw));
    if (hit) present.add(hit);
    else if (norm(raw)) leftovers.push(raw);
  }

  const remaining = roster.filter((r) => !present.has(r));
  const unclear: Seen[] = [];
  const unmatched: string[] = [];
  for (const raw of new Set(leftovers)) {
    const n = norm(raw);
    const candidates = remaining.filter((r) => {
      const full = norm(r);
      const parts = full.split(" ");
      return parts.includes(n) || editDistance(full, n) <= 2;
    });
    if (candidates.length) unclear.push({ name: raw, candidates });
    else unmatched.push(raw);
  }

  const maybe = new Set(unclear.flatMap((u) => u.candidates));
  return {
    present: [...present].sort(),
    notSeen: remaining.filter((r) => !maybe.has(r)).sort(),
    unclear,
    unmatched,
  };
}
