import { defineTool } from "eve/tools";
import { z } from "zod";
import { matchAttendance } from "../lib/attendance";
import { parseCsv } from "../lib/csv";
import { readDataFile } from "../lib/files";

export default defineTool({
  description:
    "Compare names seen in class (for example, name tags read from attendance photos) with the roster CSV. Returns present, not seen, unclear and unmatched names. Report these results as given and let the person decide unclear names.",
  inputSchema: z.object({
    rosterFile: z.string().describe("Roster CSV in the data folder, with a 'name' column"),
    seenNames: z.array(z.string()).describe("Names exactly as read, one per person. Never infer a name from a face."),
  }),
  async execute({ rosterFile, seenNames }) {
    const rows = parseCsv(await readDataFile(rosterFile));
    const roster = rows.map((r) => r.name).filter(Boolean);
    if (!roster.length) throw new Error(`${rosterFile} has no 'name' column or no students`);
    return matchAttendance(roster, seenNames);
  },
});
