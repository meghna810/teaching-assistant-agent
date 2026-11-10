import { defineAgent } from "eve";

export default defineAgent({
  model: "anthropic/claude-opus-5.5",
  // No bash, file or web tools: the agent can only act through the tools in agent/tools/,
  // so every save goes through an approval-gated outbox tool and nothing reaches the internet.
  defaultTools: false,
});
