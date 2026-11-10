import { defineTool } from "eve/tools";
import { z } from "zod";
import { parseCsv } from "../lib/csv";
import { readDataFile } from "../lib/files";
import { QUALITY_MAX, scoreParticipation, type Contribution } from "../lib/participation";

export default defineTool({
  description:
    `Turn your quality ratings into proposed participation points. Rate every contribution 0-${QUALITY_MAX} against the rubric, with a reason. The score uses each student's best few contributions, so volume does not add points. Report the result as given; the TA decides grades.`,
  inputSchema: z.object({
    ratings: z.array(z.object({
      id: z.string(),
      quality: z.number().int().min(0).max(QUALITY_MAX),
      reason: z.string().min(1).describe("Which rubric level it meets and why, in a few words"),
    })),
    rosterFile: z.string().default("roster.csv"),
    participationFile: z.string().default("participation.csv"),
    maxPoints: z.number().positive().default(10),
  }),
  async execute({ ratings, rosterFile, participationFile, maxPoints }) {
    const roster = parseCsv(await readDataFile(rosterFile)).map((r) => r.name).filter(Boolean);
    const contributions = parseCsv(await readDataFile(participationFile)) as unknown as Contribution[];
    const result = scoreParticipation(roster, contributions, ratings, { maxPoints });
    if (result.unrated.length) return { error: "Rate every contribution first", unrated: result.unrated };
    return result;
  },
});
