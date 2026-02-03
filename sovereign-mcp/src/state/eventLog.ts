import { appendFile, readFile } from "fs/promises";
import { join } from "path";
import type { EventEntry } from "./models.js";
import { Mutex } from "./mutex.js";

const logPath = join(process.cwd(), "state", "EVENT_LOG.ndjson");
const mutex = new Mutex();

export const appendEvent = async (event: EventEntry): Promise<void> => {
  await mutex.runExclusive(async () => {
    const line = JSON.stringify(event) + "\n";
    await appendFile(logPath, line, { encoding: "utf8" });
  });
};

export const readRecentEvents = async (limit: number): Promise<EventEntry[]> => {
  const raw = await readFile(logPath, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  const events = lines.map((line) => JSON.parse(line) as EventEntry);
  return events.slice(-limit).reverse();
};
