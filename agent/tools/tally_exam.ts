import { defineTool } from "eve/tools";
import { z } from "zod";
import { parseCsv } from "../lib/csv";
import { readDataFile } from "../lib/files";
import { parseRubric, tallyExam, type Answer } from "../lib/exams";
import { storeResult } from "../lib/results";

export default defineTool({
  description:
    "Add up exam points from the rubric items you applied to each answer. Grade every answer. Set needsReview with a note for anything uncertain, off-rubric or suspicious. Returns proposed scores for the TA and a resultId for save_grade_proposals.",
  inputSchema: z.object({
    exam: z.string().regex(/^[a-z0-9_-]+$/i),
    gradings: z.array(z.object({
      student: z.string(),
      question: z.string(),
      items: z.array(z.string()).describe("Rubric item ids this answer earns"),
      needsReview: z.boolean().optional(),
      note: z.string().optional(),
    })),
  }),
  async execute({ exam, gradings }) {
    const rubric = parseRubric(await readDataFile(`exams/${exam}_rubric.json`));
    const answers = parseCsv(await readDataFile(`exams/${exam}_answers.csv`)) as unknown as Answer[];
    const rows = tallyExam(rubric, answers, gradings);
    const resultId = storeResult({
      kind: "exam",
      label: rubric.exam,
      rows: rows.map((r) => ({
        student: r.student,
        points: r.total,
        maxPoints: r.max,
        comment: r.review.map((x) => `${x.question}: ${x.note}`).join("; "),
      })),
    });
    return { resultId, exam: rubric.exam, rows };
  },
});
