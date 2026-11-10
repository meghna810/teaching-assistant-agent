import { defineTool } from "eve/tools";
import { z } from "zod";
import { slug, writeOutbox } from "../lib/outbox";

export default defineTool({
  description:
    "Save a Canvas announcement as a draft in the outbox. It does not publish to Canvas; the TA reviews and posts it. List anything missing at the top under 'Before posting'.",
  inputSchema: z.object({
    weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    title: z.string().min(1),
    body: z.string().min(1).describe("Markdown body of the announcement"),
    beforePosting: z.array(z.string()).default([]).describe("Missing materials or questions for the TA"),
  }),
  async execute({ weekOf, title, body, beforePosting }) {
    const todo = beforePosting.length ? `<!-- Before posting:\n${beforePosting.map((m) => `- ${m}`).join("\n")}\n-->\n\n` : "";
    const saved = await writeOutbox("canvas", `${weekOf}-${slug(title)}.md`, `${todo}# ${title}\n\n${body}\n`);
    return { saved, status: "draft, not posted" };
  },
});
