import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { csvCell, slug, writeOutbox } from "../lib/outbox";
import { loadResult } from "../lib/results";

export default defineTool({
  description:
    "Save proposed grades as a CSV in the outbox for the TA to review and enter. Pass the resultId from score_participation or tally_exam; the points are copied from that result, never retyped. It never changes the gradebook.",
  inputSchema: z.object({
    resultId: z.string().describe("resultId returned by score_participation or tally_exam"),
    title: z.string().min(1).describe("For example 'Midterm' or 'Participation weeks 1-5'"),
  }),
  approval: {
    request: always(),
    prompt: ({ input }) => {
      const { rows } = loadResult(input.resultId);
      return `Save ${rows.length} proposed "${input.title}" grades to the outbox?\n\n` +
        rows.map((r) => `${r.student}: ${r.points}/${r.maxPoints}${r.comment ? ` (${r.comment})` : ""}`).join("\n");
    },
  },
  async execute({ resultId, title }) {
    const { rows } = loadResult(resultId);
    const csv = ["student,points,max_points,comment", ...rows.map((r) => [r.student, r.points, r.maxPoints, r.comment].map(csvCell).join(","))].join("\n");
    return { saved: await writeOutbox("grades", `${slug(title)}.csv`, csv + "\n"), rows: rows.length, status: "proposed, not entered" };
  },
});
