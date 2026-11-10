import { defineTool } from "eve/tools";
import { z } from "zod";
import { parseCsv } from "../lib/csv";
import { readDataFile } from "../lib/files";
import { reviewSubmissions } from "../lib/submissions";

export default defineTool({
  description:
    "Build the submission review for an assignment: one row per group with on time, late or missing status.",
  inputSchema: z.object({
    groupsFile: z.string().describe("CSV in the data folder with a 'group' column"),
    submissionsFile: z.string().describe("CSV in the data folder with 'group' and 'submitted_at' columns, and optionally 'company'"),
    dueAt: z.string().describe("Deadline as an ISO 8601 time with a timezone offset"),
  }),
  async execute({ groupsFile, submissionsFile, dueAt }) {
    const groups = parseCsv(await readDataFile(groupsFile)).map((r) => r.group).filter(Boolean);
    const rows = parseCsv(await readDataFile(submissionsFile));
    const submissions = rows.map((r) => ({ group: r.group, submitted_at: r.submitted_at, company: r.company }));
    return reviewSubmissions([...new Set(groups)], submissions, dueAt);
  },
});
