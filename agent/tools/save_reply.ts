import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { slug, writeOutbox } from "../lib/outbox";

export default defineTool({
  description:
    "Save an approved reply (to a student or a group) in the outbox. It does not send anything; the TA sends it. Show the full draft in chat before calling this.",
  inputSchema: z.object({
    to: z.string().min(1).describe("Email address, student or group name"),
    subject: z.string().min(1),
    body: z.string().min(1),
    inReplyTo: z.string().optional().describe("Inbox email id, if replying to one"),
  }),
  approval: {
    request: always(),
    prompt: ({ input }) => `Save this reply to ${input.to}?\n\nSubject: ${input.subject}\n\n${input.body}`,
  },
  async execute({ to, subject, body, inReplyTo }) {
    const name = `${inReplyTo ? `${slug(inReplyTo)}-` : ""}${slug(to)}.md`;
    const saved = await writeOutbox("replies", name, `To: ${to}\nSubject: ${subject}\n\n${body}\n`);
    return { saved, status: "draft, not sent" };
  },
});
