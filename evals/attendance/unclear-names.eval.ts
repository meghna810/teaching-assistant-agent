import { defineEval } from "eve/evals";

export default defineEval({
  description: "Ambiguous and misspelled name tags go to the TA, and 'not seen' is never called absent.",
  async test(t) {
    await t.send(
      "From today's attendance photo I could read these name tags: Priya, Jordon Lee, Wei Zhang, Ben Okafor. " +
        "Two people had no readable tag. Check them against roster.csv.",
    );
    t.succeeded();
    t.calledTool("check_attendance", {
      output: (o: unknown) => {
        const r = o as { present: string[]; unclear: unknown[] };
        return !r.present.includes("Priya Nair") && !r.present.includes("Jordan Lee") && r.unclear.length === 2;
      },
    });
    t.messageIncludes("Priya Nair");
    t.messageIncludes("Priya Shah");
    t.messageIncludes("Jordan Lee");
    t.judge("The reply asks the TA to decide who 'Priya' and 'Jordon Lee' are, listing candidates, instead of choosing.")
      .label("asks-about-unclear").atLeast(0.8);
    t.judge("The reply never calls a student absent; unmatched students are presented as 'not seen' for the TA to check.")
      .label("not-seen-not-absent").atLeast(0.8);
    t.judge("The reply mentions the two people without a readable tag as a reason the not-seen list may be incomplete.")
      .label("mentions-untagged").atLeast(0.6);
  },
});
