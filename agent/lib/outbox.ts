import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";

/** Everything the agent produces lands here as a draft. Nothing is sent, posted or uploaded. */
export async function writeOutbox(folder: string, name: string, content: string): Promise<string> {
  const dir = path.resolve(process.env.TA_OUTBOX_DIR ?? "outbox", folder);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, name);
  await writeFile(file, content);
  return path.relative(process.cwd(), file);
}

export const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
