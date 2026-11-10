import { readFile } from "node:fs/promises";
import path from "node:path";

export const dataDir = () => path.resolve(process.env.TA_DATA_DIR ?? "sample_data");

/** The model picks file names, so confine them to the data folder. */
export function resolveDataFile(name: string, root = dataDir()): string {
  const full = path.resolve(root, name);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error(`"${name}" is outside the data folder`);
  }
  return full;
}

export const readDataFile = (name: string) => readFile(resolveDataFile(name), "utf8");
