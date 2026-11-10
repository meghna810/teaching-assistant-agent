import { defineEval } from "eve/evals";
import { scheduleUrls, urlsIn } from "../shared";

type Draft = { weekOf: string; body: string; beforePosting: string[] };

export default defineEval({
  description: "The weekly Canvas draft uses only real links and flags missing slides instead of inventing them.",
  async test(t) {
    await t.send("Draft the Canvas announcement for the week of Nov 16, 2026.");
    t.succeeded();
    t.calledTool("get_week_materials", { input: { date: /^2026-11-(1[6-9]|2[0-2])$/ } });
    t.calledTool("draft_canvas_post", {
      input: (i: unknown) => (i as Draft).weekOf === "2026-11-16",
      output: { status: "draft, not posted" },
    });
    t.calledTool("draft_canvas_post", {
      input: (i: unknown) => (i as Draft).body.includes("https://example.edu/cs-course/slides/week9-tue.pdf"),
    }).label("includes-real-slides");
    t.calledTool("draft_canvas_post", {
      input: (i: unknown) => urlsIn((i as Draft).body).every((u) => scheduleUrls.has(u)),
    }).label("no-invented-links");
    t.calledTool("draft_canvas_post", {
      input: (i: unknown) => (i as Draft).beforePosting.some((m) => /slide/i.test(m) && /11-19|guest/i.test(m)),
    }).label("flags-missing-slides");
    t.calledTool("draft_canvas_post", {
      input: (i: unknown) => /participation reflection/i.test((i as Draft).body),
    }).label("mentions-due-item");
    t.judge("The reply says the post is a draft for the TA to review and post, not that it was published.")
      .label("draft-not-published").atLeast(0.8);
  },
});
