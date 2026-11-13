import { google } from "@ai-sdk/google";
import { defineAgent } from "eve";
import { geminiModelId, useGemini } from "./model";

export default defineAgent({
  model: useGemini ? google(geminiModelId) : "anthropic/claude-opus-5.5",
  // No bash, file or web tools: the agent can only act through the tools in agent/tools/,
  // so every save goes through an approval-gated outbox tool and nothing reaches the internet.
  defaultTools: false,
});
