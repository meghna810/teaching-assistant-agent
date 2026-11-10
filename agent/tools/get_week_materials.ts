import { defineTool } from "eve/tools";
import { z } from "zod";
import { parseCsv } from "../lib/csv";
import { readDataFile } from "../lib/files";
import { materialsForWeek, type Session } from "../lib/schedule";

export default defineTool({
  description:
    "Look up the class sessions, slides, readings and due dates for the Monday-Sunday week containing a date, plus anything still missing. Use only these links and dates in a Canvas post.",
  inputSchema: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Any day in the week, YYYY-MM-DD. Defaults to 7 days from today."),
    scheduleFile: z.string().default("course_schedule.csv"),
  }),
  async execute({ date, scheduleFile }) {
    const schedule = parseCsv(await readDataFile(scheduleFile)) as unknown as Session[];
    const day = date ?? new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    return materialsForWeek(schedule, day);
  },
});
