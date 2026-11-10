import { defineEvalConfig } from "eve/evals";

export default defineEvalConfig({
  timeoutMs: 300_000,
  async setup() {
    // Keep eval drafts out of the real outbox. .eve/ is git-ignored.
    process.env.TA_OUTBOX_DIR = ".eve/eval-outbox";
  },
});
