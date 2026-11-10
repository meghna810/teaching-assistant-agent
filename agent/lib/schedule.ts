export type Session = { week: string; date: string; topic: string; slides: string; readings: string; due: string };
export type WeekMaterials = {
  weekOf: string;
  sessions: Session[];
  /** Things the post should mention but that are not ready. A person chases these. */
  missing: string[];
};

const DAY = 86_400_000;
const isoDate = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Monday-to-Sunday week containing `date` (YYYY-MM-DD), compared as calendar dates. */
export function materialsForWeek(schedule: Session[], date: string): WeekMaterials {
  const day = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(day)) throw new Error(`Invalid date: ${date}`);
  const monday = day - ((new Date(day).getUTCDay() + 6) % 7) * DAY;
  const start = isoDate(monday);
  const end = isoDate(monday + 7 * DAY);
  const sessions = schedule.filter((s) => s.date >= start && s.date < end).sort((a, b) => a.date.localeCompare(b.date));
  const missing = sessions.flatMap((s) => [
    ...(!s.slides ? [`Slides for ${s.date} (${s.topic})`] : []),
    ...(!s.readings ? [`Readings for ${s.date} (${s.topic})`] : []),
  ]);
  return { weekOf: start, sessions, missing };
}
