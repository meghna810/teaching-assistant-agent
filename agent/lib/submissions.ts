export type SubmissionRow = { group: string; status: "on_time" | "late" | "missing"; submittedAt?: string; company?: string; minutesLate?: number };

/** One row per required group, using each group's latest submission. */
export function reviewSubmissions(
  groups: string[],
  submissions: { group: string; submitted_at: string; company?: string }[],
  dueAt: string,
): SubmissionRow[] {
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) throw new Error(`Invalid due date: ${dueAt}`);
  const key = (s: string) => s.trim().toLowerCase();
  const known = new Set(groups.map(key));
  const unknown = submissions.filter((s) => !known.has(key(s.group))).map((s) => s.group);
  if (unknown.length) throw new Error(`Submissions from unknown groups: ${[...new Set(unknown)].join(", ")}`);

  return groups.map((group) => {
    const mine = submissions
      .filter((s) => key(s.group) === key(group))
      .sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at));
    const latest = mine[0];
    if (!latest) return { group, status: "missing" as const };
    const at = Date.parse(latest.submitted_at);
    if (Number.isNaN(at)) throw new Error(`Invalid submission time for ${group}: ${latest.submitted_at}`);
    const minutesLate = Math.ceil((at - due) / 60_000);
    return {
      group,
      status: minutesLate > 0 ? ("late" as const) : ("on_time" as const),
      submittedAt: latest.submitted_at,
      company: latest.company || undefined,
      ...(minutesLate > 0 ? { minutesLate } : {}),
    };
  });
}
