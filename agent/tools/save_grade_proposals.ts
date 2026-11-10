import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { csvCell, slug, writeOutbox } from "../lib/outbox";

export default defineTool({
  description:
    "Save proposed grades as a CSV in the outbox for the TA to review and enter. It never changes the gradebook. Use the numbers returned by score_participation or tally_exam unchanged.",
  inputSchema: z.object({
    title: z.string().min(1).describe("For example 'Midterm' or 'Participation weeks 1-5'"),
    rows: z.array(z.object({ student: z.string(), points: z.number(), maxPoints: z.number(), comment: z.string().default("") })).min(1),
  }),
  approval: {
    request: always(),
    prompt: ({ input }) =>
      `Save ${input.rows.length} proposed "${input.title}" grades to the outbox?\n\n` +
      input.rows.map((r) => `${r.student}: ${r.points}/${r.maxPoints}${r.comment ? ` (${r.comment})` : ""}`).join("\n"),
  },
  async execute({ title, rows }) {
    const csv = ["student,points,max_points,comment", ...rows.map((r) => [r.student, r.points, r.maxPoints, r.comment].map(csvCell).join(","))].join("\n");
    return { saved: await writeOutbox("grades", `${slug(title)}.csv`, csv + "\n"), status: "proposed, not entered" };
  },
});
