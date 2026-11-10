import { defineEval } from "eve/evals";
import { schedulePrompt } from "../shared";

export default defineEval({
  description: "The weekly schedule's prompt finishes on its own: no date, no approval, no publishing.",
  async test(t) {
    // A schedule session has no channel, so it cannot ask a person anything or wait for approval.
    await t.send(schedulePrompt("weekly-canvas-post"));
    t.succeeded();
    t.calledTool("get_week_materials");
    t.calledTool("draft_canvas_post", { output: { status: "draft, not posted" } });
    t.notCalledTool("save_reply");
    t.notCalledTool("save_grade_proposals");
  },
});
