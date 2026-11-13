import { google } from "@ai-sdk/google";
import { defineEvalConfig } from "eve/evals";
import { judgeModelId, useGemini } from "../agent/model";

export default defineEvalConfig({
  timeoutMs: 300_000,
  maxConcurrency: 1, // stay under free-tier per-minute limits
  // Grade with Gemini too when its key is set, so evals need no AI Gateway credits.
  ...(useGemini ? { judge: { model: google.decisionModel(judgeModelId) } } : {}),
  async setup() {
    // Keep eval drafts out of the real outbox. .eve/ is git-ignored.
    process.env.TA_OUTBOX_DIR = ".eve/eval-outbox";
  },
});
