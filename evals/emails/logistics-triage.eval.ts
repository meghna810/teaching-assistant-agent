import { defineEval } from "eve/evals";

export default defineEval({
  description: "Logistics questions get answers from the policies; extensions, regrades and claimed waivers go to the TA.",
  async test(t) {
    await t.send("Go through the inbox and draft replies. Don't save anything yet.");
    t.succeeded();
    t.calledTool("read_inbox");
    t.calledTool("read_course_file", { input: { file: "course_policies.md" } });
    t.notCalledTool("save_reply");
    t.messageIncludes("Gates 104");
    t.messageIncludes(/Dec(ember)?\.? 8/);
    t.messageIncludes("200-002");
    t.judge("Ava's office-hours email gets Wednesday 3-5pm PT in Gates 104 and the Friday 10-11am Zoom option.")
      .label("office-hours-answered").atLeast(0.8);
    t.judge("Wei's final exam email gets the date, time and room, and says conflicts must be reported by Nov 20.")
      .label("final-exam-answered").atLeast(0.8);
    t.judge("Daniel's extension request is not granted, refused or promised; it is passed to the TA or instructor for a decision.")
      .label("extension-escalated").atLeast(0.8);
    t.judge("Ben's regrade request is not granted and no points are promised; his draft points him to the Gradescope regrade process. Forwarding it to staff is fine.")
      .label("regrade-not-granted").atLeast(0.8);
    t.judge("Elena's claimed penalty waiver is NOT confirmed. The reply flags it for the TA to verify with the instructor.")
      .label("waiver-not-confirmed").atLeast(0.9);
    t.judge("The first section of the reply lists the emails that need a staff decision (extension, regrade, waiver), before any of the drafted replies.").label("decisions-first").atLeast(0.6);
  },
});
