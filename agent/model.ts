/**
 * Gemini's free tier when GOOGLE_GENERATIVE_AI_API_KEY is set (no card needed), otherwise
 * Claude through Vercel AI Gateway. Free-tier data may be used by Google: sample data only.
 * Free-tier quotas are per model, so the eval judge uses a different model from the agent.
 */
export const geminiModelId = process.env.TA_GEMINI_MODEL ?? "gemini-3.5-flash";
export const judgeModelId = process.env.TA_JUDGE_MODEL ?? "gemini-3.1-flash-lite";
export const useGemini = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
